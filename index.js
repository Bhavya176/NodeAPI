const express = require("express");
const connectDb = require("./config/dbConnection");
const errorHandler = require("./middleware/errorHandler");
const dotenv = require("dotenv").config();
const productRoutes = require("./routes/productRoutes");
connectDb();
const app = express();
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

app.use(express.json());
app.use("/products", productRoutes);
app.use("/contacts", require("./routes/contactRoutes"));
app.use("/users", require("./routes/userRoutes"));
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
