import express from "express";
import requireBody from "#middleware/requireBody";
import requireUser from "#middleware/requireUser";
import {
  createOrderForUser,
  getOrderByIdForUser,
  getOrdersForUser,
} from "#db/queries/orders";

const router = express.Router();
export default router;

router.use(requireUser);

router.get("/", async (req, res, next) => {
  try {
    const orders = await getOrdersForUser(req.user.id);
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.post("/", requireBody(["items"]), async (req, res, next) => {
  try {
    const order = await createOrderForUser(req.user.id, req.body.items);
    res.status(201).json(order);
  } catch (error) {
    if (error?.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

router.get("/:orderId", async (req, res, next) => {
  try {
    const order = await getOrderByIdForUser(req.user.id, req.params.orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});
