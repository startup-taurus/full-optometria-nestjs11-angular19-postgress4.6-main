import { Injectable, OnDestroy } from '@angular/core'
import { BehaviorSubject, Observable, of, Subject } from 'rxjs'
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  map,
  scan,
  takeUntil,
} from 'rxjs/operators'
import { ApiData } from '../../interfaces/api/api-response.interface'
import {
  DEFAULT_SEARCH_NG_SELECT_TERM_DELAY,
  NgSelect,
} from '@core/interfaces/ui/ui.interface'
import { DEFAULT_SEARCH_NG_SELECT_PAGINATION } from '@core/helpers/ui/ui.constants'

export type FetchDataInput<T> =
  | { type: 'fetch' }
  | { type: 'add'; data: NgSelect<T>[] }

@Injectable()
export class SearchNgSelectService<T> implements OnDestroy {
  private fetchDataTrigger = new Subject<FetchDataInput<T>>()
  private searchTermTrigger = new Subject<string>()

  private searchTermKey: string = ''
  private lengthToSearch: number = 3

  private initialFilter = {
    limit: DEFAULT_SEARCH_NG_SELECT_PAGINATION.LIMIT,
    page: DEFAULT_SEARCH_NG_SELECT_PAGINATION.PAGE,
  }

  private filterWithoutTerm: object = this.initialFilter
  private filterWithTerm: object = this.initialFilter
  private filterWithExtendedData: object = {}
  private filter: object = this.initialFilter

  private totalWithoutTerm: number = 0
  private totalWithTerm: number = 0

  private maxAllowedPageWithoutTerm: number = 0
  private maxAllowedPageWithTerm: number = 0

  private maxAllowedPage: number = 0

  private fetchDataFunction: (
    filter: object
  ) => Observable<ApiData<NgSelect<T>[]>> = () =>
    of({
      result: [],
      totalCount: 0,
      currentPage: 1,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
    })
  private data$ = new BehaviorSubject<NgSelect<T>[]>([])
  private unsubscribe$ = new Subject<boolean>()

  constructor() {
    this.getFetchDataTrigger().subscribe()
    this.getSearchTermTrigger().subscribe()
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(true)
    this.unsubscribe$.complete()
  }

  public triggerFetchData(): void {
    this.fetchDataTrigger.next({ type: 'fetch' })
  }

  public addDataToStream(data: NgSelect<T>[]): void {
    this.fetchDataTrigger.next({ type: 'add', data })
  }

  public setFetchDataFunction(
    fetchDataFunction: (filter: object) => Observable<ApiData<NgSelect<T>[]>>
  ): void {
    this.fetchDataFunction = fetchDataFunction
  }

  public setSearchTermKey(termKey: string): void {
    this.searchTermKey = termKey
  }

  public setLengthToSearch(length: number): void {
    this.lengthToSearch = length
  }

  public extendFilter(filter: object): void {
    this.filterWithExtendedData = filter
  }

  public getData(): Observable<NgSelect<T>[]> {
    return this.data$.asObservable()
  }

  public resetNgSelect(): void {
    this.fetchDataTrigger.complete()
    this.fetchDataTrigger = new Subject<FetchDataInput<T>>()

    this.searchTermTrigger.complete()
    this.searchTermTrigger = new Subject<string>()

    this.filterWithoutTerm = this.initialFilter
    this.filterWithTerm = this.initialFilter
    this.filterWithExtendedData = {}
    this.filter = this.initialFilter

    this.data$.next([])

    this.totalWithoutTerm = 0
    this.totalWithTerm = 0

    this.maxAllowedPageWithoutTerm = 0
    this.maxAllowedPageWithTerm = 0

    this.maxAllowedPage = 0

    this.getFetchDataTrigger().subscribe()
    this.getSearchTermTrigger().subscribe()
  }

