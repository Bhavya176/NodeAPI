const validateToken = require("../middleware/validateTokenHandler");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProductById,
  deleteById,
} = require("../controllers/productController");

const router = require("express").Router();
router.post("/", validateToken, createProduct); //secure
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", validateToken, updateProductById); //secure
router.delete("/:id", validateToken, deleteById); //secure

module.exports = router;
