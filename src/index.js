import { router } from "./router.js";
import { processHistoryRoute } from "./routes/processHistory.js";

export default {
  async fetch(request, env, ctx) {
    return router(request, env, ctx);
  },

  // Runs on the Cron Trigger schedule (see wrangler.jsonc "triggers.crons").
  // Same code path as manually calling POST /process-history.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(processHistoryRoute(env));
  }
};
