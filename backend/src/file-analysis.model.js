import mongoose from "mongoose";

const fileAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    size: {
      type: Number,
      default: 0,
    },
    sha256: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["safe", "low", "medium", "high"],
      default: "safe",
    },
    indicators: {
      type: [String],
      default: [],
    },
    recommendation: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const FileAnalysis = mongoose.model("FileAnalysis", fileAnalysisSchema);
