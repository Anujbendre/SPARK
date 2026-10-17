from fastapi.testclient import TestClient

from app.api import routes
from app.main import app


def test_analyze_repository_returns_live_shape(monkeypatch) -> None:
    async def fake_load(_github, _owner, _repository):
        return (
            {
                "full_name": "example/project",
                "description": "Example project",
                "default_branch": "main",
                "stargazers_count": 12,
                "forks_count": 3,
                "language": "Python",
                "open_issues_count": 2,
                "license": {"spdx_id": "MIT"},
                "topics": ["example"],
            },
            [{"login": "maintainer", "contributions": 9, "avatar_url": "https://example.com/a.png", "type": "User"}],
            [{"number": 42, "title": "Improve docs", "html_url": "https://github.com/example/project/issues/42", "labels": [{"name": "docs"}]}],
        )

    async def fake_tree(_github, _owner, _repository, _branch):
        return [{"path": "src/main.py", "type": "blob"}, {"path": "tests", "type": "tree"}]

    monkeypatch.setattr(routes, "_load_repository_data", fake_load)
    monkeypatch.setattr(routes.GitHubClient, "get_tree", fake_tree)

    response = TestClient(app).post(
        "/analyze", json={"url": "https://github.com/example/project"}
    )

    assert response.status_code == 200
    assert response.json()["full_name"] == "example/project"
    assert response.json()["contributors"][0]["login"] == "maintainer"
    assert response.json()["issues"][0]["number"] == 42
    assert response.json()["top_level_paths"] == ["src"]


def test_analyze_repository_rejects_non_github_url() -> None:
    response = TestClient(app).post(
        "/analyze", json={"url": "https://gitlab.com/example/project"}
    )

    assert response.status_code == 422
