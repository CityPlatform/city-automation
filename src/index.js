import { router } from "./router.js";

export default {
  async fetch(request, env, ctx) {
    return router(request, env, ctx);
  }
};
