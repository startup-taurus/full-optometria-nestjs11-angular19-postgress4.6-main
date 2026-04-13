import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  In,
  EntityManager,
  FindOptionsWhere,
  IsNull,
} from 'typeorm';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Client } from '../patients/entities/client.entity';
import {
  LaboratoryOrder,
  LaboratoryOrderStatus,
} from '../laboratory-orders/entities/laboratory-order.entity';
import { Product } from '../products/entities/product.entity';
import { StockMovement } from '../products/entities/stock-movement.entity';
import { UpdatePurchaseOrderDto } from './dtos/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dtos/query-purchase-order.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(PurchaseOrderItem)
    private purchaseOrderItemRepository: Repository<PurchaseOrderItem>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(LaboratoryOrder)
    private laboratoryOrderRepository: Repository<LaboratoryOrder>,
  ) {}

  private static readonly STOCK_MOVEMENT_LAB_CREATE = 'LABORATORY_ORDER_CREATE';
  private static readonly STOCK_MOVEMENT_LAB_CANCEL = 'LABORATORY_ORDER_CANCEL';

  private extractLaboratoryOrderProductIds(
    laboratoryOrder: LaboratoryOrder,
  ): string[] {
    const orderAny = laboratoryOrder as any;

    const idsFromArray = Array.isArray(orderAny.productIds)
      ? orderAny.productIds.filter(Boolean)
      : [];

    if (idsFromArray.length > 0) {
      return Array.from(new Set(idsFromArray));
    }

    if (orderAny.productId) {
      return [orderAny.productId];
    }

    return [];
  }

  private getLaboratoryOrderQuantityMap(
    laboratoryOrder: LaboratoryOrder,
  ): Map<string, number> {
    const orderAny = laboratoryOrder as any;
    const quantityMap = new Map<string, number>();

    const persistedLines = Array.isArray(orderAny.productQuantities)
      ? orderAny.productQuantities
      : Array.isArray(orderAny.lineItems)
        ? orderAny.lineItems
        : [];

    persistedLines.forEach((line: any) => {
      if (!line || typeof line.productId !== 'string') {
        return;
      }

      const qty = Number(line.quantity);
      quantityMap.set(
        line.productId,
        Number.isFinite(qty) && qty > 0 ? qty : 1,
      );
    });

    if (!quantityMap.size) {
      this.extractLaboratoryOrderProductIds(laboratoryOrder).forEach(
        (productId) => {
          quantityMap.set(productId, 1);
        },
      );
    }

    return quantityMap;
  }

  private async buildPurchaseOrderItemSnapshots(
    laboratoryOrder: LaboratoryOrder,
    branchId: string,
    manager: EntityManager,
    strict = true,
  ): Promise<PurchaseOrderItem[]> {
    const quantityMap = this.getLaboratoryOrderQuantityMap(laboratoryOrder);
    const productIds = Array.from(quantityMap.keys());

    if (!productIds.length) {
      return [];
    }

    const products = await manager.getRepository(Product).find({
      where: { id: In(productIds), branchId },
      select: ['id', 'code', 'name', 'brand', 'unitPrice'],
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    if (strict && productMap.size !== productIds.length) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Uno o más productos de la orden de laboratorio no fueron encontrados',
          en: 'One or more laboratory order products were not found',
        },
      });
    }

    const snapshots: PurchaseOrderItem[] = [];

    quantityMap.forEach((quantity, productId) => {
      const product = productMap.get(productId);
      const unitPrice = Number(product?.unitPrice || 0);
      const lineTotal = Number((unitPrice * quantity).toFixed(2));

      snapshots.push(
        this.purchaseOrderItemRepository.create({
          productId,
          productCode: product?.code || productId,
          productName: product?.name || '-',
          productBrand: product?.brand || null,
          quantity,
          unitPrice,
          lineTotal,
        }),
      );
    });

    return snapshots;
  }

  private calculateTotalAmountFromItems(items: PurchaseOrderItem[]): number {
    const total = items.reduce(
      (sum, item) => sum + Number(item.lineTotal || 0),
      0,
    );

    return Number(total.toFixed(2));
  }

  private async generateOrderNumber(): Promise<number> {
    const lastOrder = await this.purchaseOrderRepository
      .createQueryBuilder('po')
      .select('MAX(po.orderNumber)', 'maxNumber')
      .getRawOne();

    const maxNumber = lastOrder?.maxNumber
      ? parseInt(lastOrder.maxNumber, 10)
      : 0;
    return maxNumber + 1;
  }

  private withCompanyScope<T extends { companyId?: string | null }>(
    where: FindOptionsWhere<T>,
    companyId: string | null,
  ): FindOptionsWhere<T> {
    return {
      ...where,
      companyId: companyId ?? IsNull(),
    } as FindOptionsWhere<T>;
  }

  private normalizeLaboratoryOrderStatus(
    laboratoryOrder: Pick<LaboratoryOrder, 'status' | 'isConfirmed'>,
  ): LaboratoryOrderStatus {
    if (laboratoryOrder.status) {
      return laboratoryOrder.status;
    }

    return laboratoryOrder.isConfirmed
      ? LaboratoryOrderStatus.RECEIVED
      : LaboratoryOrderStatus.PENDING;
  }

  private validatePendingCancellation(
    purchaseOrder: PurchaseOrder | null,
    laboratoryOrder: LaboratoryOrder,
  ): void {
    if (
      purchaseOrder &&
      purchaseOrder.status !== PurchaseOrderStatus.PENDING &&
      purchaseOrder.status !== PurchaseOrderStatus.CANCELLED
    ) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'Solo se pueden cancelar órdenes de pedido en estado pendiente',
          en: 'Only pending purchase orders can be cancelled',
        },
      });
    }

    const laboratoryOrderStatus =
      this.normalizeLaboratoryOrderStatus(laboratoryOrder);
    if (
      laboratoryOrderStatus !== LaboratoryOrderStatus.PENDING &&
      laboratoryOrderStatus !== LaboratoryOrderStatus.CANCELLED
    ) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'No se puede cancelar porque la orden de laboratorio vinculada ya no está pendiente',
          en: 'Cancellation is not allowed because the linked laboratory order is no longer pending',
        },
      });
    }
  }

  private async getRestorableStockMap(
    manager: EntityManager,
    laboratoryOrder: LaboratoryOrder,
  ): Promise<Map<string, number>> {
    const stockMovementRepo = manager.getRepository(StockMovement);

    const stockMovements = await stockMovementRepo.find({
      where: {
        referenceType: 'LABORATORY_ORDER',
        referenceId: laboratoryOrder.id,
        movementType: In([
          PurchaseOrdersService.STOCK_MOVEMENT_LAB_CREATE,
          PurchaseOrdersService.STOCK_MOVEMENT_LAB_CANCEL,
        ]),
      },
      select: ['productId', 'quantity', 'movementType'],
      order: { createdAt: 'ASC' },
    });

    const quantityMap = new Map<string, number>();

    if (stockMovements.length > 0) {
      const createdMap = new Map<string, number>();
      const cancelledMap = new Map<string, number>();

      stockMovements.forEach((movement) => {
        const productId = movement.productId;
        const quantity = Number(movement.quantity || 0);
        if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
          return;
        }

        if (
          movement.movementType ===
          PurchaseOrdersService.STOCK_MOVEMENT_LAB_CREATE
        ) {
          createdMap.set(
            productId,
            (createdMap.get(productId) || 0) + quantity,
          );
          return;
        }

        if (
          movement.movementType ===
          PurchaseOrdersService.STOCK_MOVEMENT_LAB_CANCEL
        ) {
          cancelledMap.set(
            productId,
            (cancelledMap.get(productId) || 0) + quantity,
          );
        }
      });

      createdMap.forEach((createdQuantity, productId) => {
        const cancelledQuantity = cancelledMap.get(productId) || 0;
        const restorableQuantity = createdQuantity - cancelledQuantity;
        if (restorableQuantity > 0) {
          quantityMap.set(productId, restorableQuantity);
        }
      });

      return quantityMap;
    }

    const fallbackMap = this.getLaboratoryOrderQuantityMap(laboratoryOrder);
    fallbackMap.forEach((quantity, productId) => {
      const normalizedQty = Number(quantity || 0);
      if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
        return;
      }

      quantityMap.set(productId, normalizedQty);
    });

    return quantityMap;
  }

  private async restoreLaboratoryOrderStock(
    manager: EntityManager,
    laboratoryOrder: LaboratoryOrder,
    branchId: string,
    companyId: string | null,
  ): Promise<void> {
    const quantityMap = await this.getRestorableStockMap(
      manager,
      laboratoryOrder,
    );
    if (!quantityMap.size) {
      return;
    }

    const stockMovementRepo = manager.getRepository(StockMovement);
    const productRepo = manager.getRepository(Product);

    for (const [productId, quantity] of quantityMap.entries()) {
      const product = await productRepo.findOne({
        where: { id: productId, branchId },
        select: ['id', 'quantity'],
      });

      if (!product) {
        continue;
      }

      const currentStock = Number(product.quantity || 0);
      const restoredStock = currentStock + quantity;

      await productRepo.update(
        { id: productId, branchId },
        { quantity: restoredStock },
      );

      const movement = stockMovementRepo.create({
        companyId: companyId || null,
        branchId,
        productId,
        movementType: PurchaseOrdersService.STOCK_MOVEMENT_LAB_CANCEL,
        quantity,
        balanceAfter: restoredStock,
        referenceType: 'LABORATORY_ORDER',
        referenceId: laboratoryOrder.id,
        note: `Cancellation for laboratory order #${laboratoryOrder.orderNumber || '-'}`,
      });

      await stockMovementRepo.save(movement);
    }
  }

  private async validateReactivationStockAvailability(
    manager: EntityManager,
    laboratoryOrder: LaboratoryOrder,
    branchId: string,
  ): Promise<
    Array<{
      productId: string;
      productName: string;
      needed: number;
      available: number;
    }>
  > {
    const productRepo = manager.getRepository(Product);
    const quantityMap = this.getLaboratoryOrderQuantityMap(laboratoryOrder);
    const insufficientProducts: Array<{
      productId: string;
      productName: string;
      needed: number;
      available: number;
    }> = [];

    for (const [productId, quantity] of quantityMap.entries()) {
      const product = await productRepo.findOne({
        where: { id: productId, branchId },
        select: ['id', 'name', 'quantity'],
      });

      if (!product) {
        insufficientProducts.push({
          productId,
          productName: `Unknown (${productId})`,
          needed: quantity,
          available: 0,
        });
        continue;
      }

      const currentStock = Number(product.quantity || 0);
      if (currentStock < quantity) {
        insufficientProducts.push({
          productId,
          productName: product.name || `Product ${productId}`,
          needed: quantity,
          available: currentStock,
        });
      }
    }

    return insufficientProducts;
  }

  private async deductLaboratoryOrderStock(
    manager: EntityManager,
    laboratoryOrder: LaboratoryOrder,
    branchId: string,
    companyId: string | null,
  ): Promise<void> {
    const quantityMap = this.getLaboratoryOrderQuantityMap(laboratoryOrder);
    if (!quantityMap.size) {
      return;
    }

    const stockMovementRepo = manager.getRepository(StockMovement);
    const productRepo = manager.getRepository(Product);

    for (const [productId, quantity] of quantityMap.entries()) {
      const product = await productRepo.findOne({
        where: { id: productId, branchId },
        select: ['id', 'quantity'],
      });

      if (!product) {
        continue;
      }

      const currentStock = Number(product.quantity || 0);
      const deductedStock = Math.max(currentStock - quantity, 0);

      await productRepo.update(
        { id: productId, branchId },
        { quantity: deductedStock },
      );

      const movement = stockMovementRepo.create({
        companyId: companyId || null,
        branchId,
        productId,
        movementType: PurchaseOrdersService.STOCK_MOVEMENT_LAB_CREATE,
        quantity,
        balanceAfter: deductedStock,
        referenceType: 'LABORATORY_ORDER',
        referenceId: laboratoryOrder.id,
        note: `Reactivation for laboratory order #${laboratoryOrder.orderNumber || '-'}`,
      });

      await stockMovementRepo.save(movement);
    }
  }

  private async reactivateLinkedOrders(
    branchId: string,
    companyId: string | null,
    options: { purchaseOrderId?: string; laboratoryOrderId?: string },
  ): Promise<{
    purchaseOrder: PurchaseOrder | null;
    laboratoryOrder: LaboratoryOrder;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseOrderRepo = manager.getRepository(PurchaseOrder);
      const laboratoryOrderRepo = manager.getRepository(LaboratoryOrder);

      let purchaseOrder: PurchaseOrder | null = null;

      if (options.purchaseOrderId) {
        const purchaseOrderWhere = this.withCompanyScope<PurchaseOrder>(
          { id: options.purchaseOrderId, branchId },
          companyId,
        );

        purchaseOrder = await purchaseOrderRepo.findOne({
          where: purchaseOrderWhere,
        });

        if (!purchaseOrder) {
          throw new NotFoundException({
            messageKey: 'ERROR.NOT_FOUND',
            message: {
              es: 'Orden de pedido no encontrada',
              en: 'Purchase order not found',
            },
          });
        }
      }

      if (!purchaseOrder && options.laboratoryOrderId) {
        const purchaseOrderWhere = this.withCompanyScope<PurchaseOrder>(
          { laboratoryOrderId: options.laboratoryOrderId, branchId },
          companyId,
        );

        purchaseOrder = await purchaseOrderRepo.findOne({
          where: purchaseOrderWhere,
        });
      }

      const laboratoryOrderId =
        options.laboratoryOrderId || purchaseOrder?.laboratoryOrderId;

      if (!laboratoryOrderId) {
        throw new NotFoundException({
          messageKey: 'ERROR.NOT_FOUND',
          message: {
            es: 'Orden de laboratorio vinculada no encontrada',
            en: 'Linked laboratory order not found',
          },
        });
      }

      const laboratoryOrderWhere = this.withCompanyScope<LaboratoryOrder>(
        { id: laboratoryOrderId, branchId },
        companyId,
      );

      const laboratoryOrder = await laboratoryOrderRepo.findOne({
        where: laboratoryOrderWhere,
      });

      if (!laboratoryOrder) {
        throw new NotFoundException({
          messageKey: 'ERROR.NOT_FOUND',
          message: {
            es: 'Orden de laboratorio no encontrada',
            en: 'Laboratory order not found',
          },
        });
      }

      // Validate both are in CANCELLED status
      if (
        purchaseOrder &&
        purchaseOrder.status !== PurchaseOrderStatus.CANCELLED
      ) {
        throw new BadRequestException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'La orden de pedido debe estar cancelada para reactivarla',
            en: 'Purchase order must be cancelled to reactivate it',
          },
        });
      }

      const laboratoryOrderStatus =
        this.normalizeLaboratoryOrderStatus(laboratoryOrder);
      if (laboratoryOrderStatus !== LaboratoryOrderStatus.CANCELLED) {
        throw new BadRequestException({
          messageKey: 'ERROR.VALIDATION',
          message: {
            es: 'La orden de laboratorio debe estar cancelada para reactivarla',
            en: 'Laboratory order must be cancelled to reactivate it',
          },
        });
      }

      // Validate stock availability BEFORE making changes
      const insufficientProducts =
        await this.validateReactivationStockAvailability(
          manager,
          laboratoryOrder,
          branchId,
        );

      if (insufficientProducts.length > 0) {
        throw new BadRequestException({
          messageKey: 'REACTIVATION.INSUFFICIENT_STOCK',
          message: {
            es: 'No hay stock disponible para reactivar la orden',
            en: 'Insufficient stock to reactivate order',
          },
          details: insufficientProducts,
        });
      }

      // Deduct stock for reactivation
      await this.deductLaboratoryOrderStock(
        manager,
        laboratoryOrder,
        branchId,
        companyId,
      );

      // Change both orders to PENDING
      if (purchaseOrder) {
        purchaseOrder.status = PurchaseOrderStatus.PENDING;
        await purchaseOrderRepo.save(purchaseOrder);
      }

      laboratoryOrder.status = LaboratoryOrderStatus.PENDING;
      laboratoryOrder.isConfirmed = false;
      await laboratoryOrderRepo.save(laboratoryOrder);

      return { purchaseOrder, laboratoryOrder };
    });
  }

  private async cancelLinkedOrders(
    branchId: string,
    companyId: string | null,
    options: { purchaseOrderId?: string; laboratoryOrderId?: string },
  ): Promise<{
    purchaseOrder: PurchaseOrder | null;
    laboratoryOrder: LaboratoryOrder;
  }> {
    return this.dataSource.transaction(async (manager) => {
      const purchaseOrderRepo = manager.getRepository(PurchaseOrder);
      const laboratoryOrderRepo = manager.getRepository(LaboratoryOrder);

      let purchaseOrder: PurchaseOrder | null = null;

      if (options.purchaseOrderId) {
        const purchaseOrderWhere = this.withCompanyScope<PurchaseOrder>(
          { id: options.purchaseOrderId, branchId },
          companyId,
        );

        purchaseOrder = await purchaseOrderRepo.findOne({
          where: purchaseOrderWhere,
        });

        if (!purchaseOrder) {
          throw new NotFoundException({
            messageKey: 'ERROR.NOT_FOUND',
            message: {
              es: 'Orden de pedido no encontrada',
              en: 'Purchase order not found',
            },
          });
        }
      }

      if (!purchaseOrder && options.laboratoryOrderId) {
        const purchaseOrderWhere = this.withCompanyScope<PurchaseOrder>(
          { laboratoryOrderId: options.laboratoryOrderId, branchId },
          companyId,
        );

        purchaseOrder = await purchaseOrderRepo.findOne({
          where: purchaseOrderWhere,
        });
      }

      const laboratoryOrderId =
        options.laboratoryOrderId || purchaseOrder?.laboratoryOrderId;

      if (!laboratoryOrderId) {
        throw new NotFoundException({
          messageKey: 'ERROR.NOT_FOUND',
          message: {
            es: 'Orden de laboratorio vinculada no encontrada',
            en: 'Linked laboratory order not found',
          },
        });
      }

      const laboratoryOrderWhere = this.withCompanyScope<LaboratoryOrder>(
        { id: laboratoryOrderId, branchId },
        companyId,
      );

      const laboratoryOrder = await laboratoryOrderRepo.findOne({
        where: laboratoryOrderWhere,
      });

      if (!laboratoryOrder) {
        throw new NotFoundException({
          messageKey: 'ERROR.NOT_FOUND',
          message: {
            es: 'Orden de laboratorio no encontrada',
            en: 'Laboratory order not found',
          },
        });
      }

      this.validatePendingCancellation(purchaseOrder, laboratoryOrder);

      const shouldCancelPurchase =
        !!purchaseOrder &&
        purchaseOrder.status !== PurchaseOrderStatus.CANCELLED;

      const laboratoryOrderStatus =
        this.normalizeLaboratoryOrderStatus(laboratoryOrder);
      const shouldCancelLaboratoryOrder =
        laboratoryOrderStatus !== LaboratoryOrderStatus.CANCELLED;

      if (shouldCancelPurchase && purchaseOrder) {
        purchaseOrder.status = PurchaseOrderStatus.CANCELLED;
        await purchaseOrderRepo.save(purchaseOrder);
      }

      if (shouldCancelLaboratoryOrder) {
        laboratoryOrder.status = LaboratoryOrderStatus.CANCELLED;
        laboratoryOrder.isConfirmed = false;
        await laboratoryOrderRepo.save(laboratoryOrder);
      }

      await this.restoreLaboratoryOrderStock(
        manager,
        laboratoryOrder,
        branchId,
        companyId,
      );

      return { purchaseOrder, laboratoryOrder };
    });
  }

  async cancelByLaboratoryOrderId(
    laboratoryOrderId: string,
    branchId: string,
    companyId: string | null,
  ): Promise<void> {
    await this.cancelLinkedOrders(branchId, companyId, { laboratoryOrderId });
  }

  async reactivateByLaboratoryOrderId(
    laboratoryOrderId: string,
    branchId: string,
    companyId: string | null,
  ): Promise<void> {
    await this.reactivateLinkedOrders(branchId, companyId, {
      laboratoryOrderId,
    });
  }

  async createFromLaboratoryOrder(
    laboratoryOrderId: string,
    clientId: string,
    companyId: string | null,
    branchId: string,
  ) {
    const laboratoryOrder = await this.laboratoryOrderRepository.findOne({
      where: { id: laboratoryOrderId, branchId },
    });

    if (!laboratoryOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Orden de laboratorio no encontrada',
          en: 'Laboratory order not found',
        },
      });
    }

    const client = await this.clientRepository.findOne({
      where: { id: clientId, branchId, companyId },
    });

    if (!client) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Cliente no encontrado',
          en: 'Client not found',
        },
      });
    }

    const existingPurchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { laboratoryOrderId },
    });

    if (existingPurchaseOrder) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'Ya existe una orden de pedido para esta orden de laboratorio',
          en: 'Purchase order already exists for this laboratory order',
        },
      });
    }

    const orderNumber = await this.generateOrderNumber();

    try {
      const result = await this.dataSource.transaction(async (manager) => {
        const itemSnapshots = await this.buildPurchaseOrderItemSnapshots(
          laboratoryOrder,
          branchId,
          manager,
          true,
        );

        const totalAmount = this.calculateTotalAmountFromItems(itemSnapshots);

        const purchaseOrderRepository = manager.getRepository(PurchaseOrder);
        const purchaseOrderItemRepository =
          manager.getRepository(PurchaseOrderItem);

        const purchaseOrder = purchaseOrderRepository.create({
          orderNumber,
          laboratoryOrderId,
          clientId,
          companyId,
          branchId,
          shouldInvoice: false,
          status: PurchaseOrderStatus.PENDING,
          totalAmount,
        });

        const savedPurchaseOrder =
          await purchaseOrderRepository.save(purchaseOrder);

        const itemsToSave = itemSnapshots.map((item) =>
          purchaseOrderItemRepository.create({
            ...item,
            purchaseOrderId: savedPurchaseOrder.id,
          }),
        );

        if (itemsToSave.length > 0) {
          await purchaseOrderItemRepository.save(itemsToSave);
        }

        const reloadedPurchaseOrder = await purchaseOrderRepository.findOne({
          where: { id: savedPurchaseOrder.id },
          relations: ['client', 'laboratoryOrder', 'items'],
        });

        return (
          reloadedPurchaseOrder || {
            ...savedPurchaseOrder,
            items: itemsToSave,
          }
        );
      });

      return {
        messageKey: 'PURCHASE_ORDER.CREATED',
        message: {
          es: 'Orden de pedido creada correctamente',
          en: 'Purchase order created successfully',
        },
        data: result,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        messageKey: 'ERROR.INTERNAL_SERVER',
        message: {
          es: 'Error inesperado al crear la orden de pedido',
          en: 'Unexpected error while creating purchase order',
        },
      });
    }
  }

  async findAll(
    queryDto: QueryPurchaseOrderDto,
    branchId: string,
    companyId: string | null,
  ) {
    const { page, limit, search, status, shouldInvoice } = queryDto;

    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.client', 'client')
      .leftJoinAndSelect('po.laboratoryOrder', 'laboratoryOrder')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('po.invoice', 'invoice')
      .where('po.branchId = :branchId', { branchId })
      .andWhere('po.companyId = :companyId', { companyId });

    if (search) {
      queryBuilder.andWhere(
        '(po.orderNumber::text LIKE :search OR LOWER(client.firstName) LIKE LOWER(:search) OR LOWER(client.lastName) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('po.status = :status', { status });
    }

    if (shouldInvoice !== undefined) {
      queryBuilder.andWhere('po.shouldInvoice = :shouldInvoice', {
        shouldInvoice,
      });
    }

    const [purchaseOrders, total] = await queryBuilder
      .orderBy('po.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      messageKey: 'PURCHASE_ORDER.FOUND',
      message: {
        es: 'Órdenes de pedido obtenidas correctamente',
        en: 'Purchase orders fetched successfully',
      },
      result: purchaseOrders,
      totalCount: total,
      currentPage: page,
      pageSize: limit,
    };
  }

  async findOne(id: string, branchId: string, companyId: string | null) {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id, branchId, companyId },
      relations: ['client', 'laboratoryOrder', 'items', 'invoice'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Orden de pedido no encontrada',
          en: 'Purchase order not found',
        },
      });
    }

    return {
      messageKey: 'PURCHASE_ORDER.FETCHED',
      message: {
        es: 'Orden de pedido obtenida correctamente',
        en: 'Purchase order fetched successfully',
      },
      data: purchaseOrder,
    };
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
    branchId: string,
    companyId: string | null,
  ) {
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id, branchId, companyId },
      relations: ['items'],
    });

    if (!purchaseOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Orden de pedido no encontrada',
          en: 'Purchase order not found',
        },
      });
    }

    if (updatePurchaseOrderDto.status === PurchaseOrderStatus.CANCELLED) {
      return this.remove(id, branchId, companyId);
    }

    if (
      updatePurchaseOrderDto.status === PurchaseOrderStatus.PENDING &&
      purchaseOrder.status === PurchaseOrderStatus.CANCELLED
    ) {
      const { purchaseOrder: reactivatedOrder } =
        await this.reactivateLinkedOrders(branchId, companyId, {
          purchaseOrderId: id,
        });

      return {
        messageKey: 'PURCHASE_ORDER.REACTIVATED',
        message: {
          es: 'Orden de pedido reactivada correctamente',
          en: 'Purchase order reactivated successfully',
        },
        data: reactivatedOrder,
      };
    }

    try {
      Object.assign(purchaseOrder, updatePurchaseOrderDto);
      const updatedPurchaseOrder =
        await this.purchaseOrderRepository.save(purchaseOrder);

      return {
        messageKey: 'PURCHASE_ORDER.UPDATED',
        message: {
          es: 'Orden de pedido actualizada correctamente',
          en: 'Purchase order updated successfully',
        },
        data: updatedPurchaseOrder,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        messageKey: 'ERROR.INTERNAL_SERVER',
        message: {
          es: 'Error inesperado al actualizar la orden de pedido',
          en: 'Unexpected error while updating purchase order',
        },
      });
    }
  }

  async remove(id: string, branchId: string, companyId: string | null) {
    const { purchaseOrder } = await this.cancelLinkedOrders(
      branchId,
      companyId,
      {
        purchaseOrderId: id,
      },
    );

    return {
      messageKey: 'PURCHASE_ORDER.CANCELLED',
      message: {
        es: 'Orden de pedido cancelada correctamente',
        en: 'Purchase order cancelled successfully',
      },
      data: purchaseOrder,
    };
  }

  async getPurchaseOrderByLaboratoryOrderId(laboratoryOrderId: string) {
    return this.purchaseOrderRepository.findOne({
      where: { laboratoryOrderId },
      relations: ['client', 'laboratoryOrder', 'items', 'invoice'],
    });
  }
}
