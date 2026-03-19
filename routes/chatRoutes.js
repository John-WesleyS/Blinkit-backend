// routes/chatRoutes.js
const express = require("express");
const router = express.Router();

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// ✅ Create or Get Conversation
router.post("/conversation", async (req, res) => {
  const { userId, adminId } = req.body;

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
router.get("/messages/:conversationId", async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
