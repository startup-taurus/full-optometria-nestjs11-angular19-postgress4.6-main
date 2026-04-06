import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, EntityManager } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { Client } from '../patients/entities/client.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Product } from '../products/entities/product.entity';
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

  private extractLaboratoryOrderProductIds(laboratoryOrder: LaboratoryOrder): string[] {
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
      quantityMap.set(line.productId, Number.isFinite(qty) && qty > 0 ? qty : 1);
    });

    if (!quantityMap.size) {
      this.extractLaboratoryOrderProductIds(laboratoryOrder).forEach((productId) => {
        quantityMap.set(productId, 1);
      });
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

    const maxNumber = lastOrder?.maxNumber ? parseInt(lastOrder.maxNumber, 10) : 0;
    return maxNumber + 1;
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
        const purchaseOrderItemRepository = manager.getRepository(PurchaseOrderItem);

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

        const savedPurchaseOrder = await purchaseOrderRepository.save(purchaseOrder);

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

        return reloadedPurchaseOrder || {
          ...savedPurchaseOrder,
          items: itemsToSave,
        };
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
      queryBuilder.andWhere('po.shouldInvoice = :shouldInvoice', { shouldInvoice });
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
      relations: ['client', 'laboratoryOrder', 'items'],
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

    try {
      Object.assign(purchaseOrder, updatePurchaseOrderDto);
      const updatedPurchaseOrder = await this.purchaseOrderRepository.save(purchaseOrder);

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
    const purchaseOrder = await this.purchaseOrderRepository.findOne({
      where: { id, branchId, companyId },
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

    purchaseOrder.status = PurchaseOrderStatus.CANCELLED;
    await this.purchaseOrderRepository.save(purchaseOrder);

    return {
      messageKey: 'PURCHASE_ORDER.DELETED',
      message: {
        es: 'Orden de pedido eliminada correctamente',
        en: 'Purchase order deleted successfully',
      },
    };
  }

  async getPurchaseOrderByLaboratoryOrderId(laboratoryOrderId: string) {
    return this.purchaseOrderRepository.findOne({
      where: { laboratoryOrderId },
      relations: ['client', 'laboratoryOrder', 'items'],
    });
  }
}
