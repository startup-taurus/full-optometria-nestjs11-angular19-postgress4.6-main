import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';
import {
  RequestQrRefreshReason,
  SendMessageResult,
  StartSessionResult,
  WhatsAppProvider,
  WhatsAppRuntimeState,
  WhatsAppSessionSnapshot,
} from './whatsapp-provider.interface';

type StateWaiter = {
  targetStates: Set<WhatsAppRuntimeState>;
  resolve: (snapshot: WhatsAppSessionSnapshot) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
};

type SessionRuntime = {
  client: Client;
  runtimeId: string;
  state: WhatsAppRuntimeState;
  reason: string | null;
  hasRuntime: boolean;
  attempt: number;
  connected: boolean;
  latestQr: string | null;
  latestQrAt: number | null;
  qrExpiresAt: number | null;
  stateWaiters: StateWaiter[];
  initPromise: Promise<void> | null;
  createdAt: number;
  updatedAt: number;
  lastEventAt: number;
  lastRecreateAt: number;
};

@Injectable()
export class WhatsAppWebJsProvider
  implements WhatsAppProvider, OnApplicationShutdown
{
  private static injectPatchApplied = false;
  private static unhandledRejectionGuardApplied = false;
  private static injectChains = new WeakMap<object, Promise<unknown>>();
  private readonly logger = new Logger(WhatsAppWebJsProvider.name);
  private readonly sessions = new Map<string, SessionRuntime>();
  private readonly operationChains = new Map<string, Promise<void>>();
  private readonly staleRuntimeMs = 120000;
  private readonly freshQrMs = 60000;
  private readonly bootingTimeoutMs = 90000;
  private readonly recreateCooldownMs = 20000;
  private readonly authBasePath = this.resolveAuthBasePath();
  private readonly legacyAuthBasePath = path.resolve(
    process.cwd(),
    'uploads',
    'whatsapp-auth-webjs',
  );

  constructor() {
    this.ensureRuntimeHardening();
  }

  async onApplicationShutdown(): Promise<void> {
    await this.destroyAll();
  }

  async ensureRuntime(sessionKey: string): Promise<WhatsAppSessionSnapshot> {
    return this.withSessionLock(sessionKey, 'ensureRuntime', async () => {
      await this.ensureClient(sessionKey, false, 'ensureRuntime');
      return this.getSnapshotFor(sessionKey);
    });
  }

  async getSessionSnapshot(sessionKey: string): Promise<WhatsAppSessionSnapshot> {
    return this.withSessionLock(sessionKey, 'getSessionSnapshot', async () => {
      return this.getSnapshotFor(sessionKey);
    });
  }

  async requestQrRefresh(
    sessionKey: string,
    reason: RequestQrRefreshReason,
  ): Promise<WhatsAppSessionSnapshot> {
    return this.withSessionLock(sessionKey, `requestQrRefresh:${reason}`, async () => {
      let runtime = await this.ensureClient(
        sessionKey,
        false,
        `requestQrRefresh:${reason}`,
      );

      if (runtime.connected || runtime.state === 'ready') {
        return this.toSnapshot(sessionKey, runtime);
      }

      if (reason === 'manual') {
        runtime = await this.ensureClient(
          sessionKey,
          true,
          `requestQrRefresh:${reason}`,
        );
        return this.toSnapshot(sessionKey, runtime);
      }

      if (this.hasFreshQr(runtime)) {
        return this.toSnapshot(sessionKey, runtime);
      }

      const now = Date.now();
      const canRecreate = now - runtime.lastRecreateAt >= this.recreateCooldownMs;
      const shouldRecreate =
        runtime.state === 'auth_failure' ||
        runtime.state === 'stuck' ||
        runtime.state === 'disconnected' ||
        (runtime.state === 'qr_ready' && !this.hasFreshQr(runtime));

      if (shouldRecreate && canRecreate) {
        runtime = await this.ensureClient(
          sessionKey,
          true,
          `requestQrRefresh:${reason}`,
        );
      }

      return this.toSnapshot(sessionKey, runtime);
    });
  }

  async waitForState(
    sessionKey: string,
    targetStates: WhatsAppRuntimeState[],
    timeoutMs: number,
  ): Promise<WhatsAppSessionSnapshot> {
    return this.withSessionLock(sessionKey, 'waitForState:prepare', async () => {
      const runtime = await this.ensureClient(sessionKey, false, 'waitForState');
      const snapshot = this.toSnapshot(sessionKey, runtime);
      if (targetStates.includes(snapshot.state)) {
        return snapshot;
      }

      return new Promise<WhatsAppSessionSnapshot>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.removeStateWaiter(runtime, waiter);
          reject(
            new Error(
              `Timeout esperando estado [${targetStates.join(',')}] en sesión ${sessionKey}`,
            ),
          );
        }, timeoutMs);

        const waiter: StateWaiter = {
          targetStates: new Set(targetStates),
          resolve,
          reject,
          timer,
        };

        runtime.stateWaiters.push(waiter);
      });
    });
  }

  async destroyAll(): Promise<void> {
    const sessionKeys = Array.from(this.sessions.keys());
    for (const sessionKey of sessionKeys) {
      await this.withSessionLock(sessionKey, 'destroyAll', async () => {
        const runtime = this.sessions.get(sessionKey);
        if (!runtime) {
          return;
        }

        await this.destroyRuntime(sessionKey, runtime, false);
      });
    }
  }

  async startSession(sessionKey: string): Promise<StartSessionResult> {
    const snapshot = await this.requestQrRefresh(sessionKey, 'startup');
    if (snapshot.state === 'ready' || snapshot.connected) {
      throw new Error('La sesión ya está conectada; no requiere iniciar QR');
    }

    const finalSnapshot = snapshot.qrCode
      ? snapshot
      : await this.waitForState(sessionKey, ['qr_ready', 'ready'], 90000);

    if (!finalSnapshot.qrCode) {
      throw new Error('No se recibió QR para iniciar la sesión');
    }

    return {
      sessionKey,
      qrCode: finalSnapshot.qrCode,
    };
  }

  async refreshQr(sessionKey: string): Promise<string> {
    const snapshot = await this.requestQrRefresh(sessionKey, 'manual');
    if (snapshot.connected || snapshot.state === 'ready') {
      throw new Error('La sesión ya está conectada; no requiere QR');
    }

    if (snapshot.qrCode) {
      return snapshot.qrCode;
    }

    const awaited = await this.waitForState(sessionKey, ['qr_ready', 'ready'], 90000);
    if (!awaited.qrCode) {
      throw new Error('No se pudo obtener QR actualizado');
    }

    return awaited.qrCode;
  }

  async isSessionConnected(sessionKey: string): Promise<boolean> {
    const snapshot = await this.getSessionSnapshot(sessionKey);
    return snapshot.connected || snapshot.state === 'ready';
  }

  async sendMessage(
    sessionKey: string,
    phone: string,
    message: string,
  ): Promise<SendMessageResult> {
    await this.ensureRuntime(sessionKey);
    await this.waitForState(sessionKey, ['ready'], 15000);

    const runtime = this.sessions.get(sessionKey);
    if (!runtime || !runtime.connected) {
      throw new Error(`Sesión ${sessionKey} no está conectada para enviar mensajes`);
    }

    const jid = this.toWhatsAppJid(phone);
    const sent = await runtime.client.sendMessage(jid, message);

    return {
      providerMessageId: sent?.id?._serialized || `${Date.now()}`,
    };
  }

  async logout(sessionKey: string): Promise<void> {
    await this.withSessionLock(sessionKey, 'logout', async () => {
      const runtime = this.sessions.get(sessionKey);

      if (runtime) {
        try {
          await runtime.client.logout();
        } catch (error) {
          this.logger.warn(
            `No se pudo ejecutar logout para ${sessionKey}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }

        await this.destroyRuntime(sessionKey, runtime, false);
      }

      await this.clearAuthState(sessionKey);
    });
  }

  private withSessionLock<T>(
    sessionKey: string,
    opName: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    const chain = this.operationChains.get(sessionKey) ?? Promise.resolve();
    const next = chain
      .catch(() => undefined)
      .then(async () => {
        const startedAt = Date.now();
        try {
          return await operation();
        } finally {
          const elapsedMs = Date.now() - startedAt;
          this.logger.debug(
            `[${sessionKey}] operación ${opName} completada en ${elapsedMs}ms`,
          );
        }
      });

    this.operationChains.set(
      sessionKey,
      next
        .then(() => undefined)
        .catch(() => undefined),
    );

    return next;
  }

  private async ensureClient(
    sessionKey: string,
    forceRecreate: boolean,
    reason: string,
  ): Promise<SessionRuntime> {
    const existing = this.sessions.get(sessionKey);
    if (existing && this.isRuntimeCurrent(sessionKey, existing.runtimeId)) {
      if (!forceRecreate && !this.shouldRecreate(existing)) {
        return existing;
      }

      if (
        !forceRecreate &&
        Date.now() - existing.lastRecreateAt < this.recreateCooldownMs
      ) {
        return existing;
      }

      await this.destroyRuntime(sessionKey, existing, false);
    }

    const nextAttempt = (existing?.attempt ?? 0) + 1;

    await fs.mkdir(this.authBasePath, { recursive: true });

   const clientCreationStart = Date.now();
   console.log(`[WA_CLIENT_CREATING] sessionKey=${sessionKey}, runtimeId=${this.generateRuntimeId().slice(0, 8)}`);
    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionKey,
        dataPath: this.authBasePath,
      }),
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
      evalOnNewDoc: () => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      },
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--window-size=1366,768',
        ],
        timeout: 120000,
        executablePath: this.getPuppeteerExecutablePath(),
      },
    });
   console.log(`[WA_CLIENT_CREATED] sessionKey=${sessionKey}, elapsed=${Date.now() - clientCreationStart}ms`);

    const runtime: SessionRuntime = {
      client,
      runtimeId: this.generateRuntimeId(),
      state: 'booting',
      reason,
      hasRuntime: true,
      attempt: nextAttempt,
      connected: false,
      latestQr: null,
      latestQrAt: null,
      qrExpiresAt: null,
      stateWaiters: [],
      initPromise: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastEventAt: Date.now(),
      lastRecreateAt: Date.now(),
    };

    this.sessions.set(sessionKey, runtime);

    client.on('qr', (qr: string) => {
      if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
        return;
      }
     console.log(`[WA_QR_EVENT] sessionKey=${sessionKey}, runtimeId=${runtime.runtimeId.slice(0, 8)}, timestamp=${Date.now()}`);

      void (async () => {
        try {
          const dataUrl = await this.toQrImage(qr);
          this.applyStateTransition(sessionKey, runtime, 'qr_ready', {
            connected: false,
            latestQr: dataUrl,
            latestQrAt: Date.now(),
            qrExpiresAt: Date.now() + this.freshQrMs,
            reason: 'qr_event',
          });
          this.logger.log(`QR generado para sesión ${sessionKey}`);
         console.log(`[WA_QR_PROCESSED] sessionKey=${sessionKey}, qrImage size=${dataUrl.length} bytes`);
        } catch (error) {
          this.logger.warn(
            `Error generando imagen QR para ${sessionKey}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      })();
    });

    client.on('ready', () => {
      if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
        return;
      }

      this.applyStateTransition(sessionKey, runtime, 'ready', {
        connected: true,
        latestQr: null,
        latestQrAt: null,
        qrExpiresAt: null,
        reason: 'ready_event',
      });
      this.logger.log(`Sesión ${sessionKey} conectada en WhatsApp Web`);
    });

    client.on('authenticated', () => {
      if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
        return;
      }

      this.applyStateTransition(sessionKey, runtime, 'authenticated', {
        reason: 'authenticated_event',
      });
      this.logger.log(`Sesión ${sessionKey} autenticada`);
    });

    client.on('auth_failure', (message) => {
      if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
        return;
      }

      this.applyStateTransition(sessionKey, runtime, 'auth_failure', {
        connected: false,
        latestQr: null,
        latestQrAt: null,
        qrExpiresAt: null,
        reason: message || 'auth_failure',
      });

      this.logger.warn(
        `Auth failure en ${sessionKey}: ${message || 'sin detalle'}`,
      );

      void this.clearAuthState(sessionKey);
    });

    client.on('disconnected', (reasonText) => {
      if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
        return;
      }

      const reasonValue = `${reasonText || 'unknown'}`;
      this.applyStateTransition(sessionKey, runtime, 'disconnected', {
        connected: false,
        latestQr: null,
        latestQrAt: null,
        qrExpiresAt: null,
        reason: reasonValue,
      });

      this.logger.warn(`Sesión ${sessionKey} desconectada. reason=${reasonValue}`);

      if (reasonValue.toUpperCase().includes('LOGOUT')) {
        void this.clearAuthState(sessionKey);
      }
    });

    client.on('error', (error: unknown) => {
      if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
        return;
      }

      this.applyStateTransition(sessionKey, runtime, 'stuck', {
        connected: false,
        reason: this.formatErrorMessage(error),
      });

      this.logger.warn(
        `Evento error en cliente WhatsApp ${sessionKey}: ${this.formatErrorMessage(error)}`,
      );
    });

     const initStart = Date.now();
     console.log(`[WA_INIT_START] sessionKey=${sessionKey}, timestamp=${initStart}`);
     runtime.initPromise = client
       .initialize()
      .catch((error) => {
        if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
          return;
        }

         console.log(`[WA_INIT_ERROR] sessionKey=${sessionKey}, error=${error instanceof Error ? error.message : 'unknown'}`);
        this.applyStateTransition(sessionKey, runtime, 'stuck', {
          reason: error instanceof Error ? error.message : 'initialize_failed',
        });
        this.logger.warn(
          `No se pudo inicializar cliente WhatsApp para ${sessionKey}: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        );
      })
      .finally(() => {
        if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
          return;
        }
         console.log(`[WA_INIT_FINALLY] sessionKey=${sessionKey}, elapsed=${Date.now() - initStart}ms, state=${runtime.state}`);

        runtime.initPromise = null;
        runtime.lastEventAt = Date.now();
        runtime.updatedAt = Date.now();
      });

    return runtime;
  }

  private async destroyRuntime(
    sessionKey: string,
    runtime: SessionRuntime,
    keepSessionSlot: boolean,
  ): Promise<void> {
    this.rejectStateWaiters(
      runtime,
      new Error(`Runtime cerrado para sesión ${sessionKey}`),
    );

    try {
      await runtime.client.destroy();
    } catch (error) {
      this.logger.warn(
        `Error destruyendo runtime ${runtime.runtimeId} para ${sessionKey}: ${
          error instanceof Error ? error.message : 'unknown'
        }`,
      );
    }

    if (!keepSessionSlot && this.sessions.get(sessionKey)?.runtimeId === runtime.runtimeId) {
      this.sessions.delete(sessionKey);
    }
  }

  private toSnapshot(
    sessionKey: string,
    runtime: SessionRuntime,
  ): WhatsAppSessionSnapshot {
    return {
      sessionKey,
      state: runtime.state,
      connected: runtime.connected,
      qrCode: runtime.latestQr,
      qrExpiresAt: runtime.qrExpiresAt,
      hasRuntime: runtime.hasRuntime,
      runtimeId: runtime.runtimeId,
      reason: runtime.reason,
      lastEventAt: runtime.lastEventAt,
      updatedAt: runtime.updatedAt,
      attempt: runtime.attempt,
    };
  }

  private getSnapshotFor(sessionKey: string): WhatsAppSessionSnapshot {
    const runtime = this.sessions.get(sessionKey);
    if (!runtime) {
      return {
        sessionKey,
        state: 'idle',
        connected: false,
        qrCode: null,
        qrExpiresAt: null,
        hasRuntime: false,
        runtimeId: null,
        reason: null,
        lastEventAt: 0,
        updatedAt: Date.now(),
        attempt: 0,
      };
    }

    if (this.shouldRecreate(runtime)) {
      this.applyStateTransition(sessionKey, runtime, 'stuck', {
        reason: runtime.reason || 'watchdog_runtime_stuck',
      });
    }

    return this.toSnapshot(sessionKey, runtime);
  }

  private applyStateTransition(
    sessionKey: string,
    runtime: SessionRuntime,
    nextState: WhatsAppRuntimeState,
    patch?: Partial<
      Pick<
        SessionRuntime,
        'connected' | 'latestQr' | 'latestQrAt' | 'qrExpiresAt' | 'reason'
      >
    >,
  ): void {
    if (!this.isRuntimeCurrent(sessionKey, runtime.runtimeId)) {
      return;
    }

    runtime.state = nextState;
    runtime.connected = patch?.connected ?? runtime.connected;
    runtime.latestQr = patch?.latestQr ?? runtime.latestQr;
    runtime.latestQrAt = patch?.latestQrAt ?? runtime.latestQrAt;
    runtime.qrExpiresAt = patch?.qrExpiresAt ?? runtime.qrExpiresAt;
    runtime.reason = patch?.reason ?? runtime.reason;
    runtime.lastEventAt = Date.now();
    runtime.updatedAt = Date.now();

    const snapshot = this.toSnapshot(sessionKey, runtime);
    const pending = [...runtime.stateWaiters];

    for (const waiter of pending) {
      if (!waiter.targetStates.has(nextState)) {
        continue;
      }

      this.removeStateWaiter(runtime, waiter);
      waiter.resolve(snapshot);
    }
  }

  private removeStateWaiter(runtime: SessionRuntime, waiter: StateWaiter): void {
    clearTimeout(waiter.timer);
    const idx = runtime.stateWaiters.indexOf(waiter);
    if (idx >= 0) {
      runtime.stateWaiters.splice(idx, 1);
    }
  }

  private rejectStateWaiters(runtime: SessionRuntime, error: Error): void {
    const waiters = [...runtime.stateWaiters];
    runtime.stateWaiters = [];

    for (const waiter of waiters) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
  }

  private shouldRecreate(runtime: SessionRuntime): boolean {
    if (runtime.state === 'auth_failure' || runtime.state === 'disconnected') {
      return true;
    }

    if (runtime.connected || this.hasFreshQr(runtime)) {
      return false;
    }

    const now = Date.now();
    if (runtime.state === 'booting' && now - runtime.createdAt > this.bootingTimeoutMs) {
      return true;
    }

    return now - runtime.lastEventAt > this.staleRuntimeMs;
  }

  private hasFreshQr(runtime: SessionRuntime): boolean {
    if (!runtime.latestQr || !runtime.latestQrAt || !runtime.qrExpiresAt) {
      return false;
    }

    return runtime.qrExpiresAt > Date.now();
  }

  private isRuntimeCurrent(sessionKey: string, runtimeId: string): boolean {
    const current = this.sessions.get(sessionKey);
    return !!current && current.runtimeId === runtimeId;
  }

  private generateRuntimeId(): string {
    return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
  }

  private toWhatsAppJid(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (!digits) {
      throw new Error('Número de teléfono inválido para WhatsApp');
    }

    return `${digits}@c.us`;
  }

  private toQrImage(rawQr: string): Promise<string> {
    return QRCode.toDataURL(rawQr, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 260,
      margin: 1,
    });
  }

  private async clearAuthState(sessionKey: string): Promise<void> {
    const authRoots = [this.authBasePath, this.legacyAuthBasePath].filter(
      (value, index, arr) => arr.indexOf(value) === index,
    );

    const candidates = [
      ...authRoots.flatMap((rootPath) => [
        path.join(rootPath, sessionKey),
        path.join(rootPath, `session-${sessionKey}`),
        path.join(rootPath, '.wwebjs_auth', `session-${sessionKey}`),
      ]),
    ];

    for (const candidate of candidates) {
      await fs.rm(candidate, { recursive: true, force: true });
    }
  }

  private resolveAuthBasePath(): string {
    const configured = process.env.WHATSAPP_AUTH_BASE_PATH?.trim();
    if (configured) {
      return path.resolve(configured);
    }

    if (process.platform === 'win32') {
      const localAppData = process.env.LOCALAPPDATA;
      if (localAppData) {
        return path.join(localAppData, 'zofta-whatsapp-auth');
      }

      return path.resolve('C:/zofta-whatsapp-auth');
    }

    return path.resolve(process.cwd(), '.wwebjs_auth');
  }

  private getPuppeteerExecutablePath(): string | undefined {

    const linuxPaths = [
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium',
    ];

    if (process.platform === 'linux') {
      for (const chromiumPath of linuxPaths) {
        try {
          require('fs').accessSync(chromiumPath);
          console.log(`[PUPPETEER_CONFIG] Found Chrome at ${chromiumPath}`);
          return chromiumPath;
        } catch {}
      }
      console.warn(`[PUPPETEER_CONFIG] No Chrome executable found in common Linux paths. Puppeteer will attempt to use bundled browser.`);
      return undefined;
    }

    return undefined;
  }

  private ensureRuntimeHardening(): void {
    this.patchClientInjectOnce();
    this.registerUnhandledRejectionGuardOnce();
  }

  private patchClientInjectOnce(): void {
    if (WhatsAppWebJsProvider.injectPatchApplied) {
      return;
    }

    const clientPrototype = Client.prototype as unknown as {
      inject?: (...args: unknown[]) => Promise<unknown>;
    };

    if (typeof clientPrototype.inject !== 'function') {
      this.logger.warn('No se pudo aplicar parche de inject: método no encontrado');
      return;
    }

    const originalInject = clientPrototype.inject;

    clientPrototype.inject = async function patchedInject(
      this: object,
      ...args: unknown[]
    ): Promise<unknown> {
      const runWithRetries = async (): Promise<unknown> => {
        let lastError: unknown;

        for (let attempt = 1; attempt <= 5; attempt += 1) {
          try {
            return await originalInject.apply(this, args);
          } catch (error) {
            lastError = error;
            if (!WhatsAppWebJsProvider.isRecoverablePuppeteerError(error)) {
              throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
          }
        }

        throw lastError;
      };

      const previous =
        WhatsAppWebJsProvider.injectChains.get(this) ?? Promise.resolve();

      const current = previous
        .catch(() => undefined)
        .then(async () => runWithRetries());

      WhatsAppWebJsProvider.injectChains.set(
        this,
        current.then(() => undefined).catch(() => undefined),
      );

      return current;
    };

    WhatsAppWebJsProvider.injectPatchApplied = true;
    this.logger.log('Parche de resiliencia aplicado a whatsapp-web.js Client.inject');
  }

  private registerUnhandledRejectionGuardOnce(): void {
    if (WhatsAppWebJsProvider.unhandledRejectionGuardApplied) {
      return;
    }

    process.on('unhandledRejection', (reason: unknown) => {
      if (!WhatsAppWebJsProvider.isRecoverablePuppeteerError(reason)) {
        return;
      }

      const message = WhatsAppWebJsProvider.formatStaticErrorMessage(reason);
      console.warn(
        `[WhatsAppWebJsProvider] Rechazo no manejado recuperable interceptado: ${message}`,
      );
    });

    WhatsAppWebJsProvider.unhandledRejectionGuardApplied = true;
  }

  private formatErrorMessage(error: unknown): string {
    return WhatsAppWebJsProvider.formatStaticErrorMessage(error);
  }

  private static formatStaticErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return `${error ?? 'unknown'}`;
  }

  private static isRecoverablePuppeteerError(error: unknown): boolean {
    const message = this.formatStaticErrorMessage(error).toLowerCase();

    return (
      message.includes('execution context was destroyed') ||
      message.includes('cannot find context with specified id') ||
      message.includes('navigat') ||
      message.includes('detached frame') ||
      message.includes('frame was detached')
    );
  }
}
