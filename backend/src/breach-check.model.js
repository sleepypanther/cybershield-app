import mongoose from "mongoose";

const breachItemSchema = new mongoose.Schema(
  {
    name: String,
    domain: String,
    breachDate: String,
    compromisedData: [String],
    description: String,
  },
  { _id: false }
);

const breachCheckSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    provider: {
      type: String,
      default: "fallback",
    },
    found: {
      type: Boolean,
      default: false,
    },
    breachCount: {
      type: Number,
      default: 0,
    },
    breaches: {
      type: [breachItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const BreachCheck = mongoose.model("BreachCheck", breachCheckSchema);
