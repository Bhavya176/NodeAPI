const express = require("express");
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const Message = require("./models/messageModel");
const UserMessage = require("./models/userMessageModel");
const socketIo = require("socket.io");
const productRoutes = require("./routes/productRoutes");
const http = require("http");
const app = express();
const cors = require("cors");
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

app.use(cors(corsOptions));
const stripe = require("stripe")(process.env.STRIPE_SECRET);
connectDb();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Update with your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});
const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("products api running new deploy");
  // res.render("home");
});

app.get("/about", (req, res) => {
  res.send("products api running new deploy");
});

app.delete("/delete-all-chats", async (req, res) => {
  try {
    await UserMessage.deleteMany({}); // Delete all documents from Message collection
    res.status(200).json({ message: "All chats deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete chats." });
  }
});
app.use(express.json());
app.use("/products", productRoutes);
app.use("/contacts", require("./routes/contactRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use(errorHandler);

app.post("/api/create-checkout-session", async (req, res) => {
  const { products, customer } = req.body;
  const lineItems = products.map((product) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product.title,
        images: [product.image],
      },
      unit_amount: product.price * 100,
    },
    quantity: product.qty,
  }));
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: 1500,
            currency: "usd",
          },
          display_name: "Next day air",
          delivery_estimate: {
            minimum: {
              unit: "business_day",
              value: 1,
            },
            maximum: {
              unit: "business_day",
              value: 1,
            },
          },
        },
      },
    ],
    allow_promotion_codes: true,
    customer_email: customer.email,
    success_url: process.env.CLIENT_URL,
    cancel_url: process.env.CLIENT_URL + "cart",
  });

  res.json({ id: session.id });
});

// Message routes
app.post("/messages", async (req, res) => {
  const { sender, receiver, content } = req.body;
  try {
    const message = new UserMessage({ sender, receiver, content });
    await message.save();
    res.status(201).send(message);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.get("/messages/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await UserMessage.find({
      $or: [{ sender: userId }, { receiver: userId }],
    }).populate("sender receiver");
    res.status(200).send(messages);
  } catch (error) {
    res.status(400).send(error);
  }
});

// io.on("connection", (socket) => {
//   console.log("A user connected");

//   // Send previous messages to the client
//   socket.on("load messages", async (userId) => {
//     try {
//       const messages = await UserMessage.find({
//         $or: [{ sender: userId }, { receiver: userId }],
//       }).populate("sender receiver");
//       socket.emit("load messages", messages);
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   // Listen for new messages from the client
//   socket.on("send message", async (data) => {
//     const { sender, receiver, content } = data;
//     const newMessage = new UserMessage({ sender, receiver, content });
//     try {
//       await newMessage.save();
//       io.emit("receive message", { sender, receiver, content });
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   // Handle disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });
// io.on("connection", (socket) => {
//   console.log("A user connected:", socket.id);

//   // Send socket ID to client
//   socket.emit("socketId", socket.id);

//   // Load chat messages for user
//   socket.on("load messages", async (userId) => {
//     try {
//       const messages = await UserMessage.find({
//         $or: [{ sender: userId }, { receiver: userId }],
//       }).populate("sender receiver");
//       socket.emit("load messages", messages);
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   // Receive and broadcast new chat message
//   socket.on("send message", async (data) => {
//     const { sender, receiver, content } = data;
//     const newMessage = new UserMessage({ sender, receiver, content });
//     try {
//       await newMessage.save();
//       io.emit("receive message", { sender, receiver, content });
//     } catch (err) {
//       console.error(err);
//     }
//   });

//   // Video Call: Initiate call
//   socket.on("initiateCall", ({ targetId, signalData, senderId, senderName }) => {
//     io.to(targetId).emit("incomingCall", {
//       signal: signalData,
//       from: senderId,
//       name: senderName,
//     });
//   });

//   // Video Call: Answer call
//   socket.on("answerCall", (data) => {
//     socket.broadcast.emit("mediaStatusChanged", {
//       mediaType: data.mediaType,
//       isActive: data.mediaStatus,
//     });
//     io.to(data.to).emit("callAnswered", data);
//   });

//   // Video Call: Terminate call
//   socket.on("terminateCall", ({ targetId }) => {
//     io.to(targetId).emit("callTerminated");
//   });

//   // Video Call: Media status change (mute/unmute, camera on/off)
//   socket.on("changeMediaStatus", ({ mediaType, isActive }) => {
//     socket.broadcast.emit("mediaStatusChanged", {
//       mediaType,
//       isActive,
//     });
//   });

//   // Video Call: Chat messages within call
//   socket.on("sendMessage", ({ targetId, message, senderName }) => {
//     io.to(targetId).emit("receiveMessage", { message, senderName });
//   });

//   // Disconnection
//   socket.on("disconnect", () => {
//     console.log("User disconnected:", socket.id);
//   });
// });



io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Send socket ID to client
  socket.emit("socketId", socket.id);

  // Load chat messages for user
  socket.on("load messages", async (userId) => {
    try {
      const messages = await UserMessage.find({
        $or: [{ sender: userId }, { receiver: userId }],
      }).populate("sender receiver");
      socket.emit("load messages", messages);
    } catch (err) {
      console.error(err);
    }
  });

  // Receive and broadcast new chat message
  socket.on("send message", async (data) => {
    const { sender, receiver, content } = data;
    const newMessage = new UserMessage({ sender, receiver, content });
    try {
      await newMessage.save();
      io.emit("receive message", { sender, receiver, content });
    } catch (err) {
      console.error(err);
    }
  });

  // Video Call: Initiate call
  socket.on("initiateCall", ({ targetId, signalData, senderId, senderName }) => {
    io.to(targetId).emit("incomingCall", {
      signal: signalData,
      from: senderId,
      name: senderName,
    });
  });

  // Video Call: Answer call
  socket.on("answerCall", (data) => {
    socket.broadcast.emit("mediaStatusChanged", {
      mediaType: data.mediaType,
      isActive: data.mediaStatus,
    });
    io.to(data.to).emit("callAnswered", data);
  });

  // Video Call: Terminate call
  socket.on("terminateCall", ({ targetId }) => {
    io.to(targetId).emit("callTerminated");
  });

  // Video Call: Media status change (mute/unmute, camera on/off)
  socket.on("changeMediaStatus", ({ mediaType, isActive }) => {
    socket.broadcast.emit("mediaStatusChanged", {
      mediaType,
      isActive,
    });
  });

  // Video Call: In-call messaging
  socket.on("sendMessage", ({ targetId, message, senderName }) => {
    io.to(targetId).emit("receiveMessage", { message, senderName });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
