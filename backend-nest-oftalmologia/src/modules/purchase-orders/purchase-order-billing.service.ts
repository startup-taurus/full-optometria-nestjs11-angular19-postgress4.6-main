import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Company } from '../companies/entities/company.entity';
import {
  PurchaseOrder,
  PurchaseOrderStatus,
} from './entities/purchase-order.entity';
import {
  PurchaseOrderInvoice,
  PurchaseOrderInvoiceState,
} from './entities/purchase-order-invoice.entity';
import {
  PurchaseOrderInvoiceLog,
  PurchaseOrderInvoiceLogAction,
} from './entities/purchase-order-invoice-log.entity';
import { BillingPaymentMethod } from './entities/billing-payment-method.entity';
import { Client } from '../patients/entities/client.entity';
import { CreatePurchaseOrderInvoiceDto } from './dtos/create-purchase-order-invoice.dto';
import { RetryPurchaseOrderInvoiceDto } from './dtos/retry-purchase-order-invoice.dto';
import {
  BillingApiError,
  BillingApiProvider,
} from './providers/billing-api.provider';

@Injectable()
export class PurchaseOrderBillingService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(PurchaseOrderInvoice)
    private readonly purchaseOrderInvoiceRepository: Repository<PurchaseOrderInvoice>,
    @InjectRepository(PurchaseOrderInvoiceLog)
    private readonly purchaseOrderInvoiceLogRepository: Repository<PurchaseOrderInvoiceLog>,
    @InjectRepository(BillingPaymentMethod)
    private readonly billingPaymentMethodRepository: Repository<BillingPaymentMethod>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly billingApiProvider: BillingApiProvider,
  ) {}

  async getPaymentMethods() {
    const methods = await this.billingPaymentMethodRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });

    return {
      messageKey: 'PURCHASE_ORDER.BILLING_PAYMENT_METHODS_FETCHED',
      data: methods,
    };
  }

  async getInvoiceByPurchaseOrderId(
    purchaseOrderId: string,
    branchId: string,
    companyId: string | null,
  ) {
    await this.loadScopedPurchaseOrder(purchaseOrderId, branchId, companyId);

    const invoice = await this.purchaseOrderInvoiceRepository.findOne({
      where: {
        purchaseOrderId,
        branchId,
        companyId: this.toCompanyScope(companyId),
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'La orden no tiene una factura asociada',
          en: 'The order has no linked invoice',
        },
      });
    }

    return {
      messageKey: 'PURCHASE_ORDER.INVOICE_FETCHED',
      data: invoice,
    };
  }

  async createInvoice(
    purchaseOrderId: string,
    dto: CreatePurchaseOrderInvoiceDto,
    branchId: string,
    companyId: string | null,
  ) {
    return this.createOrRetryInvoice(
      purchaseOrderId,
      dto.paymentMethod,
      dto.taxPercent,
      branchId,
      companyId,
      false,
    );
  }

  async retryInvoice(
    purchaseOrderId: string,
    dto: RetryPurchaseOrderInvoiceDto,
    branchId: string,
    companyId: string | null,
  ) {
    const existingInvoice = await this.purchaseOrderInvoiceRepository.findOne({
      where: {
        purchaseOrderId,
        branchId,
        companyId: this.toCompanyScope(companyId),
      },
    });

    const paymentMethod =
      dto.paymentMethod || existingInvoice?.paymentMethod || '01';
    const taxPercent = Number.isFinite(dto.taxPercent)
      ? Number(dto.taxPercent)
      : Number(existingInvoice?.taxPercent ?? 15);

    console.log('[PurchaseOrderBillingService][retryInvoice] resolved input', {
      purchaseOrderId,
      branchId,
      companyId,
      paymentMethod,
      taxPercent,
      existingInvoiceId: existingInvoice?.id || null,
      existingState: existingInvoice?.state || null,
    });

    return this.createOrRetryInvoice(
      purchaseOrderId,
      paymentMethod,
      taxPercent,
      branchId,
      companyId,
      true,
    );
  }

  async authorizeInvoice(
    purchaseOrderId: string,
    branchId: string,
    companyId: string | null,
  ) {
    console.log('[PurchaseOrderBillingService][authorizeInvoice] start', {
      purchaseOrderId,
      branchId,
      companyId,
    });

    const purchaseOrder = await this.loadScopedPurchaseOrder(
      purchaseOrderId,
      branchId,
      companyId,
    );

    const invoice = await this.loadScopedInvoice(
      purchaseOrderId,
      branchId,
      companyId,
    );

    if (!invoice.externalInvoiceId) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'La factura no tiene identificador externo para autorizar',
          en: 'Invoice has no external identifier to authorize',
        },
      });
    }

    const company = await this.loadCompanyBillingConfig(
      purchaseOrder.companyId,
    );

    const authorizeRequestPayload = this.asRecord({
      external_invoice_id: invoice.externalInvoiceId,
      contributor_id: Number.isFinite(company.billingContributorId)
        ? Number(company.billingContributorId)
        : null,
    });
    invoice.lastRequestPayload = authorizeRequestPayload;

    console.log('[PurchaseOrderBillingService][authorizeInvoice] request payload',
      authorizeRequestPayload,
    );

    try {
      const apiResult = await this.billingApiProvider.authorizeInvoice(
        company.billingApiKey,
        invoice.externalInvoiceId,
        company.billingContributorId,
      );

      console.log('[PurchaseOrderBillingService][authorizeInvoice] provider response', {
        statusCode: apiResult.statusCode,
        payload: this.summarizeValue(apiResult.payload),
      });

      const providerSummary = this.extractProviderSummary(apiResult.payload);
      const normalizedState = this.normalizeState(providerSummary.rawState);

      invoice.state = normalizedState;
      invoice.authorizationNumber =
        providerSummary.authorizationNumber ||
        invoice.authorizationNumber;
      invoice.authorizationDate = this.parseDate(
        providerSummary.authorizationDate,
      );
      invoice.errorMessage = null;
      invoice.lastResponsePayload = this.asRecord(apiResult.payload);

      const savedInvoice =
        await this.purchaseOrderInvoiceRepository.save(invoice);

      await this.persistLog({
        invoiceId: savedInvoice.id,
        purchaseOrderId,
        action: PurchaseOrderInvoiceLogAction.AUTHORIZE,
        statusCode: apiResult.statusCode,
        requestPayload: authorizeRequestPayload,
        responsePayload: this.asRecord(apiResult.payload),
      });

      if (
        savedInvoice.state === PurchaseOrderInvoiceState.AUTHORIZED ||
        savedInvoice.state === PurchaseOrderInvoiceState.APPROVED
      ) {
        purchaseOrder.status = PurchaseOrderStatus.INVOICED;
        await this.purchaseOrderRepository.save(purchaseOrder);
      }

      return {
        messageKey: 'PURCHASE_ORDER.INVOICE_AUTHORIZED',
        data: savedInvoice,
      };
    } catch (error) {
      console.log('[PurchaseOrderBillingService][authorizeInvoice] provider error', {
        purchaseOrderId,
        invoiceId: invoice.id,
        errorMessage: this.extractErrorMessage(error),
      });

      await this.handleApiError(
        error,
        invoice,
        purchaseOrderId,
        PurchaseOrderInvoiceLogAction.AUTHORIZE,
      );

      throw this.buildBillingException(
        error,
        'No se pudo autorizar la factura en el SRI',
        'Could not authorize invoice in SRI',
      );
    }
  }

  async syncInvoiceStatus(
    purchaseOrderId: string,
    branchId: string,
    companyId: string | null,
  ) {
    console.log('[PurchaseOrderBillingService][syncInvoiceStatus] start', {
      purchaseOrderId,
      branchId,
      companyId,
    });

    const purchaseOrder = await this.loadScopedPurchaseOrder(
      purchaseOrderId,
      branchId,
      companyId,
    );

    const invoice = await this.loadScopedInvoice(
      purchaseOrderId,
      branchId,
      companyId,
    );

    if (!invoice.externalInvoiceId) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'La factura no tiene identificador externo para consultar estado',
          en: 'Invoice has no external identifier to check status',
        },
      });
    }

    const company = await this.loadCompanyBillingConfig(
      purchaseOrder.companyId,
    );

    const syncRequestPayload = this.asRecord({
      external_invoice_id: invoice.externalInvoiceId,
      contributor_id: Number.isFinite(company.billingContributorId)
        ? Number(company.billingContributorId)
        : null,
    });
    invoice.lastRequestPayload = syncRequestPayload;

    try {
      const apiResult = await this.billingApiProvider.getInvoiceDetails(
        company.billingApiKey,
        invoice.externalInvoiceId,
        company.billingContributorId,
      );

      console.log('[PurchaseOrderBillingService][syncInvoiceStatus] provider response', {
        statusCode: apiResult.statusCode,
        payload: this.summarizeValue(apiResult.payload),
      });

      const providerSummary = this.extractProviderSummary(apiResult.payload);
      const normalizedState = this.normalizeState(providerSummary.rawState);

      invoice.state = normalizedState;
      invoice.invoiceNumber =
        providerSummary.invoiceNumber || invoice.invoiceNumber || null;
      invoice.accessKey = providerSummary.accessKey || invoice.accessKey || null;
      invoice.authorizationNumber =
        providerSummary.authorizationNumber || invoice.authorizationNumber;
      invoice.authorizationDate =
        this.parseDate(providerSummary.authorizationDate) ||
        invoice.authorizationDate;
      invoice.xmlBase64 =
        this.extractXmlBase64(apiResult.payload) || invoice.xmlBase64;
      invoice.errorMessage = null;
      invoice.lastResponsePayload = this.asRecord(apiResult.payload);

      const savedInvoice = await this.purchaseOrderInvoiceRepository.save(invoice);

      await this.persistLog({
        invoiceId: savedInvoice.id,
        purchaseOrderId,
        action: PurchaseOrderInvoiceLogAction.STATUS_SYNC,
        statusCode: apiResult.statusCode,
        requestPayload: syncRequestPayload,
        responsePayload: this.asRecord(apiResult.payload),
      });

      if (
        savedInvoice.state === PurchaseOrderInvoiceState.AUTHORIZED ||
        savedInvoice.state === PurchaseOrderInvoiceState.APPROVED
      ) {
        purchaseOrder.status = PurchaseOrderStatus.INVOICED;
        await this.purchaseOrderRepository.save(purchaseOrder);
      }

      return {
        messageKey: 'PURCHASE_ORDER.INVOICE_STATUS_SYNCED',
        data: savedInvoice,
      };
    } catch (error) {
      console.log('[PurchaseOrderBillingService][syncInvoiceStatus] provider error', {
        purchaseOrderId,
        invoiceId: invoice.id,
        errorMessage: this.extractErrorMessage(error),
      });

      await this.handleApiError(
        error,
        invoice,
        purchaseOrderId,
        PurchaseOrderInvoiceLogAction.STATUS_SYNC,
      );

      throw this.buildBillingException(
        error,
        'No se pudo consultar el estado de la factura',
        'Could not check invoice status',
      );
    }
  }

  async getInvoiceXml(
    purchaseOrderId: string,
    branchId: string,
    companyId: string | null,
  ) {
    console.log('[PurchaseOrderBillingService][getInvoiceXml] start', {
      purchaseOrderId,
      branchId,
      companyId,
    });

    const purchaseOrder = await this.loadScopedPurchaseOrder(
      purchaseOrderId,
      branchId,
      companyId,
    );

    const invoice = await this.loadScopedInvoice(
      purchaseOrderId,
      branchId,
      companyId,
    );

    if (invoice.xmlBase64) {
      return {
        messageKey: 'PURCHASE_ORDER.INVOICE_XML_FETCHED',
        data: {
          invoiceId: invoice.id,
          xmlBase64: invoice.xmlBase64,
        },
      };
    }

    if (!invoice.externalInvoiceId) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'La factura no tiene identificador externo para obtener XML',
          en: 'Invoice has no external identifier to fetch XML',
        },
      });
    }

    const company = await this.loadCompanyBillingConfig(
      purchaseOrder.companyId,
    );

    const xmlRequestPayload = this.asRecord({
      external_invoice_id: invoice.externalInvoiceId,
      contributor_id: Number.isFinite(company.billingContributorId)
        ? Number(company.billingContributorId)
        : null,
    });
    invoice.lastRequestPayload = xmlRequestPayload;

    console.log('[PurchaseOrderBillingService][getInvoiceXml] request payload',
      xmlRequestPayload,
    );

    try {
      const apiResult = await this.billingApiProvider.getInvoiceXml(
        company.billingApiKey,
        invoice.externalInvoiceId,
        company.billingContributorId,
      );

      console.log('[PurchaseOrderBillingService][getInvoiceXml] provider response', {
        statusCode: apiResult.statusCode,
        payload: this.summarizeValue(apiResult.payload),
      });

      const xmlBase64 = this.extractXmlBase64(apiResult.payload);
      if (!xmlBase64) {
        throw new BillingApiError(422, apiResult.payload, 'Empty XML payload');
      }

      invoice.xmlBase64 = xmlBase64;
      invoice.errorMessage = null;
      invoice.lastResponsePayload = this.asRecord(apiResult.payload);

      const savedInvoice =
        await this.purchaseOrderInvoiceRepository.save(invoice);

      await this.persistLog({
        invoiceId: savedInvoice.id,
        purchaseOrderId,
        action: PurchaseOrderInvoiceLogAction.XML,
        statusCode: apiResult.statusCode,
        requestPayload: xmlRequestPayload,
        responsePayload: this.asRecord(apiResult.payload),
      });

      return {
        messageKey: 'PURCHASE_ORDER.INVOICE_XML_FETCHED',
        data: {
          invoiceId: savedInvoice.id,
          xmlBase64,
        },
      };
    } catch (error) {
      console.log('[PurchaseOrderBillingService][getInvoiceXml] provider error', {
        purchaseOrderId,
        invoiceId: invoice.id,
        errorMessage: this.extractErrorMessage(error),
      });

      await this.handleApiError(
        error,
        invoice,
        purchaseOrderId,
        PurchaseOrderInvoiceLogAction.XML,
      );

      throw this.buildBillingException(
        error,
        'No se pudo obtener el XML de la factura',
        'Could not fetch invoice XML',
      );
    }
  }

  private async createOrRetryInvoice(
    purchaseOrderId: string,
    paymentMethod: string,
    taxPercent: number,
    branchId: string,
    companyId: string | null,
    isRetry: boolean,
  ) {
    const purchaseOrder = await this.loadScopedPurchaseOrder(
      purchaseOrderId,
      branchId,
      companyId,
    );

    console.log('[PurchaseOrderBillingService][createOrRetryInvoice] start', {
      purchaseOrderId,
      branchId,
      companyId,
      isRetry,
      paymentMethod,
      taxPercent,
      purchaseOrderCompanyId: purchaseOrder.companyId || null,
      shouldInvoice: purchaseOrder.shouldInvoice,
      status: purchaseOrder.status,
    });

    if (!purchaseOrder.shouldInvoice) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'La orden no está marcada para facturación',
          en: 'Order is not marked for billing',
        },
      });
    }

    if (purchaseOrder.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'No se puede facturar una orden cancelada',
          en: 'Cancelled orders cannot be invoiced',
        },
      });
    }

    const existingInvoice = await this.purchaseOrderInvoiceRepository.findOne({
      where: {
        purchaseOrderId,
        branchId,
        companyId: this.toCompanyScope(companyId),
      },
    });

    if (
      existingInvoice &&
      existingInvoice.state !== PurchaseOrderInvoiceState.FAILED &&
      !isRetry
    ) {
      return {
        messageKey: 'PURCHASE_ORDER.INVOICE_FETCHED',
        data: existingInvoice,
      };
    }

    const company = await this.loadCompanyBillingConfig(
      purchaseOrder.companyId,
    );
    const itemsResult = this.mapItemsAndTotals(purchaseOrder, taxPercent);

    const requestPayload: Record<string, unknown> = {
      customer: {
        identification: purchaseOrder.client?.documentNumber || '',
        business_name:
          `${purchaseOrder.client?.firstName || ''} ${purchaseOrder.client?.lastName || ''}`.trim(),
        email: purchaseOrder.client?.email || '',
        address: purchaseOrder.client?.address || '',
        phone:
          purchaseOrder.client?.mobilePhone ||
          purchaseOrder.client?.homePhone ||
          '',
      },
      items: itemsResult.items,
      payments: [
        {
          payment_method: paymentMethod,
          total: itemsResult.total,
          deadline: 1,
          unit_time: 'dias',
        },
      ],
    };

    if (Number.isFinite(company.billingContributorId)) {
      requestPayload.contributor_id = Number(company.billingContributorId);
    }

    console.log('[PurchaseOrderBillingService][createOrRetryInvoice] request payload', {
      purchaseOrderId,
      invoiceId: existingInvoice?.id || null,
      contributorId: requestPayload.contributor_id || null,
      subtotal: itemsResult.subtotal,
      taxAmount: itemsResult.taxAmount,
      total: itemsResult.total,
      itemsCount: itemsResult.items.length,
      payload: requestPayload,
    });

    let invoice =
      existingInvoice ||
      this.purchaseOrderInvoiceRepository.create({
        purchaseOrderId,
        companyId: purchaseOrder.companyId || null,
        branchId: purchaseOrder.branchId || null,
      });

    invoice.paymentMethod = paymentMethod;
    invoice.taxPercent = taxPercent;
    invoice.subtotal = itemsResult.subtotal;
    invoice.taxAmount = itemsResult.taxAmount;
    invoice.totalAmount = itemsResult.total;
    invoice.lastRequestPayload = this.asRecord(requestPayload);

    try {
      const apiResult = await this.billingApiProvider.createInvoice(
        company.billingApiKey,
        requestPayload,
      );

      console.log('[PurchaseOrderBillingService][createOrRetryInvoice] provider response', {
        purchaseOrderId,
        statusCode: apiResult.statusCode,
        payload: this.summarizeValue(apiResult.payload),
      });

      const responseData = apiResult.payload?.data || apiResult.payload || {};
      const externalInvoiceId = this.extractExternalInvoiceId(responseData);
      if (!externalInvoiceId) {
        throw new BillingApiError(
          502,
          apiResult.payload,
          'Billing API response did not include external invoice id',
        );
      }

      invoice.externalInvoiceId = externalInvoiceId;
      invoice.invoiceNumber =
        responseData.n_invoice ||
        responseData.invoice_number ||
        responseData.invoiceNumber ||
        invoice.invoiceNumber ||
        null;
      invoice.accessKey =
        responseData.access_key ||
        responseData.accessKey ||
        responseData.claveAcceso ||
        invoice.accessKey ||
        null;
      invoice.state = this.normalizeState(
        responseData.state ||
          responseData.status ||
          responseData.invoice_state ||
          'NEW',
      );
      invoice.xmlBase64 =
        this.extractXmlBase64(apiResult.payload) || invoice.xmlBase64;
      invoice.errorMessage = null;
      invoice.lastResponsePayload = this.asRecord(apiResult.payload);

      const savedInvoice =
        await this.purchaseOrderInvoiceRepository.save(invoice);

      await this.persistLog({
        invoiceId: savedInvoice.id,
        purchaseOrderId,
        action: isRetry
          ? PurchaseOrderInvoiceLogAction.RETRY
          : PurchaseOrderInvoiceLogAction.CREATE,
        statusCode: apiResult.statusCode,
        requestPayload: this.asRecord(requestPayload),
        responsePayload: this.asRecord(apiResult.payload),
      });

      return {
        messageKey: isRetry
          ? 'PURCHASE_ORDER.INVOICE_RETRIED'
          : 'PURCHASE_ORDER.INVOICE_CREATED',
        data: savedInvoice,
      };
    } catch (error) {
      console.log('[PurchaseOrderBillingService][createOrRetryInvoice] provider error', {
        purchaseOrderId,
        invoiceId: invoice.id || null,
        isRetry,
        errorMessage: this.extractErrorMessage(error),
      });

      invoice.state = PurchaseOrderInvoiceState.FAILED;
      invoice.errorMessage = this.extractErrorMessage(error);

      const savedInvoice =
        await this.purchaseOrderInvoiceRepository.save(invoice);

      await this.handleApiError(
        error,
        savedInvoice,
        purchaseOrderId,
        isRetry
          ? PurchaseOrderInvoiceLogAction.RETRY
          : PurchaseOrderInvoiceLogAction.CREATE,
      );

      throw this.buildBillingException(
        error,
        'No se pudo generar la factura electrónica',
        'Could not create electronic invoice',
      );
    }
  }

  private async loadScopedPurchaseOrder(
    purchaseOrderId: string,
    branchId: string,
    companyId: string | null,
  ): Promise<PurchaseOrder> {
    const queryBuilder = this.purchaseOrderRepository
      .createQueryBuilder('po')
      .leftJoinAndSelect('po.client', 'client')
      .leftJoinAndSelect('po.items', 'items')
      .leftJoinAndSelect('po.invoice', 'invoice')
      .where('po.id = :purchaseOrderId', { purchaseOrderId })
      .andWhere('po.branchId = :branchId', { branchId });

    if (companyId) {
      queryBuilder.andWhere('po.companyId = :companyId', { companyId });
    } else {
      queryBuilder.andWhere('po.companyId IS NULL');
    }

    const purchaseOrder = await queryBuilder.getOne();

    if (!purchaseOrder) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Orden de pedido no encontrada',
          en: 'Purchase order not found',
        },
      });
    }

    return this.refreshPurchaseOrderClient(purchaseOrder);
  }

  private async refreshPurchaseOrderClient(
    purchaseOrder: PurchaseOrder,
  ): Promise<PurchaseOrder> {
    if (!purchaseOrder?.clientId || !purchaseOrder.branchId) {
      return purchaseOrder;
    }

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.id = :clientId', { clientId: purchaseOrder.clientId })
      .andWhere('client.branchId = :branchId', {
        branchId: purchaseOrder.branchId,
      });

    if (purchaseOrder.companyId) {
      queryBuilder.andWhere('client.companyId = :companyId', {
        companyId: purchaseOrder.companyId,
      });
    } else {
      queryBuilder.andWhere('client.companyId IS NULL');
    }

    const scopedClient = await queryBuilder.getOne();

    if (scopedClient) {
      return {
        ...purchaseOrder,
        client: scopedClient,
      };
    }

    console.log('[PurchaseOrderBillingService][refreshPurchaseOrderClient] scoped client not found, trying fallback by id+branch', {
      purchaseOrderId: purchaseOrder.id,
      clientId: purchaseOrder.clientId,
      branchId: purchaseOrder.branchId,
      companyId: purchaseOrder.companyId ?? null,
      currentClientAddress: purchaseOrder.client?.address || null,
    });

    const fallbackClient = await this.clientRepository.findOne({
      where: {
        id: purchaseOrder.clientId,
        branchId: purchaseOrder.branchId,
      },
    });

    if (fallbackClient) {
      console.log('[PurchaseOrderBillingService][refreshPurchaseOrderClient] fallback client found', {
        purchaseOrderId: purchaseOrder.id,
        clientId: fallbackClient.id,
        clientCompanyId: fallbackClient.companyId ?? null,
        clientAddress: fallbackClient.address || null,
      });
    }

    return {
      ...purchaseOrder,
      client: fallbackClient || purchaseOrder.client,
    };
  }

  private async loadScopedInvoice(
    purchaseOrderId: string,
    branchId: string,
    companyId: string | null,
  ): Promise<PurchaseOrderInvoice> {
    const invoice = await this.purchaseOrderInvoiceRepository.findOne({
      where: {
        purchaseOrderId,
        branchId,
        companyId: this.toCompanyScope(companyId),
      },
    });

    if (!invoice) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'No se encontró una factura para la orden seleccionada',
          en: 'Invoice not found for selected order',
        },
      });
    }

    return invoice;
  }

  private async loadCompanyBillingConfig(companyId: string | null) {
    if (!companyId) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'La orden no tiene empresa asociada para facturación',
          en: 'Order has no company linked for billing',
        },
      });
    }

    console.log('[PurchaseOrderBillingService][loadCompanyBillingConfig] start', {
      companyId,
    });

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ['id', 'billingApiKey', 'billingContributorId'],
    });

    if (!company) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Empresa no encontrada para facturación',
          en: 'Billing company not found',
        },
      });
    }

    const normalizedApiKey = String(company.billingApiKey || '').trim();
    const contributorCandidate = Number(company.billingContributorId);
    const normalizedContributorId =
      Number.isInteger(contributorCandidate) && contributorCandidate > 0
        ? contributorCandidate
        : null;

    console.log('[PurchaseOrderBillingService][loadCompanyBillingConfig] loaded company config', {
      companyId: company.id,
      billingApiKeyMasked: this.maskApiKey(normalizedApiKey),
      hasBillingApiKey: normalizedApiKey.length > 0,
      billingContributorId: normalizedContributorId,
    });

    if (!normalizedApiKey) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'La empresa no tiene API key de facturación configurada',
          en: 'Company has no configured billing API key',
        },
      });
    }

    // Nota: contributor_id es opcional (Modo A: Emisor Fijo)
    // Solo se incluye en el payload si está configurado en la empresa (Modo B: Multiemisor)
    // Si no existe, zBilling usa el contributor asociado a la API key

    company.billingApiKey = normalizedApiKey;
    company.billingContributorId = normalizedContributorId;

    return company;
  }

  private mapItemsAndTotals(order: PurchaseOrder, taxPercent: number) {
    const items = (order.items || []).map((item) => {
      const quantity = Number(item.quantity || 0);
      const unitPrice = Number(item.unitPrice || 0);

      return {
        code: item.productCode || item.productId,
        description: item.productName || '-',
        quantity,
        unit_price: Number(unitPrice.toFixed(2)),
        tax_percent: taxPercent,
      };
    });

    const subtotal = Number(
      items
        .reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
          0,
        )
        .toFixed(2),
    );
    const taxAmount = Number(((subtotal * taxPercent) / 100).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));

    return {
      items,
      subtotal,
      taxAmount,
      total,
    };
  }

  private normalizeState(rawState: any): PurchaseOrderInvoiceState {
    const value = String(rawState || '').toUpperCase();

    if (value === 'APPROVED') {
      return PurchaseOrderInvoiceState.APPROVED;
    }

    if (value === 'RETURNED') {
      return PurchaseOrderInvoiceState.RETURNED;
    }

    if (value === 'NOT_APPROVED' || value === 'NO_AUTORIZADO') {
      return PurchaseOrderInvoiceState.NOT_APPROVED;
    }

    if (value === 'AUTHORIZED' || value === 'AUTORIZADO') {
      return PurchaseOrderInvoiceState.AUTHORIZED;
    }

    if (value === 'FAILED' || value === 'ERROR') {
      return PurchaseOrderInvoiceState.FAILED;
    }

    return PurchaseOrderInvoiceState.NEW;
  }

  private extractProviderSummary(payload: any): {
    rawState: string;
    authorizationNumber: string | null;
    authorizationDate: string | null;
    invoiceNumber: string | null;
    accessKey: string | null;
  } {
    const responseData = payload?.data || payload || {};
    const sriResponse =
      responseData?.RespuestaAutorizacionComprobante ||
      responseData?.respuestaAutorizacionComprobante ||
      responseData?.authorizationResponse ||
      null;
    const authorizationNode =
      sriResponse?.autorizaciones?.autorizacion ||
      sriResponse?.autorizacion ||
      responseData?.autorizacion ||
      null;
    const authorization = Array.isArray(authorizationNode)
      ? authorizationNode[0] || null
      : authorizationNode;

    const rawState = String(
      authorization?.estado ||
        responseData?.estado ||
        responseData?.state ||
        responseData?.status ||
        responseData?.invoice_state ||
        responseData?.invoice?.state ||
        '',
    ).trim();

    const authorizationNumber = this.normalizeString(
      authorization?.numeroAutorizacion ||
        responseData?.numeroAutorizacion ||
        responseData?.authorization_number ||
        responseData?.authorizationNumber,
    );

    const authorizationDate = this.normalizeString(
      authorization?.fechaAutorizacion ||
        responseData?.fechaAutorizacion ||
        responseData?.authorization_date ||
        responseData?.authorizationDate,
    );

    const invoiceNumber = this.normalizeString(
      responseData?.n_invoice ||
        responseData?.invoice_number ||
        responseData?.invoiceNumber ||
        responseData?.invoice?.n_invoice ||
        responseData?.invoice?.invoice_number,
    );

    const accessKey = this.normalizeString(
      responseData?.access_key ||
        responseData?.accessKey ||
        responseData?.claveAcceso ||
        sriResponse?.claveAccesoConsultada ||
        responseData?.invoice?.access_key,
    );

    return {
      rawState,
      authorizationNumber,
      authorizationDate,
      invoiceNumber,
      accessKey,
    };
  }

  private normalizeString(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private parseDate(rawDate: any): Date | null {
    if (!rawDate) {
      return null;
    }

    const date = new Date(rawDate);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private extractXmlBase64(payload: any): string | null {
    const data = payload?.data || payload;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (typeof data?.xml === 'string' && data.xml.trim()) {
      return data.xml;
    }

    if (typeof data?.xml_base64 === 'string' && data.xml_base64.trim()) {
      return data.xml_base64;
    }

    if (typeof data?.signed_xml === 'string' && data.signed_xml.trim()) {
      return data.signed_xml;
    }

    return null;
  }

  private extractExternalInvoiceId(responseData: any): string | null {
    const rawValue =
      responseData?.id ||
      responseData?.invoice_id ||
      responseData?.external_invoice_id ||
      null;

    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    const normalized = String(rawValue).trim();
    return normalized.length > 0 ? normalized : null;
  }

  private toCompanyScope(companyId: string | null) {
    return companyId ?? IsNull();
  }

  private async handleApiError(
    error: unknown,
    invoice: PurchaseOrderInvoice,
    purchaseOrderId: string,
    action: PurchaseOrderInvoiceLogAction,
  ) {
    await this.persistLog({
      invoiceId: invoice.id,
      purchaseOrderId,
      action,
      statusCode: error instanceof BillingApiError ? error.statusCode : null,
      requestPayload: invoice.lastRequestPayload,
      responsePayload:
        error instanceof BillingApiError ? this.asRecord(error.payload) : null,
      errorMessage: this.extractErrorMessage(error),
    });
  }

  private async persistLog(params: {
    invoiceId: string;
    purchaseOrderId: string;
    action: PurchaseOrderInvoiceLogAction;
    statusCode?: number | null;
    requestPayload?: Record<string, unknown> | null;
    responsePayload?: Record<string, unknown> | null;
    errorMessage?: string | null;
  }) {
    const log = this.purchaseOrderInvoiceLogRepository.create({
      invoiceId: params.invoiceId,
      purchaseOrderId: params.purchaseOrderId,
      action: params.action,
      statusCode: params.statusCode || null,
      requestPayload: params.requestPayload || null,
      responsePayload: params.responsePayload || null,
      errorMessage: params.errorMessage || null,
    });

    const savedLog = await this.purchaseOrderInvoiceLogRepository.save(log);

    console.log('[PurchaseOrderBillingService][persistLog] saved', {
      logId: savedLog.id,
      invoiceId: params.invoiceId,
      purchaseOrderId: params.purchaseOrderId,
      action: params.action,
      statusCode: params.statusCode || null,
      errorMessage: params.errorMessage || null,
    });
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof BillingApiError) {
      const payloadMessage =
        error.payload?.message ||
        error.payload?.data?.error ||
        error.payload?.error ||
        error.message;

      if (Array.isArray(payloadMessage) && payloadMessage.length > 0) {
        return String(payloadMessage[0]);
      }

      if (payloadMessage && typeof payloadMessage === 'object') {
        return (
          payloadMessage.es ||
          payloadMessage.en ||
          JSON.stringify(payloadMessage)
        );
      }

      if (typeof payloadMessage === 'string' && payloadMessage.trim()) {
        return payloadMessage;
      }

      return 'Billing API request failed';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Unknown billing error';
  }

  private buildBillingException(
    error: unknown,
    messageEs: string,
    messageEn: string,
  ) {
    const providerMessage = this.normalizeProviderMessage(
      this.extractErrorMessage(error),
    );

    return new BadRequestException({
      messageKey: 'ERROR.VALIDATION',
      message: {
        es: `${messageEs}. ${providerMessage.es}`,
        en: `${messageEn}. ${providerMessage.en}`,
      },
      data: {
        localizedMessage: {
          es: `${messageEs}. ${providerMessage.es}`,
          en: `${messageEn}. ${providerMessage.en}`,
        },
      },
    });
  }

  private normalizeProviderMessage(providerMessage: string): {
    es: string;
    en: string;
  } {
    const normalized = providerMessage.toLowerCase();

    console.log('[PurchaseOrderBillingService][normalizeProviderMessage] received', {
      providerMessage,
      normalized,
    });

    if (
      normalized.includes('contributor_id') &&
      (normalized.includes('required') ||
        normalized.includes('obligatorio') ||
        normalized.includes('missing'))
    ) {
      return {
        es: 'La API key está en modo Multiemisor y requiere contributor_id. Configura billingContributorId en la empresa correspondiente',
        en: 'The API key is in Multi-Issuer mode and requires contributor_id. Configure billingContributorId in the corresponding company',
      };
    }

    if (
      normalized.includes('contributor') &&
      (normalized.includes('invalid') ||
        normalized.includes('not found') ||
        normalized.includes('no existe'))
    ) {
      return {
        es: 'El contributor_id configurado no es válido para esta API key. Verifica el contributor en zBilling',
        en: 'The configured contributor_id is not valid for this API key. Verify the contributor in zBilling',
      };
    }

    if (normalized.includes('permission denied for table api_key')) {
      return {
        es: 'La API key de facturación fue rechazada por el proveedor (sin permisos). Contacta soporte de zBilling para habilitar la API key del emisor',
        en: 'The billing API key was rejected by the provider (missing permissions). Contact zBilling support to enable the issuer API key',
      };
    }

    return {
      es: providerMessage,
      en: providerMessage,
    };
  }

  private asRecord(value: any): Record<string, unknown> | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown>;
  }

  private maskApiKey(apiKey: string | null | undefined): string {
    if (!apiKey) {
      return '';
    }

    const cleaned = String(apiKey).trim();
    if (!cleaned) {
      return '';
    }

    if (cleaned.length <= 8) {
      return `${cleaned.slice(0, 2)}***${cleaned.slice(-1)}`;
    }

    return `${cleaned.slice(0, 4)}***${cleaned.slice(-4)}`;
  }

  private summarizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value !== 'object') {
      return value;
    }

    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return String(value);
    }
  }
}
