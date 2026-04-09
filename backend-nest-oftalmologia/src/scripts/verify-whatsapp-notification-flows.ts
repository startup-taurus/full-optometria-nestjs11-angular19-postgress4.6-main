import { NotificationsService } from '../modules/notifications/notifications.service';
import {
  DispatchStatus,
  MessageDispatchLog,
} from '../modules/notifications/entities/message-dispatch-log.entity';
import {
  WhatsAppSession,
  WhatsAppSessionStatus,
} from '../modules/notifications/entities/whatsapp-session.entity';

type SendCall = {
  sessionKey: string;
  phone: string;
  message: string;
};

type RepoLike = Record<string, any>;

const BRANCH_ID = 'branch-test';
const COMPANY_ID = 'company-test';
const USER_ID = 'user-test';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function createQueryBuilderResult(logs: Array<Partial<MessageDispatchLog>>): any {
  const chain: any = {
    where: () => chain,
    andWhere: () => chain,
    orderBy: () => chain,
    addOrderBy: () => chain,
    take: () => chain,
    getMany: async () => logs,
  };

  return chain;
}

function createRepositoryMock(overrides: RepoLike = {}): RepoLike {
  const base: RepoLike = {
    find: async () => [],
    findOne: async () => null,
    create: (payload: any) => ({ ...payload }),
    save: async (payload: any) => payload,
    count: async () => 0,
    createQueryBuilder: () => createQueryBuilderResult([]),
  };

  return { ...base, ...overrides };
}

function createMessageDispatchLogRepository(
  inferredLogs: Array<Partial<MessageDispatchLog>> = [],
): RepoLike {
  const storedLogs: Array<Record<string, any>> = [];

  return createRepositoryMock({
    create: (payload: any) => ({ ...payload }),
    save: async (payload: any) => {
      const entity = { ...payload };

      if (!entity.id) {
        entity.id = `log-${storedLogs.length + 1}`;
      }

      const existingIndex = storedLogs.findIndex((item) => item.id === entity.id);
      if (existingIndex >= 0) {
        storedLogs[existingIndex] = { ...storedLogs[existingIndex], ...entity };
      } else {
        storedLogs.push(entity);
      }

      return entity;
    },
    count: async () => 0,
    createQueryBuilder: () => createQueryBuilderResult(inferredLogs),
    __storedLogs: storedLogs,
  });
}

function createProvider(sendCalls: SendCall[]) {
  return {
    isSessionConnected: async () => true,
    sendMessage: async (sessionKey: string, phone: string, message: string) => {
      sendCalls.push({ sessionKey, phone, message });
      return {
        providerMessageId: `provider-${sendCalls.length}`,
      };
    },
  };
}

function createReminderRule() {
  return {
    branchId: BRANCH_ID,
    companyId: COMPANY_ID,
    isActive: true,
    appointmentReminderHoursBefore: 24,
    renewalAfterDays: 365,
    renewalNotifyBeforeDays: 15,
    quietHoursStart: '23:58',
    quietHoursEnd: '23:59',
  };
}

function createConnectedSession(overrides: Partial<WhatsAppSession> = {}): WhatsAppSession {
  return {
    id: 'session-id',
    sessionKey: 'session-key',
    status: WhatsAppSessionStatus.CONNECTED,
    companyId: COMPANY_ID,
    branchId: BRANCH_ID,
    userId: USER_ID,
    qrCode: null,
    connectedPhone: null,
    lastConnectedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    company: null,
    branch: null,
    user: null,
    ...overrides,
  } as WhatsAppSession;
}

function createService(deps: {
  whatsappSessionRepository: RepoLike;
  reminderRuleRepository: RepoLike;
  messageDispatchLogRepository: RepoLike;
  patientContactPreferenceRepository: RepoLike;
  patientRepository: RepoLike;
  clinicalHistoryRepository: RepoLike;
  laboratoryOrderRepository: RepoLike;
  shiftRepository: RepoLike;
  whatsappProvider: RepoLike;
}) {
  return new NotificationsService(
    deps.whatsappSessionRepository as any,
    deps.reminderRuleRepository as any,
    deps.messageDispatchLogRepository as any,
    deps.patientContactPreferenceRepository as any,
    deps.patientRepository as any,
    deps.clinicalHistoryRepository as any,
    deps.laboratoryOrderRepository as any,
    deps.shiftRepository as any,
    deps.whatsappProvider as any,
  );
}

