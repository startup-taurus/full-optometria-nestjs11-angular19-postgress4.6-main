import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';

@Injectable()
export class ProvisionKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('PROVISIONING_API_KEY');

    if (!expected) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.UNAUTHORIZED',
        message: 'Provisioning is not configured',
      });
    }

    const request = context.switchToHttp().getRequest();
    const header = request.headers['x-provision-key'];
    const provided = Array.isArray(header) ? header[0] : header;

    if (!provided || !this.matches(provided, expected)) {
      throw new UnauthorizedException({
        messageKey: 'ERROR.UNAUTHORIZED',
        message: 'Invalid provisioning key',
      });
    }

    return true;
  }

  private matches(provided: string, expected: string): boolean {
    const providedHash = createHash('sha256').update(provided).digest();
    const expectedHash = createHash('sha256').update(expected).digest();
    return timingSafeEqual(providedHash, expectedHash);
  }
}
