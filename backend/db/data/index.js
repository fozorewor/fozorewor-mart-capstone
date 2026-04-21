import db from "#db/client";
import { categories, products } from "./products.js";

export async function runSeed() {
  await seedProducts();
}

async function seedProducts() {
  for (const category of categories) {
    await db.query(
      `
        INSERT INTO categories
          (name, description)
        VALUES
          ($1, $2)
        ON CONFLICT (name) DO UPDATE
        SET description = EXCLUDED.description
      `,
      [category.name, category.description],
    );
  }

  const insertSql = `
    INSERT INTO products
      (slug, name, category, description, keywords, price_cents, stock_quantity, is_active, rating_stars, rating_count, unit_label, image_path, image_gallery_paths)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        keywords = EXCLUDED.keywords,
        price_cents = EXCLUDED.price_cents,
        stock_quantity = EXCLUDED.stock_quantity,
        is_active = EXCLUDED.is_active,
        rating_stars = EXCLUDED.rating_stars,
        rating_count = EXCLUDED.rating_count,
        unit_label = EXCLUDED.unit_label,
        image_path = EXCLUDED.image_path,
        image_gallery_paths = EXCLUDED.image_gallery_paths
  `;

  for (const product of products) {
    await db.query(insertSql, [
      product.slug,
      product.name,
      categoryLabel(product.category),
      product.description,
      product.keywords,
      product.price_cents,
      product.stock_quantity,
      product.is_active,
      product.rating_stars,
      product.rating_count,
      product.unit_label,
      product.image_path,
      product.image_gallery_paths,
    ]);
  }
}

function categoryLabel(value) {
  return String(value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
