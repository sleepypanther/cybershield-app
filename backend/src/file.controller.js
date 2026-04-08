import { FileAnalysis } from "../models/file-analysis.model.js";
import { analyzeFile } from "../services/file.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export async function createFileAnalysis(req, res) {
  const file = req.file;

  if (!file) {
    throw new AppError("A file upload is required. Use multipart/form-data with field name `file`.", 400);
  }

  const result = analyzeFile(file);

  const record = await FileAnalysis.create({
    userId: req.user.id,
    ...result,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "File analysis completed successfully",
    data: {
      analysisId: record._id.toString(),
      ...result,
      createdAt: record.createdAt,
    },
  });
}
