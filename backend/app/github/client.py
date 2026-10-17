import httpx

from app.core.config import settings


class GitHubClient:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def get_repository(self, owner: str, repository: str) -> dict:
        response = await self._client.get(
            f"https://api.github.com/repos/{owner}/{repository}",
            headers=self._headers(),
            follow_redirects=True,
        )
        response.raise_for_status()
        return response.json()

    async def get_contributors(self, owner: str, repository: str) -> list[dict]:
        response = await self._client.get(
            f"https://api.github.com/repos/{owner}/{repository}/contributors",
            headers=self._headers(),
            params={"per_page": 8},
            follow_redirects=True,
        )
        response.raise_for_status()
        return response.json()

    async def get_issues(self, owner: str, repository: str) -> list[dict]:
        # 1. Primary: Use GitHub Search API with is:issue state:open to get 100% pure issues (no PR pollution)
        try:
            search_query = f"repo:{owner}/{repository} is:issue state:open"
            response = await self._client.get(
                "https://api.github.com/search/issues",
                headers=self._headers(),
                params={"q": search_query, "sort": "created", "order": "desc", "per_page": 30},
                follow_redirects=True,
            )
            if response.status_code == 200:
                items = response.json().get("items", [])
                if items:
                    return [i for i in items if "pull_request" not in i]
        except Exception:
            pass

        # 2. Resilient fallback to standard repository issues endpoint
        response = await self._client.get(
            f"https://api.github.com/repos/{owner}/{repository}/issues",
            headers=self._headers(),
            params={"state": "open", "per_page": 50},
            follow_redirects=True,
        )
        response.raise_for_status()
        return [issue for issue in response.json() if "pull_request" not in issue]

    async def get_tree(self, owner: str, repository: str, branch: str) -> list[dict]:
        response = await self._client.get(
            f"https://api.github.com/repos/{owner}/{repository}/git/trees/{branch}",
            headers=self._headers(),
            params={"recursive": "1"},
            follow_redirects=True,
        )
        response.raise_for_status()
        return response.json().get("tree", [])

    async def get_readme(self, owner: str, repository: str) -> str:
        import base64

        try:
            response = await self._client.get(
                f"https://api.github.com/repos/{owner}/{repository}/readme",
                headers=self._headers(),
                follow_redirects=True,
            )
            if response.status_code == 200:
                data = response.json()
                raw_content = data.get("content", "")
                if raw_content:
                    return base64.b64decode(raw_content).decode("utf-8", errors="ignore")[:6000]
        except Exception:
            pass
        return ""

    def _headers(self) -> dict[str, str]:
        headers = {
            "Accept": "application/vnd.github+json",
            "User-Agent": "OSS-Navigator/1.0",
        }
        if settings.github_token:
            headers["Authorization"] = f"Bearer {settings.github_token}"
        return headers
