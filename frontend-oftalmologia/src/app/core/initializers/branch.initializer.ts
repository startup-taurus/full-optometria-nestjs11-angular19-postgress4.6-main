import { BranchService } from '@core/services/api/branch.service'

export function branchInitializerFactory(branchService: BranchService) {
  return () => {
    return branchService.initialize().toPromise()
  }
}