  public searchTerm(term: string): void {
    const termLengthAvailable = term.length >= this.lengthToSearch

    if (termLengthAvailable) {
      this.filterWithTerm = {
        ...this.initialFilter,
        [this.searchTermKey]: term,
      }
      this.filter = { ...this.filterWithTerm }
      this.triggerFetchData()
    } else {
      this.filterWithTerm = this.initialFilter
      this.filter = { ...this.filterWithoutTerm }
    }
  }

  public scrollToEnd(): void {
    this.updateFilter()

    if (this.filter['page' as keyof object] <= this.maxAllowedPage) {
      this.triggerFetchData()
    }
  }

  private updateFilter(): void {
    const isSearching = this.filterWithTerm.hasOwnProperty(this.searchTermKey)

    if (isSearching) {
      this.maxAllowedPage = this.maxAllowedPageWithTerm

      this.filterWithTerm = {
        ...this.filterWithTerm,
        page: this.filterWithTerm['page' as keyof object] + 1,
      }
      this.filter = { ...this.filterWithTerm }
    } else {
      this.maxAllowedPage = this.maxAllowedPageWithoutTerm

      this.filterWithoutTerm = {
        ...this.filterWithoutTerm,
        page: this.filterWithoutTerm['page' as keyof object] + 1,
      }
      this.filter = { ...this.filterWithoutTerm }
    }
  }

  public getSearchTermTrigger(): Observable<void> {
    return this.searchTermTrigger.asObservable().pipe(
      takeUntil(this.unsubscribe$),
      debounceTime(DEFAULT_SEARCH_NG_SELECT_TERM_DELAY),
      distinctUntilChanged((prev, curr) => prev === curr),
      map((term) => this.handleSearchTerm(term))
    )
  }

  public getFetchDataTrigger(): Observable<void> {
    return this.fetchDataTrigger.asObservable().pipe(
      takeUntil(this.unsubscribe$),
      concatMap((input) => this.processFetchDataFunction(input)),
      scan(this.combineData, []),
      map((data) => this.data$.next(data))
    )
  }

  private processFetchDataFunction(
    input: FetchDataInput<T>
  ): Observable<NgSelect<T>[]> {
    let response: Observable<NgSelect<T>[]> = of([])

    if (input.type === 'fetch') {
      response = this.handleFetchDataFunction()
    }
    if (input.type === 'add') {
      response = of(input.data)
    }

    return response
  }

  private handleFetchDataFunction(): Observable<NgSelect<T>[]> {
    const filter = { ...this.filter, ...this.filterWithExtendedData }
    return this.fetchDataFunction(filter).pipe(
      map((response) => this.processFetchResponse(response)),
      catchError(() => of([]))
    )
  }

  private processFetchResponse(response: {
    result: NgSelect<T>[]
    totalCount: number
  }): NgSelect<T>[] {
    const isSearching = this.filter.hasOwnProperty(this.searchTermKey)

    if (isSearching) {
      this.totalWithTerm = response.totalCount
      this.maxAllowedPageWithTerm = Math.ceil(
        this.totalWithTerm / this.filter['limit' as keyof object]
      )
    } else {
      this.totalWithoutTerm = response.totalCount
      this.maxAllowedPageWithoutTerm = Math.ceil(
        this.totalWithoutTerm / this.filter['limit' as keyof object]
      )
    }

    return response.result
  }

  private combineData(acc: NgSelect<T>[], data: NgSelect<T>[]): NgSelect<T>[] {
    const dataMap = new Map(acc.map((item) => [item.value, item]))
    data.forEach((item) => dataMap.set(item.value, item))
    return Array.from(dataMap.values())
  }

  private handleSearchTerm(term: string): void {
    this.filterWithTerm = this.initialFilter
    this.filterWithTerm = {
      ...this.filterWithTerm,
      [this.searchTermKey]: term,
    }

    this.filter = { ...this.filterWithTerm }
    this.triggerFetchData()
  }
}
