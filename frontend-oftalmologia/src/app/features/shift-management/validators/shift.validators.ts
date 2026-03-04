import { AbstractControl, ValidationErrors } from '@angular/forms'
import {
  BranchOpeningScheduleDay,
  isDateTimeWithinBranchSchedule,
} from '../../../core/helpers/branch-schedule.helper'

export class ShiftValidators {
  static futureDateValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    if (!control.value) {
      return null
    }

    const selectedDate = new Date(control.value)
    const now = new Date()

    const selectedDateOnly = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    )
    const nowDateOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )

    if (selectedDateOnly < nowDateOnly) {
      return { futureDate: true }
    }

    return null
  }

  static appointmentTimeValidator(schedule: BranchOpeningScheduleDay[]) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null
      }

      const selectedDate = new Date(control.value)
      const isWithinSchedule = isDateTimeWithinBranchSchedule(
        schedule,
        selectedDate
      )

      return isWithinSchedule ? null : { invalidTime: true }
    }
  }

  static maxDescriptionLength(maxLength: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null
      }

      if (control.value.length > maxLength) {
        return {
          maxlength: {
            actualLength: control.value.length,
            requiredLength: maxLength,
          },
        }
      }

      return null
    }
  }
}
