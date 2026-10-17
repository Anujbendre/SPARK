import asyncio
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, HTTPException

from app.agent.orchestrator import RepositoryAgent
from app.github.client import GitHubClient
from app.models.schemas import (
    ArchitectureModule,
    AskRequest,
    AskResponse,
    Citation,
    ContributionStep,
    ContributorSummary,
    HealthResponse,
    IssueSummary,
    RepositoryAnalysis,
    RepositoryRequest,
)

router = APIRouter()
agent = RepositoryAgent()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@router.post("/analyze", response_model=RepositoryAnalysis)
async def analyze_repository(request: RepositoryRequest) -> RepositoryAnalysis:
    owner, repository = _repository_parts(str(request.url))

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            github = GitHubClient(client)
            overview, contributors, issues = await _load_repository_data(
                github, owner, repository
            )
            tree = await github.get_tree(
                owner, repository, overview.get("default_branch", "main")
            )
            readme = await github.get_readme(owner, repository)
    except httpx.HTTPStatusError as error:
        if error.response.status_code == 404:
            raise HTTPException(status_code=404, detail="GitHub repository was not found") from error
        if error.response.status_code == 403:
            raise HTTPException(
                status_code=503,
                detail="GitHub API rate limit reached; configure GITHUB_TOKEN and retry",
            ) from error
        raise HTTPException(status_code=502, detail="GitHub API request failed") from error
    except httpx.RequestError as error:
        raise HTTPException(status_code=503, detail="GitHub is unavailable") from error

    paths = sorted(
        {
            item["path"].split("/", 1)[0]
            for item in tree
            if item.get("path") and item["path"].count("/") > 0
        }
    )[:40]

    # Run AI analysis
    ai_data = await agent.analyze_repository(
        overview=overview,
        readme=readme,
        tree=tree,
        issues=issues,
        top_level_paths=paths,
    )

    # Merge AI issue scoring
    ai_issues_map = {
        item.get("number"): item for item in ai_data.get("issues", []) if item.get("number")
    }

    merged_issues = []
    for raw_issue in issues:
        num = raw_issue["number"]
        ai_info = ai_issues_map.get(num, {})
        merged_issues.append(
            IssueSummary(
                number=num,
                title=raw_issue["title"],
                html_url=raw_issue["html_url"],
                labels=[label["name"] for label in raw_issue.get("labels", [])],
                difficulty=ai_info.get("difficulty", "BEGINNER"),
                rationale=ai_info.get(
                    "rationale",
                    "Clear self-contained scope with minimal cross-cutting dependencies.",
                ),
                touch_files=ai_info.get("touch_files", []),
                steps=ai_info.get("steps", []),
            )
        )

    contributor_models = [
        ContributorSummary(
            login=item["login"],
            contributions=item.get("contributions", 0),
            avatar_url=item.get("avatar_url", ""),
            html_url=item.get("html_url", f"https://github.com/{item['login']}"),
        )
        for item in contributors
        if item.get("type") == "User"
    ]

    modules_list = [
        ArchitectureModule(
            id=m.get("id", f"mod_{i}"),
            name=m.get("name", f"Module {i}"),
            path=m.get("path", f"/{paths[i]}" if i < len(paths) else "/"),
            description=m.get("description", "Subsystem component"),
            scope=m.get("scope", "CORE SUBSYSTEM"),
            files=m.get("files", []),
            reviewers=[c.login for c in contributor_models[:2]],
        )
        for i, m in enumerate(ai_data.get("modules", []))
    ]

    roadmap_list = [
        ContributionStep(
            step_number=s.get("step_number", f"0{i+1}"),
            title=s.get("title", f"STEP {i+1}"),
            description=s.get("description", ""),
            status=s.get("status", "READY"),
            badge=s.get("badge", "ACTION"),
        )
        for i, s in enumerate(ai_data.get("roadmap", []))
    ]

    return RepositoryAnalysis(
        full_name=overview["full_name"],
        description=overview.get("description"),
        default_branch=overview.get("default_branch", "main"),
        stars=overview.get("stargazers_count", 0),
        forks=overview.get("forks_count", 0),
        language=overview.get("language"),
        open_issues=overview.get("open_issues_count", 0),
        license_name=(overview.get("license") or {}).get("spdx_id"),
        topics=overview.get("topics", []),
        contributors=contributor_models,
        issues=merged_issues,
        top_level_paths=paths,
        ai_summary=ai_data.get("ai_summary"),
        primary_dependency=ai_data.get("primary_dependency"),
        architecture_pattern=ai_data.get("architecture_pattern"),
        recommended_entrypoint=ai_data.get("recommended_entrypoint"),
        modules=modules_list,
        roadmap=roadmap_list,
        mermaid_diagram=ai_data.get("mermaid_diagram"),
    )


@router.post("/ask", response_model=AskResponse)
async def ask_repository(request: AskRequest) -> AskResponse:
    owner, repository = _repository_parts(str(request.url))

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            github = GitHubClient(client)
            overview = await github.get_repository(owner, repository)
            readme = await github.get_readme(owner, repository)
            tree = await github.get_tree(owner, repository, overview.get("default_branch", "main"))
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Failed to fetch repository for Q&A: {error}")

    paths = sorted(
        {
            item["path"].split("/", 1)[0]
            for item in tree
            if item.get("path") and item["path"].count("/") > 0
        }
    )[:20]

    repo_context = {
        "full_name": overview.get("full_name"),
        "language": overview.get("language"),
        "description": overview.get("description"),
        "top_level_paths": paths,
        "readme": readme,
    }

    result = await agent.answer(request.question, repo_context)

    citations = [
        Citation(file=c.get("file", ""), snippet=c.get("snippet", ""))
        for c in result.get("citations", [])
    ]
    return AskResponse(
        answer=result.get("answer", "No answer could be determined from the repository."),
        citations=citations,
    )


async def _load_repository_data(
    github: GitHubClient, owner: str, repository: str
) -> tuple[dict, list[dict], list[dict]]:
    return await _gather_repository_requests(github, owner, repository)


async def _gather_repository_requests(
    github: GitHubClient, owner: str, repository: str
) -> tuple[dict, list[dict], list[dict]]:
    return await asyncio.gather(
        github.get_repository(owner, repository),
        github.get_contributors(owner, repository),
        github.get_issues(owner, repository),
    )


def _repository_parts(repository_url: str) -> tuple[str, str]:
    parsed = urlparse(repository_url)
    if parsed.scheme != "https" or parsed.netloc.lower() != "github.com":
        raise HTTPException(status_code=422, detail="Use an https://github.com/{owner}/{repo} URL")
    parts = [part for part in parsed.path.split("/") if part]
    if len(parts) != 2 or any(part in {".", ".."} for part in parts):
        raise HTTPException(status_code=422, detail="Use an https://github.com/{owner}/{repo} URL")
    return parts[0], parts[1].removesuffix(".git")
