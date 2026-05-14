import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  ElementRef,
  computed,
  signal,
  effect,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslateModule } from '@ngx-translate/core'

interface TemplateVariable {
  key: string
  labelKey: string
}

@Component({
  selector: 'app-message-template-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbTooltipModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './message-template-editor.component.html',
  styleUrl: './message-template-editor.component.scss',
})
export class MessageTemplateEditorComponent {
  @ViewChild('textarea') textareaRef?: ElementRef<HTMLTextAreaElement>

  @Input() set value(v: string) {
    this.draft.set(v ?? '')
  }
  @Input() defaultTemplate = 'NOTIFICATIONS.TEMPLATE.DEFAULT_MESSAGE'
  @Output() valueChange = new EventEmitter<string>()

  readonly draft = signal('')

  readonly variables: TemplateVariable[] = [
    { key: 'nombres', labelKey: 'NOTIFICATIONS.TEMPLATE.VAR_NOMBRES' },
    { key: 'apellidos', labelKey: 'NOTIFICATIONS.TEMPLATE.VAR_APELLIDOS' },
    { key: 'nombre', labelKey: 'NOTIFICATIONS.TEMPLATE.VAR_NOMBRE' },
    { key: 'cedula', labelKey: 'NOTIFICATIONS.TEMPLATE.VAR_CEDULA' },
    { key: 'telefono', labelKey: 'NOTIFICATIONS.TEMPLATE.VAR_TELEFONO' },
  ]

  readonly preview = computed(() => {
    const sample: Record<string, string> = {
      nombres: 'María',
      apellidos: 'Pérez',
      nombre: 'María Pérez',
      cedula: '0102030405',
      telefono: '+593 99 999 9999',
    }
    return this.draft().replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      return sample[key] ?? ''
    })
  })

  constructor() {
    effect(() => {
      this.valueChange.emit(this.draft())
    })
  }

  onChange(v: string): void {
    this.draft.set(v)
  }

  formatVariable(varName: string): string {
    return `{{${varName}}}`
  }

  insertVariable(varName: string): void {
    const textarea = this.textareaRef?.nativeElement
    const placeholder = `{{${varName}}}`
    if (!textarea) {
      this.draft.update((current) => `${current} ${placeholder}`.trim())
      return
    }
    const start = textarea.selectionStart ?? this.draft().length
    const end = textarea.selectionEnd ?? this.draft().length
    const current = this.draft()
    const next = current.substring(0, start) + placeholder + current.substring(end)
    this.draft.set(next)
    queueMicrotask(() => {
      textarea.focus()
      const cursor = start + placeholder.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }
}
