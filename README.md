# OSS Navigator

OSS Navigator turns a public GitHub repository into a guided contribution map:
it explains how the codebase works, connects project areas to people and work,
and recommends where a new contributor should start.

## Project status

This repository contains the initial production-oriented scaffold. The API
boundaries and domain modules are in place; repository analysis, Gemma-powered
reasoning, and the UI will be implemented incrementally.

## Repository layout

```text
frontend/   Next.js, TypeScript, Tailwind UI
backend/    FastAPI, GitHub integration, agent orchestration
docs/       Architecture and product documentation
```

## Recommended stack

- Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, XYFlow, and Lucide
- Python, FastAPI, Pydantic, httpx, and pytest
- GitHub REST API
- Google GenAI API with a configurable Gemma 4 model
- Docker Compose for local orchestration

## Setup

Copy `.env.example` to `.env` and provide the API credentials:

```powershell
Copy-Item .env.example .env
```

Start the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Start the frontend in a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Or use Docker Compose:

```powershell
docker compose up --build
```

The frontend is available at http://localhost:3000 and the API at
http://localhost:8000/docs.

## Environment variables

See `.env.example`. `GEMMA_MODEL` is intentionally configurable because the
event's current Gemma 4 model identifier must be verified before deployment.

## Planned user journey

Repository URL → analysis → overview → architecture → contributors →
issues/PRs → contribution recommendation → repository Q&A.

## License

MIT

