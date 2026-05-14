import { BadRequestException, Inject, Injectable, Logger, MessageEvent } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { defer, from, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
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
  private readonly throttleMinDelayMs = this.resolveThrottleMinDelayMs();
  private readonly throttleMaxDelayMs = this.resolveThrottleMaxDelayMs();
  private readonly sessionSendChains = new Map<string, Promise<void>>();
  private readonly sessionNextAllowedSendAt = new Map<string, number>();
  private appointmentReminderCronRunning = false;
  private appointmentReminderLastRunAt: Date | null = null;

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

  streamWhatsAppSession(
    branchId: string,
    companyId: string | null,
    userId: string,
  ): Observable<MessageEvent> {
    return defer(() =>
      from(this.getOrCreateSession(branchId, companyId, userId)),
    ).pipe(
      switchMap((session) =>
        this.whatsappProvider.getSessionStream(session.sessionKey).pipe(
          switchMap((snapshot) =>
            from(this.applySnapshotToSession(session, snapshot)),
          ),
          map((updatedSession) => {
            console.log(
              `[SVC_SSE_EMIT] sessionKey=${updatedSession.sessionKey} status=${updatedSession.status} qrPresent=${!!updatedSession.qrCode} ts=${Date.now()}`,
            );
            return { data: updatedSession } as MessageEvent;
          }),
        ),
      ),
    );
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
        const result = await this.enqueueSessionSend(
          session.sessionKey,
          'manual_renewal',
          async () =>
            this.whatsappProvider.sendMessage(
              session.sessionKey,
              phone,
              content,
            ),
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

  @Cron('0 8 * * *')
  async processAutomaticAppointmentReminders() {
    if (this.appointmentReminderCronRunning) {
      this.logger.warn('Se omite ejecución de recordatorios automáticos por solapamiento');
      return;
    }

    this.appointmentReminderCronRunning = true;
    const runStartedAt = new Date();
    const startedAtMs = Date.now();

    let sessionsEvaluated = 0;
    let shiftsEvaluated = 0;
    let shiftsDispatched = 0;

    try {
      const tomorrowStart = new Date(runStartedAt);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      tomorrowStart.setHours(0, 0, 0, 0);

      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const connectedSessions = await this.whatsappSessionRepository.find({
        where: {
          status: WhatsAppSessionStatus.CONNECTED,
        },
        take: 200,
      });

      const eligibleSessions = connectedSessions.filter(
        (s) => s.branchId && s.userId,
      );

      if (!eligibleSessions.length) {
        this.logger.log('No hay sesiones conectadas elegibles para recordatorios');
        return;
      }

      const branchIds = Array.from(
        new Set(eligibleSessions.map((s) => s.branchId)),
      );
      const userIds = Array.from(
        new Set(eligibleSessions.map((s) => s.userId)),
      );

      const shifts = await this.shiftRepository.find({
        where: {
          branchId: In(branchIds),
          createdByUserId: In(userIds),
          appointmentDate: Between(tomorrowStart, tomorrowEnd),
        },
        relations: ['patient'],
        order: {
          appointmentDate: 'ASC',
          id: 'ASC',
        },
      });

      shiftsEvaluated = shifts.length;

      if (!shifts.length) {
        this.logger.log(
          `Recordatorios automáticos: sin citas para ${tomorrowStart.toISOString().slice(0, 10)}`,
        );
        return;
      }

      const patientIds = Array.from(
        new Set(shifts.map((s) => s.patientId).filter(Boolean) as string[]),
      );

      const preferences = patientIds.length
        ? await this.patientContactPreferenceRepository.find({
            where: {
              branchId: In(branchIds),
              patientId: In(patientIds),
            },
          })
        : [];

      const preferenceMap = new Map<string, PatientContactPreference>();
      for (const pref of preferences) {
        preferenceMap.set(`${pref.branchId}:${pref.patientId}`, pref);
      }

      const dispatchTolerance = 30 * 60 * 1000;
      const recentLogsLowerBound = new Date(tomorrowStart.getTime() - dispatchTolerance);
      const recentLogsUpperBound = new Date(tomorrowEnd.getTime() + dispatchTolerance);

      const recentLogs = patientIds.length
        ? await this.messageDispatchLogRepository.find({
            where: {
              branchId: In(branchIds),
              patientId: In(patientIds),
              channel: 'whatsapp',
              status: In([
                DispatchStatus.PENDING,
                DispatchStatus.PROCESSING,
                DispatchStatus.SENT,
              ]),
              scheduledAt: Between(recentLogsLowerBound, recentLogsUpperBound),
            },
            select: ['branchId', 'patientId', 'scheduledAt'],
          })
        : [];

      const dispatchedKeys = new Set<string>();
      for (const log of recentLogs) {
        dispatchedKeys.add(`${log.branchId}:${log.patientId}`);
      }

      const inferredPhoneCache = new Map<string, string | null>();

      const sessionsByKey = new Map<string, WhatsAppSession>();
      for (const session of eligibleSessions) {
        sessionsByKey.set(`${session.branchId}:${session.userId}`, session);
      }

      const ruleCache = new Map<string, ReminderRule>();
      const quietBranches = new Set<string>();

      for (const shift of shifts) {
        if (!shift.patientId || !shift.patient || !shift.createdByUserId) {
          continue;
        }

        const session = sessionsByKey.get(`${shift.branchId}:${shift.createdByUserId}`);
        if (!session) {
          continue;
        }

        sessionsEvaluated += 1;

        const ruleKey = `${session.branchId}:${session.companyId || ''}`;
        let rule = ruleCache.get(ruleKey);
        if (!rule) {
          rule = await this.getOrCreateReminderRule(
            session.branchId,
            session.companyId || null,
          );
          ruleCache.set(ruleKey, rule);
        }

        if (!rule.isActive) {
          continue;
        }

        if (this.isQuietHour(rule)) {
          if (!quietBranches.has(session.branchId)) {
            quietBranches.add(session.branchId);
            this.logger.log(
              `Sucursal ${session.branchId} en quiet hours; se omite envío`,
            );
          }
          continue;
        }

        const dedupeKey = `${shift.branchId}:${shift.patientId}`;
        if (dispatchedKeys.has(dedupeKey)) {
          continue;
        }

        const preference = preferenceMap.get(dedupeKey);
        if (preference && !preference.whatsappOptIn) {
          continue;
        }

        const inferredCacheKey = `${session.branchId}:${session.companyId || ''}`;
        let inferredConnectedPhone = inferredPhoneCache.get(inferredCacheKey);
        if (inferredConnectedPhone === undefined) {
          inferredConnectedPhone = await this.inferConnectedPhoneFromRecentSuccessfulLogs(
            session.branchId,
            session.companyId || null,
          );
          inferredPhoneCache.set(inferredCacheKey, inferredConnectedPhone);
        }

        const phone = this.resolvePatientPhone(
          shift.patient,
          preference?.preferredPhone,
          session.connectedPhone,
          inferredConnectedPhone,
        );

        if (!phone) {
          continue;
        }

        const reminderHours = Number(rule.appointmentReminderHoursBefore || 24);
        const scheduledAt = new Date(
          shift.appointmentDate.getTime() - reminderHours * 60 * 60 * 1000,
        );

        const content = this.interpolateTemplate(
          'Hola {{nombre}}, te recordamos que tienes una cita medica manana a las {{hora}}.',
          {
            nombre: `${shift.patient.firstName} ${shift.patient.lastName}`.trim(),
            hora: this.toHourString(shift.appointmentDate),
          },
        );

        await this.dispatchAutomaticMessage({
          branchId: session.branchId,
          companyId: session.companyId || null,
          patientId: shift.patientId,
          phone,
          content,
          sessionKey: session.sessionKey,
          scheduledAt,
          useThrottle: true,
          source: 'appointment_reminder',
        });

        dispatchedKeys.add(dedupeKey);
        shiftsDispatched += 1;
      }

      this.logger.log(
        `Recordatorios automáticos procesados: sesiones=${sessionsEvaluated}, candidatos=${shiftsEvaluated}, enviados=${shiftsDispatched}, duracionMs=${Date.now() - startedAtMs}`,
      );
    } finally {
      this.appointmentReminderLastRunAt = runStartedAt;
      this.appointmentReminderCronRunning = false;
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

  private async dispatchAutomaticMessage(params: {
    branchId: string;
    companyId: string | null;
    patientId: string;
    phone: string;
    content: string;
    sessionKey: string;
    scheduledAt: Date;
    useThrottle?: boolean;
    source?: 'appointment_reminder' | 'manual_renewal' | 'other';
  }) {
    const {
      branchId,
      companyId,
      patientId,
      phone,
      content,
      sessionKey,
      scheduledAt,
      useThrottle,
      source,
    } = params;

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
      const sendOperation = async () =>
        this.whatsappProvider.sendMessage(sessionKey, phone, content);
      const result = useThrottle
        ? await this.enqueueSessionSend(
            sessionKey,
            source || 'other',
            sendOperation,
          )
        : await sendOperation();
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
    if (session.status === WhatsAppSessionStatus.CONNECTED) {
      const authExists = await this.whatsappProvider.hasAuthOnDisk(session.sessionKey);
      if (authExists) {
        return session;
      }
    }

    const snapshot = await this.withTimeout<WhatsAppSessionSnapshot | null>(
      this.whatsappProvider.getSessionSnapshot(session.sessionKey),
      this.sessionNormalizationTimeoutMs,
      `getSessionSnapshot(${session.sessionKey})`,
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
    const __statusBefore = session.status;
    console.log(
      `[SVC_APPLY_IN] sessionKey=${session.sessionKey} snapshotState=${snapshot.state} snapshotConnected=${snapshot.connected} sessionStatusBefore=${__statusBefore}`,
    );

    if (snapshot.connected || snapshot.state === 'ready') {
      session.status = WhatsAppSessionStatus.CONNECTED;
      session.qrCode = null;
      session.lastConnectedAt = new Date();
      const saved = await this.whatsappSessionRepository.save(session);
      console.log(
        `[SVC_APPLY_OUT] sessionKey=${session.sessionKey} pathTaken=1 sessionStatusAfter=${saved.status} saved=true`,
      );
      return saved;
    }

    if (this.hasValidImageQr(snapshot.qrCode)) {
      session.status = WhatsAppSessionStatus.QR_READY;
      session.qrCode = snapshot.qrCode;
      const saved = await this.whatsappSessionRepository.save(session);
      console.log(
        `[SVC_APPLY_OUT] sessionKey=${session.sessionKey} pathTaken=2 sessionStatusAfter=${saved.status} saved=true`,
      );
      return saved;
    }

    if (snapshot.state === 'booting' || snapshot.state === 'authenticated') {
      console.log(
        `[SVC_APPLY_OUT] sessionKey=${session.sessionKey} pathTaken=3 sessionStatusAfter=${session.status} saved=false`,
      );
      return session;
    }

    if (
      snapshot.state === 'idle' &&
      session.status === WhatsAppSessionStatus.CONNECTED
    ) {
      const authExists = await this.whatsappProvider.hasAuthOnDisk(
        session.sessionKey,
      );
      if (authExists) {
        console.log(
          `[SVC_APPLY_OUT] sessionKey=${session.sessionKey} pathTaken=4 sessionStatusAfter=${session.status} saved=false`,
        );
        return session;
      }
    }

    if (
      this.hasValidImageQr(session.qrCode) &&
      session.status === WhatsAppSessionStatus.QR_READY &&
      !this.isQrExpired(session)
    ) {
      console.log(
        `[SVC_APPLY_OUT] sessionKey=${session.sessionKey} pathTaken=5 sessionStatusAfter=${session.status} saved=false`,
      );
      return session;
    }

    session.status = WhatsAppSessionStatus.DISCONNECTED;
    session.qrCode = null;
    session.connectedPhone = null;
    const saved = await this.whatsappSessionRepository.save(session);
    console.log(
      `[SVC_APPLY_OUT] sessionKey=${session.sessionKey} pathTaken=6 sessionStatusAfter=${saved.status} saved=true`,
    );
    return saved;
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

  private async enqueueSessionSend<T>(
    sessionKey: string,
    source: 'appointment_reminder' | 'manual_renewal' | 'other',
    operation: () => Promise<T>,
  ): Promise<T> {
    const previous = this.sessionSendChains.get(sessionKey) ?? Promise.resolve();

    const current = previous
      .catch(() => undefined)
      .then(async () => {
        await this.waitForSessionThrottle(sessionKey, source);
        return operation();
      });

    this.sessionSendChains.set(
      sessionKey,
      current
        .then(() => undefined)
        .catch(() => undefined),
    );

    return current;
  }

  private async waitForSessionThrottle(
    sessionKey: string,
    source: 'appointment_reminder' | 'manual_renewal' | 'other',
  ): Promise<void> {
    const now = Date.now();
    const nextAllowedAt = this.sessionNextAllowedSendAt.get(sessionKey) || now;
    const waitMs = Math.max(0, nextAllowedAt - now);

    if (waitMs > 0) {
      this.logger.debug(
        `Throttle WhatsApp aplicado: sessionKey=${sessionKey} source=${source} waitMs=${waitMs}`,
      );
      await this.delay(waitMs);
    }

    const jitterMs = this.randomIntInclusive(
      this.throttleMinDelayMs,
      this.throttleMaxDelayMs,
    );
    this.sessionNextAllowedSendAt.set(sessionKey, Date.now() + jitterMs);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private randomIntInclusive(min: number, max: number): number {
    const safeMin = Math.min(min, max);
    const safeMax = Math.max(min, max);
    return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
  }

  private resolveThrottleMinDelayMs(): number {
    const raw = Number(process.env.WHATSAPP_THROTTLE_MIN_DELAY_MS);
    if (Number.isFinite(raw) && raw >= 1000) {
      return Math.trunc(raw);
    }

    return 5000;
  }

  private resolveThrottleMaxDelayMs(): number {
    const raw = Number(process.env.WHATSAPP_THROTTLE_MAX_DELAY_MS);
    if (Number.isFinite(raw) && raw >= this.throttleMinDelayMs) {
      return Math.trunc(raw);
    }

    return 8000;
  }

}
