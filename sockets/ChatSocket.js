// sockets/chatSocket.js
const Message = require("../models/Message");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔹 Join Room
    socket.on("joinChat", (conversationId) => {
      socket.join(conversationId);
    });

    // 🔹 Send Message
    socket.on("sendMessage", async (data) => {
      const { conversationId, senderId, message } = data;

      try {
        // Save to DB
        const newMessage = await Message.create({
          conversationId,
          senderId,
          message,
        });

        // Emit to room
        io.to(conversationId).emit("receiveMessage", newMessage);
      } catch (err) {
        console.error(err);
      }
    });

    // 🔹 Typing
    socket.on("typing", (conversationId) => {
      socket.to(conversationId).emit("typing");
    });

    // 🔹 Disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};