import { Component, signal, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { ToastrNotificationService } from '@core/services/ui/notification.service'

@Component({
  selector: 'app-default-zgames',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './default-zgames.component.html',
  styleUrls: ['./default-zgames.component.scss'],
})
export class DefaultZgamesComponent {
  phoneNumber = '0995923599'
  email = 'info@latamsoft.com'
  copiedPhone = signal(false)
  copiedEmail = signal(false)
  private notificationService = inject(ToastrNotificationService)

  copyToClipboard(text: string, type: 'phone' | 'email'): void {
    const fallbackCopy = () => {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        document.execCommand('copy')
        this.onCopied(type)
      } finally {
        document.body.removeChild(textarea)
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => this.onCopied(type))
        .catch(() => fallbackCopy())
    } else {
      fallbackCopy()
    }
  }

  private onCopied(type: 'phone' | 'email') {
    if (type === 'phone') {
      this.copiedPhone.set(true)
      setTimeout(() => this.copiedPhone.set(false), 2000)
      this.notificationService.showNotification({
        type: 'success',
        message: 'Número copiado al portapapeles',
      })
    }
  }

  openWhatsApp(): void {
    const message = encodeURIComponent(
      '¡Hola LatamSoft! Me gustaría saber más sobre sus servicios de desarrollo de software. Vengo del sistema de Oftalmología'
    )
    window.open(
      `https://wa.me/593${this.phoneNumber.slice(1)}?text=${message}`,
      '_blank'
    )
  }

  openEmail(): void {
    const subject = 'Solicitud de información - LatamSoft'
    const body =
      '¡Hola LatamSoft! Me gustaría saber más sobre sus servicios de desarrollo de software. Vengo del sistema de Oftalmología.'
    const mailto = `mailto:${this.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
  }
}
