const STORAGE_PREFIX = "fozorewor-local-orders";

export function saveLocalOrder(token, items, summary) {
  const storageKey = getStorageKey(token);
  const createdAt = new Date().toISOString();
  const deliveryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const orderId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `local-${Date.now()}`;

  const order = {
    id: orderId,
    status: "placed",
    subtotal: centsToDollars(summary.subtotalCents),
    subtotal_cents: summary.subtotalCents,
    tax: centsToDollars(summary.taxCents),
    tax_cents: summary.taxCents,
    delivery_fee: centsToDollars(summary.deliveryFeeCents),
    delivery_fee_cents: summary.deliveryFeeCents,
    total: centsToDollars(summary.totalCents),
    total_cents: summary.totalCents,
    delivery_date: deliveryDate,
    delivered_at: null,
    created_at: createdAt,
    updated_at: createdAt,
    source: "local",
    items: items.map((item, index) => ({
      id: `${orderId}-${index + 1}`,
      order_id: orderId,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price_cents: item.priceCents,
      price_at_purchase: centsToDollars(item.priceCents),
      line_total_cents: item.priceCents * item.quantity,
      line_total: centsToDollars(item.priceCents * item.quantity),
      slug: item.slug,
      name: item.name,
      image_path: item.imagePath,
      unit_label: item.unitLabel,
    })),
  };

  const existingOrders = getLocalOrders(token);
  window.localStorage.setItem(storageKey, JSON.stringify([order, ...existingOrders]));
  return order;
}

export function getLocalOrders(token) {
  try {
    const rawValue = window.localStorage.getItem(getStorageKey(token));
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLocalOrderById(token, orderId) {
  return getLocalOrders(token).find((order) => order.id === orderId) ?? null;
}

function getStorageKey(token) {
  return `${STORAGE_PREFIX}:${token || "guest"}`;
}

function centsToDollars(cents) {
  return Number((Number(cents || 0) / 100).toFixed(2));
}
