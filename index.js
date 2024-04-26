const express = require("express");
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const Message = require("./models/messageModel");
const socketIo = require("socket.io");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const productRoutes = require("./routes/productRoutes");
connectDb();
app.set("view engine", "ejs");

const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  // res.send("products api running new deploy");
  res.render("home");
});
// app.get("/register", (req, res) => {
//   res.render("registerPage");
// });
// app.get("/login", (req, res) => {
//   res.render("loginPage");
// });
app.get("/about", (req, res) => {
  res.render("aboutPage");
});
app.get("/message", (req, res) => {
  res.render("message");
});
app.delete('/delete-all-chats', async (req, res) => {
  try {
      await Message.deleteMany({}); // Delete all documents from Message collection
      res.status(200).json({ message: 'All chats deleted successfully.' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to delete chats.' });
  }
});
app.use(express.json());
app.use("/products", productRoutes);
app.use("/contacts", require("./routes/contactRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use(errorHandler);
io.on("connection", (socket) => {
  console.log("A user connected");

  // Send previous messages to the client
  Message.find({}, (err, messages) => {
    if (err) console.error(err);
    socket.emit("load messages", messages);
  });

  // Listen for new messages from the client
  socket.on("send message", (data) => {
    const newMessage = new Message({ user: data.user, message: data.message });
    newMessage.save((err) => {
      if (err) console.error(err);
      io.emit("receive message", { user: data.user, message: data.message });
    });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
