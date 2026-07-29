import { healthRoute } from "./routes/health.js";
import { processLatestRoute } from "./routes/processLatest.js";
import { processHistoryRoute } from "./routes/processHistory.js";

export async function router(request, env) {
  const url = new URL(request.url);

  if (request.method === "GET" && url.pathname === "/health") {
    return healthRoute();
  }

  if (request.method === "POST" && url.pathname === "/process-latest") {
    return processLatestRoute(env);
  }

  if (request.method === "POST" && url.pathname === "/process-history") {
    return processHistoryRoute(env);
  }

  return Response.json(
    { error: "Endpoint not found" },
    { status: 404 }
  );
}
