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
var multer = require("multer");
var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    return cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    return cb(null, `${Date.now()}-${file.originalname}`);
  },
});
var upload = multer({ storage: storage });

router.post("/register", upload.single("image"), registerUser);

router.post("/login", loginUser);
router.get("/getAdmin", getAdmin);
router.get("/getUser", getUsers);
router.put(
  "/usersID/:id",
  upload.single("image"), // Use 'image' here to match the frontend field name
  (req, res, next) => {
    if (req.fileValidationError) {
      return res.status(400).send(req.fileValidationError);
    }
    next();
  },
  editUser
);
router.get("/current", validateToken, currentUser);
router.get("/userProfile/:id", getUserProfile);

module.exports = router;
