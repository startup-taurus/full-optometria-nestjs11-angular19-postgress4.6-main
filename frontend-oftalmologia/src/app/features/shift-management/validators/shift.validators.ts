import { AbstractControl, ValidationErrors } from '@angular/forms'

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

  static appointmentTimeValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    if (!control.value) {
      return null
    }

    const selectedDate = new Date(control.value)
    const hours = selectedDate.getHours()
    const minutes = selectedDate.getMinutes()

    if (hours < 8 || hours >= 18) {
      return { invalidTime: true }
    }

    return null
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
