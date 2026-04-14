import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { validate as isUUID } from 'uuid';
import { JwtService } from '@nestjs/jwt';
import { Branch } from '../../modules/branches/entities/branch.entity';
import { User } from '../../modules/users/entities/user.entity';
import { AdminBranchSessionService } from '../services/admin-branch-session.service';

@Injectable()
export class BranchFilterMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private adminBranchSessionService: AdminBranchSessionService
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const excludedRoutes = [
      'auth',
      'roles',
      'permission',
      'module',
      'files',
      'branches',
      'public',
    ];

    const urlParts = req.originalUrl.split('/');
    const routeBase = urlParts[3];
    const subRoute = urlParts[4];

    const isPublicRoute =
      req.originalUrl.includes('/public/') ||
      req.originalUrl.includes('/public') ||
      subRoute === 'public' ||
      excludedRoutes.includes(routeBase);

    if (isPublicRoute) {
      return next();
    }

    const authHeader = req.headers.authorization;
    let currentUser: User | null = (req as any).user || null;

    if (!currentUser && authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = this.jwtService.decode(token) as any;

        if (decoded && decoded.sub) {
          currentUser = await this.userRepository.findOne({
            where: { id: decoded.sub },
            relations: ['role', 'branch'],
          });
        }
      } catch (error) {}
    }

    if (!currentUser) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'No se pudo determinar el usuario autenticado para resolver la sucursal.',
          en: 'Could not determine authenticated user to resolve branch.',
        },
      });
    }

    let branchId: string;

    if (currentUser) {
      const adminBranchId = req.headers['x-admin-branch-id'] as string;

      if (adminBranchId) {
        branchId = adminBranchId;
        this.adminBranchSessionService.setAdminBranchSelection(
          currentUser.id,
          adminBranchId
        );
      } else {
        const savedAdminSelection =
          this.adminBranchSessionService.getAdminBranchSelection(
            currentUser.id
          );
        if (savedAdminSelection) {
          branchId = savedAdminSelection;
        } else {
          if (currentUser?.branchId) {
            branchId = currentUser.branchId;
          }
        }
      }
    }

    if (!branchId) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'No se pudo determinar la sucursal. Verifique que el usuario tenga una sucursal asignada.',
          en: 'Could not determine branch. Please verify that the user has an assigned branch.',
        },
      });
    }

    if (!isUUID(branchId)) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'El formato del branch ID debe ser UUID válido',
          en: 'Branch ID must be a valid UUID format',
        },
      });
    }

    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
    });

    if (!branch) {
      throw new NotFoundException({
        statusCode: 404,
        success: false,
        message: {
          es: 'Sucursal no encontrada',
          en: 'Branch not found',
        },
      });
    }

    if (!branch.isActive) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La sucursal no está activa',
          en: 'Branch is not active',
        },
      });
    }

    const userCompanyId = currentUser.companyId ?? null;
    if (userCompanyId && branch.companyId !== userCompanyId) {
      throw new BadRequestException({
        statusCode: 400,
        success: false,
        message: {
          es: 'La sucursal seleccionada no pertenece a su compañía.',
          en: 'Selected branch does not belong to your company.',
        },
      });
    }

    (req as any).branchId = branchId;
    (req as any).currentUser = currentUser;
    (req as any).isAdminFiltering = req.headers['x-admin-branch-id'] ? true : false;

    next();
  }
}
