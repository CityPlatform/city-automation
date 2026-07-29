// All calls go through the CITY_OUTLOOK service binding — no public URLs,
// no duplicated business logic. This service only orchestrates.

export async function listUnprocessedEmails(env, limit) {
  const response = await env.CITY_OUTLOOK.fetch(
    `https://internal/list-emails?limit=${limit}`,
    { method: "GET" }
  );
  return response.json();
}

// Single-email path: delegates entirely to outlook-service's own
// sync -> classify -> tag -> mark-read pipeline. No duplication here.
export async function processLatest(env) {
  const response = await env.CITY_OUTLOOK.fetch(
    "https://internal/process-latest",
    { method: "POST" }
  );
  return response.json();
}

export async function classifyEmail(env, { subject, body, from, categories, headers }) {
  const response = await env.CITY_OUTLOOK.fetch(
    "https://internal/analyze-email",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, from, categories, headers })
    }
  );
  return response.json();
}

export async function applyCategory(env, { messageId, category, markRead }) {
  const response = await env.CITY_OUTLOOK.fetch(
    "https://internal/apply-category",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, category, markRead })
    }
  );
  return response.json();
}
