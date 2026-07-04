import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LandingBillingClient {
  private readonly logger = new Logger(LandingBillingClient.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.getBaseUrl() && this.getApiKey());
  }

  async cancelRemote(externalSubscriptionId: string): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    const url = `${this.getBaseUrl()}/api/subscriptions/cancel`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.getTimeoutMs());

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getApiKey()}`,
        },
        body: JSON.stringify({ id: externalSubscriptionId }),
        signal: controller.signal,
      });

      if (!response.ok && response.status !== 404) {
        this.logger.error(
          `No se pudo cancelar el cobro en la landing (sub=${externalSubscriptionId}): http_${response.status}`
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Fallo al contactar la landing para cancelar el cobro (sub=${externalSubscriptionId}): ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }

  private getBaseUrl(): string {
    return (this.configService.get<string>('LANDING_API_URL') || '').replace(
      /\/+$/,
      ''
    );
  }

  private getApiKey(): string {
    return this.configService.get<string>('LANDING_API_KEY') || '';
  }

  private getTimeoutMs(): number {
    return Number(this.configService.get<string>('LANDING_API_TIMEOUT_MS')) || 10000;
  }
}
