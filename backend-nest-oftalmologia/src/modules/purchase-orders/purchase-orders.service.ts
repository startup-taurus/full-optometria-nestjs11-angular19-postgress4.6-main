import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { PurchaseOrder, PurchaseOrderStatus } from './entities/purchase-order.entity';
import { Client } from '../patients/entities/client.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { CreatePurchaseOrderDto } from './dtos/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dtos/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dtos/query-purchase-order.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(PurchaseOrder)
    private purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(LaboratoryOrder)
    private laboratoryOrderRepository: Repository<LaboratoryOrder>,
  ) {}

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

    const purchaseOrder = this.purchaseOrderRepository.create({
      orderNumber,
      laboratoryOrderId,
      clientId,
      companyId,
      branchId,
      shouldInvoice: false,
      status: PurchaseOrderStatus.PENDING,
    });

    try {
      const savedPurchaseOrder = await this.purchaseOrderRepository.save(purchaseOrder);

      return {
        messageKey: 'PURCHASE_ORDER.CREATED',
        message: {
          es: 'Orden de pedido creada correctamente',
          en: 'Purchase order created successfully',
        },
        data: savedPurchaseOrder,
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
      relations: ['client', 'laboratoryOrder'],
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
      relations: ['client', 'laboratoryOrder'],
    });
  }
}
