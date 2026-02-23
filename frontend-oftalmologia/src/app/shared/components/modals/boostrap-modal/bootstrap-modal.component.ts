import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common'
import { CommonModule } from '@angular/common'
import { Component, Input, TemplateRef, Type } from '@angular/core'
import { BootstrapModalService } from '@core/services/ui/bootstrap-modal.service'
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap'
import { Subject, takeUntil } from 'rxjs'

@Component({
  selector: 'bootstrap-modal',
  standalone: true,
  imports: [NgTemplateOutlet, NgComponentOutlet, CommonModule],
  templateUrl: './bootstrap-modal.component.html',
})
export class BootstrapModalComponent {
  @Input()
  public component: Type<any> | null = null

  @Input()
  public template: TemplateRef<any> | null = null

  private unsubscribe$: Subject<boolean> = new Subject<boolean>()

  constructor(
    private _activeModal: NgbActiveModal,
    private _bsModalService: BootstrapModalService<null>
  ) {}

  ngOnInit(): void {
    this._bsModalService
      .getModalClosed()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((res) => this._activeModal.close())
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.complete()
  }
}
