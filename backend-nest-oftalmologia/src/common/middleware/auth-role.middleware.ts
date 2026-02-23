import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';

@Injectable()
export class AuthRoleMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const publicRoutes = [
      '/auth/login',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];

    const isPublicCatalog =
      req.originalUrl.includes('/products/public/catalog') ||
      req.originalUrl.includes('/products/public/filters') ||
      req.originalUrl.includes('/products/public/');

    const isAuthPublicRoute = publicRoutes.some((route) =>
      req.originalUrl.includes(route)
    );

    if (isPublicCatalog || isAuthPublicRoute) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        statusCode: 401,
        success: false,
        message: {
          es: 'No se proporcionó un token de autenticación válido',
          en: 'No valid authentication token provided',
        },
      });
    }

    try {
      const token = authHeader.substring(7);
      const decoded = this.jwtService.verify(token);

      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException({
          statusCode: 401,
          success: false,
          message: {
            es: 'Token de autenticación inválido',
            en: 'Invalid authentication token',
          },
        });
      }

      const user = await this.userRepository.findOne({
        where: { id: decoded.sub },
        relations: ['role', 'branch'],
      });

      if (!user) {
        throw new UnauthorizedException({
          statusCode: 401,
          success: false,
          message: {
            es: 'Usuario no encontrado',
            en: 'User not found',
          },
        });
      }

      if (!user.isActive) {
        throw new UnauthorizedException({
          statusCode: 401,
          success: false,
          message: {
            es: 'Usuario inactivo',
            en: 'User is inactive',
          },
        });
      }

      if (user.isLocked) {
        throw new UnauthorizedException({
          statusCode: 401,
          success: false,
          message: {
            es: 'Usuario bloqueado. Contacte al administrador',
            en: 'User is locked. Contact administrator',
          },
        });
      }

      if (!user.role) {
        throw new UnauthorizedException({
          statusCode: 401,
          success: false,
          message: {
            es: 'Usuario sin rol asignado',
            en: 'User has no role assigned',
          },
        });
      }

      (req as any).user = user;

      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({
        statusCode: 401,
        success: false,
        message: {
          es: 'Token de autenticación inválido o expirado',
          en: 'Invalid or expired authentication token',
        },
      });
    }
  }
}
