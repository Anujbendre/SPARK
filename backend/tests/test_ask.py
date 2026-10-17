from fastapi.testclient import TestClient

from app.api import routes
from app.main import app


def test_ask_repository_returns_answer(monkeypatch) -> None:
    async def fake_get_repo(_github, _owner, _repo):
        return {"full_name": "example/project", "language": "Python", "description": "An example repository", "default_branch": "main"}

    async def fake_get_readme(_github, _owner, _repo):
        return "# Example Project\nThis project handles fast data processing."

    async def fake_get_tree(_github, _owner, _repo, _branch):
        return [{"path": "core/runner.py", "type": "blob"}, {"path": "api/server.py", "type": "blob"}]

    monkeypatch.setattr(routes.GitHubClient, "get_repository", fake_get_repo)
    monkeypatch.setattr(routes.GitHubClient, "get_readme", fake_get_readme)
    monkeypatch.setattr(routes.GitHubClient, "get_tree", fake_get_tree)

    response = TestClient(app).post(
        "/ask",
        json={
            "url": "https://github.com/example/project",
            "question": "Where is the core runner implemented?",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert isinstance(data["citations"], list)
