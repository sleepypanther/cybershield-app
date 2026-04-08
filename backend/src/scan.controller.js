import { Scan } from "../models/scan.model.js";
import { executeNmapScan } from "../services/scan.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";
import { detectNmap } from "../services/tooling.service.js";
import { env } from "../config/env.js";

export async function createScan(req, res) {
  const target = (req.body?.target || env.nmapDefaultTarget).trim();
  const ports = (req.body?.ports || env.nmapDefaultPorts).trim();

  if (!target) {
    throw new AppError("Scan target is required", 400);
  }

  let result;

  try {
    result = await executeNmapScan({ target, ports });
  } catch (error) {
    const toolInfo = detectNmap();

    await Scan.create({
      userId: req.user.id,
      target,
      requestedPorts: ports,
      toolAvailable: toolInfo.available,
      toolName: toolInfo.name,
      toolVersion: toolInfo.version,
      status: "failed",
      errorMessage: error.message,
    });
    throw error;
  }

  const scan = await Scan.create({
    userId: req.user.id,
    target,
    requestedPorts: ports,
    toolAvailable: result.toolInfo.available,
    toolName: result.toolInfo.name,
    toolVersion: result.toolInfo.version,
    status: "completed",
    summary: result.summary,
    ports: result.ports,
    rawOutput: result.rawOutput,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Scan completed successfully",
    data: {
      scanId: scan._id.toString(),
      target,
      requestedPorts: ports,
      tool: result.toolInfo,
      summary: result.summary,
      ports: result.ports,
      createdAt: scan.createdAt,
    },
  });
}

export async function listScans(req, res) {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const scans = await Scan.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return sendSuccess(res, {
    message: "Scan history fetched successfully",
    data: scans,
    meta: {
      count: scans.length,
      tool: detectNmap(),
    },
  });
}
