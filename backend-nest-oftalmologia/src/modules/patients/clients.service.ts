import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Client } from './entities/client.entity';
import { Patient } from './entities/patient.entity';
import { CreateClientDto } from './dtos/create-client.dto';
import { UpdateClientDto } from './dtos/update-client.dto';
import { QueryClientDto } from './dtos/query-client.dto';
import { QueryGlobalClientDto } from './dtos/query-global-client.dto';
import { PaginationUtil } from '../../common/utils/pagination.util';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private clientRepository: Repository<Client>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  private applyCompanyScope(
    queryBuilder: SelectQueryBuilder<Client>,
    companyId: string | null,
  ): void {
    if (companyId) {
      queryBuilder.andWhere('client.companyId = :companyId', { companyId });
    }
  }

  private applyPatientCompanyScope(
    queryBuilder: SelectQueryBuilder<Patient>,
    companyId: string | null,
  ): void {
    if (companyId) {
      queryBuilder.andWhere('patient.companyId = :companyId', { companyId });
      return;
    }

    queryBuilder.andWhere('patient.companyId IS NULL');
  }

  private normalizePatientIds(
    patientIds?: string[] | null,
    patientId?: string | null,
  ): string[] {
    const ids = [...(patientIds || [])];

    if (patientId) {
      ids.push(patientId);
    }

    return Array.from(
      new Set(
        ids
          .map((id) => String(id || '').trim())
          .filter((id) => id.length > 0),
      ),
    );
  }

  private async ensurePatientsInScope(
    patientIds: string[],
    branchId: string,
    companyId: string | null,
  ): Promise<Patient[]> {
    if (!patientIds.length) {
      return [];
    }

    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.id IN (:...patientIds)', { patientIds })
      .andWhere('patient.branchId = :branchId', { branchId })
      .andWhere('patient.isActive = :isActive', { isActive: true });

    this.applyPatientCompanyScope(queryBuilder, companyId);

    const patients = await queryBuilder.getMany();

    if (patients.length !== patientIds.length) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Uno o más pacientes seleccionados no existen o no pertenecen al contexto actual',
          en: 'One or more selected patients do not exist or are out of current scope',
        },
      });
    }

    return patients;
  }

  private async ensureUniqueDocument(
    documentNumber: string,
    branchId: string,
    companyId: string | null,
    excludedClientId?: string,
  ): Promise<void> {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .where('client.documentNumber = :documentNumber', { documentNumber })
      .andWhere('client.branchId = :branchId', { branchId })
      .andWhere('client.isActive = :isActive', { isActive: true });

    this.applyCompanyScope(queryBuilder, companyId);

    if (excludedClientId) {
      queryBuilder.andWhere('client.id != :excludedClientId', {
        excludedClientId,
      });
    }

    const existingClient = await queryBuilder.getOne();

    if (existingClient) {
      throw new ConflictException({
        messageKey: 'ERROR.VALIDATION',
        message: {
          es: 'Ya existe un cliente activo con ese número de documento',
          en: 'An active client already exists with this document number',
        },
      });
    }
  }

  private async syncClientPatientLinks(
    clientId: string,
    patientIds: string[],
  ): Promise<void> {
    const currentClient = await this.clientRepository.findOne({
      where: { id: clientId },
      relations: ['patients'],
    });

    const currentPatientIds = (currentClient?.patients || []).map(
      (item) => item.id,
    );

    const idsToAdd = patientIds.filter((id) => !currentPatientIds.includes(id));
    const idsToRemove = currentPatientIds.filter(
      (id) => !patientIds.includes(id),
    );

    await this.clientRepository
      .createQueryBuilder()
      .relation(Client, 'patients')
      .of(clientId)
      .addAndRemove(idsToAdd, idsToRemove);
  }

  private async loadScopedClient(
    clientId: string,
    branchId: string,
    companyId: string | null,
    patientId?: string,
  ): Promise<Client | null> {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.patient', 'patient')
      .leftJoinAndSelect('client.patients', 'patients')
      .where('client.id = :clientId', { clientId })
      .andWhere('client.branchId = :branchId', { branchId })
      .andWhere('client.isActive = :isActive', { isActive: true });

    this.applyCompanyScope(queryBuilder, companyId);

    if (patientId) {
      queryBuilder
        .innerJoin('client.patients', 'patientFilter')
        .andWhere('patientFilter.id = :patientId', { patientId });
    }

    return queryBuilder.getOne();
  }

  private serializeClient(client: Client) {
    const patients = (client.patients || []).map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      documentNumber: item.documentNumber,
    }));

    return {
      ...client,
      patientIds: patients.map((item) => item.id),
      patients,
      patient:
        client.patient ||
        (patients.length
          ? {
              id: patients[0].id,
              firstName: patients[0].firstName,
              lastName: patients[0].lastName,
              documentNumber: patients[0].documentNumber,
            }
          : null),
      patientId: client.patientId || (patients.length ? patients[0].id : null),
    };
  }

  private async createInternal(
    createClientDto: CreateClientDto,
    branchId: string,
    companyId: string | null,
    fixedPatientIds: string[] = [],
  ) {
    const { email, documentNumber, patientId, patientIds, ...clientData } =
      createClientDto;

    const normalizedPatientIds = this.normalizePatientIds(
      [...fixedPatientIds, ...(patientIds || [])],
      patientId,
    );

    await this.ensureUniqueDocument(documentNumber, branchId, companyId);
    await this.ensurePatientsInScope(normalizedPatientIds, branchId, companyId);

    const client = this.clientRepository.create({
      email: email.toLowerCase(),
      documentNumber,
      patientId: normalizedPatientIds[0] || null,
      companyId,
      branchId,
      ...clientData,
    });

    try {
      const savedClient = await this.clientRepository.save(client);
      await this.syncClientPatientLinks(savedClient.id, normalizedPatientIds);

      const reloadedClient = await this.loadScopedClient(
        savedClient.id,
        branchId,
        companyId,
      );

      return {
        messageKey: 'CLIENT.CREATED',
        message: {
          es: 'Cliente creado correctamente',
          en: 'Client created successfully',
        },
        data: this.serializeClient(reloadedClient || savedClient),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        messageKey: 'ERROR.INTERNAL_SERVER',
        message: {
          es: 'Error inesperado al crear el cliente',
          en: 'Unexpected error while creating client',
        },
      });
    }
  }

  async create(
    patientId: string,
    createClientDto: CreateClientDto,
    branchId: string,
    companyId: string | null,
  ) {
    return this.createInternal(createClientDto, branchId, companyId, [patientId]);
  }

  async createGlobal(
    createClientDto: CreateClientDto,
    branchId: string,
    companyId: string | null,
  ) {
    return this.createInternal(createClientDto, branchId, companyId);
  }

  async findAllByPatient(
    patientId: string,
    queryDto: QueryClientDto,
    branchId: string,
    companyId: string | null,
  ) {
    const { page, limit, search, firstName, lastName, email, documentNumber } =
      queryDto;

    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.patient', 'patient')
      .leftJoinAndSelect('client.patients', 'patients')
      .innerJoin('client.patients', 'patientFilter')
      .where('patientFilter.id = :patientId', { patientId })
      .andWhere('client.branchId = :branchId', { branchId })
      .andWhere('client.isActive = :isActive', { isActive: true });

    this.applyCompanyScope(queryBuilder, companyId);

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(client.firstName) LIKE LOWER(:search) OR LOWER(client.lastName) LIKE LOWER(:search) OR LOWER(client.documentNumber) LIKE LOWER(:search) OR LOWER(client.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (firstName) {
      queryBuilder.andWhere('LOWER(client.firstName) LIKE LOWER(:firstName)', {
        firstName: `%${firstName}%`,
      });
    }

    if (lastName) {
      queryBuilder.andWhere('LOWER(client.lastName) LIKE LOWER(:lastName)', {
        lastName: `%${lastName}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('LOWER(client.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }

    if (documentNumber) {
      queryBuilder.andWhere(
        'LOWER(client.documentNumber) LIKE LOWER(:documentNumber)',
        {
          documentNumber: `%${documentNumber}%`,
        },
      );
    }

    const [clients, total] = await queryBuilder
      .orderBy('client.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      messageKey: 'CLIENT.FOUND',
      message: {
        es: 'Clientes obtenidos correctamente',
        en: 'Clients fetched successfully',
      },
      result: clients.map((client) => this.serializeClient(client)),
      totalCount: total,
      currentPage: page,
      pageSize: limit,
    };
  }

  async findAllGlobal(
    queryDto: QueryGlobalClientDto,
    branchId: string,
    companyId: string | null,
  ) {
    const {
      page,
      limit,
      search,
      firstName,
      lastName,
      email,
      documentNumber,
      hasPatientLink,
      patientId,
    } = queryDto;

    const { skip, take } = PaginationUtil.getSkipAndTake({ page, limit });

    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.patient', 'patient')
      .leftJoinAndSelect('client.patients', 'patients')
      .where('client.branchId = :branchId', { branchId })
      .andWhere('client.isActive = :isActive', { isActive: true });

    this.applyCompanyScope(queryBuilder, companyId);

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(client.firstName) LIKE LOWER(:search) OR LOWER(client.lastName) LIKE LOWER(:search) OR LOWER(client.documentNumber) LIKE LOWER(:search) OR LOWER(client.email) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (firstName) {
      queryBuilder.andWhere('LOWER(client.firstName) LIKE LOWER(:firstName)', {
        firstName: `%${firstName}%`,
      });
    }

    if (lastName) {
      queryBuilder.andWhere('LOWER(client.lastName) LIKE LOWER(:lastName)', {
        lastName: `%${lastName}%`,
      });
    }

    if (email) {
      queryBuilder.andWhere('LOWER(client.email) LIKE LOWER(:email)', {
        email: `%${email}%`,
      });
    }

    if (documentNumber) {
      queryBuilder.andWhere(
        'LOWER(client.documentNumber) LIKE LOWER(:documentNumber)',
        {
          documentNumber: `%${documentNumber}%`,
        },
      );
    }

    if (patientId) {
      queryBuilder
        .innerJoin('client.patients', 'patientFilter')
        .andWhere('patientFilter.id = :patientId', { patientId });
    }

    if (hasPatientLink === true) {
      queryBuilder.andWhere(
        'EXISTS (SELECT 1 FROM client_patients cp WHERE cp.client_id = client.id)',
      );
    }

    if (hasPatientLink === false) {
      queryBuilder.andWhere(
        'NOT EXISTS (SELECT 1 FROM client_patients cp WHERE cp.client_id = client.id)',
      );
    }

    const [clients, total] = await queryBuilder
      .orderBy('client.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      messageKey: 'CLIENT.FOUND',
      message: {
        es: 'Clientes obtenidos correctamente',
        en: 'Clients fetched successfully',
      },
      result: clients.map((client) => this.serializeClient(client)),
      totalCount: total,
      currentPage: page,
      pageSize: limit,
    };
  }

  async findOne(
    patientId: string,
    clientId: string,
    branchId: string,
    companyId: string | null,
  ) {
    const client = await this.loadScopedClient(
      clientId,
      branchId,
      companyId,
      patientId,
    );

    if (!client) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Cliente no encontrado',
          en: 'Client not found',
        },
      });
    }

    return {
      messageKey: 'CLIENT.FETCHED',
      message: {
        es: 'Cliente obtenido correctamente',
        en: 'Client fetched successfully',
      },
      data: this.serializeClient(client),
    };
  }

  async findOneGlobal(
    clientId: string,
    branchId: string,
    companyId: string | null,
  ) {
    const client = await this.loadScopedClient(clientId, branchId, companyId);

    if (!client) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Cliente no encontrado',
          en: 'Client not found',
        },
      });
    }

    return {
      messageKey: 'CLIENT.FETCHED',
      message: {
        es: 'Cliente obtenido correctamente',
        en: 'Client fetched successfully',
      },
      data: this.serializeClient(client),
    };
  }

  private async updateInternal(
    clientId: string,
    updateClientDto: UpdateClientDto,
    branchId: string,
    companyId: string | null,
    forcedPatientIds?: string[],
    scopedPatientId?: string,
  ) {
    const client = await this.loadScopedClient(
      clientId,
      branchId,
      companyId,
      scopedPatientId,
    );

    if (!client) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Cliente no encontrado',
          en: 'Client not found',
        },
      });
    }

    const { email, documentNumber, patientId, patientIds, ...updateData } =
      updateClientDto;

    const hasPatientIdsChange =
      Object.prototype.hasOwnProperty.call(updateClientDto, 'patientIds') ||
      Object.prototype.hasOwnProperty.call(updateClientDto, 'patientId') ||
      Array.isArray(forcedPatientIds);

    const normalizedPatientIds = hasPatientIdsChange
      ? this.normalizePatientIds(
          [
            ...(forcedPatientIds || []),
            ...(patientIds || []),
            ...(scopedPatientId ? [scopedPatientId] : []),
          ],
          patientId,
        )
      : (client.patients || []).map((item) => item.id);

    const nextDocumentNumber = documentNumber || client.documentNumber;
    if (nextDocumentNumber !== client.documentNumber) {
      await this.ensureUniqueDocument(
        nextDocumentNumber,
        branchId,
        companyId,
        client.id,
      );
    }

    await this.ensurePatientsInScope(normalizedPatientIds, branchId, companyId);

    if (email) {
      updateData['email'] = email.toLowerCase();
    }

    if (documentNumber) {
      updateData['documentNumber'] = documentNumber;
    }

    updateData['patientId'] = normalizedPatientIds[0] || null;

    try {
      Object.assign(client, updateData);
      const updatedClient = await this.clientRepository.save(client);

      if (hasPatientIdsChange) {
        await this.syncClientPatientLinks(updatedClient.id, normalizedPatientIds);
      }

      const reloadedClient = await this.loadScopedClient(
        updatedClient.id,
        branchId,
        companyId,
      );

      return {
        messageKey: 'CLIENT.UPDATED',
        message: {
          es: 'Cliente actualizado correctamente',
          en: 'Client updated successfully',
        },
        data: this.serializeClient(reloadedClient || updatedClient),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        messageKey: 'ERROR.INTERNAL_SERVER',
        message: {
          es: 'Error inesperado al actualizar el cliente',
          en: 'Unexpected error while updating client',
        },
      });
    }
  }

  async update(
    patientId: string,
    clientId: string,
    updateClientDto: UpdateClientDto,
    branchId: string,
    companyId: string | null,
  ) {
    return this.updateInternal(
      clientId,
      updateClientDto,
      branchId,
      companyId,
      [patientId],
      patientId,
    );
  }

  async updateGlobal(
    clientId: string,
    updateClientDto: UpdateClientDto,
    branchId: string,
    companyId: string | null,
  ) {
    return this.updateInternal(clientId, updateClientDto, branchId, companyId);
  }

  async remove(
    patientId: string,
    clientId: string,
    branchId: string,
    companyId: string | null,
  ) {
    const client = await this.loadScopedClient(
      clientId,
      branchId,
      companyId,
      patientId,
    );

    if (!client) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Cliente no encontrado',
          en: 'Client not found',
        },
      });
    }

    client.isActive = false;
    await this.clientRepository.save(client);

    return {
      messageKey: 'CLIENT.DELETED',
      message: {
        es: 'Cliente eliminado correctamente',
        en: 'Client deleted successfully',
      },
    };
  }

  async removeGlobal(
    clientId: string,
    branchId: string,
    companyId: string | null,
  ) {
    const client = await this.loadScopedClient(clientId, branchId, companyId);

    if (!client) {
      throw new NotFoundException({
        messageKey: 'ERROR.NOT_FOUND',
        message: {
          es: 'Cliente no encontrado',
          en: 'Client not found',
        },
      });
    }

    client.isActive = false;
    await this.clientRepository.save(client);

    return {
      messageKey: 'CLIENT.DELETED',
      message: {
        es: 'Cliente eliminado correctamente',
        en: 'Client deleted successfully',
      },
    };
  }

  async searchByDocumentNumber(
    patientId: string,
    documentNumber: string,
    branchId: string,
    companyId: string | null,
  ) {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.patient', 'patient')
      .leftJoinAndSelect('client.patients', 'patients')
      .innerJoin('client.patients', 'patientFilter')
      .where('patientFilter.id = :patientId', { patientId })
      .andWhere('client.branchId = :branchId', { branchId })
      .andWhere('client.isActive = :isActive', { isActive: true })
      .andWhere('client.documentNumber = :documentNumber', { documentNumber })
      .orderBy('client.createdAt', 'DESC')
      .take(5);

    this.applyCompanyScope(queryBuilder, companyId);

    const clients = await queryBuilder.getMany();

    return {
      messageKey: 'CLIENT.SEARCH_RESULTS',
      message: {
        es: 'Resultados de búsqueda obtenidos',
        en: 'Search results retrieved',
      },
      data: clients.map((client) => this.serializeClient(client)),
    };
  }

  async searchGlobalByDocumentNumber(
    documentNumber: string,
    branchId: string,
    companyId: string | null,
  ) {
    const queryBuilder = this.clientRepository
      .createQueryBuilder('client')
      .leftJoinAndSelect('client.patient', 'patient')
      .leftJoinAndSelect('client.patients', 'patients')
      .where('client.branchId = :branchId', { branchId })
      .andWhere('client.isActive = :isActive', { isActive: true })
      .andWhere('client.documentNumber = :documentNumber', { documentNumber })
      .orderBy('client.createdAt', 'DESC')
      .take(10);

    this.applyCompanyScope(queryBuilder, companyId);

    const clients = await queryBuilder.getMany();

    return {
      messageKey: 'CLIENT.SEARCH_RESULTS',
      message: {
        es: 'Resultados de búsqueda obtenidos',
        en: 'Search results retrieved',
      },
      data: clients.map((client) => this.serializeClient(client)),
    };
  }

  async findClientById(clientId: string) {
    return this.clientRepository.findOne({
      where: { id: clientId, isActive: true },
      relations: ['patient', 'patients'],
    });
  }
}
