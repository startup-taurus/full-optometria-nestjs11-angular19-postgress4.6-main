import { Component } from '@angular/core'
import { credits } from '@core/helpers/ui/constants'

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styles: ``,
})
export class FooterComponent {
  credits = credits
}
