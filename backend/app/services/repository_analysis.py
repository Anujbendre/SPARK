import asyncio
from typing import Any
import httpx
from fastapi import HTTPException

from app.agent.orchestrator import RepositoryAgent
from app.github.client import GitHubClient
from app.models.schemas import (
    ArchitectureModule,
    ContributionStep,
    ContributorSummary,
    IssueSummary,
    RepositoryAnalysis,
)


class RepositoryAnalysisService:
    """Application service for repository analysis workflows."""

    def __init__(self, agent: RepositoryAgent | None = None) -> None:
        self._agent = agent or RepositoryAgent()

    async def analyze(self, github: GitHubClient, owner: str, repository: str) -> RepositoryAnalysis:
        # Load repo overview, contributors, issues, tree, readme concurrently
        overview, contributors, issues, readme = await asyncio.gather(
            github.get_repository(owner, repository),
            github.get_contributors(owner, repository),
            github.get_issues(owner, repository),
            github.get_readme(owner, repository),
        )

        branch = overview.get("default_branch", "main")
        tree = await github.get_tree(owner, repository, branch)

        # Extract top level paths
        paths = sorted(
            {
                item["path"].split("/", 1)[0]
                for item in tree
                if item.get("path") and item["path"].count("/") > 0
            }
        )[:40]

        # Call AI agent for architectural synthesis
        ai_data: dict[str, Any] = await self._agent.analyze_repository(
            overview=overview,
            readme=readme,
            tree=tree,
            issues=issues,
            top_level_paths=paths,
        )

        # Merge AI scored issues with raw GitHub issues
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
                        "Isolated ticket with distinct scope for new contributors.",
                    ),
                    touch_files=ai_info.get("touch_files", []),
                    steps=ai_info.get("steps", []),
                )
            )

        # Build contributor models
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

        # Build modules
        modules_list = [
            ArchitectureModule(
                id=m.get("id", f"mod_{i}"),
                name=m.get("name", f"Module {i}"),
                path=m.get("path", "/"),
                description=m.get("description", "Component subsystem"),
                scope=m.get("scope", "CORE MODULE"),
                files=m.get("files", []),
                reviewers=[c.login for c in contributor_models[:2]],
            )
            for i, m in enumerate(ai_data.get("modules", []))
        ]

        # Build roadmap
        roadmap_list = [
            ContributionStep(
                step_number=s.get("step_number", f"0{i+1}"),
                title=s.get("title", "STEP"),
                description=s.get("description", ""),
                status=s.get("status", "READY"),
                badge=s.get("badge", "ACTION"),
            )
            for i, s in enumerate(ai_data.get("roadmap", []))
        ]

        real_open_issues = getattr(issues, "total_count", None)
        if real_open_issues is None or real_open_issues <= 0:
            real_open_issues = overview.get("open_issues_count", len(merged_issues))

        return RepositoryAnalysis(
            full_name=overview["full_name"],
            description=overview.get("description"),
            default_branch=branch,
            stars=overview.get("stargazers_count", 0),
            forks=overview.get("forks_count", 0),
            language=overview.get("language"),
            open_issues=real_open_issues,
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
