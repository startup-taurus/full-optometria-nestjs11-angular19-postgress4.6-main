import { CommonModule } from '@angular/common'
import { Component, Input, TemplateRef, Type } from '@angular/core'
import {
  NgbAccordionDirective,
  NgbAccordionToggle,
  NgbModule,
} from '@ng-bootstrap/ng-bootstrap'
import { TranslatePipe } from '@ngx-translate/core'

@Component({
  selector: 'toogle-panel',
  standalone: true,
  imports: [CommonModule, NgbModule, TranslatePipe],
  templateUrl: './toogle-panel.component.html',
})
export class TooglePanelComponent {
  @Input()
  public isCollapsed: boolean = true

  @Input()
  public title: string = 'WORDS.FILTER'

  @Input()
  public headerTemplate: TemplateRef<HTMLElement> | null = null

  @Input()
  public contentTemplate: TemplateRef<HTMLElement> | null = null

  @Input()
  public contentComponent: Type<any | null> | null = null

  public collapseAccordion(accordion: NgbAccordionDirective): void {
    accordion.toggle('first')
    this.isCollapsed = !this.isCollapsed
  }
}
