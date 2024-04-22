const express = require("express");
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const productRoutes = require("./routes/productRoutes");

connectDb();
const app = express();

const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("products api running new deploy");
});
app.use(express.json());
app.use("/products", productRoutes);
app.use("/contacts", require("./routes/contactRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
