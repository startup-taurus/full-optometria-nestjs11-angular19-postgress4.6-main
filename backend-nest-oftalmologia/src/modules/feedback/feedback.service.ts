import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Feedback } from './entities/feedback.entity';
import { CreateFeedbackDto } from './dtos/create-feedback.dto';
import { QueryFeedbackDto } from './dtos/query-feedback.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';
import { CompanyFilterUtil } from '../../common/utils/company-filter.util';
import { File } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { UploadFileDto } from '../files/dtos/upload-file.dto';
import {
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
} from './constants/feedback.constants';
import { UpdateFeedbackStatusDto } from './dtos/update-feedback-status.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepository: Repository<Feedback>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private filesService: FilesService,
  ) {}

  async create(
    dto: CreateFeedbackDto,
    files: Express.Multer.File[] | undefined,
    branchId: string | null,
    companyId: string | null,
    userId: string,
  ) {
    if (!companyId) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'Solo los usuarios de una compania pueden crear feedback',
          en: 'Only company users can create feedback',
        },
      });
    }

    if (files && files.length > 3) {
      throw new BadRequestException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'Solo se permiten hasta 3 adjuntos por feedback',
          en: 'Only up to 3 attachments are allowed per feedback',
        },
      });
    }

    const feedback = this.feedbackRepository.create({
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: FEEDBACK_STATUSES[0],
      companyId,
      branchId,
      createdByUserId: userId,
    });

    const savedFeedback = await this.feedbackRepository.save(feedback);

    if (files?.length) {
      for (const file of files) {
        const uploadDto: UploadFileDto = {
          entityType: 'feedback',
          entityId: savedFeedback.id,
        };
        await this.filesService.uploadFile(file, uploadDto);
      }
    }

    const result = await this.findOne(
      savedFeedback.id,
      companyId,
      userId,
      false,
    );

    return {
      messageKey: 'FEEDBACK.CREATED',
      message: {
        es: 'Feedback creado correctamente',
        en: 'Feedback created successfully',
      },
      data: result.data,
    };
  }

  async findAll(
    queryDto: QueryFeedbackDto,
    selectedBranchId: string | null,
    companyId: string | null,
  ) {
    const { page, limit, search, type, status, createdByUserId } = queryDto;
    const branchId = queryDto.branchId || selectedBranchId;
    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.company', 'company')
      .leftJoinAndSelect('feedback.branch', 'branch')
      .leftJoinAndSelect('feedback.createdByUser', 'createdByUser')
      .select([
        'feedback.id',
        'feedback.title',
        'feedback.description',
        'feedback.type',
        'feedback.status',
        'feedback.companyId',
        'feedback.branchId',
        'feedback.createdByUserId',
        'feedback.createdAt',
        'feedback.updatedAt',
        'company.id',
        'company.name',
        'branch.id',
        'branch.name',
        'createdByUser.id',
        'createdByUser.firstName',
        'createdByUser.lastName',
        'createdByUser.email',
      ]);

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'feedback', companyId);

    if (branchId) {
      queryBuilder.andWhere('feedback.branchId = :branchId', { branchId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(feedback.title ILIKE :search OR feedback.description ILIKE :search OR createdByUser.firstName ILIKE :search OR createdByUser.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type && FEEDBACK_TYPES.includes(type as any)) {
      queryBuilder.andWhere('feedback.type = :type', { type });
    }

    if (status && FEEDBACK_STATUSES.includes(status as any)) {
      queryBuilder.andWhere('feedback.status = :status', { status });
    }

    if (createdByUserId) {
      queryBuilder.andWhere('feedback.createdByUserId = :createdByUserId', {
        createdByUserId,
      });
    }

    const totalCount = await queryBuilder.getCount();

    const feedbacks = await queryBuilder
      .orderBy('feedback.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const feedbackWithAttachments = await this.attachFiles(feedbacks);

    const paginatedResult = PaginationUtil.paginate(
      feedbackWithAttachments,
      totalCount,
      {
        page,
        limit,
      },
    );

    return {
      messageKey: 'FEEDBACK.FOUND',
      data: paginatedResult,
    };
  }

  async findAllForAdmin(queryDto: QueryFeedbackDto) {
    const { page, limit, search, type, status, branchId, createdByUserId } =
      queryDto;
    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.company', 'company')
      .leftJoinAndSelect('feedback.branch', 'branch')
      .leftJoinAndSelect('feedback.createdByUser', 'createdByUser')
      .select([
        'feedback.id',
        'feedback.title',
        'feedback.description',
        'feedback.type',
        'feedback.status',
        'feedback.companyId',
        'feedback.branchId',
        'feedback.createdByUserId',
        'feedback.createdAt',
        'feedback.updatedAt',
        'company.id',
        'company.name',
        'company.code',
        'branch.id',
        'branch.name',
        'createdByUser.id',
        'createdByUser.firstName',
        'createdByUser.lastName',
        'createdByUser.email',
      ]);

    if (queryDto.companyId) {
      queryBuilder.andWhere('feedback.companyId = :companyId', {
        companyId: queryDto.companyId,
      });
    }

    if (branchId) {
      queryBuilder.andWhere('feedback.branchId = :branchId', { branchId });
    }

    if (search) {
      queryBuilder.andWhere(
        '(feedback.title ILIKE :search OR feedback.description ILIKE :search OR company.name ILIKE :search OR createdByUser.firstName ILIKE :search OR createdByUser.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (type && FEEDBACK_TYPES.includes(type as any)) {
      queryBuilder.andWhere('feedback.type = :type', { type });
    }

    if (status && FEEDBACK_STATUSES.includes(status as any)) {
      queryBuilder.andWhere('feedback.status = :status', { status });
    }

    if (createdByUserId) {
      queryBuilder.andWhere('feedback.createdByUserId = :createdByUserId', {
        createdByUserId,
      });
    }

    const totalCount = await queryBuilder.getCount();

    const feedbacks = await queryBuilder
      .orderBy('feedback.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    const feedbackWithAttachments = await this.attachFiles(feedbacks);

    const paginatedResult = PaginationUtil.paginate(
      feedbackWithAttachments,
      totalCount,
      {
        page,
        limit,
      },
    );

    return {
      messageKey: 'FEEDBACK.FOUND',
      data: paginatedResult,
    };
  }

  async findOne(
    id: string,
    companyId: string | null,
    userId: string,
    enforceOwnership: boolean,
  ) {
    const queryBuilder = this.feedbackRepository
      .createQueryBuilder('feedback')
      .leftJoinAndSelect('feedback.company', 'company')
      .leftJoinAndSelect('feedback.branch', 'branch')
      .leftJoinAndSelect('feedback.createdByUser', 'createdByUser')
      .where('feedback.id = :id', { id });

    CompanyFilterUtil.applyCompanyFilter(queryBuilder, 'feedback', companyId);

    const feedback = await queryBuilder.getOne();

    if (!feedback) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Feedback no encontrado',
          en: 'Feedback not found',
        },
      });
    }

    if (enforceOwnership && feedback.createdByUserId !== userId) {
      throw new ForbiddenException({
        messageKey: 'ERROR.FORBIDDEN',
        message: {
          es: 'No tienes permiso para acceder a este feedback',
          en: 'You do not have permission to access this feedback',
        },
      });
    }

    const attachmentsResponse = await this.filesService.findByEntity(
      'feedback',
      feedback.id,
    );

    return {
      messageKey: 'FEEDBACK.FETCHED',
      data: {
        ...feedback,
        attachments: attachmentsResponse.data || [],
      },
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateFeedbackStatusDto,
    companyId: string | null,
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id },
      companyId,
    );
    const feedback = await this.feedbackRepository.findOne({
      where: whereCondition,
    });

    if (!feedback) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Feedback no encontrado',
          en: 'Feedback not found',
        },
      });
    }

    feedback.status = dto.status;
    await this.feedbackRepository.save(feedback);

    return {
      messageKey: 'FEEDBACK.UPDATED',
      message: {
        es: 'Estado de feedback actualizado correctamente',
        en: 'Feedback status updated successfully',
      },
      data: feedback,
    };
  }

  async remove(
    id: string,
    companyId: string | null,
    userId: string,
    isSuperAdmin: boolean,
  ) {
    const whereCondition = CompanyFilterUtil.buildWhereCondition(
      { id },
      companyId,
    );

    const feedback = await this.feedbackRepository.findOne({
      where: whereCondition,
    });

    if (!feedback) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Feedback no encontrado',
          en: 'Feedback not found',
        },
      });
    }

    if (!isSuperAdmin && feedback.createdByUserId !== userId) {
      throw new ForbiddenException({
        messageKey: 'ERROR.FORBIDDEN',
        message: {
          es: 'Solo puedes eliminar feedback creado por ti',
          en: 'You can only delete your own feedback',
        },
      });
    }

    const attachments = await this.fileRepository.find({
      where: {
        entityType: 'feedback',
        entityId: id,
        isActive: true,
      },
    });

    for (const attachment of attachments) {
      await this.filesService.remove(attachment.id);
    }

    await this.feedbackRepository.delete(id);

    return {
      messageKey: 'FEEDBACK.DELETED',
      message: {
        es: 'Feedback eliminado correctamente',
        en: 'Feedback deleted successfully',
      },
      data: { id },
    };
  }

  private async attachFiles(feedbackList: Feedback[]) {
    if (!feedbackList.length) {
      return [];
    }

    const ids = feedbackList.map((feedback) => feedback.id);
    const files = await this.fileRepository.find({
      where: {
        entityType: 'feedback',
        entityId: In(ids),
        isActive: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    const groupedFiles = new Map<string, File[]>();
    for (const file of files) {
      const current = groupedFiles.get(file.entityId) || [];
      current.push({
        ...file,
        path: file.path.startsWith('/') ? file.path : `/${file.path}`,
      } as File);
      groupedFiles.set(file.entityId, current);
    }

    return feedbackList.map((feedback) => ({
      ...feedback,
      attachments: groupedFiles.get(feedback.id) || [],
      attachmentsCount: (groupedFiles.get(feedback.id) || []).length,
    }));
  }
}
