import { SERVICE_NAME, VERSION } from "../config/constants.js";

export function healthRoute() {
  return Response.json({
    service: SERVICE_NAME,
    version: VERSION,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
}
