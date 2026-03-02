import { config } from 'dotenv';
import { Client } from 'pg';

config();

async function ensureProductIdsColumn(): Promise<void> {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DB_USER || process.env.DATABASE_USERNAME,
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.DB_NAME || process.env.DATABASE_NAME,
  });

  await client.connect();

  try {
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'laboratory_orders'
        ) THEN
          ALTER TABLE "laboratory_orders"
          ADD COLUMN IF NOT EXISTS "product_ids" uuid[];

          IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'laboratory_orders'
              AND column_name = 'product_id'
          ) THEN
            UPDATE "laboratory_orders"
            SET "product_ids" = ARRAY["product_id"]::uuid[]
            WHERE "product_id" IS NOT NULL
              AND ("product_ids" IS NULL OR cardinality("product_ids") = 0);
          END IF;
        END IF;
      END
      $$;
    `);
  } finally {
    await client.end();
  }
}

ensureProductIdsColumn()
  .then(() => {
    console.log('DB patch applied: laboratory_orders.product_ids ready');
  })
  .catch((error) => {
    console.error('DB patch failed:', error);
    process.exit(1);
  });
