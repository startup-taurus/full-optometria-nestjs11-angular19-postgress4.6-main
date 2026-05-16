import { NgClass, NgFor, NgIf } from '@angular/common'
import { Component, Input, computed, signal } from '@angular/core'
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { TranslatePipe } from '@ngx-translate/core'

export type RowActionVariant =
  | 'primary'
  | 'secondary'
  | 'danger'
  | 'warning'
  | 'info'
  | 'success'
  | 'dark'

export interface RowActionItem {
  icon: string
  tooltip: string
  variant: RowActionVariant
  visible?: boolean
  disabled?: boolean
  onClick: () => void
}

@Component({
  selector: 'app-row-actions-menu',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    NgbDropdownModule,
    NgbTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './row-actions-menu.component.html',
  styleUrl: './row-actions-menu.component.scss',
})
export class RowActionsMenuComponent {
  private primarySignal = signal<RowActionItem[]>([])
  private secondarySignal = signal<RowActionItem[]>([])

  @Input()
  set primary(value: RowActionItem[] | null | undefined) {
    this.primarySignal.set(value ?? [])
  }

  @Input()
  set secondary(value: RowActionItem[] | null | undefined) {
    this.secondarySignal.set(value ?? [])
  }

  public visiblePrimary = computed(() =>
    this.primarySignal().filter((item) => item.visible !== false)
  )

  public visibleSecondary = computed(() =>
    this.secondarySignal().filter((item) => item.visible !== false)
  )

  public outlineClass(variant: RowActionVariant): string {
    return `btn-outline-${variant}`
  }

  public runAction(item: RowActionItem): void {
    if (item.disabled) return
    item.onClick()
  }
}
