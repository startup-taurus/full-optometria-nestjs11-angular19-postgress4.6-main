import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { TableMedicalHistoryComponent } from '../components/tables/table-medical-history.component'
import { FieldVisibilityService } from '@core/services/ui/field-visibility.service'

@Component({
  selector: 'pages-medical-history',
  standalone: true,
  imports: [CommonModule, TableMedicalHistoryComponent],
  templateUrl: './pages-medical-history.component.html',
  styleUrl: './pages-medical-history.component.scss',
})
export class PagesMedicalHistoryComponent implements OnInit, OnDestroy {
  public patientId: string | null = null

  private readonly destroy$ = new Subject<void>()
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)
  private readonly _fieldVisibilityService = inject(FieldVisibilityService)

  ngOnInit(): void {
    this._route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (queryParamMap) => {
        this.patientId = queryParamMap.get('patientId')
      },
    })

    this._fieldVisibilityService
      .getFieldsConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe()
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  public clearPatientFilter(): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        patientId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }
}
