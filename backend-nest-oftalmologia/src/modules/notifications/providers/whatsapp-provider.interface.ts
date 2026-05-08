export interface StartSessionResult {
  sessionKey: string;
  qrCode: string;
}

export type WhatsAppRuntimeState =
  | 'idle'
  | 'booting'
  | 'qr_ready'
  | 'authenticated'
  | 'ready'
  | 'auth_failure'
  | 'disconnected'
  | 'stuck';

export type RequestQrRefreshReason =
  | 'manual'
  | 'missing_qr'
  | 'expired_qr'
  | 'stale_runtime'
  | 'startup';

export interface WhatsAppSessionSnapshot {
  sessionKey: string;
  state: WhatsAppRuntimeState;
  connected: boolean;
  qrCode: string | null;
  qrExpiresAt: number | null;
  hasRuntime: boolean;
  runtimeId: string | null;
  reason: string | null;
  lastEventAt: number;
  updatedAt: number;
  attempt: number;
}

export interface SendMessageResult {
  providerMessageId: string;
}

export interface WhatsAppProvider {
  ensureRuntime(sessionKey: string): Promise<WhatsAppSessionSnapshot>;
  getSessionSnapshot(sessionKey: string): Promise<WhatsAppSessionSnapshot>;
  requestQrRefresh(
    sessionKey: string,
    reason: RequestQrRefreshReason,
  ): Promise<WhatsAppSessionSnapshot>;
  waitForState(
    sessionKey: string,
    targetStates: WhatsAppRuntimeState[],
    timeoutMs: number,
  ): Promise<WhatsAppSessionSnapshot>;
  destroyAll(): Promise<void>;
  startSession(sessionKey: string): Promise<StartSessionResult>;
  refreshQr(sessionKey: string): Promise<string>;
  isSessionConnected(sessionKey: string): Promise<boolean>;
  hasAuthOnDisk(sessionKey: string): Promise<boolean>;
  sendMessage(
    sessionKey: string,
    phone: string,
    message: string,
  ): Promise<SendMessageResult>;
  logout(sessionKey: string): Promise<void>;
}

export const WHATSAPP_PROVIDER = 'WHATSAPP_PROVIDER';
