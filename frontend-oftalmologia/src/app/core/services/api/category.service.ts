import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Category } from '@core/interfaces/api/inventory.interface'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends BranchAwareService<Category> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'categories')
  }
}
