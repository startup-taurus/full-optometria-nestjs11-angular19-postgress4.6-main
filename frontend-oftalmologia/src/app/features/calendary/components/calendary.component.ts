import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms'
import { Subject, takeUntil } from 'rxjs'
import { Store } from '@ngrx/store'
import { TranslateService, TranslateModule } from '@ngx-translate/core'
import { AppState } from '@core/states'
import { selectBranchFilterState } from '@core/states/branch/branch.selectors'
import { ShiftsService } from '@core/services/api/shifts.service'
import { Shift, QueryShiftDto } from '@core/interfaces/api/shift.interface'
import { BranchFilterState } from '@core/services/api/branch.service'
import { ToastrNotificationService } from '@core/services/ui/notification.service'
import {
  localDateTimeToIso,
  toDateTimeLocalValue,
} from '@core/helpers/date-time/appointment-date-time.helper'

interface CalendarShift extends Shift {
  displayDate: Date
}

@Component({
  selector: 'app-calendary',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './calendary.component.html',
  styleUrls: ['./calendary.component.scss'],
})
export class CalendaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>()
  private store = inject(Store<AppState>)
  private shiftsService = inject(ShiftsService)
  private fb = inject(FormBuilder)
  private translate = inject(TranslateService)
  private notificationService = inject(ToastrNotificationService)

  currentDate = signal(new Date())
  selectedDate = signal(new Date())
  shifts = signal<CalendarShift[]>([])
  isLoading = signal(false)
  filterState: BranchFilterState | null = null
  private isInitialLoad = true

  showDetailModal = signal(false)
  showDayShiftsModal = signal(false)
  selectedShift = signal<CalendarShift | null>(null)
  selectedDayForList = signal<Date | null>(null)

  updateShiftForm: FormGroup

  currentMonth = computed(() => this.currentDate().getMonth())
  currentYear = computed(() => this.currentDate().getFullYear())

  monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]

  dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB']

  constructor() {
    this.updateShiftForm = this.fb.group({
      appointmentDate: ['', Validators.required],
      description: [''],
    })
  }

  ngOnInit() {
    this.selectedDate.set(new Date())
    this.initializeBranchFilter()
    this.loadShifts()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  private initializeBranchFilter(): void {
    this.store
      .select(selectBranchFilterState)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state: BranchFilterState) => {
          this.filterState = state
          if (!this.isInitialLoad) {
            this.loadShifts()
          }
          this.isInitialLoad = false
        },
      })
  }

  private loadShifts(): void {
    const currentMonth = this.currentMonth()
    const currentYear = this.currentYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)

    const filter: QueryShiftDto = {
      dateFrom: firstDay.toISOString(),
      dateTo: lastDay.toISOString(),
      limit: 1000,
    }

    if (this.filterState?.selectedBranchId) {
      filter.branchId = this.filterState.selectedBranchId
    }

    this.isLoading.set(true)
    this.shiftsService
      .findShifts(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const shiftsWithDate = response.data.result.map((shift) => ({
            ...shift,
            displayDate: new Date(shift.appointmentDate),
          }))
          this.shifts.set(shiftsWithDate)
          this.isLoading.set(false)
        },
        error: () => {
          this.shifts.set([])
          this.isLoading.set(false)
        },
      })
  }

  previousMonth() {
    const current = this.currentDate()
    this.currentDate.set(
      new Date(current.getFullYear(), current.getMonth() - 1, 1)
    )
    this.loadShifts()
  }

  nextMonth() {
    const current = this.currentDate()
    this.currentDate.set(
      new Date(current.getFullYear(), current.getMonth() + 1, 1)
    )
    this.loadShifts()
  }

  goToToday() {
    const today = new Date()
    this.currentDate.set(today)
    this.selectedDate.set(today)
    this.loadShifts()
  }

  getCalendarDays(): (Date | null)[] {
    const year = this.currentYear()
    const month = this.currentMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startingDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: (Date | null)[] = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  getCalendarWeeks(): (Date | null)[][] {
    const days = this.getCalendarDays()
    const weeks: (Date | null)[][] = []

    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    while (weeks.length < 6) {
      weeks.push([null, null, null, null, null, null, null])
    }

    return weeks
  }

  getShiftsForDay(date: Date | null): CalendarShift[] {
    if (!date) return []

    return this.shifts().filter((shift) =>
      this.isSameDay(shift.displayDate, date)
    )
  }

  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    )
  }

  isToday(date: Date | null): boolean {
    if (!date) return false
    return this.isSameDay(date, new Date())
  }

  isSelectedDay(date: Date | null): boolean {
    if (!date) return false
    return this.isSameDay(date, this.selectedDate())
  }

  selectDay(date: Date | null) {
    if (date) {
      this.selectedDate.set(date)
    }
  }

  openDetailModal(shift: CalendarShift) {
    this.selectedShift.set(shift)
    const appointmentDate = new Date(shift.appointmentDate)
    this.updateShiftForm.patchValue({
      appointmentDate: this.formatDateTimeForInput(appointmentDate),
      description: shift.description || '',
    })
    this.showDetailModal.set(true)
  }

  openDayShiftsModal(day: Date, event: Event) {
    event.stopPropagation()
    this.selectedDate.set(day)
    this.selectedDayForList.set(day)
    this.showDayShiftsModal.set(true)
  }

  closeDayShiftsModal() {
    this.showDayShiftsModal.set(false)
    this.selectedDayForList.set(null)
  }

  getSelectedDayShifts(): CalendarShift[] {
    return this.getShiftsForDay(this.selectedDayForList())
  }

  openShiftFromDayList(shift: CalendarShift): void {
    this.closeDayShiftsModal()
    this.openDetailModal(shift)
  }

  closeDetailModal() {
    this.showDetailModal.set(false)
    this.selectedShift.set(null)
    setTimeout(() => {
      document.body.style.overflow = 'auto'
    }, 300)
  }

  updateShift() {
    if (this.updateShiftForm.valid && this.selectedShift()) {
      const formValue = this.updateShiftForm.value
      const shiftId = this.selectedShift()!.id

      const updateData = {
        appointmentDate: localDateTimeToIso(formValue.appointmentDate),
        description: formValue.description,
      }

      this.shiftsService
        .updateShift(shiftId, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.closeDetailModal()
            this.loadShifts()
          },
          error: () => {
            this.closeDetailModal()
          },
        })
    }
  }

  copyToClipboard(
    text: string,
    fieldType: 'name' | 'document' | 'phone' | 'email'
  ): void {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.showCopySuccess(fieldType)
        })
        .catch((error) => {
          this.copyToClipboardFallback(text, fieldType)
        })
    } else {
      this.copyToClipboardFallback(text, fieldType)
    }
  }

  private copyToClipboardFallback(
    text: string,
    fieldType: 'name' | 'document' | 'phone' | 'email'
  ): void {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)

    try {
      textArea.focus()
      textArea.select()

      const successful = document.execCommand('copy')

      if (successful) {
        this.showCopySuccess(fieldType)
      } else {
        this.showCopyError()
      }
    } catch (error) {
      this.showCopyError()
    } finally {
      document.body.removeChild(textArea)
    }
  }

  private showCopySuccess(
    fieldType: 'name' | 'document' | 'phone' | 'email'
  ): void {
    const translationKey = `SHIFT_MANAGEMENT_MODULE.COPY.${fieldType.toUpperCase()}`

    this.translate
      .get([translationKey, 'SHIFT_MANAGEMENT_MODULE.TITLE'])
      .subscribe({
        next: (translations) => {
          const message = translations[translationKey]
          const title = translations['SHIFT_MANAGEMENT_MODULE.TITLE']

          this.notificationService.showNotification({
            title: title,
            message: {
              es: message,
              en: message,
            },
            type: 'success',
          })
        },
        error: (error) => {
          this.showCopyErrorWithFallback()
        },
      })
  }

  private showCopyError(): void {
    this.notificationService.showNotification({
      title: 'Error',
      message: {
        es: 'Error al copiar al portapapeles',
        en: 'Error copying to clipboard',
      },
      type: 'error',
    })
  }

  private showCopyErrorWithFallback(): void {
    this.notificationService.showNotification({
      title: 'Gestión de turnos',
      message: {
        es: 'Copiado al portapapeles',
        en: 'Copied to clipboard',
      },
      type: 'success',
    })
  }

  formatDateTimeForInput(date: Date): string {
    return toDateTimeLocalValue(date)
  }

  formatDate(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  formatTime(date: Date | string): string {
    const d = new Date(date)
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  formatShiftTooltip(shift: CalendarShift): string {
    return (
      `${shift.patient.firstName} ${shift.patient.lastName}` +
      ` - ${this.formatTime(shift.appointmentDate)}\n` +
      `${shift.status.name} | ${shift.branch.name}`
    )
  }

  trackByShiftId(index: number, shift: CalendarShift): string {
    return shift.id || index.toString()
  }
}
