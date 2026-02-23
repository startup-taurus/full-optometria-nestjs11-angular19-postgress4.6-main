import { Injectable } from '@angular/core'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { Store } from '@ngrx/store'
import { AppState } from '@core/states'
import { selectUser } from '@core/states/auth/auth.selectors'
import { environment } from '@environment/environment'

@Injectable({
  providedIn: 'root',
})
export class CompanyLogoService {
  private readonly DEFAULT_LOGO = '/assets/images/ZGames.png'
  private readonly NO_LOGO_TEXT = 'Sin Logo'
  private readonly CACHE_KEY = 'currentCompanyLogoUrl'

  constructor(private store: Store<AppState>) {}

  public getCompanyLogoUrl$(): Observable<string> {
    return this.store.select(selectUser).pipe(
      map((user) => {
        if (user?.company?.logoFile?.path) {
          return `${environment.fileBaseUrl}/${user.company.logoFile.path}`
        }
        return this.DEFAULT_LOGO
      })
    )
  }

  public hasCompanyLogo$(): Observable<boolean> {
    return this.store.select(selectUser).pipe(
      map((user) => {
        return !!user?.company?.logoFile?.path
      })
    )
  }

  public getDefaultLogo(): string {
    return this.DEFAULT_LOGO
  }

  public cacheLogoUrl(logoUrl: string | null): void {
    try {
      if (logoUrl) {
        localStorage.setItem(this.CACHE_KEY, logoUrl)
      } else {
        localStorage.removeItem(this.CACHE_KEY)
      }
    } catch (error) {}
  }

  public getCachedLogoUrl(): string | null {
    try {
      return localStorage.getItem(this.CACHE_KEY)
    } catch (error) {
      return null
    }
  }

  public getNoLogoText(): string {
    return this.NO_LOGO_TEXT
  }

  public async convertLogoToBase64(logoUrl: string): Promise<string> {
    try {
      const response = await fetch(logoUrl)
      const blob = await response.blob()
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      return ''
    }
  }
}
