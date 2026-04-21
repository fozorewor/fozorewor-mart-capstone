import express from "express";
import { getActiveProducts } from "#db/queries/products";

const router = express.Router();
export default router;

router.get("/", async (_req, res, next) => {
  try {
    const products = await getActiveProducts();
    res.json(products);
  } catch (error) {
    next(error);
  }
});
