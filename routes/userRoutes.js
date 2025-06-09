const express = require("express");
const {
  registerUser,
  currentUser,
  loginUser,
  getUsers,
  getAdmin,
  editUser,
  getUserProfile,
} = require("../controllers/userController");
const validateToken = require("../middleware/validateTokenHandler");

const router = express.Router();

// ✅ Multer and Cloudinary setup
// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");
// const cloudinary = require("../config/cloudinary"); // Create this config

// const storage = new CloudinaryStorage({
//   cloudinary: cloudinary,
//   params: {
//     folder: "user_images", // optional: folder in your Cloudinary account
//     allowed_formats: ["jpg", "png", "jpeg", "webp"],
//     public_id: (req, file) => `${Date.now()}-${file.originalname}`,
//   },
// });

// const upload = multer({ storage });

// ✅ Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/getAdmin", validateToken, getAdmin);
router.get("/getUser", validateToken, getUsers);
router.put("/usersID/:id", validateToken, editUser);
router.get("/current", validateToken, currentUser);
router.get("/userProfile/:id", validateToken, getUserProfile);

module.exports = router;
