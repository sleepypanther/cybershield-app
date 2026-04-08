import { buildDashboard } from "../services/dashboard.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { detectNmap } from "../services/tooling.service.js";

export async function getDashboard(req, res) {
  const dashboard = await buildDashboard(req.user.id);

  return sendSuccess(res, {
    message: "Dashboard stats fetched successfully",
    data: {
      ...dashboard,
      tools: {
        nmap: detectNmap(),
      },
    },
  });
}
