import db from "#db/client";

export async function getActiveProducts() {
  const sql = `
    SELECT
      id,
      slug,
      name,
      category,
      description,
      price,
      price_cents,
      stock_quantity,
      is_active,
      rating_stars,
      rating_count,
      unit_label,
      image_path,
      image_gallery_paths
    FROM products
    WHERE is_active = true
    ORDER BY name ASC
  `;

  const { rows } = await db.query(sql);
  return rows;
}
