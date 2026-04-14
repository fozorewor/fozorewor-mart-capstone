import bcrypt from "bcrypt";
import db from "#db/client";
import { categories, products } from "./products.js";

const SEED_USERNAME = String(process.env.SEED_USERNAME || "demo-user")
  .trim()
  .toLowerCase();
const SEED_EMAIL = String(process.env.SEED_EMAIL || "demo@fozorewor.com")
  .trim()
  .toLowerCase();
const SEED_PASSWORD = String(process.env.SEED_PASSWORD || "demo12345");

export async function runSeed() {
  await deleteLegacyRaviUser();

  await upsertUser({
    username: SEED_USERNAME,
    email: SEED_EMAIL,
    password: SEED_PASSWORD,
  });

  await seedProducts();
}

async function deleteLegacyRaviUser() {
  await db.query(
    `
      DELETE FROM users
      WHERE lower(coalesce(username, '')) = 'ravi@gmail.com'
         OR lower(coalesce(email, '')) = 'ravi@gmail.com'
         OR lower(coalesce(username, '')) = 'ravi'
    `,
  );
}

async function upsertUser({
  username,
  email,
  password,
}) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const normalizedUsername = String(username || "").trim().toLowerCase();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  const {
    rows: [user],
  } = await db.query(
    `
      INSERT INTO users
        (username, email, password)
      VALUES
        ($1, $2, $3)
      ON CONFLICT (username) DO UPDATE
      SET email = EXCLUDED.email,
          password = EXCLUDED.password
      RETURNING *
    `,
    [normalizedUsername, normalizedEmail, hashedPassword],
  );

  return user;
}

async function seedProducts() {
  const categoryMap = new Map();

  for (const category of categories) {
    const {
      rows: [savedCategory],
    } = await db.query(
      `
        INSERT INTO categories
          (slug, name, description)
        VALUES
          ($1, $2, $3)
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description
        RETURNING id, slug
      `,
      [category.slug, category.name, category.description],
    );
    categoryMap.set(savedCategory.slug, savedCategory.id);
  }

  const insertSql = `
    INSERT INTO products
      (slug, category_id, name, description, keywords, price_cents, stock_quantity, is_active, rating_stars, rating_count, unit_label, image_path, image_gallery_paths)
    VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (slug) DO UPDATE
    SET category_id = EXCLUDED.category_id,
        name = EXCLUDED.name,
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
      categoryMap.get(product.category),
      product.name,
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
