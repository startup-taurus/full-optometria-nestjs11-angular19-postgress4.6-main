import { Injectable } from '@angular/core'
import { BehaviorSubject } from 'rxjs'

@Injectable({
  providedIn: 'root',
})
export class SelectionService {
  public selectedRoleId$ = new BehaviorSubject<string | null>(null)
  public selectedModuleId$ = new BehaviorSubject<string | null>(null)
  public hasModules$ = new BehaviorSubject<boolean>(false)

  setRoleId(roleId: string | null): void {
    this.selectedRoleId$.next(roleId)
    if (!roleId) {
      this.selectedModuleId$.next(null)
      this.hasModules$.next(false)
    }
  }

  setModuleId(moduleId: string | null): void {
    this.selectedModuleId$.next(moduleId)
  }

  setHasModules(hasModules: boolean): void {
    this.hasModules$.next(hasModules)
  }
}
