import express from "express";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/:conversationId", authMiddleware, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversation: conversationId })
      .populate("sender", "name email avatarUrl")
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { conversationId, text } = req.body;
    const userId = req.user.userId;

    const message = await Message.create({
      conversation: conversationId,
      sender: userId,
      text
    });

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id
    });

    const populated = await message.populate("sender", "name email avatarUrl");
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { forEveryone } = req.query;

    const message = await Message.findById(id);
    if (!message) return res.status(404).json({ message: "Not found" });

    if (forEveryone === "true") {
      message.deletedForEveryone = true;
    } else {
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
      }
    }

    await message.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
