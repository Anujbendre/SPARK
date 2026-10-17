# ⚡ SPARK

### Find your place in open source.

**From an unfamiliar repository to your first meaningful contribution.**

SPARK is an AI-assisted open-source exploration tool designed to help developers understand GitHub repositories, navigate codebase architecture, explore issues and pull requests, and discover where they can contribute.

Instead of spending hours figuring out where to start, use SPARK to build a clearer picture of a project and identify your next step.

<p align="center">
  <strong>Explore. Understand. Contribute.</strong>
</p>

<p align="center">
  <a href="https://github.com/Anujbendre/SPARK">Repository</a> ·
  <a href="https://github.com/Anujbendre/SPARK/issues">Issues</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="LICENSE">MIT License</a>
</p>

---

## 📸 See SPARK in Action

<!-- TODO: Add screenshots or a short demo GIF after capturing the working application. -->

<img width="1920" height="1080" alt="Screenshot (1920)" src="https://github.com/user-attachments/assets/b96364db-4b00-4c90-b5e9-79f65f3e3e7c" />
<img width="1920" height="1080" alt="Screenshot (1921)" src="https://github.com/user-attachments/assets/c394149e-876b-4415-b3f1-8459937a295c" />
<img width="1920" height="1080" alt="Screenshot (1922)" src="https://github.com/user-attachments/assets/f8743e75-5ca6-4b3f-beb1-e3eef800c6de" />
<img width="1920" height="1080" alt="Screenshot (1923)" src="https://github.com/user-attachments/assets/6c260288-750a-465d-94d7-f9a3261a3080" />
<img width="1920" height="1080" alt="Screenshot (1924)" src="https://github.com/user-attachments/assets/b5374f30-a6d4-45d5-9fde-dff3eca8e9e0" />



## 💡 Why SPARK?

Open source is one of the best ways to learn software development, collaborate with other developers, and build real-world experience. But getting started with an unfamiliar repository can be overwhelming.

New contributors often face questions like:

- Where should I start in a large codebase?
- How do the different parts of this project work together?
- Which issues could I realistically contribute to?
- What should I understand before opening a pull request?
- Who maintains the part of the project I want to work on?

SPARK is built around one idea:

> **Make open-source repositories easier to understand and contribution opportunities easier to discover.**

## ✨ What SPARK Offers

SPARK is being developed around a guided repository exploration experience.

| Capability | Purpose |
|---|---|
| 🔍 Repository exploration | Start with a GitHub repository URL and inspect available project information. |
| 🏗️ Architecture insights | Understand the organization of a codebase and the roles of its components. |
| 👥 Contributor discovery | Explore contributors and their relationship to project activity. |
| 🧩 Issue exploration | Investigate open issues and possible contribution opportunities. |
| 🔀 Pull request context | Understand proposed changes and ongoing work. |
| 🧭 Contribution guidance | Find a more informed starting point for contributing. |
| 🤖 AI-assisted Q&A | Ask questions about a repository and get contextual explanations. |
| 🎯 Issue-based exploration | Begin with a supported GitHub issue URL and investigate its context. |

*Feature availability depends on the current implementation. Consult the running application for the capabilities currently supported.*

## 🔄 How It Works

The intended user journey is simple:

1. **Paste a GitHub URL.** Start with a repository or supported issue link.
2. **Explore repository information.** Inspect the information retrieved from GitHub.
3. **Understand the codebase.** Review available architecture and project insights.
4. **Discover contribution opportunities.** Investigate issues, pull requests, and contributors.
5. **Ask questions.** Use AI-assisted explanations to clarify unfamiliar concepts.
6. **Choose your next step.** Use the available context to plan a contribution.

SPARK is designed to help users make informed decisions. AI-generated explanations should be checked against the repository's actual code and documentation.

## 🤖 AI Model & Hackathon Usage

SPARK's intended in-product AI integration uses **Gemma 4**, accessed through the Gemini API, for repository understanding and contribution guidance.

The project is intended to use the AI model provided or approved for the hackathon's AI track. The application should not call GPT or other external chatbot models as part of its AI workflow.

The model identifier is configurable through `GEMMA_MODEL`. The current example configuration uses `gemma-4-26b-a4b-it`; confirm that this identifier matches the model and access provided by the hackathon before deployment.

### What the AI helps with

- Explaining unfamiliar repository concepts.
- Summarizing relevant project context.
- Helping users reason about issues and potential contributions.
- Answering questions using available repository information.

### Responsible AI usage

AI responses can be incomplete or incorrect. SPARK should distinguish verified repository facts from generated interpretations and encourage users to verify important information against source files, documentation, issues, and pull requests.

**Model disclosure:** This section describes the intended in-product AI workflow. Verify the final integration and the hackathon's disclosure requirements before claiming full compliance.

## 🧰 Technology Stack

SPARK's repository is organized as a full-stack application.

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling and UI | Tailwind CSS and related UI components |
| Backend API | Python, FastAPI |
| Data validation | Pydantic |
| HTTP requests | httpx |
| Repository data | GitHub REST API |
| AI integration | Gemma 4 through the Gemini API |
| Testing | pytest and the frontend's configured test tools |
| Local orchestration | Docker Compose |

*The stack reflects the repository's documented architecture. Confirm individual dependencies and integrations against the current code before release.*

## 🏛️ Architecture Overview

SPARK separates the user interface from backend processing.

```text
                 ┌─────────────────────┐
                 │        User         │
                 │  GitHub repository  │
                 │     or issue URL    │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   Next.js Frontend  │
                 │   React + TypeScript│
                 └──────────┬──────────┘
                            │ HTTP API
                            ▼
                 ┌─────────────────────┐
                 │    FastAPI Backend  │
                 │ Request validation  │
                 │ Repository services │
                 └──────────┬──────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
       ┌────────────────┐     ┌────────────────┐
       │   GitHub API   │     │   Gemma 4 API  │
       │ Repository data│     │ AI explanations│
       └────────────────┘     └────────────────┘
```

