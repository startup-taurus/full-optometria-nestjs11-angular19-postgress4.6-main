import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para filtrar datos por companyId automáticamente
 * SUPER_ADMIN (companyId = null): Ve todos los datos
 * Usuario normal (companyId != null): Solo ve datos de su Company
 * 
 * IMPORTANTEEE: Este middleware solo inyecta companyId en el body para rutas específicas
 * que explícitamente lo requieren en sus DTOs (whitelist).
 * 
 * Para la mayoría de endpoints, el companyId se obtiene mediante el decorador @CompanyId()
 * y no debe estar en el body del DTO.
 */
@Injectable()
export class CompanyFilterMiddleware implements NestMiddleware {
  private readonly pathsRequiringCompanyIdInBody = [
    '/branches/create',
    '/branches/update',
    '/roles/create',
    '/roles/update',
    '/user/create',
  ];

  private readonly excludedPaths = [
    '/role-permissions/assign',
    '/role-permissions/remove',
    '/role-modules/assign',
    '/role-modules/remove',
    
    '/auth/login',
    '/auth/refresh',
    '/auth/change-password',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/set-admin-branch-filter',
    '/auth/clear-admin-branch-filter',
    
    '/user/validate-current-password',
    '/user/update/current',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as any).user;

    if (user) {

      (req as any).companyId = user.companyId;
      (req as any).isSuperAdmin =
        user.companyId === null || user.companyId === undefined;

      const shouldExclude = this.excludedPaths.some(path => 
        req.originalUrl.includes(path) || req.url.includes(path)
      );

      const requiresCompanyIdInBody = this.pathsRequiringCompanyIdInBody.some(path =>
        req.originalUrl.includes(path) || req.url.includes(path)
      );

      if (
        !(req as any).isSuperAdmin &&
        !shouldExclude &&
        requiresCompanyIdInBody &&
        (req.method === 'POST' ||
          req.method === 'PATCH' ||
          req.method === 'PUT')
      ) {
        if (req.body && typeof req.body === 'object') {
          req.body.companyId = user.companyId;
        }
      }
    }

    next();
  }
}
