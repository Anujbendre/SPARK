from pydantic import BaseModel, HttpUrl


class HealthResponse(BaseModel):
    status: str


class RepositoryRequest(BaseModel):
    url: HttpUrl


class ContributorSummary(BaseModel):
    login: str
    contributions: int
    avatar_url: str
    html_url: str | None = None


class ArchitectureModule(BaseModel):
    id: str
    name: str
    path: str
    description: str
    scope: str
    files: list[str] = []
    reviewers: list[str] = []


class IssueSummary(BaseModel):
    number: int
    title: str
    html_url: str
    labels: list[str] = []
    difficulty: str = "BEGINNER"
    rationale: str = ""
    touch_files: list[str] = []
    steps: list[str] = []


class ContributionStep(BaseModel):
    step_number: str
    title: str
    description: str
    status: str
    badge: str


class RepositoryAnalysis(BaseModel):
    full_name: str
    description: str | None = None
    default_branch: str = "main"
    stars: int = 0
    forks: int = 0
    language: str | None = None
    open_issues: int = 0
    license_name: str | None = None
    topics: list[str] = []
    contributors: list[ContributorSummary] = []
    issues: list[IssueSummary] = []
    top_level_paths: list[str] = []
    ai_summary: str | None = None
    primary_dependency: str | None = None
    architecture_pattern: str | None = None
    recommended_entrypoint: str | None = None
    modules: list[ArchitectureModule] = []
    roadmap: list[ContributionStep] = []
    mermaid_diagram: str | None = None


class AskRequest(BaseModel):
    url: HttpUrl
    question: str


class Citation(BaseModel):
    file: str
    snippet: str


class AskResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
