const express = require("express");
const {
  registerUser,
  currentUser,
  loginUser,
  getUsers,
  getAdmin,
  editUser,
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
router.put("/users/:id", upload.single("img"), editUser);
router.get("/current", validateToken, currentUser);

module.exports = router;
