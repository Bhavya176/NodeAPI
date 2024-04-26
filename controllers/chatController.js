const Message = require("./../models/messageModel.js");

const activeUsers = new Map(); // Stores active user sockets and IDs
const chatHistoryCache = new Map(); // Caches chat history for performance

let ioInstance; // Holds the Socket.IO instance for use in functions

// Sets the Socket.IO instance for use within the controller
const setIoInstance = (io) => {
  ioInstance = io;
};

// Handles incoming chat connections
const handleChatConnection = (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join chat room and emit chat history
  socket.on("join_chat", async ({ userId }) => {
    try {
      socket.join(userId); // Joins the chat room with the user's ID

      // Check cache first for chat history
      const cachedHistory = chatHistoryCache.get(userId);

      if (cachedHistory) {
        socket.emit("chat_history", cachedHistory);
      } else {
        // Fetch chat history from database if not cached
        const chatHistory = await Message.find({
          $or: [{ senderId: userId }, { recipientId: userId }],
        }).sort({ createdAt: "asc" });

        socket.emit("chat_history", chatHistory);
        chatHistoryCache.set(userId, chatHistory); // Update cache
      }

      // Add user to active users map and emit updated list
      activeUsers.set(socket.id, { userId, socket });
      ioInstance.emit(
        "active_users",
        [...activeUsers.values()].map((user) => user.userId)
      );
    } catch (error) {
      console.error("Error joining chat:", error);
    }
  });

  // Handles incoming messages
  socket.on("send_message", async ({ senderId, recipientId, message }) => {
    try {
      // Create a new message in the database
      const newMessage = await Message.create({
        senderId,
        recipientId,
        message,
      });

      // Find recipient's socket if online and emit message directly
      const recipientSocket = [...activeUsers.values()].find(
        (user) => user.userId === recipientId
      )?.socket;

      if (recipientSocket) {
        recipientSocket.emit("receive_message", {
          senderId,
          message: newMessage.message,
          createdAt: newMessage.createdAt,
        });
      }
    } catch (error) {
      console.error("Error creating message:", error);
    }
  });

  // Handles socket disconnections
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);

    activeUsers.delete(socket.id); // Remove user from active users map

    // Emit updated list of active users
    ioInstance.emit(
      "active_users",
      [...activeUsers.values()].map((user) => user.userId)
    );
  });
};

module.exports = { setIoInstance, handleChatConnection };
