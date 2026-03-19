// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
