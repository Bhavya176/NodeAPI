const validateToken = require("../middleware/validateTokenHandler");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProductById,
  deleteById,
} = require("../controllers/productController");

const router = require("express").Router();
router.post("/", createProduct); //secure
router.get("/", getProducts);
router.get("/:id", getProductById);
router.put("/:id", updateProductById); //secure
router.delete("/:id", deleteById); //secure

module.exports = router;
