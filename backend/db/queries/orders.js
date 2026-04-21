import db from "#db/client";

const TAX_RATE = 0.08;
const DELIVERY_FEE_CENTS = 499;
const FREE_DELIVERY_THRESHOLD_CENTS = 3500;
const DELIVERY_WINDOW_HOURS = 24;

export async function createOrderForUser(userId, items) {
  const normalizedItems = normalizeItems(items);
  let startedTransaction = false;

  try {
    await db.query("BEGIN");
    startedTransaction = true;

    const productIds = normalizedItems.map((item) => item.productId);
    const { rows: productRows } = await db.query(
      `
        SELECT
          id,
          slug,
          name,
          price_cents,
          stock_quantity,
          is_active,
          image_path,
          unit_label
        FROM products
        WHERE id = ANY($1::int[])
        FOR UPDATE
      `,
      [productIds],
    );

    const productsById = new Map(productRows.map((product) => [product.id, product]));

    for (const item of normalizedItems) {
      const product = productsById.get(item.productId);

      if (!product || !product.is_active) {
        throw badRequest("One or more products are unavailable.");
      }

      if (product.stock_quantity < item.quantity) {
        throw badRequest(`Not enough stock for ${product.name}.`);
      }
    }

    const subtotalCents = normalizedItems.reduce((sum, item) => {
      const product = productsById.get(item.productId);
      return sum + product.price_cents * item.quantity;
    }, 0);

    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const deliveryFeeCents =
      subtotalCents >= FREE_DELIVERY_THRESHOLD_CENTS ? 0 : DELIVERY_FEE_CENTS;
    const totalCents = subtotalCents + taxCents + deliveryFeeCents;
    const deliveryDate = new Date(Date.now() + DELIVERY_WINDOW_HOURS * 60 * 60 * 1000);

    const {
      rows: [order],
    } = await db.query(
      `
        INSERT INTO orders
          (user_id, subtotal_cents, tax_cents, delivery_fee_cents, total_cents, delivery_date)
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [userId, subtotalCents, taxCents, deliveryFeeCents, totalCents, deliveryDate],
    );

    for (const item of normalizedItems) {
      const product = productsById.get(item.productId);
      const lineTotalCents = product.price_cents * item.quantity;

      await db.query(
        `
          INSERT INTO order_items
            (order_id, product_id, quantity, unit_price_cents, line_total_cents)
          VALUES
            ($1, $2, $3, $4, $5)
        `,
        [order.id, product.id, item.quantity, product.price_cents, lineTotalCents],
      );

      await db.query(
        `
          UPDATE products
          SET stock_quantity = stock_quantity - $1
          WHERE id = $2
        `,
        [item.quantity, product.id],
      );
    }

    await db.query("COMMIT");
    startedTransaction = false;

    return getOrderByIdForUser(userId, order.id);
  } catch (error) {
    if (startedTransaction) {
      await db.query("ROLLBACK").catch(() => {});
    }
    throw error;
  }
}

export async function getOrdersForUser(userId) {
  const orders = await getBaseOrders(userId);
  if (orders.length === 0) return [];

  const orderIds = orders.map((order) => order.id);
  const items = await getOrderItems(orderIds);

  return attachItemsToOrders(orders, items);
}

export async function getOrderByIdForUser(userId, orderId) {
  const orders = await getBaseOrders(userId, orderId);
  if (orders.length === 0) return null;

  const items = await getOrderItems([orderId]);
  return attachItemsToOrders(orders, items)[0] ?? null;
}

async function getBaseOrders(userId, orderId) {
  const values = [userId];
  const orderFilter = orderId ? "AND id = $2" : "";

  if (orderId) values.push(orderId);

  const { rows } = await db.query(
    `
      SELECT
        id,
        status,
        subtotal,
        subtotal_cents,
        tax,
        tax_cents,
        delivery_fee,
        delivery_fee_cents,
        total,
        total_cents,
        delivery_date,
        delivered_at,
        created_at,
        updated_at
      FROM orders
      WHERE user_id = $1
      ${orderFilter}
      ORDER BY created_at DESC
    `,
    values,
  );

  return rows;
}

async function getOrderItems(orderIds) {
  const { rows } = await db.query(
    `
      SELECT
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price_cents,
        oi.price_at_purchase,
        oi.line_total_cents,
        p.slug,
        p.name,
        p.image_path,
        p.unit_label
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = ANY($1::uuid[])
      ORDER BY oi.id ASC
    `,
    [orderIds],
  );

  return rows.map((row) => ({
    ...row,
    line_total: centsToDollars(row.line_total_cents),
  }));
}

function attachItemsToOrders(orders, items) {
  const itemsByOrderId = new Map();

  for (const item of items) {
    const existing = itemsByOrderId.get(item.order_id) ?? [];
    existing.push(item);
    itemsByOrderId.set(item.order_id, existing);
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(order.id) ?? [],
  }));
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw badRequest("Your cart is empty.");
  }

  const merged = new Map();

  for (const rawItem of items) {
    const productId = Number.parseInt(rawItem?.productId, 10);
    const quantity = Number.parseInt(rawItem?.quantity, 10);

    if (!Number.isInteger(productId) || productId <= 0) {
      throw badRequest("One of the cart items has an invalid product id.");
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw badRequest("One of the cart items has an invalid quantity.");
    }

    const currentQuantity = merged.get(productId) ?? 0;
    merged.set(productId, currentQuantity + quantity);
  }

  return [...merged.entries()].map(([productId, quantity]) => ({
    productId,
    quantity,
  }));
}

function centsToDollars(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}