*Conceptual architecture: the final data flow and implemented services may differ as development progresses.*

## 🚀 Getting Started

You can run SPARK locally using the frontend and backend separately, or use Docker Compose if the configured services are ready.

### Prerequisites

- Git
- Node.js and npm compatible with the frontend dependencies
- Python compatible with the backend dependencies
- A Gemini API key with access to the configured Gemma model
- Docker and Docker Compose, if using the containerized setup

### 1. Clone the repository

```bash
git clone https://github.com/Anujbendre/SPARK.git
cd SPARK
```

### 2. Configure environment variables

Create a local environment file from the example.

**Windows PowerShell**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux**

```bash
cp .env.example .env
```

Open `.env` and enter your own valid credentials. Never commit this file or publish its contents.

### 3. Start the backend

Open a terminal in the repository root and run:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
source .venv/bin/activate
```

Install the backend package and development dependencies:

```bash
pip install -e ".[dev]"
```

Start the API server:

```bash
uvicorn app.main:app --reload --port 8000
```

When the server starts successfully, the API documentation should be available at:

http://localhost:8000/docs

### 4. Start the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

The frontend is expected to be available at:

http://localhost:3000

### 5. Run with Docker Compose

If the Docker configuration is ready for your local environment, run this from the repository root:

```bash
docker compose up --build
```

To stop the services, use `Ctrl+C`, or run `docker compose down` in a separate terminal.

> **Setup note:** These commands follow the repository's documented setup. If a command fails, check the current package files, environment requirements, and Docker configuration. The commands and service configuration may change as the project evolves.

## 🔐 Environment Variables

The root `.env.example` documents the configuration expected by the application.

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Credential for the Gemini API, if required by the backend. |
| `GEMMA_MODEL` | Configurable model identifier. |
| `GITHUB_TOKEN` | Optional GitHub authentication, if required. |
| `NEXT_PUBLIC_API_URL` | Backend API URL used by the frontend. |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins for backend requests. |

Example values for local development:

```dotenv
GEMINI_API_KEY=
GEMMA_MODEL=gemma-4-26b-a4b-it
GITHUB_TOKEN=
NEXT_PUBLIC_API_URL=http://localhost:8000
BACKEND_CORS_ORIGINS=http://localhost:3000
```

Use the exact variable names supported by the current codebase. Do not put real credentials in this example.

### Security essentials

- Never commit `.env` or other files containing secrets.
- Keep API keys on the backend rather than exposing them to browser code.
- Use the least privilege needed for any GitHub token.
- Rotate credentials immediately if they are exposed.
- Review `.gitignore` and repository history for accidentally committed secrets.

## 📂 Project Structure

```text
SPARK/
├── frontend/                 # Next.js web application
├── backend/                  # FastAPI application
├── docs/                     # Architecture and project documentation
├── .env.example              # Environment variable template
├── .gitignore                # Files excluded from version control
├── CODE_OF_CONDUCT.md        # Community expectations
├── CONTRIBUTING.md           # Contribution workflow
├── LICENSE                   # MIT license
├── README.md                 # Project overview and setup
└── docker-compose.yml        # Local multi-service configuration
```

This is the high-level repository layout. Explore each directory for its implementation details.

## 🧪 Testing & Quality

Before submitting changes, run the checks available for the area you changed.

**Backend**

The backend documents `pytest` as its test framework. Once the development dependencies are installed, run:

```bash
cd backend
pytest
```

**Frontend**

Check the scripts declared in `frontend/package.json` before running the relevant lint, test, and build commands. Use the scripts configured in the repository rather than assuming a particular command exists.

Test your changes locally and report any checks that you could not run.

## 🤝 Contributing

SPARK welcomes contributions from developers at different experience levels.

You can contribute through:

- Bug fixes and reliability improvements.
- Documentation and setup improvements.
- UI/UX and accessibility refinements.
- Tests and developer tooling.
- Repository analysis and AI integration improvements.

### Contribution workflow

1. Read [`CONTRIBUTING.md`](CONTRIBUTING.md).
2. Check existing issues and pull requests.
3. Discuss substantial changes before starting implementation.
4. Create a focused branch for your change.
5. Test your changes.
6. Open a pull request with a clear summary and testing notes.

Please follow the project's [Code of Conduct](CODE_OF_CONDUCT.md).

## 🛡️ Security

Do not post credentials, API keys, or private information in public issues or pull requests.

Follow the project's `SECURITY.md` if available. If a security reporting policy has not yet been added, contact the maintainers privately rather than publishing details of a vulnerability.

## 🗺️ Roadmap

The project's direction is to make repository exploration and contribution discovery more useful and accessible.

Potential areas of continued development include:

- Improving repository architecture explanations.
- Making issue discovery and contribution guidance more useful.
- Strengthening the grounding and reliability of AI responses.
- Expanding automated tests and error handling.
- Improving onboarding, accessibility, and documentation.

This is a direction for future development, not a promise that each item is already implemented.

## 📄 License

SPARK is intended to be released under the [MIT License](LICENSE).

Refer to the `LICENSE` file in the repository for the actual license terms.

## 🌟 Join the Journey

Open source should be a place where developers can learn by exploring real projects, understand how software is built, and contribute with confidence.

SPARK aims to make that first step easier.

If the project interests you, explore the code, report an issue, suggest an improvement, or contribute a pull request.

**Explore. Understand. Contribute. Spark something. ⚡**
