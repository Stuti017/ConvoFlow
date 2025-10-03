import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    text: { type: String },
    fileUrl: { type: String },
    fileName: { type: String },
    fileType: { type: String },
    deletedForEveryone: { type: Boolean, default: false },
    deletedFor: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
