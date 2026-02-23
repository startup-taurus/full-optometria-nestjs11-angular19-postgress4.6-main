import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Subcategory } from '@core/interfaces/api/inventory.interface'
import { BranchAwareService } from './branch-aware.service'
import { BranchService } from './branch.service'

@Injectable({
  providedIn: 'root',
})
export class SubcategoryService extends BranchAwareService<Subcategory> {
  constructor(
    protected override http: HttpClient,
    protected override branchService: BranchService
  ) {
    super(http, branchService, 'subcategories')
  }
}
