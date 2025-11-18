const express = require("express");
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const Message = require("./models/messageModel");
const UserMessage = require("./models/userMessageModel");
const socketIo = require("socket.io");
const productRoutes = require("./routes/productRoutes");
const agentRoutes = require("./routes/agentRoutes");
const http = require("http");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET);

connectDb();

const app = express();
app.use(express.json());

// =============================================
// 🔒 ALLOWED DOMAIN
// =============================================
const ALLOWED_ORIGIN = "https://universalcart.vercel.app";

// =============================================
// 🔒 GLOBAL ORIGIN VALIDATION MIDDLEWARE
// Blocks all unknown origins before hitting routes
// =============================================
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || origin === ALLOWED_ORIGIN) {
    return next(); // allow server-to-server & allowed site
  }

  return res.status(403).json({ error: "Forbidden: Invalid origin" });
});

// =============================================
// 🔒 CORS CONFIG (Allow only your domain)
// =============================================
app.use(
  cors({
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

const server = http.createServer(app);

// =============================================
// 🔒 SOCKET.IO CORS PROTECTION
// =============================================
const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// =============================================
// ROUTES
// =============================================
const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("products api running new deploy");
});

app.use("/agent", agentRoutes);

app.get("/about", (req, res) => {
  res.send("products api running new deploy");
});

// =============================================
// DELETE ALL CHATS
// =============================================
app.delete("/delete-all-chats", async (req, res) => {
  try {
    await UserMessage.deleteMany({});
    res.status(200).json({ message: "All chats deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete chats." });
  }
});

app.use("/products", productRoutes);
app.use("/contacts", require("./routes/contactRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use(errorHandler);

// =============================================
// STRIPE CHECKOUT SESSION
// =============================================
app.post("/api/create-checkout-session", async (req, res) => {
  try {
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
            fixed_amount: { amount: 1500, currency: "usd" },
            display_name: "Next day air",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 1 },
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// =============================================
// STRIPE PAYMENT SHEET
// =============================================
app.post("/payment-sheet", async (req, res) => {
  try {
    const { amount, email } = req.body;

    const customers = await stripe.customers.list({ email });

    const customer =
      customers.data.length > 0
        ? customers.data[0]
        : await stripe.customers.create({ email });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2023-10-16" }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: customer.id,
      automatic_payment_methods: { enabled: true },
    });

    res.status(200).json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PUBLICKEY,
    });
  } catch (error) {
    console.error("Payment Sheet error:", error);
    res.status(500).json({ error: "Failed to initialize payment sheet." });
  }
});

// =============================================
// SAVE MESSAGE
// =============================================
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

// GET USER MESSAGES
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

// =============================================
// 🚀 CHATGPT / OPENROUTER API (Protected)
// =============================================
app.post("/api/chat", async (req, res) => {
  try {
    const { model, messages } = req.body;

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, messages }),
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// =============================================
// SOCKET.IO HANDLERS
// =============================================
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.emit("socketId", socket.id);

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

  socket.on(
    "initiateCall",
    ({ targetId, signalData, senderId, senderName }) => {
      io.to(targetId).emit("incomingCall", {
        signal: signalData,
        from: senderId,
        name: senderName,
      });
    }
  );

  socket.on("answerCall", (data) => {
    socket.broadcast.emit("mediaStatusChanged", {
      mediaType: data.mediaType,
      isActive: data.mediaStatus,
    });
    io.to(data.to).emit("callAnswered", data);
  });

  socket.on("terminateCall", ({ targetId }) => {
    io.to(targetId).emit("callTerminated");
  });

  socket.on("changeMediaStatus", ({ mediaType, isActive }) => {
    socket.broadcast.emit("mediaStatusChanged", { mediaType, isActive });
  });

  socket.on("sendMessage", ({ targetId, message, senderName }) => {
    io.to(targetId).emit("receiveMessage", { message, senderName });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// =============================================
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
