import mongoose from "mongoose";

const portSchema = new mongoose.Schema(
  {
    port: Number,
    protocol: String,
    state: String,
    service: String,
    product: String,
    risk: String,
  },
  { _id: false }
);

const scanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    requestedPorts: {
      type: String,
      default: "",
    },
    toolAvailable: {
      type: Boolean,
      default: false,
    },
    toolName: {
      type: String,
      default: "nmap",
    },
    toolVersion: {
      type: String,
      default: "unknown",
    },
    status: {
      type: String,
      enum: ["completed", "failed"],
      default: "completed",
    },
    summary: {
      totalPorts: { type: Number, default: 0 },
      openPorts: { type: Number, default: 0 },
      riskyPorts: { type: Number, default: 0 },
      vulnerabilitiesCount: { type: Number, default: 0 },
    },
    ports: {
      type: [portSchema],
      default: [],
    },
    rawOutput: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Scan = mongoose.model("Scan", scanSchema);
