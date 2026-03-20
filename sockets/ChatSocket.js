// sockets/chatSocket.js
const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

module.exports = (io) => {
  // Middleware for Authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication error: Token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // Attach user info to the socket
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "Authenticated User:", socket.user?.id);

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