import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type BillingApiResult = {
  statusCode: number;
  payload: any;
};

export class BillingApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly payload: any,
    message?: string,
  ) {
    super(message || 'Billing API request failed');
  }
}

@Injectable()
export class BillingApiProvider {
  private readonly logger = new Logger(BillingApiProvider.name);
  private hasWarnedUrlNormalization = false;

  constructor(private readonly configService: ConfigService) {}

  private get baseUrl(): string {
    const raw = (this.configService.get<string>('BILLING_API_URL') || '').trim();

    if (!raw) {
      return '';
    }

    const normalizedRaw = raw.replace(/\/+$/, '');

    try {
      const parsed = new URL(normalizedRaw);
      const pathname = (parsed.pathname || '/').replace(/\/+$/, '') || '/';

      if (pathname === '/' || pathname === '/v1') {
        const targetPath = pathname === '/v1' ? '/v1/api' : '/v1/api';
        const previousUrl = `${parsed.origin}${pathname}`;
        parsed.pathname = targetPath;
        const normalizedUrl = `${parsed.origin}${parsed.pathname}`.replace(
          /\/+$/,
          '',
        );

        if (!this.hasWarnedUrlNormalization) {
          this.logger.warn(
            `BILLING_API_URL appears incomplete (${previousUrl}). Auto-normalized to ${normalizedUrl}`,
          );
          this.hasWarnedUrlNormalization = true;
        }

        return normalizedUrl;
      }

      return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '');
    } catch {
      return normalizedRaw;
    }
  }

  private get timeoutMs(): number {
    const value = this.configService.get<number>('BILLING_API_TIMEOUT_MS');
    return Number.isFinite(value) && value > 0 ? value : 10000;
  }

  private get maxRetries(): number {
    const value = this.configService.get<number>('BILLING_API_MAX_RETRIES');
    return Number.isFinite(value) && value >= 0 ? value : 2;
  }

  async createInvoice(
    apiKey: string,
    body: Record<string, unknown>,
  ): Promise<BillingApiResult> {
    return this.request(apiKey, 'POST', '/billing/invoices', body);
  }

  async authorizeInvoice(
    apiKey: string,
    invoiceId: string,
    contributorId?: number | null,
  ): Promise<BillingApiResult> {
    const query =
      contributorId && Number.isFinite(contributorId)
        ? `?contributor_id=${contributorId}`
        : '';
    return this.request(
      apiKey,
      'POST',
      `/billing/invoices/${invoiceId}/authorize${query}`,
    );
  }

  async getInvoiceXml(
    apiKey: string,
    invoiceId: string,
    contributorId?: number | null,
  ): Promise<BillingApiResult> {
    const query =
      contributorId && Number.isFinite(contributorId)
        ? `?contributor_id=${contributorId}`
        : '';
    return this.request(
      apiKey,
      'GET',
      `/billing/invoices/${invoiceId}/xml${query}`,
    );
  }

  async getInvoiceDetails(
    apiKey: string,
    invoiceId: string,
    contributorId?: number | null,
  ): Promise<BillingApiResult> {
    const query =
      contributorId && Number.isFinite(contributorId)
        ? `?contributor_id=${contributorId}`
        : '';

    return this.request(
      apiKey,
      'GET',
      `/billing/invoices/${invoiceId}${query}`,
    );
  }

  private async request(
    apiKey: string,
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<BillingApiResult> {
    if (!this.baseUrl) {
      console.log('[BillingApiProvider][request] missing base url', {
        method,
        path,
      });

      throw new BillingApiError(500, null, 'Billing API URL not configured');
    }

    const attempts = this.maxRetries + 1;
    const requestUrl = `${this.baseUrl}${path}`;

    console.log('[BillingApiProvider][request] start', {
      method,
      path,
      url: requestUrl,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
      attempts,
      apiKeyMasked: this.maskApiKey(apiKey),
      body,
    });

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      console.log('[BillingApiProvider][request] attempt', {
        attempt,
        attempts,
        method,
        url: requestUrl,
      });

      try {
        const controller = new AbortController();
        const timeoutRef = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(requestUrl, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutRef);

        const rawText = await response.text();
        const payload = this.tryParseJson(rawText);

        console.log('[BillingApiProvider][request] response received', {
          method,
          url: requestUrl,
          attempt,
          attempts,
          statusCode: response.status,
          payload,
        });

        if (!response.ok) {
          const err = new BillingApiError(response.status, payload);
          const isPermanent = this.isPermanentProviderError(payload);
          const canRetry =
            this.shouldRetry(response.status) &&
            !isPermanent;

          console.log('[BillingApiProvider][request] non-success response', {
            method,
            url: requestUrl,
            attempt,
            attempts,
            statusCode: response.status,
            canRetry,
            isPermanent,
            payload,
          });

          if (attempt >= attempts || !canRetry) {
            throw err;
          }
          await this.sleep(attempt * 500);
          continue;
        }

        if (this.isVersionPayload(payload)) {
          console.log('[BillingApiProvider][request] invalid version payload', {
            method,
            url: requestUrl,
            payload,
          });

          throw new BillingApiError(
            502,
            payload,
            'Billing API returned service version payload. Verify BILLING_API_URL (expected .../v1/api)',
          );
        }

        return {
          statusCode: response.status,
          payload,
        };
      } catch (error) {
        if (error instanceof BillingApiError) {
          console.log('[BillingApiProvider][request] billing api error thrown', {
            method,
            url: requestUrl,
            attempt,
            attempts,
            statusCode: error.statusCode,
            payload: error.payload,
            message: error.message,
          });

          throw error;
        }

        const message = error instanceof Error ? error.message : String(error);

        console.log('[BillingApiProvider][request] network/runtime error', {
          method,
          url: requestUrl,
          attempt,
          attempts,
          message,
        });

        if (attempt >= attempts) {
          throw new BillingApiError(
            504,
            null,
            'Billing API timeout or network error',
          );
        }

        await this.sleep(attempt * 500);
      }
    }

    throw new BillingApiError(500, null, 'Billing API request failed');
  }

  private shouldRetry(statusCode: number): boolean {
    return statusCode === 408 || statusCode === 429 || statusCode >= 500;
  }

  private isPermanentProviderError(payload: any): boolean {
    const rawMessage =
      payload?.message || payload?.data?.error || payload?.error || '';

    if (!rawMessage) {
      return false;
    }

    const normalizedMessage = String(rawMessage).toLowerCase();

    return normalizedMessage.includes('permission denied for table api_key');
  }

  private tryParseJson(rawText: string): any {
    if (!rawText) {
      return null;
    }

    try {
      return JSON.parse(rawText);
    } catch {
      return {
        raw: rawText,
      };
    }
  }

  private isVersionPayload(payload: any): boolean {
    const raw = typeof payload?.raw === 'string' ? payload.raw.trim() : '';
    return /^v\.\d+\.\d+\.\d+\.\d+$/i.test(raw);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
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
}
