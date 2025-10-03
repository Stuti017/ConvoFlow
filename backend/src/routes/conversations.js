import express from "express";
import Conversation from "../models/Conversation.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate("participants", "name email avatarUrl")
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { participantId } = req.body;

    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userId, participantId], $size: 2 }
    });

    if (existing) return res.json(existing);

    const convo = await Conversation.create({
      participants: [userId, participantId]
    });

    res.status(201).json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/group", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, participantIds } = req.body;

    const convo = await Conversation.create({
      isGroup: true,
      name,
      participants: [userId, ...participantIds]
    });

    res.status(201).json(convo);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
