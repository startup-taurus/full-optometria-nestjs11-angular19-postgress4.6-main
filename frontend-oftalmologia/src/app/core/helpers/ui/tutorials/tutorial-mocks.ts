import type { Patient } from '@core/interfaces/api/patient.interface'
import type { Shift } from '@core/interfaces/api/shift.interface'
import type { LaboratoryOrder } from '@core/interfaces/api/laboratory-order.interface'
import type { Branch } from '@core/interfaces/api/user.interface'
import type { MedicalHistoryRecord } from '@/app/features/medical-history/components/tables/table-medical-history.component'

const DEMO_BRANCH: Branch = {
  id: 'tutorial-branch',
  name: 'Sucursal Centro',
  code: 'CEN-001',
  address: 'Av. Amazonas y República',
  city: 'Quito',
  isActive: true,
}

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'tutorial-patient-1',
    firstName: 'María Fernanda',
    lastName: 'Cevallos Andrade',
    documentNumber: '1712345678',
    email: 'mf.cevallos@gmail.com',
    mobilePhone: '0987654321',
    homePhone: '022456789',
    address: 'Av. Amazonas N34-120 y República, Quito',
    isActive: true,
    branch: DEMO_BRANCH,
    createdAt: '2026-01-15T14:30:00.000Z',
  },
  {
    id: 'tutorial-patient-2',
    firstName: 'Carlos Andrés',
    lastName: 'Molina Torres',
    documentNumber: '0923456781',
    email: 'carlos.molina@hotmail.com',
    mobilePhone: '0991122334',
    homePhone: '042998877',
    address: 'Cdla. Kennedy Norte, Mz. 12 V. 3, Guayaquil',
    isActive: true,
    branch: DEMO_BRANCH,
    createdAt: '2026-02-03T10:15:00.000Z',
  },
  {
    id: 'tutorial-patient-3',
    firstName: 'Lucía Isabel',
    lastName: 'Paredes Vaca',
    documentNumber: '0104567892',
    email: 'lucia.paredes@outlook.com',
    mobilePhone: '0976543210',
    address: 'Calle Larga 7-52 y Borrero, Cuenca',
    isActive: false,
    branch: DEMO_BRANCH,
    createdAt: '2026-02-20T09:00:00.000Z',
  },
]

const DEMO_STATUS_CONFIRMED = {
  id: 'tutorial-status-confirmed',
  name: 'confirmed',
  description: 'Cita confirmada',
  color: '#22c55e',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const DEMO_STATUS_PENDING = {
  id: 'tutorial-status-pending',
  name: 'pending',
  description: 'Cita pendiente',
  color: '#f59e0b',
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const MOCK_SHIFTS: Shift[] = [
  {
    id: 'tutorial-shift-1',
    patientId: MOCK_PATIENTS[0].id,
    branchId: DEMO_BRANCH.id,
    statusId: DEMO_STATUS_CONFIRMED.id,
    appointmentDate: '2026-07-10T15:30:00.000Z',
    description: 'Control anual de la vista',
    name: 'Control anual',
    notes: '',
    createdAt: '2026-07-01T12:00:00.000Z',
    updatedAt: '2026-07-01T12:00:00.000Z',
    patient: MOCK_PATIENTS[0],
    status: DEMO_STATUS_CONFIRMED,
    branch: DEMO_BRANCH,
  },
  {
    id: 'tutorial-shift-2',
    patientId: MOCK_PATIENTS[1].id,
    branchId: DEMO_BRANCH.id,
    statusId: DEMO_STATUS_PENDING.id,
    appointmentDate: '2026-07-11T10:00:00.000Z',
    description: 'Primera consulta por visión borrosa',
    name: 'Primera consulta',
    notes: '',
    createdAt: '2026-07-02T09:30:00.000Z',
    updatedAt: '2026-07-02T09:30:00.000Z',
    patient: MOCK_PATIENTS[1],
    status: DEMO_STATUS_PENDING,
    branch: DEMO_BRANCH,
  },
]

function buildMockClinicalHistory(patient: Patient) {
  return {
    id: `tutorial-history-${patient.id}`,
    branchId: DEMO_BRANCH.id,
    patientId: patient.id,
    professionalName: 'Dra. Andrea Salazar',
    isSent: false,
    patient,
    createdAt: '2026-07-05T11:00:00.000Z',
    updatedAt: '2026-07-05T11:00:00.000Z',
  } as MedicalHistoryRecord['originalRecord']
}

export const MOCK_MEDICAL_HISTORY: MedicalHistoryRecord[] = [
  {
    id: 'tutorial-history-1',
    identification: MOCK_PATIENTS[0].documentNumber ?? '',
    firstName: MOCK_PATIENTS[0].firstName,
    lastName: MOCK_PATIENTS[0].lastName,
    phone: MOCK_PATIENTS[0].mobilePhone ?? '',
    lastExamDate: '2026-07-05',
    rightEyeAdd: '+1.00',
    leftEyeAdd: '+1.00',
    status: 'pendiente',
    originalRecord: buildMockClinicalHistory(MOCK_PATIENTS[0]),
  },
  {
    id: 'tutorial-history-2',
    identification: MOCK_PATIENTS[1].documentNumber ?? '',
    firstName: MOCK_PATIENTS[1].firstName,
    lastName: MOCK_PATIENTS[1].lastName,
    phone: MOCK_PATIENTS[1].mobilePhone ?? '',
    lastExamDate: '2026-06-28',
    rightEyeAdd: '+0.75',
    leftEyeAdd: '+0.75',
    status: 'enviado',
    originalRecord: buildMockClinicalHistory(MOCK_PATIENTS[1]),
  },
]

function mockOrderPatient(patient: Patient) {
  return {
    id: patient.id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    documentNumber: patient.documentNumber ?? '',
    email: patient.email ?? '',
    mobilePhone: patient.mobilePhone ?? '',
    homePhone: patient.homePhone ?? '',
  }
}

export const MOCK_LABORATORY_ORDERS: LaboratoryOrder[] = [
  {
    id: 'tutorial-order-1',
    orderNumber: 1024,
    branchId: DEMO_BRANCH.id,
    patientId: MOCK_PATIENTS[0].id,
    attendanceDate: '2026-07-05',
    deliveryDate: '2026-07-12',
    status: 'pending' as LaboratoryOrder['status'],
    isConfirmed: true,
    createdAt: '2026-07-05T11:30:00.000Z',
    updatedAt: '2026-07-05T11:30:00.000Z',
    patient: mockOrderPatient(MOCK_PATIENTS[0]),
    product: {
      id: 'tutorial-product-1',
      code: 'LEN-001',
      name: 'Lente monofocal antirreflejo',
      brand: 'Essilor',
    },
  },
  {
    id: 'tutorial-order-2',
    orderNumber: 1025,
    branchId: DEMO_BRANCH.id,
    patientId: MOCK_PATIENTS[1].id,
    attendanceDate: '2026-06-28',
    deliveryDate: '2026-07-06',
    status: 'sent' as LaboratoryOrder['status'],
    isConfirmed: true,
    createdAt: '2026-06-28T09:45:00.000Z',
    updatedAt: '2026-06-28T09:45:00.000Z',
    patient: mockOrderPatient(MOCK_PATIENTS[1]),
    product: {
      id: 'tutorial-product-2',
      code: 'LEN-002',
      name: 'Lente progresivo digital',
      brand: 'Zeiss',
    },
  },
]