async function verifyManualFlow(): Promise<void> {
  const sendCalls: SendCall[] = [];
  const session = createConnectedSession();
  const messageLogs = createMessageDispatchLogRepository([]);

  const service = createService({
    whatsappSessionRepository: createRepositoryMock({
      findOne: async () => session,
      save: async (entity: any) => entity,
    }),
    reminderRuleRepository: createRepositoryMock({
      findOne: async () => createReminderRule(),
    }),
    messageDispatchLogRepository: messageLogs,
    patientContactPreferenceRepository: createRepositoryMock({
      find: async () => [],
    }),
    patientRepository: createRepositoryMock({
      find: async () => [
        {
          id: 'patient-manual',
          firstName: 'Ana',
          lastName: 'Manual',
          documentNumber: '0102030405',
          mobilePhone: '0991234567',
          homePhone: null,
          isActive: true,
        },
      ],
    }),
    clinicalHistoryRepository: createRepositoryMock(),
    laboratoryOrderRepository: createRepositoryMock(),
    shiftRepository: createRepositoryMock(),
    whatsappProvider: createProvider(sendCalls),
  });

  const result = await service.sendManualRenewalReminder(
    {
      patientIds: ['patient-manual'],
      messageTemplate: 'Hola {{nombre}}',
    },
    BRANCH_ID,
    COMPANY_ID,
    USER_ID,
  );

  assertCondition(result?.data?.sent === 1, 'Manual: sent debe ser 1');
  assertCondition(result?.data?.failed === 0, 'Manual: failed debe ser 0');
  assertCondition(sendCalls.length === 1, 'Manual: debe existir 1 envio');
  assertCondition(
    sendCalls[0].phone === '+593991234567',
    `Manual: phone inesperado (${sendCalls[0].phone})`,
  );
}

async function verifyAppointmentFlow(): Promise<void> {
  const sendCalls: SendCall[] = [];
  const session = createConnectedSession();
  const messageLogs = createMessageDispatchLogRepository([]);

  const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const service = createService({
    whatsappSessionRepository: createRepositoryMock({
      find: async () => [session],
      findOne: async () => session,
      save: async (entity: any) => entity,
    }),
    reminderRuleRepository: createRepositoryMock({
      findOne: async () => createReminderRule(),
    }),
    messageDispatchLogRepository: messageLogs,
    patientContactPreferenceRepository: createRepositoryMock({
      findOne: async () => null,
    }),
    patientRepository: createRepositoryMock(),
    clinicalHistoryRepository: createRepositoryMock(),
    laboratoryOrderRepository: createRepositoryMock(),
    shiftRepository: createRepositoryMock({
      find: async () => [
        {
          id: 'shift-1',
          branchId: BRANCH_ID,
          createdByUserId: USER_ID,
          patientId: 'patient-appointment',
          appointmentDate,
          patient: {
            id: 'patient-appointment',
            firstName: 'Luis',
            lastName: 'Cita',
            mobilePhone: '0987654321',
            homePhone: null,
          },
        },
      ],
    }),
    whatsappProvider: createProvider(sendCalls),
  });

  await service.processAutomaticAppointmentReminders();

  assertCondition(
    sendCalls.length === 1,
    `Citas: se esperaba 1 envio, obtenido ${sendCalls.length}`,
  );
  assertCondition(
    sendCalls[0].phone === '+593987654321',
    `Citas: phone inesperado (${sendCalls[0].phone})`,
  );
}

async function verifyLaboratoryFlow(): Promise<void> {
  const sendCalls: SendCall[] = [];
  const session = createConnectedSession();
  const messageLogs = createMessageDispatchLogRepository([]);

  const service = createService({
    whatsappSessionRepository: createRepositoryMock({
      findOne: async () => session,
      save: async (entity: any) => entity,
    }),
    reminderRuleRepository: createRepositoryMock({
      findOne: async () => createReminderRule(),
    }),
    messageDispatchLogRepository: messageLogs,
    patientContactPreferenceRepository: createRepositoryMock({
      findOne: async () => null,
    }),
    patientRepository: createRepositoryMock(),
    clinicalHistoryRepository: createRepositoryMock(),
    laboratoryOrderRepository: createRepositoryMock({
      findOne: async () => ({
        id: 'lab-1',
        patientId: 'patient-lab',
        createdByUserId: USER_ID,
        patient: {
          id: 'patient-lab',
          firstName: 'Marta',
          lastName: 'Laboratorio',
          mobilePhone: '0911122233',
          homePhone: null,
        },
      }),
    }),
    shiftRepository: createRepositoryMock(),
    whatsappProvider: createProvider(sendCalls),
  });

  await service.sendLaboratoryOrderReceivedReminder(
    'lab-1',
    BRANCH_ID,
    COMPANY_ID,
    USER_ID,
  );

  assertCondition(
    sendCalls.length === 1,
    `Laboratorio: se esperaba 1 envio, obtenido ${sendCalls.length}`,
  );
  assertCondition(
    sendCalls[0].phone === '+593911122233',
    `Laboratorio: phone inesperado (${sendCalls[0].phone})`,
  );
}

async function main() {
  process.env.WHATSAPP_DEFAULT_DIAL_CODE = process.env.WHATSAPP_DEFAULT_DIAL_CODE || '593';

  await verifyManualFlow();
  await verifyAppointmentFlow();
  await verifyLaboratoryFlow();

  console.log('OK: verificacion funcional WhatsApp (manual, citas, laboratorio)');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'unknown';
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
});
