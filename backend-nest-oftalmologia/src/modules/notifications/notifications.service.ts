import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { Between, In, IsNull, QueryFailedError, Repository } from 'typeorm';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { Patient } from '../patients/entities/patient.entity';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Shift } from '../shift-management/entities/shift.entity';
import {
  WhatsAppSession,
  WhatsAppSessionStatus,
} from './entities/whatsapp-session.entity';
import { ReminderRule } from './entities/reminder-rule.entity';
import {
  DispatchStatus,
  MessageDispatchLog,
} from './entities/message-dispatch-log.entity';
import { PatientContactPreference } from './entities/patient-contact-preference.entity';
import { MarkWhatsAppConnectedDto } from './dtos/mark-whatsapp-connected.dto';
import { QueryRenewalEligibleDto } from './dtos/query-renewal-eligible.dto';
import { SendManualRenewalDto } from './dtos/send-manual-renewal.dto';
import { UpdateReminderRuleDto } from './dtos/update-reminder-rule.dto';
import {
  WHATSAPP_PROVIDER,
  WhatsAppProvider,
  WhatsAppSessionSnapshot,
} from './providers/whatsapp-provider.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly defaultDialCode = this.resolveDefaultDialCode();
  private readonly qrTtlMs = 60000;
  private readonly sessionNormalizationTimeoutMs = 2500;
  private readonly runtimeStartTimeoutMs = 45000;
  private readonly refreshWaitTimeoutMs = 5000;

  constructor(
    @InjectRepository(WhatsAppSession)
    private whatsappSessionRepository: Repository<WhatsAppSession>,
    @InjectRepository(ReminderRule)
    private reminderRuleRepository: Repository<ReminderRule>,
    @InjectRepository(MessageDispatchLog)
    private messageDispatchLogRepository: Repository<MessageDispatchLog>,
    @InjectRepository(PatientContactPreference)
    private patientContactPreferenceRepository: Repository<PatientContactPreference>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
    @InjectRepository(ClinicalHistory)
    private clinicalHistoryRepository: Repository<ClinicalHistory>,
    @InjectRepository(LaboratoryOrder)
    private laboratoryOrderRepository: Repository<LaboratoryOrder>,
    @InjectRepository(Shift)
    private shiftRepository: Repository<Shift>,
    @Inject(WHATSAPP_PROVIDER)
    private whatsappProvider: WhatsAppProvider,
  ) {}

  async initWhatsAppSession(branchId: string, companyId: string | null, userId: string) {
     const startTime = Date.now();
     console.log(`[WHATSAPP_INIT_START] sessionKey=unknown, timestamp=${startTime}`);
    const session = await this.getOrCreateSession(branchId, companyId, userId);
     console.log(`[WHATSAPP_SESSION_CREATED] sessionKey=${session.sessionKey}`);
    let snapshot = await this.whatsappProvider.requestQrRefresh(
      session.sessionKey,
      'startup',
    );
     const afterRequestQrTime = Date.now();
     console.log(`[WHATSAPP_AFTER_REQUEST_QR] sessionKey=${session.sessionKey}, elapsed=${afterRequestQrTime - startTime}ms, qrCode=${!!snapshot.qrCode}, state=${snapshot.state}`);

    if (!snapshot.connected && !snapshot.qrCode) {
       console.log(`[WHATSAPP_WAITING_FOR_STATE] sessionKey=${session.sessionKey}, starting wait...`);
      snapshot = await this.withTimeout(
        this.whatsappProvider.waitForState(
          session.sessionKey,
          ['qr_ready', 'ready', 'stuck', 'auth_failure', 'disconnected'],
          this.runtimeStartTimeoutMs,
        ),
        this.runtimeStartTimeoutMs,
        `waitForState.startup(${session.sessionKey})`,
        async () => this.whatsappProvider.getSessionSnapshot(session.sessionKey),
      );
       const afterWaitForStateTime = Date.now();
       console.log(`[WHATSAPP_AFTER_WAIT_FOR_STATE] sessionKey=${session.sessionKey}, elapsed=${afterWaitForStateTime - startTime}ms, qrCode=${!!snapshot.qrCode}, state=${snapshot.state}`);
    }

    const savedSession = await this.applySnapshotToSession(session, snapshot);
     const endTime = Date.now();
     console.log(`[WHATSAPP_INIT_COMPLETE] sessionKey=${session.sessionKey}, totalElapsed=${endTime - startTime}ms`);

    return {
      messageKey: 'NOTIFICATIONS.WHATSAPP_SESSION_INITIALIZED',
      data: savedSession,
    };
  }

  async getWhatsAppSession(branchId: string, companyId: string | null, userId: string) {
    const session = await this.getOrCreateSession(branchId, companyId, userId);
    const normalizedSession = await this.withTimeout(
      this.ensureValidQrForSession(session),
      this.sessionNormalizationTimeoutMs,
      `ensureValidQrForSession(${session.sessionKey})`,
      () => session,
    );

    return {
      messageKey: 'NOTIFICATIONS.WHATSAPP_SESSION_FOUND',
      data: normalizedSession,
    };
  }

  async refreshWhatsAppQr(branchId: string, companyId: string | null, userId: string) {
    const session = await this.getOrCreateSession(branchId, companyId, userId);

    let snapshot = await this.whatsappProvider.requestQrRefresh(
      session.sessionKey,
      'manual',
    );

    if (!snapshot.connected && !snapshot.qrCode) {
      snapshot = await this.withTimeout(
        this.whatsappProvider.waitForState(
          session.sessionKey,
          ['qr_ready', 'ready', 'stuck', 'auth_failure', 'disconnected'],
          this.refreshWaitTimeoutMs,
        ),
        this.refreshWaitTimeoutMs,
        `waitForState.refreshQr(${session.sessionKey})`,
        async () => this.whatsappProvider.getSessionSnapshot(session.sessionKey),
      );
    }

    const savedSession = await this.applySnapshotToSession(session, snapshot);

    return {
      messageKey: 'NOTIFICATIONS.WHATSAPP_QR_REFRESHED',
      data: savedSession,
    };
  }

  async markWhatsAppConnected(
    dto: MarkWhatsAppConnectedDto,
    branchId: string,
    companyId: string | null,
    userId: string,
  ) {
    const session = await this.getOrCreateSession(branchId, companyId, userId);

    session.status = WhatsAppSessionStatus.CONNECTED;
    session.connectedPhone = this.normalizeConnectedPhone(dto.connectedPhone);
    session.qrCode = null;
    session.lastConnectedAt = new Date();
    await this.whatsappSessionRepository.save(session);

    return {
      messageKey: 'NOTIFICATIONS.WHATSAPP_SESSION_CONNECTED',
      data: session,
    };
  }

  async logoutWhatsAppSession(branchId: string, companyId: string | null, userId: string) {
    const session = await this.getOrCreateSession(branchId, companyId, userId);

    await this.whatsappProvider.logout(session.sessionKey);

    session.status = WhatsAppSessionStatus.DISCONNECTED;
    session.connectedPhone = null;
    session.qrCode = null;
    await this.whatsappSessionRepository.save(session);

    return {
      messageKey: 'NOTIFICATIONS.WHATSAPP_SESSION_LOGOUT',
      data: session,
    };
  }

  async getReminderRule(branchId: string, companyId: string | null) {
    const rule = await this.getOrCreateReminderRule(branchId, companyId);

    return {
      messageKey: 'NOTIFICATIONS.REMINDER_RULE_FOUND',
      data: rule,
    };
  }

  async updateReminderRule(
    dto: UpdateReminderRuleDto,
    branchId: string,
    companyId: string | null,
  ) {
    const rule = await this.getOrCreateReminderRule(branchId, companyId);

    Object.assign(rule, dto);
    const savedRule = await this.reminderRuleRepository.save(rule);

    return {
      messageKey: 'NOTIFICATIONS.REMINDER_RULE_UPDATED',
      data: savedRule,
    };
  }

  async findRenewalEligiblePatients(
    queryDto: QueryRenewalEligibleDto,
    branchId: string,
    companyId: string | null,
  ) {
    const rule = await this.getOrCreateReminderRule(branchId, companyId);
    const baseQuery = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.branchId = :branchId', { branchId })
      .andWhere('patient.isActive = true');

    CompanyFilterUtil.applyCompanyFilter(baseQuery, 'patient', companyId);

    if (queryDto.search) {
      baseQuery.andWhere(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.documentNumber ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    const patients = await baseQuery.getMany();
    const eligibility = await this.buildRenewalEligibilityForPatients(
      patients,
      branchId,
      companyId,
      rule,
      !!queryDto.includeAll,
    );

    const { skip, take } = PaginationUtil.getSkipAndTake(queryDto);
    const paged = eligibility.slice(skip, skip + take);
    const paginated = PaginationUtil.paginate(paged, eligibility.length, queryDto);

    return {
      messageKey: 'NOTIFICATIONS.RENEWAL_ELIGIBLE_FOUND',
      data: paginated,
    };
  }

  async sendManualRenewalReminder(
    dto: SendManualRenewalDto,
    branchId: string,
    companyId: string | null,
    userId: string,
  ) {
    const session = await this.getOrCreateSession(branchId, companyId, userId);

    const isConnected = await this.whatsappProvider.isSessionConnected(
      session.sessionKey,
    );
    if (isConnected && session.status !== WhatsAppSessionStatus.CONNECTED) {
      session.status = WhatsAppSessionStatus.CONNECTED;
      session.qrCode = null;
      session.lastConnectedAt = new Date();
      await this.whatsappSessionRepository.save(session);
    }

    if (session.status !== WhatsAppSessionStatus.CONNECTED) {
      throw new BadRequestException({
        messageKey: 'NOTIFICATIONS.WHATSAPP_NOT_CONNECTED',
        message: {
          es: 'Debes conectar WhatsApp antes de enviar recordatorios',
          en: 'You must connect WhatsApp before sending reminders',
        },
      });
    }

    const rule = await this.getOrCreateReminderRule(branchId, companyId);
    const patients = await this.patientRepository.find({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          id: In(dto.patientIds),
          isActive: true,
        },
        companyId,
      ),
    });

    const preferences = await this.patientContactPreferenceRepository.find({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId: In(dto.patientIds),
        },
        companyId,
      ),
    });

    const preferenceMap = new Map(preferences.map((item) => [item.patientId, item]));
    const inferredConnectedPhone =
      await this.inferConnectedPhoneFromRecentSuccessfulLogs(
      branchId,
      companyId,
    );
    let sent = 0;
    let failed = 0;

    for (const patient of patients) {
      const preference = preferenceMap.get(patient.id);

      if (preference && !preference.whatsappOptIn) {
        continue;
      }

      const phone = this.resolvePatientPhone(
        patient,
        preference?.preferredPhone,
        session.connectedPhone,
        inferredConnectedPhone,
      );

      if (!phone) {
        failed += 1;
        continue;
      }

      const content = this.interpolateTemplate(
        dto.messageTemplate ||
          'Hola {{nombre}}, te recordamos renovar tus lentes en nuestra sucursal.',
        {
          nombre: `${patient.firstName} ${patient.lastName}`.trim(),
          nombres: patient.firstName?.trim() || '',
          apellidos: patient.lastName?.trim() || '',
          cedula: patient.documentNumber || '',
          telefono: phone,
        },
      );

      const log = this.messageDispatchLogRepository.create({
        branchId,
        companyId,
        patientId: patient.id,
        channel: 'whatsapp',
        phone,
        message: content,
        status: DispatchStatus.PROCESSING,
        scheduledAt: new Date(),
      });

      const savedLog = await this.messageDispatchLogRepository.save(log);

      try {
        const result = await this.whatsappProvider.sendMessage(
          session.sessionKey,
          phone,
          content,
        );
        savedLog.status = DispatchStatus.SENT;
        savedLog.sentAt = new Date();
        savedLog.providerMessageId = result.providerMessageId;
        await this.messageDispatchLogRepository.save(savedLog);
        sent += 1;
      } catch (error) {
        savedLog.status = DispatchStatus.FAILED;
        savedLog.errorReason =
          error instanceof Error ? error.message : 'Unexpected error';
        await this.messageDispatchLogRepository.save(savedLog);
        failed += 1;
      }
    }

    return {
      messageKey: 'NOTIFICATIONS.RENEWAL_MANUAL_DISPATCH_DONE',
      data: {
        total: patients.length,
        sent,
        failed,
      },
    };
  }

  @Cron('0 9 * * *')
  async processAutomaticRenewalReminders() {
    const connectedSessions = await this.whatsappSessionRepository.find({
      where: {
        status: WhatsAppSessionStatus.CONNECTED,
      },
      take: 20,
    });

    for (const session of connectedSessions) {
      if (!session.branchId) {
        continue;
      }

      const rule = await this.getOrCreateReminderRule(
        session.branchId,
        session.companyId || null,
      );

      if (!rule.isActive || this.isQuietHour(rule)) {
        continue;
      }

      const eligible = await this.findRenewalEligiblePatients(
        { page: 1, limit: 50 },
        session.branchId,
        session.companyId || null,
      );

      const patientIds = eligible.data.result.map((item) => item.patientId);

      if (!patientIds.length) {
        continue;
      }

      await this.sendManualRenewalReminder(
        {
          patientIds,
          messageTemplate:
            'Hola {{nombre}}, te recordamos que tu renovación de lentes está próxima. Agenda tu cita cuando gustes.',
        },
        session.branchId,
        session.companyId || null,
        session.userId,
      );
    }
  }

  @Cron('* * * * *')
  async processAutomaticAppointmentReminders() {
    const toleranceMs = 2 * 60 * 1000;
    const connectedSessions = await this.whatsappSessionRepository.find({
      where: {
        status: WhatsAppSessionStatus.CONNECTED,
      },
      take: 200,
    });

    for (const session of connectedSessions) {
      if (!session.branchId || !session.userId) {
        continue;
      }

      const rule = await this.getOrCreateReminderRule(
        session.branchId,
        session.companyId || null,
      );

      if (!rule.isActive || this.isQuietHour(rule)) {
        continue;
      }

      const now = new Date();
      const reminderHours = Number(rule.appointmentReminderHoursBefore || 24);
      const targetTime = now.getTime() + reminderHours * 60 * 60 * 1000;
      const windowStart = new Date(targetTime - toleranceMs);
      const windowEnd = new Date(targetTime + toleranceMs);

      const where: any = {
        branchId: session.branchId,
        createdByUserId: session.userId,
        appointmentDate: Between(windowStart, windowEnd),
      };

      if (session.companyId) {
        where.companyId = session.companyId;
      } else {
        where.companyId = IsNull();
      }

      const shifts = await this.shiftRepository.find({
        where,
        relations: ['patient'],
      });

      const inferredConnectedPhone =
        await this.inferConnectedPhoneFromRecentSuccessfulLogs(
          session.branchId,
          session.companyId || null,
        );

      for (const shift of shifts) {
        await this.dispatchAppointmentReminder(
          shift,
          session.branchId,
          session.companyId || null,
          session.userId,
          reminderHours,
          inferredConnectedPhone,
        );
      }
    }
  }

  async sendLaboratoryOrderReceivedReminder(
    orderId: string,
    branchId: string,
    companyId: string | null,
    fallbackUserId: string | null = null,
  ) {
    const order = await this.laboratoryOrderRepository.findOne({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          id: orderId,
          branchId,
        },
        companyId,
      ),
      relations: ['patient'],
    });

    const senderUserId = order?.createdByUserId || fallbackUserId;

    if (!order || !order.patientId || !senderUserId) {
      return;
    }

    const session = await this.getConnectedSessionForSender(
      branchId,
      companyId,
      senderUserId,
    );

    if (!session) {
      return;
    }

    const inferredConnectedPhone =
      await this.inferConnectedPhoneFromRecentSuccessfulLogs(branchId, companyId);

    const preference = await this.patientContactPreferenceRepository.findOne({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId: order.patientId,
        },
        companyId,
      ),
    });

    if (preference && !preference.whatsappOptIn) {
      return;
    }

    const patient = order.patient;
    if (!patient) {
      return;
    }

    const phone = this.resolvePatientPhone(
      patient,
      preference?.preferredPhone,
      session.connectedPhone,
      inferredConnectedPhone,
    );
    if (!phone) {
      return;
    }

    const content = this.interpolateTemplate(
      'Hola {{nombre}}, tu producto ya esta listo para retiro en nuestra sucursal.',
      {
        nombre: `${patient.firstName} ${patient.lastName}`.trim(),
      },
    );

    await this.dispatchAutomaticMessage({
      branchId,
      companyId,
      patientId: patient.id,
      phone,
      content,
      sessionKey: session.sessionKey,
      scheduledAt: new Date(),
    });
  }

  private async getOrCreateSession(
    branchId: string,
    companyId: string | null,
    userId: string,
  ) {
    const where: any = { branchId, userId };
    if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = IsNull();
    }

    let session = await this.whatsappSessionRepository.findOne({ where });

    if (!session) {
      try {
        session = this.whatsappSessionRepository.create({
          branchId,
          companyId,
          userId,
          sessionKey: randomUUID(),
          status: WhatsAppSessionStatus.DISCONNECTED,
        });
        session = await this.whatsappSessionRepository.save(session);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          const existing = await this.whatsappSessionRepository.findOne({ where });
          if (existing) {
            return existing;
          }
        }

        throw error;
      }
    }

    return session;
  }

  private async dispatchAppointmentReminder(
    shift: Shift,
    branchId: string,
    companyId: string | null,
    senderUserId: string,
    reminderHours: number,
    inferredConnectedPhone?: string | null,
  ) {
    if (!shift.patientId || !shift.patient || !shift.createdByUserId) {
      return;
    }

    if (shift.createdByUserId !== senderUserId) {
      return;
    }

    const scheduledAt = new Date(
      shift.appointmentDate.getTime() - reminderHours * 60 * 60 * 1000,
    );

    const alreadyDispatched = await this.hasRecentDispatch(
      shift.patientId,
      branchId,
      companyId,
      scheduledAt,
    );

    if (alreadyDispatched) {
      return;
    }

    const preference = await this.patientContactPreferenceRepository.findOne({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId: shift.patientId,
        },
        companyId,
      ),
    });

    if (preference && !preference.whatsappOptIn) {
      return;
    }

    const session = await this.getConnectedSessionForSender(
      branchId,
      companyId,
      senderUserId,
    );

    if (!session) {
      return;
    }

    const phone = this.resolvePatientPhone(
      shift.patient,
      preference?.preferredPhone,
      session.connectedPhone,
      inferredConnectedPhone,
    );

    if (!phone) {
      return;
    }

    const content = this.interpolateTemplate(
      'Hola {{nombre}}, te recordamos que tienes una cita medica manana a las {{hora}}.',
      {
        nombre: `${shift.patient.firstName} ${shift.patient.lastName}`.trim(),
        hora: this.toHourString(shift.appointmentDate),
      },
    );

    await this.dispatchAutomaticMessage({
      branchId,
      companyId,
      patientId: shift.patientId,
      phone,
      content,
      sessionKey: session.sessionKey,
      scheduledAt,
    });
  }

  private async getConnectedSessionForSender(
    branchId: string,
    companyId: string | null,
    userId: string,
  ) {
    const where: any = {
      branchId,
      userId,
      status: WhatsAppSessionStatus.CONNECTED,
    };

    if (companyId) {
      where.companyId = companyId;
    } else {
      where.companyId = IsNull();
    }

    const session = await this.whatsappSessionRepository.findOne({
      where,
    });

    if (!session) {
      return null;
    }

    const connected = await this.whatsappProvider.isSessionConnected(session.sessionKey);

    if (!connected) {
      session.status = WhatsAppSessionStatus.DISCONNECTED;
      session.qrCode = null;
      session.connectedPhone = null;
      await this.whatsappSessionRepository.save(session);
      return null;
    }

    return session;
  }

  private async hasRecentDispatch(
    patientId: string,
    branchId: string,
    companyId: string | null,
    scheduledAt: Date,
  ): Promise<boolean> {
    const toleranceMs = 60000;
    const scheduledStart = new Date(scheduledAt.getTime() - toleranceMs);
    const scheduledEnd = new Date(scheduledAt.getTime() + toleranceMs);

    const count = await this.messageDispatchLogRepository.count({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId,
          channel: 'whatsapp',
          status: In([
            DispatchStatus.PENDING,
            DispatchStatus.PROCESSING,
            DispatchStatus.SENT,
          ]),
          scheduledAt: Between(scheduledStart, scheduledEnd),
        },
        companyId,
      ),
    });

    return count > 0;
  }

  private async dispatchAutomaticMessage(params: {
    branchId: string;
    companyId: string | null;
    patientId: string;
    phone: string;
    content: string;
    sessionKey: string;
    scheduledAt: Date;
  }) {
    const { branchId, companyId, patientId, phone, content, sessionKey, scheduledAt } =
      params;

    const log = this.messageDispatchLogRepository.create({
      branchId,
      companyId,
      patientId,
      channel: 'whatsapp',
      phone,
      message: content,
      status: DispatchStatus.PROCESSING,
      scheduledAt,
    });

    const savedLog = await this.messageDispatchLogRepository.save(log);

    try {
      const result = await this.whatsappProvider.sendMessage(sessionKey, phone, content);
      savedLog.status = DispatchStatus.SENT;
      savedLog.sentAt = new Date();
      savedLog.providerMessageId = result.providerMessageId;
      await this.messageDispatchLogRepository.save(savedLog);
    } catch (error) {
      savedLog.status = DispatchStatus.FAILED;
      savedLog.errorReason =
        error instanceof Error ? error.message : 'Unexpected error';
      await this.messageDispatchLogRepository.save(savedLog);
    }
  }

  private async getOrCreateReminderRule(branchId: string, companyId: string | null) {
    const where = CompanyFilterUtil.buildWhereCondition({ branchId }, companyId);
    let rule = await this.reminderRuleRepository.findOne({ where });

    if (!rule) {
      try {
        rule = this.reminderRuleRepository.create({
          branchId,
          companyId,
          isActive: true,
          appointmentReminderHoursBefore: 24,
          renewalAfterDays: 365,
          renewalNotifyBeforeDays: 15,
          quietHoursStart: '21:00',
          quietHoursEnd: '08:00',
        });
        rule = await this.reminderRuleRepository.save(rule);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          const existing = await this.reminderRuleRepository.findOne({ where });
          if (existing) {
            return existing;
          }
        }

        throw error;
      }
    }

    return rule;
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string };
    return driverError?.code === '23505';
  }

  private async ensureValidQrForSession(session: WhatsAppSession): Promise<WhatsAppSession> {
    const snapshot = await this.withTimeout<WhatsAppSessionSnapshot | null>(
      this.whatsappProvider.ensureRuntime(session.sessionKey),
      this.sessionNormalizationTimeoutMs,
      `ensureRuntime(${session.sessionKey})`,
      () => null,
    );

    if (!snapshot) {

      return session;
    }

    if (snapshot.connected || snapshot.state === 'ready') {
      return this.applySnapshotToSession(session, snapshot);
    }

    if (this.hasValidImageQr(snapshot.qrCode)) {
      return this.applySnapshotToSession(session, snapshot);
    }

    // Durante reinicios/despliegues el runtime puede quedar en estados transitorios
    // sin QR todavía. En ese caso conservamos el estado persistido para evitar
    // desconexiones falsas en la UI y en la base de datos.
    if (snapshot.state === 'booting' || snapshot.state === 'authenticated') {
      return session;
    }

    if (
      session.status === WhatsAppSessionStatus.QR_READY &&
      this.hasValidImageQr(session.qrCode) &&
      !this.isQrExpired(session)
    ) {
      return session;
    }

    session.status = WhatsAppSessionStatus.DISCONNECTED;
    session.qrCode = null;
    session.connectedPhone = null;
    return this.whatsappSessionRepository.save(session);
  }

  private async applySnapshotToSession(
    session: WhatsAppSession,
    snapshot: WhatsAppSessionSnapshot,
  ): Promise<WhatsAppSession> {
    if (snapshot.connected || snapshot.state === 'ready') {
      session.status = WhatsAppSessionStatus.CONNECTED;
      session.qrCode = null;
      session.lastConnectedAt = new Date();
      return this.whatsappSessionRepository.save(session);
    }

    if (this.hasValidImageQr(snapshot.qrCode)) {
      session.status = WhatsAppSessionStatus.QR_READY;
      session.qrCode = snapshot.qrCode;
      return this.whatsappSessionRepository.save(session);
    }

    if (snapshot.state === 'booting' || snapshot.state === 'authenticated') {
      return session;
    }

    if (
      this.hasValidImageQr(session.qrCode) &&
      session.status === WhatsAppSessionStatus.QR_READY &&
      !this.isQrExpired(session)
    ) {
      return session;
    }

    session.status = WhatsAppSessionStatus.DISCONNECTED;
    session.qrCode = null;
    session.connectedPhone = null;
    return this.whatsappSessionRepository.save(session);
  }

  private fireAndForgetQrRefresh(
    sessionKey: string,
    reason: 'missing_qr' | 'expired_qr',
  ): void {
    void this.whatsappProvider
      .requestQrRefresh(sessionKey, reason)
      .catch((error) => {
        this.logger.warn(
          `requestQrRefresh(${sessionKey}) falló: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      });
  }

  private hasValidImageQr(qrCode: string | null | undefined): boolean {
    if (!qrCode) {
      return false;
    }

    return /^data:image\/(png|jpeg|jpg);base64,/.test(qrCode);
  }

  private isQrExpired(session: WhatsAppSession): boolean {
    if (!session.qrCode || session.status !== WhatsAppSessionStatus.QR_READY) {
      return true;
    }

    const referenceDate = session.updatedAt || session.createdAt;
    if (!referenceDate) {
      return true;
    }

    return Date.now() - new Date(referenceDate).getTime() > this.qrTtlMs;
  }

  private async buildRenewalEligibilityForPatients(
    patients: Patient[],
    branchId: string,
    companyId: string | null,
    rule: ReminderRule,
    includeAll = false,
  ) {
    if (!patients.length) {
      return [];
    }

    const patientIds = patients.map((item) => item.id);
    const clinicalRows = await this.clinicalHistoryRepository.find({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId: In(patientIds),
        },
        companyId,
      ),
      select: ['patientId', 'lastVisualExamDate'],
    });

    const labRows = await this.laboratoryOrderRepository.find({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId: In(patientIds),
        },
        companyId,
      ),
      select: ['patientId', 'attendanceDate', 'deliveryDate'],
    });

    const preferences = await this.patientContactPreferenceRepository.find({
      where: CompanyFilterUtil.buildWhereCondition(
        {
          branchId,
          patientId: In(patientIds),
        },
        companyId,
      ),
    });

    const preferenceMap = new Map(preferences.map((item) => [item.patientId, item]));
    const maxClinicalDateByPatient = new Map<string, Date>();
    const maxLabDateByPatient = new Map<string, Date>();

    for (const row of clinicalRows) {
      if (!row.lastVisualExamDate) {
        continue;
      }

      const prev = maxClinicalDateByPatient.get(row.patientId);
      if (!prev || row.lastVisualExamDate > prev) {
        maxClinicalDateByPatient.set(row.patientId, row.lastVisualExamDate);
      }
    }

    for (const row of labRows) {
      const candidateDates = [row.attendanceDate, row.deliveryDate].filter(Boolean) as Date[];
      if (!candidateDates.length) {
        continue;
      }

      const rowMax = candidateDates.reduce((acc, current) =>
        current > acc ? current : acc,
      );

      const prev = maxLabDateByPatient.get(row.patientId);
      if (!prev || rowMax > prev) {
        maxLabDateByPatient.set(row.patientId, rowMax);
      }
    }

    const now = new Date();

    return patients
      .map((patient) => {
        const preference = preferenceMap.get(patient.id);
        if (preference && !preference.whatsappOptIn) {
          return null;
        }

        const phone = this.resolvePatientPhone(patient, preference?.preferredPhone);
        if (!phone) {
          return null;
        }

        const baseClinicalDate = maxClinicalDateByPatient.get(patient.id);
        const baseLabDate = maxLabDateByPatient.get(patient.id);

        let baseDate = this.pickLatestDate(baseClinicalDate, baseLabDate);

        if (!baseDate && includeAll) {
          baseDate = patient.updatedAt || patient.createdAt;
        }

        if (!baseDate) {
          return null;
        }

        const renewalDate = new Date(baseDate);
        renewalDate.setDate(renewalDate.getDate() + rule.renewalAfterDays);

        const daysUntilRenewal = Math.ceil(
          (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        const isDueSoon = daysUntilRenewal <= rule.renewalNotifyBeforeDays;

        if (!includeAll && !isDueSoon) {
          return null;
        }

        return {
          patientId: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          documentNumber: patient.documentNumber,
          phone,
          lastReferenceDate: baseDate,
          renewalDate,
          daysUntilRenewal,
          isDueSoon,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  }

  private pickLatestDate(...dates: Array<Date | undefined | null>) {
    const available = dates.filter(Boolean) as Date[];
    if (!available.length) {
      return null;
    }

    return available.reduce((acc, current) => (current > acc ? current : acc));
  }

  private resolvePatientPhone(
    patient: Patient,
    preferredPhone?: string | null,
    senderConnectedPhone?: string | null,
    inferredConnectedPhone?: string | null,
  ) {
    const raw = preferredPhone || patient.mobilePhone || patient.homePhone;
    if (!raw) {
      return null;
    }

    const normalized = raw.replace(/[^\d+]/g, '');
    const digits = normalized.replace(/\D/g, '');

    if (!digits) {
      return null;
    }

    if (normalized.startsWith('+')) {
      const e164 = `+${digits}`;
      const isValidE164 = /^\+[1-9]\d{7,14}$/.test(e164);
      return isValidE164 ? e164 : null;
    }

    if (/^0\d{9,14}$/.test(digits)) {
      const nationalNumber = digits.slice(1);
      const senderDialCode = this.extractDialCodeFromSender(
        senderConnectedPhone,
        nationalNumber.length,
      );
      const inferredDialCode = this.extractDialCodeFromSender(
        inferredConnectedPhone,
        nationalNumber.length,
      );
      const dialCode =
        senderDialCode ||
        inferredDialCode ||
        this.defaultDialCode;

      if (!senderDialCode && !inferredDialCode && dialCode) {
        this.logger.debug(
          `Usando dial code fallback para normalizar teléfono de paciente ${patient.id}`,
        );
      }

      if (dialCode) {
        const e164 = `+${dialCode}${nationalNumber}`;
        const isValidE164 = /^\+[1-9]\d{7,14}$/.test(e164);
        if (isValidE164) {
          return e164;
        }
      }

      return null;
    }

    const isValidInternationalDigits = /^[1-9]\d{7,14}$/.test(digits);
    return isValidInternationalDigits ? `+${digits}` : null;
  }

  private normalizeConnectedPhone(connectedPhone?: string | null): string | null {
    if (!connectedPhone) {
      return null;
    }

    const digits = connectedPhone.replace(/\D/g, '');
    const isValidInternationalDigits = /^[1-9]\d{7,14}$/.test(digits);

    return isValidInternationalDigits ? `+${digits}` : null;
  }

  private resolveDefaultDialCode(): string {
    const rawDialCode =
      process.env.WHATSAPP_DEFAULT_DIAL_CODE ||
      process.env.WHATSAPP_DEFAULT_COUNTRY_CODE ||
      '593';
    const digits = rawDialCode.replace(/\D/g, '');

    if (/^[1-9]\d{0,3}$/.test(digits)) {
      return digits;
    }

    return '593';
  }

  private extractDialCodeFromSender(
    senderConnectedPhone: string | null | undefined,
    expectedNationalLength: number,
  ): string | null {
    if (!senderConnectedPhone) {
      return null;
    }

    const senderDigits = senderConnectedPhone.replace(/\D/g, '');
    if (!senderDigits || senderDigits.length <= expectedNationalLength) {
      return null;
    }

    const dialCode = senderDigits.slice(0, senderDigits.length - expectedNationalLength);
    return /^[1-9]\d{0,3}$/.test(dialCode) ? dialCode : null;
  }

  private async inferConnectedPhoneFromRecentSuccessfulLogs(
    branchId: string,
    companyId: string | null,
  ): Promise<string | null> {
    try {
      const query = this.messageDispatchLogRepository
        .createQueryBuilder('log')
        .where('log.branchId = :branchId', { branchId })
        .andWhere('log.channel = :channel', { channel: 'whatsapp' })
        .andWhere('log.status = :status', { status: DispatchStatus.SENT });

      if (companyId) {
        query.andWhere('log.companyId = :companyId', { companyId });
      } else {
        query.andWhere('log.companyId IS NULL');
      }

      const logs = await query
        .orderBy('log.sentAt', 'DESC', 'NULLS LAST')
        .addOrderBy('log.createdAt', 'DESC')
        .take(30)
        .getMany();

      for (const log of logs) {
        const phone = log.phone || '';

        const normalized = this.normalizeConnectedPhone(phone);
        if (!normalized) {
          continue;
        }

        if (/^\+[1-9]\d{7,14}$/.test(normalized)) {
          return normalized;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(
        `No se pudo inferir phone de referencia por logs (branchId=${branchId}, companyId=${companyId}): ${errorMessage}`,
      );
    }

    return null;
  }

  private interpolateTemplate(
    template: string,
    variables: Record<string, string | number>,
  ) {
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const value = variables[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  private isQuietHour(rule: ReminderRule) {
    const now = new Date();
    const [startHour, startMinute] = rule.quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = rule.quietHoursEnd.split(':').map(Number);

    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (startMinutes < endMinutes) {
      return nowMinutes >= startMinutes && nowMinutes < endMinutes;
    }

    return nowMinutes >= startMinutes || nowMinutes < endMinutes;
  }

  private toHourString(date: Date): string {
    return date.toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    label: string,
    fallback: () => T | Promise<T>,
  ): Promise<T> {
    try {
      return await Promise.race<T>([
        operation,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout en ${label}`)), timeoutMs);
        }),
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'unknown';
      this.logger.warn(`${label} falló: ${errorMessage}`);
      return fallback();
    }
  }

}
