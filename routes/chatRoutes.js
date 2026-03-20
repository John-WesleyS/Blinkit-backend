// routes/chatRoutes.js
const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// ✅ Create or Get Conversation
router.post("/conversation", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const adminId = req.body.adminId || "admin_1"; // Default admin if not specified

  try {
    let convo = await Conversation.findOne({
      participants: { $all: [userId, adminId] },
    });

    if (!convo) {
      convo = await Conversation.create({
        participants: [userId, adminId],
      });
    }

    res.json(convo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get Messages
router.get("/messages/:conversationId", verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADMIN: Get all conversations
router.get("/conversations", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const convos = await Conversation.find().sort({ updatedAt: -1 });
    res.json(convos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
