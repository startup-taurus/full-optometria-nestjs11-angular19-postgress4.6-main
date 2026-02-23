import { Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { environment } from '../../../../environments/environment'
import {
  Role,
  Module,
  Permission,
  RolePermission,
  RoleModule,
} from '@core/interfaces/ui/permissions.interface'

@Injectable({
  providedIn: 'root',
})
export class RoleManagementService {
  private readonly _apiUrl = `${environment.apiBaseUrl}`

  constructor(private _http: HttpClient) {}

  getRoles(): Observable<any> {
    return this._http.get(`${this._apiUrl}/roles/get-all`)
  }

  createRole(role: { roleName: string; description: string }): Observable<any> {
    return this._http.post(`${this._apiUrl}/roles/create`, role)
  }

  updateRole(id: string, role: Partial<Role>): Observable<any> {
    return this._http.patch(`${this._apiUrl}/roles/update/${id}`, role)
  }

  deleteRole(id: string): Observable<any> {
    return this._http.delete(`${this._apiUrl}/roles/delete/${id}`)
  }

  getModules(): Observable<any> {
    return this._http.get(`${this._apiUrl}/module/get-all`)
  }

  createModule(module: {
    moduleName: string
    description: string
  }): Observable<any> {
    return this._http.post(`${this._apiUrl}/module/create`, module)
  }

  updateModule(id: string, module: Partial<Module>): Observable<any> {
    return this._http.patch(`${this._apiUrl}/module/update/${id}`, module)
  }

  deleteModule(id: string): Observable<any> {
    return this._http.delete(`${this._apiUrl}/module/delete/${id}`)
  }

  getPermissions(): Observable<any> {
    return this._http.get(`${this._apiUrl}/permission/get-all`)
  }

  createPermission(permission: {
    permissionName: string
    description: string
    moduleId: string
  }): Observable<any> {
    return this._http.post(`${this._apiUrl}/permission/create`, permission)
  }

  updatePermission(
    id: string,
    permission: Partial<Permission>
  ): Observable<any> {
    return this._http.patch(
      `${this._apiUrl}/permission/update/${id}`,
      permission
    )
  }

  deletePermission(id: string): Observable<any> {
    return this._http.delete(`${this._apiUrl}/permission/delete/${id}`)
  }

  getRolePermissions(roleId?: string): Observable<any> {
    const url = roleId
      ? `${this._apiUrl}/role-permissions/role/${roleId}`
      : `${this._apiUrl}/role-permissions/all`
    return this._http.get(url)
  }

  assignPermissionToRole(
    roleId: string,
    permissionId: string
  ): Observable<any> {
    return this._http.post(`${this._apiUrl}/role-permissions/assign`, {
      roleId,
      permissionId,
      isEnabled: true,
    })
  }

  removePermissionFromRole(
    roleId: string,
    permissionId: string
  ): Observable<any> {
    return this._http.delete(
      `${this._apiUrl}/role-permissions/remove/${roleId}/${permissionId}`
    )
  }

  getRoleModules(roleId?: string): Observable<any> {
    const url = roleId
      ? `${this._apiUrl}/role-modules/role/${roleId}`
      : `${this._apiUrl}/role-modules/all`
    return this._http.get(url)
  }

  assignModuleToRole(roleId: string, moduleId: string): Observable<any> {
    return this._http.post(`${this._apiUrl}/role-modules/assign`, {
      roleId,
      moduleId,
      isEnabled: true,
    })
  }

  removeModuleFromRole(roleId: string, moduleId: string): Observable<any> {
    return this._http.delete(
      `${this._apiUrl}/role-modules/remove/${roleId}/${moduleId}`
    )
  }

  getUsers(): Observable<any> {
    return this._http.get(`${this._apiUrl}/user/get-all`)
  }

  createUser(user: any): Observable<any> {
    return this._http.post(`${this._apiUrl}/user/create`, user)
  }

  updateUser(id: string, user: any): Observable<any> {
    return this._http.patch(`${this._apiUrl}/user/update/${id}`, user)
  }

  deleteUser(id: string): Observable<any> {
    return this._http.delete(`${this._apiUrl}/user/delete/${id}`)
  }
}
