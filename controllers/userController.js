const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
var fs = require("fs");
var path = require("path");
//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const userAvailable = await User.findOne({ email });
  if (userAvailable) {
    res.status(400);
    throw new Error("User already registered!");
  }

  //Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log("Hashed Password: ", hashedPassword);
  const imgData = req.file
    ? {
        data: fs.readFileSync(path.join("./uploads/" + req.file.filename)),
        contentType: "image/png",
      }
    : null; // Set to undefined when no file is uploaded

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    img: imgData,
    role: "user",
  });

  console.log(`User created ${user}`);
  if (user) {
    res.status(201).json({
      _id: user.id,
      email: user.email,
      message: "User Registered Successfully",
    });
  } else {
    res.status(400);
    throw new Error("User data is not valid");
  }
  res.json({ message: "Register the user" });
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }
  const user = await User.findOne({ email });
  //compare password with hashedpassword
  if (user && (await bcrypt.compare(password, user.password))) {
    const userInfo = {
      username: user.username,
      email: user.email,
      id: user.id,
      img: user.img,
      role: user.role,
    };
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user.id,
          img: user.img,
          role: user.role,
        },
      },
      process.env.ACCESS_TOKEN_SECERT,
      { expiresIn: "15m" }
    );
    res
      .status(200)
      .json({ accessToken, userInfo, message: "User Login Successfully" });
  } else {
    res.status(401);
    throw new Error("email or password is not valid");
  }
});

//@desc Current user info
//@route POST /api/users/current
//@access private
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

const getUsers = async (req, res) => {
  console.log("results");
  try {
    const results = await User.find({ role: "user" });
    res.status(200).json({ message: "success", data: results });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};
const getAdmin = async (req, res) => {
  console.log("results");
  try {
    const results = await User.find({ role: "admin" });
    res.status(200).json({ message: "success", data: results });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { registerUser, loginUser, currentUser, getUsers, getAdmin };
