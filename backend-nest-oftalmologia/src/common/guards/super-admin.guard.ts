import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        messageKey: 'ERROR.UNAUTHORIZED',
        message: 'User not authenticated',
      });
    }

    const isSuperAdmin =
      user.companyId === null && user.role?.roleName === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
      throw new ForbiddenException({
        messageKey: 'ERROR.SUPER_ADMIN_REQUIRED',
        message: 'Recurso protegido, no puedes acceder jijijija',
      });
    }

    return true;
  }
}
