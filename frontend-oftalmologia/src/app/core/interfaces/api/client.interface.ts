export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email: string;
  documentNumber: string;
  patientId?: string | null;
  patientIds?: string[];
  mobilePhone?: string;
  homePhone?: string;
  address?: string;
}

export interface UpdateClientDto extends Partial<CreateClientDto> {
  isActive?: boolean;
}

export interface Client extends CreateClientDto {
  id: string;
  patientId?: string | null;
  companyId?: string;
  branchId?: string;
  isPatientSelf?: boolean;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
  } | null;
  patientIds?: string[];
  patients?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    documentNumber: string;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  documentNumber?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  hasPatientLink?: boolean;
  patientId?: string;
}
