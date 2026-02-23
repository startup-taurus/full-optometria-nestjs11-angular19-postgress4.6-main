import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminBranchSessionService {

  private adminBranchSelection = new Map<string, string>();

  setAdminBranchSelection(userId: string, branchId: string): void {
    this.adminBranchSelection.set(userId, branchId);
  }

  getAdminBranchSelection(userId: string): string | undefined {
    return this.adminBranchSelection.get(userId);
  }

  clearAdminBranchSelection(userId: string): void {
    this.adminBranchSelection.delete(userId);
  }

  // Limpiar todas las selecciones (útil para mantenimiento)
  clearAllSelections(): void {
    this.adminBranchSelection.clear();
  }
}