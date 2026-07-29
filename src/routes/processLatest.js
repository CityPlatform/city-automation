import { processLatest } from "../services/outlookClient.js";

// POST /process-latest
// Thin pass-through to city-outlook-service's own process-latest pipeline.
// No orchestration logic duplicated here on purpose.
export async function processLatestRoute(env) {
  const result = await processLatest(env);
  return Response.json(result);
}
