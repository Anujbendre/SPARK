# Architecture

The frontend presents a connected repository workspace. The FastAPI backend
validates repository URLs, retrieves bounded GitHub evidence, stores normalized
domain data in memory or a future persistence layer, and sends grounded
context to the Gemma model for interpretation.

```text
Next.js UI
    │
    ▼
FastAPI API ──► GitHub client ──► Repository evidence
    │
    └──────────► Agent orchestration ──► Gemma 4
```

The first vertical slice should implement repository URL validation, bounded
metadata retrieval, an overview response, and evidence references before
adding the architecture graph and recommendation workflow.

