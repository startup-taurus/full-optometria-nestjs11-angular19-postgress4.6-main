import { config } from 'dotenv';
import { Client } from 'pg';

config();

async function ensureProductIdsColumn(): Promise<boolean> {
  const client = new Client({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 5432),
    user: process.env.DB_USER || process.env.DATABASE_USERNAME,
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.DB_NAME || process.env.DATABASE_NAME,
  });

  await client.connect();

  try {
    let hasChanges = false;

    const tableExistsResult = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = 'laboratory_orders'
        ) AS "exists"
      `
    );

    const tableExists = Boolean(tableExistsResult.rows[0]?.exists);
    if (!tableExists) {
      return false;
    }

    const columnExistsResult = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'laboratory_orders'
            AND column_name = 'product_ids'
        ) AS "exists"
      `
    );

    const columnExists = Boolean(columnExistsResult.rows[0]?.exists);
    if (!columnExists) {
      await client.query(
        `ALTER TABLE "laboratory_orders" ADD COLUMN "product_ids" uuid[]`
      );
      hasChanges = true;
    }

    const oldColumnExistsResult = await client.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'laboratory_orders'
            AND column_name = 'product_id'
        ) AS "exists"
      `
    );

    const oldColumnExists = Boolean(oldColumnExistsResult.rows[0]?.exists);
    if (oldColumnExists) {
      const updateResult = await client.query(`
        UPDATE "laboratory_orders"
        SET "product_ids" = ARRAY["product_id"]::uuid[]
        WHERE "product_id" IS NOT NULL
          AND ("product_ids" IS NULL OR cardinality("product_ids") = 0)
      `);

      if ((updateResult.rowCount ?? 0) > 0) {
        hasChanges = true;
      }
    }

    return hasChanges;
  } finally {
    await client.end();
  }
}

ensureProductIdsColumn()
  .then((hasChanges) => {
    if (hasChanges) {
      console.log('DB patch applied: laboratory_orders.product_ids updated');
    }
  })
  .catch((error) => {
    console.error('DB patch failed:', error);
    process.exit(1);
  });
