import express from "express";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../controllers/product.controller.js";
import { handleBase64Upload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", handleBase64Upload, createProduct);
router.post("/upload-image", handleBase64Upload, (req, res) => {
  const url = req.uploadedFileUrl || req.body.imageData || "";
  res.json({ success: true, url, imageUrl: url });
});
router.put("/:id", handleBase64Upload, updateProduct);
router.delete("/:id", deleteProduct);

export default router;
