import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute, Router } from '@angular/router'
import { Subject, takeUntil } from 'rxjs'
import { TranslateModule } from '@ngx-translate/core'
import { TableLaboratoryOrdersComponent } from '../components/tables/table-laboratory-orders.component'

@Component({
  selector: 'pages-laboratory-orders',
  standalone: true,
  imports: [CommonModule, TranslateModule, TableLaboratoryOrdersComponent],
  templateUrl: './pages-laboratory-orders.component.html',
  styleUrl: './pages-laboratory-orders.component.scss',
})
export class PagesLaboratoryOrdersComponent implements OnInit, OnDestroy {
  public orderId: string | null = null

  private readonly destroy$ = new Subject<void>()
  private readonly _route = inject(ActivatedRoute)
  private readonly _router = inject(Router)

  ngOnInit(): void {
    this._route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (queryParamMap) => {
        this.orderId = queryParamMap.get('orderId')
      },
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next()
    this.destroy$.complete()
  }

  public clearLinkedFilter(): void {
    this._router.navigate([], {
      relativeTo: this._route,
      queryParams: {
        orderId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    })
  }
}
