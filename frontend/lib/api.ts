import { AskResponse, RepositoryAnalysis } from "../types/repository";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getApiHealth(): Promise<{ status: string }> {
  const response = await fetch(`${apiUrl}/health`);
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return response.json() as Promise<{ status: string }>;
}

export async function analyzeRepository(repositoryUrl: string): Promise<RepositoryAnalysis> {
  const response = await fetch(`${apiUrl}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: repositoryUrl }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : "Failed to analyze repository";
    throw new Error(detail);
  }

  return payload as RepositoryAnalysis;
}

export async function askRepository(repositoryUrl: string, question: string): Promise<AskResponse> {
  const response = await fetch(`${apiUrl}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: repositoryUrl, question }),
  });

  const payload = await response.json();
  if (!response.ok) {
    const detail =
      typeof payload === "object" && payload !== null && "detail" in payload
        ? String(payload.detail)
        : "Failed to answer question";
    throw new Error(detail);
  }

  return payload as AskResponse;
}
