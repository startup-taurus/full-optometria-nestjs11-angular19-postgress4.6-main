import { CommonModule } from '@angular/common'
import { Component, Input, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CompanyLogoService } from '@core/services/ui/company-logo.service'
import { Observable } from 'rxjs'

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <!-- Logo para Auth -->
    @if (isAuth) {
      <a routerLink="/auth/login" class="auth-brand mb-3">
        <img
          [src]="defaultLogo"
          alt="dark logo"
          height="42"
          class="logo-dark"
        />
        <img
          [src]="defaultLogo"
          alt="logo light"
          height="42"
          class="logo-light"
        />
      </a>
    }
    <!-- Logo para Dashboard -->
    @else {
      <a routerLink="/" class="logo">
        <span class="logo-light">
          <span class="logo-lg"
            ><img [src]="logoUrl$ | async" alt="logo"
          /></span>
          <span class="logo-sm"
            ><img [src]="logoUrl$ | async" alt="small logo"
          /></span>
        </span>
        <span class="logo-dark">
          <span class="logo-lg"
            ><img [src]="logoUrl$ | async" alt="dark logo"
          /></span>
          <span class="logo-sm"
            ><img [src]="logoUrl$ | async" alt="small logo"
          /></span>
        </span>
      </a>
    }
  `,
})
export class LogoComponent implements OnInit {
  @Input() isAuth: boolean = false
  
  public logoUrl$!: Observable<string>
  public defaultLogo: string

  constructor(private companyLogoService: CompanyLogoService) {
    this.defaultLogo = this.companyLogoService.getDefaultLogo()
  }

  ngOnInit(): void {
    this.logoUrl$ = this.companyLogoService.getCompanyLogoUrl$()
  }
}
