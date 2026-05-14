import { MigrationInterface, QueryRunner } from 'typeorm';

type PurchaseOrderBackfillRow = {
  purchase_order_id: string;
  branch_id: string;
  product_quantities: unknown;
  product_ids: unknown;
  product_id: string | null;
};

type ProductRow = {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  unit_price: string | number | null;
};

export class CreatePurchaseOrderItems1765061000000 implements MigrationInterface {
  name = 'CreatePurchaseOrderItems1765061000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "purchase_order_id" uuid NOT NULL,
        "product_id" uuid NOT NULL,
        "product_code" character varying NOT NULL,
        "product_name" character varying NOT NULL,
        "product_brand" character varying,
        "quantity" integer NOT NULL,
        "unit_price" numeric(12,2) NOT NULL,
        "line_total" numeric(12,2) NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_purchase_order_items" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'purchase_orders'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE table_schema = 'public' AND table_name = 'purchase_order_items' AND constraint_name = 'FK_purchase_order_items_purchase_order_id'
        ) THEN
          ALTER TABLE "purchase_order_items"
          ADD CONSTRAINT "FK_purchase_order_items_purchase_order_id"
          FOREIGN KEY ("purchase_order_id") REFERENCES "purchase_orders"("id") ON DELETE CASCADE;
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_purchase_order_items_purchase_order_id_product_id" ON "purchase_order_items" ("purchase_order_id", "product_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_items_purchase_order_id" ON "purchase_order_items" ("purchase_order_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_purchase_order_items_product_id" ON "purchase_order_items" ("product_id")
    `);

    const baseTablesExist = await queryRunner.query(`
      SELECT
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'purchase_orders'
        ) AS purchase_orders_exists,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'laboratory_orders'
        ) AS laboratory_orders_exists,
        EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'products'
        ) AS products_exists
    `);

    const purchaseOrdersExists = Boolean(baseTablesExist[0]?.purchase_orders_exists);
    const laboratoryOrdersExists = Boolean(baseTablesExist[0]?.laboratory_orders_exists);
    const productsExists = Boolean(baseTablesExist[0]?.products_exists);

    if (!purchaseOrdersExists || !laboratoryOrdersExists || !productsExists) {
      return;
    }

    const purchaseOrders = (await queryRunner.query(`
      SELECT
        po.id AS purchase_order_id,
        po.branch_id,
        lo.product_quantities,
        lo.product_ids,
        lo.product_id
      FROM purchase_orders po
      INNER JOIN laboratory_orders lo ON lo.id = po.laboratory_order_id
    `)) as PurchaseOrderBackfillRow[];

    for (const purchaseOrder of purchaseOrders) {
      const quantityMap = new Map<string, number>();
      const rawQuantities = Array.isArray(purchaseOrder.product_quantities)
        ? purchaseOrder.product_quantities
        : typeof purchaseOrder.product_quantities === 'string'
          ? (() => {
              try {
                return JSON.parse(purchaseOrder.product_quantities);
              } catch {
                return [];
              }
            })()
          : [];

      if (Array.isArray(rawQuantities)) {
        for (const entry of rawQuantities as Array<{ productId?: string; quantity?: number }>) {
          if (!entry?.productId) {
            continue;
          }

          const productId = String(entry.productId).trim();
          if (!productId) {
            continue;
          }

          const quantity = Number(entry.quantity || 1);
          quantityMap.set(productId, (quantityMap.get(productId) || 0) + Math.max(1, Math.floor(quantity || 1)));
        }
      }

      if (!quantityMap.size && Array.isArray(purchaseOrder.product_ids)) {
        for (const productIdValue of purchaseOrder.product_ids as string[]) {
          const productId = String(productIdValue || '').trim();
          if (productId) {
            quantityMap.set(productId, 1);
          }
        }
      }

      if (!quantityMap.size && purchaseOrder.product_id) {
        quantityMap.set(purchaseOrder.product_id, 1);
      }

      if (!quantityMap.size) {
        continue;
      }

      const productIds = Array.from(quantityMap.keys());
      const products = (await queryRunner.query(
        `
          SELECT id, code, name, brand, unit_price
          FROM products
          WHERE branch_id = $1 AND id = ANY($2::uuid[])
        `,
        [purchaseOrder.branch_id, productIds],
      )) as ProductRow[];

      const productMap = new Map(products.map((product) => [product.id, product]));
      let totalAmount = 0;

      for (const [productId, quantity] of quantityMap.entries()) {
        const product = productMap.get(productId);
        const unitPrice = Number(product?.unit_price || 0);
        const lineTotal = Number((unitPrice * quantity).toFixed(2));
        totalAmount += lineTotal;

        await queryRunner.query(
          `
            INSERT INTO "purchase_order_items" (
              "purchase_order_id",
              "product_id",
              "product_code",
              "product_name",
              "product_brand",
              "quantity",
              "unit_price",
              "line_total"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT ("purchase_order_id", "product_id")
            DO UPDATE SET
              "product_code" = EXCLUDED."product_code",
              "product_name" = EXCLUDED."product_name",
              "product_brand" = EXCLUDED."product_brand",
              "quantity" = EXCLUDED."quantity",
              "unit_price" = EXCLUDED."unit_price",
              "line_total" = EXCLUDED."line_total",
              "updated_at" = now()
          `,
          [
            purchaseOrder.purchase_order_id,
            product?.id || productId,
            product?.code || productId,
            product?.name || '-',
            product?.brand || null,
            quantity,
            unitPrice,
            lineTotal,
          ],
        );
      }

      await queryRunner.query(
        `
          UPDATE "purchase_orders"
          SET "total_amount" = $1
          WHERE "id" = $2
        `,
        [Number(totalAmount.toFixed(2)), purchaseOrder.purchase_order_id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_items_product_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_purchase_order_items_purchase_order_id"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "UQ_purchase_order_items_purchase_order_id_product_id"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "purchase_order_items"
    `);
  }
}