const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
// var fs = require("fs");
// var path = require("path");

//@desc Register a user
//@route POST /api/users/register
//@access public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, imgUrl } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error("All fields are mandatory!");
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("User already registered!");
  }

  // TODO: You should hash the password before saving in production!
  const user = await User.create({
    username,
    email,
    password,
    imgUrl: imgUrl || null, // handle optional image URL
    role: "user",
  });

  res.status(201).json({
    _id: user.id,
    email: user.email,
    message: "User Registered Successfully",
  });
});

//@desc Login user
//@route POST /api/users/login
//@access public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password, deviceId } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are mandatory!");
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error("Email or password is not valid");
    }

    // Compare password with stored password
    if (password !== user.password) {
      res.status(401);
      throw new Error("Email or password is not valid");
    }

    // Update the deviceId in the user document if provided
    if (deviceId) {
      try {
        user.deviceId = deviceId;
        await user.save();
        console.log("Device ID updated");
      } catch (error) {
        console.error("Error updating device ID:", error.message);
        res
          .status(500)
          .json({ message: "Internal server error updating device ID" });
        return;
      }
    } else {
      console.log("Device ID not provided");
    }

    const userInfo = {
      username: user.username,
      email: user.email,
      id: user.id,
      img: user.img,
      role: user.role,
      deviceId: user?.deviceId,
    };

    const accessToken = jwt.sign(
      {
        user: userInfo,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res
      .status(200)
      .json({ accessToken, userInfo, message: "User Login Successfully" });
    console.log("Login successful");
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
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

//@desc Edit user data
//@route PUT /api/users/:id
//@access private
const editUser = asyncHandler(async (req, res) => {
  const { username, email, oldPassword, newPassword, role, deviceId, imgUrl } =
    req.body;
  console.log("oldPassword", oldPassword);
  const userId = req.params.id;
  
  const user = await User.findById(userId);
  console.log("user.password", user.password);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  // Check if old password is provided and valid (if the user wants to change their password)
  if (oldPassword && newPassword) {
    // Compare the old password with the stored one
    if (oldPassword !== user.password) {
      res.status(401);
      throw new Error("Old password is incorrect");
    }

    // Check the length of the new password (you can add more checks here)
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error("New password must be at least 6 characters");
    }

  }
  if (username) user.username = username;
  if (email) user.email = email;
  if (newPassword) user.password = newPassword;
  if (role) user.role = role;
  if (deviceId) user.deviceId = deviceId;
  if (imgUrl) user.imgUrl = imgUrl;

  const updatedUser = await user.save();

  res.status(200).json({
    _id: updatedUser.id,
    username: updatedUser.username,
    email: updatedUser.email,
    imgUrl: updatedUser.imgUrl,
    role: updatedUser.role,
    deviceId: updatedUser.deviceId,
    message: "User updated successfully",
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id; // Retrieve user ID from URL parameters

  // Check if the user exists in the database
  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Send the user data as response
  res.status(200).json({
    _id: user.id,
    username: user.username,
    email: user.email,
    imgUrl: user.imgUrl,
    role: user.role,
    deviceId: user.deviceId,
  });
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  getUsers,
  getAdmin,
  editUser,
  getUserProfile,
};
