import { config } from 'dotenv';
import { Client } from 'pg';

config();

type DbConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

function buildConnectionCandidates(): DbConnectionConfig[] {
  const host = process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost';
  const port = Number(
    process.env.DATABASE_PORT || process.env.DB_PORT || 5432
  );

  const primary: DbConnectionConfig = {
    host,
    port,
    user: process.env.DATABASE_USERNAME || process.env.DB_USER || '',
    password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.DATABASE_NAME || process.env.DB_NAME || '',
  };

  const fallback: DbConnectionConfig = {
    host,
    port,
    user: process.env.DB_USER || process.env.DATABASE_USERNAME || '',
    password: process.env.DB_PASSWORD || process.env.DATABASE_PASSWORD || '',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || '',
  };

  const serialize = (cfg: DbConnectionConfig) =>
    `${cfg.host}:${cfg.port}:${cfg.user}:${cfg.database}`;

  const unique = new Map<string, DbConnectionConfig>();
  for (const candidate of [primary, fallback]) {
    if (candidate.user && candidate.database) {
      unique.set(serialize(candidate), candidate);
    }
  }

  return Array.from(unique.values());
}

async function connectWithFallback(): Promise<Client> {
  const candidates = buildConnectionCandidates();
  if (candidates.length === 0) {
    throw new Error(
      'No hay credenciales DB válidas. Define DATABASE_USERNAME/DATABASE_PASSWORD/DATABASE_NAME o DB_USER/DB_PASSWORD/DB_NAME.'
    );
  }

  let lastError: unknown;
  for (const cfg of candidates) {
    const client = new Client(cfg);
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('No fue posible conectar a PostgreSQL con las credenciales disponibles.');
}

async function ensureProductIdsColumn(): Promise<boolean> {
  const client = await connectWithFallback();

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
