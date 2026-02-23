export interface LaboratoryOrder {
  id: string
  orderNumber: string
  patientId: string
  patientName: string
  patientEmail?: string
  patientPhone?: string
  doctorId: string
  doctorName: string
  branchId: string
  branchName: string
  orderDate: string
  scheduledDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  tests: LaboratoryTest[]
  totalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface LaboratoryTest {
  id: string
  name: string
  code: string
  category: string
  description?: string
  price: number
  preparationInstructions?: string
  estimatedDuration: number 
  requiresFasting: boolean
  results?: TestResult[]
}

export interface TestResult {
  id: string
  parameter: string
  value: string
  unit: string
  referenceRange: string
  status: 'normal' | 'abnormal' | 'critical'
  notes?: string
}

// Interfaces para Medical History
export interface MedicalHistory {
  id: string
  patientId: string
  patientName: string
  patientEmail?: string
  patientPhone?: string
  doctorId: string
  doctorName: string
  branchId: string
  branchName: string
  visitDate: string
  chiefComplaint: string
  presentIllness: string
  pastMedicalHistory?: string
  medications?: Medication[]
  allergies?: Allergy[]
  vitalSigns?: VitalSigns
  physicalExamination?: string
  diagnosis: string
  treatment: string
  followUpDate?: string
  notes?: string
  attachments?: MedicalAttachment[]
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
}

export interface Allergy {
  allergen: string
  reaction: string
  severity: 'mild' | 'moderate' | 'severe'
}

export interface VitalSigns {
  bloodPressure: string
  heartRate: number
  temperature: number
  respiratoryRate: number
  weight?: number
  height?: number
  bmi?: number
}

export interface MedicalAttachment {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  url: string
  description?: string
  uploadDate: string
}

export interface Diagnosis {
  id: string
  code: string // ICD-10 code
  description: string
  type: 'primary' | 'secondary' | 'differential'
  status: 'active' | 'resolved' | 'chronic' | 'under_investigation'
  diagnosedAt: string
  doctorId: string
  doctorName: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Treatment {
  id: string
  name: string
  description: string
  type: 'medication' | 'surgery' | 'therapy' | 'lifestyle' | 'procedure'
  status: 'active' | 'completed' | 'suspended' | 'cancelled'
  startDate: string
  endDate?: string
  dosage?: string
  frequency?: string
  instructions: string
  prescribedBy: string
  prescribedByName: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MedicalRecord {
  id: string
  date: string
  symptoms: string
  physicalExamination: string
  vitalSigns: VitalSigns
  notes: string
  doctorId: string
  doctorName: string
  createdAt: string
  updatedAt: string
}

// Interfaces para Shift Management
export interface ShiftSchedule {
  id: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  position: string
  branchId: string
  branchName: string
  shiftDate: string
  startTime: string
  endTime: string
  shiftType: 'morning' | 'afternoon' | 'night' | 'full-day'
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  breakTime?: number // minutes
  overtimeHours?: number
  notes?: string
  createdAt: string
  updatedAt: string
  isActive: boolean
}

export interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  position: string
  department: string
  branchId: string
  branchName: string
  hireDate: string
  salary?: number
  isActive: boolean
  shifts?: ShiftSchedule[]
}

export interface ShiftTemplate {
  id: string
  name: string
  description?: string
  startTime: string
  endTime: string
  shiftType: 'morning' | 'afternoon' | 'night' | 'full-day'
  breakTime: number
  daysOfWeek: number[] // 0=Sunday, 1=Monday, etc.
  branchId: string
  isActive: boolean
}

export interface ShiftAssignment {
  id: string
  shiftScheduleId: string
  employeeId: string
  employeeName: string
  employeeEmail: string
  position: string
  assignedAt: string
  assignedBy: string
  assignedByName: string
  status: 'assigned' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
  checkInTime?: string
  checkOutTime?: string
  actualHours?: number
  overtimeHours?: number
  notes?: string
  createdAt: string
  updatedAt: string
}
