import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedBasePermissions1692123456790 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear roles base
    await queryRunner.query(`
      INSERT INTO "roles" ("id", "role_name", "description", "is_active") VALUES 
      ('${this.generateUUID()}', 'SUPER_ADMIN', 'Super Administrador con todos los permisos', true),
      ('${this.generateUUID()}', 'ADMIN', 'Administrador del sistema', true),
      ('${this.generateUUID()}', 'DOCTOR', 'Médico oftalmólogo', true),
      ('${this.generateUUID()}', 'NURSE', 'Enfermera', true),
      ('${this.generateUUID()}', 'RECEPTIONIST', 'Recepcionista', true),
      ('${this.generateUUID()}', 'USER', 'Usuario básico', true)
    `);

    // 2. Crear módulos base
    const userModuleId = this.generateUUID();
    const roleModuleId = this.generateUUID();
    const moduleModuleId = this.generateUUID();
    const permissionModuleId = this.generateUUID();
    const dashboardModuleId = this.generateUUID();
    const patientsModuleId = this.generateUUID();
    const appointmentsModuleId = this.generateUUID();
    const reportsModuleId = this.generateUUID();

    await queryRunner.query(`
      INSERT INTO "modules" ("id", "module_name", "description", "is_active") VALUES 
      ('${userModuleId}', 'USERS', 'Gestión de usuarios', true),
      ('${roleModuleId}', 'ROLES', 'Gestión de roles', true),
      ('${moduleModuleId}', 'MODULES', 'Gestión de módulos', true),
      ('${permissionModuleId}', 'PERMISSIONS', 'Gestión de permisos', true),
      ('${dashboardModuleId}', 'DASHBOARD', 'Panel principal', true),
      ('${patientsModuleId}', 'PATIENTS', 'Gestión de pacientes', true),
      ('${appointmentsModuleId}', 'APPOINTMENTS', 'Gestión de citas', true),
      ('${reportsModuleId}', 'REPORTS', 'Reportes y estadísticas', true)
    `);

    // 3. Crear permisos base
    await queryRunner.query(`
      INSERT INTO "permissions" ("id", "permission_name", "description", "module_id", "is_active") VALUES 
      -- Permisos para USERS
      ('${this.generateUUID()}', 'CREATE_USER', 'Crear usuarios', '${userModuleId}', true),
      ('${this.generateUUID()}', 'READ_USER', 'Ver usuarios', '${userModuleId}', true),
      ('${this.generateUUID()}', 'UPDATE_USER', 'Editar usuarios', '${userModuleId}', true),
      ('${this.generateUUID()}', 'DELETE_USER', 'Eliminar usuarios', '${userModuleId}', true),
      
      -- Permisos para ROLES
      ('${this.generateUUID()}', 'CREATE_ROLE', 'Crear roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'READ_ROLE', 'Ver roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'UPDATE_ROLE', 'Editar roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'DELETE_ROLE', 'Eliminar roles', '${roleModuleId}', true),
      
      -- Permisos para MODULES
      ('${this.generateUUID()}', 'CREATE_MODULE', 'Crear módulos', '${moduleModuleId}', true),
      ('${this.generateUUID()}', 'READ_MODULE', 'Ver módulos', '${moduleModuleId}', true),
      ('${this.generateUUID()}', 'UPDATE_MODULE', 'Editar módulos', '${moduleModuleId}', true),
      ('${this.generateUUID()}', 'DELETE_MODULE', 'Eliminar módulos', '${moduleModuleId}', true),
      
      -- Permisos para PERMISSIONS
      ('${this.generateUUID()}', 'CREATE_PERMISSION', 'Crear permisos', '${permissionModuleId}', true),
      ('${this.generateUUID()}', 'READ_PERMISSION', 'Ver permisos', '${permissionModuleId}', true),
      ('${this.generateUUID()}', 'UPDATE_PERMISSION', 'Editar permisos', '${permissionModuleId}', true),
      ('${this.generateUUID()}', 'DELETE_PERMISSION', 'Eliminar permisos', '${permissionModuleId}', true),
      
      -- Permisos especiales para asignaciones
      ('${this.generateUUID()}', 'ASSIGN_ROLE_PERMISSION', 'Asignar permisos a roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'REMOVE_ROLE_PERMISSION', 'Remover permisos de roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'READ_ROLE_PERMISSION', 'Ver permisos de roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'ASSIGN_ROLE_MODULE', 'Asignar módulos a roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'REMOVE_ROLE_MODULE', 'Remover módulos de roles', '${roleModuleId}', true),
      ('${this.generateUUID()}', 'READ_ROLE_MODULE', 'Ver módulos de roles', '${roleModuleId}', true),
      
      -- Permisos para DASHBOARD
      ('${this.generateUUID()}', 'VIEW_DASHBOARD', 'Ver dashboard', '${dashboardModuleId}', true),
      
      -- Permisos para PATIENTS
      ('${this.generateUUID()}', 'CREATE_PATIENT', 'Crear pacientes', '${patientsModuleId}', true),
      ('${this.generateUUID()}', 'READ_PATIENT', 'Ver pacientes', '${patientsModuleId}', true),
      ('${this.generateUUID()}', 'UPDATE_PATIENT', 'Editar pacientes', '${patientsModuleId}', true),
      ('${this.generateUUID()}', 'DELETE_PATIENT', 'Eliminar pacientes', '${patientsModuleId}', true),
      
      -- Permisos para APPOINTMENTS
      ('${this.generateUUID()}', 'CREATE_APPOINTMENT', 'Crear citas', '${appointmentsModuleId}', true),
      ('${this.generateUUID()}', 'READ_APPOINTMENT', 'Ver citas', '${appointmentsModuleId}', true),
      ('${this.generateUUID()}', 'UPDATE_APPOINTMENT', 'Editar citas', '${appointmentsModuleId}', true),
      ('${this.generateUUID()}', 'DELETE_APPOINTMENT', 'Eliminar citas', '${appointmentsModuleId}', true),
      
      -- Permisos para REPORTS
      ('${this.generateUUID()}', 'VIEW_REPORTS', 'Ver reportes', '${reportsModuleId}', true),
      ('${this.generateUUID()}', 'EXPORT_REPORTS', 'Exportar reportes', '${reportsModuleId}', true)
    `);

    // 4. Asignar todos los permisos al SUPER_ADMIN
    const superAdminRoleQuery = await queryRunner.query(
      `SELECT id FROM "roles" WHERE "role_name" = 'SUPER_ADMIN'`
    );
    const superAdminRoleId = superAdminRoleQuery[0].id;

    const allPermissionsQuery = await queryRunner.query(
      `SELECT id FROM "permissions" WHERE "is_active" = true`
    );

    for (const permission of allPermissionsQuery) {
      await queryRunner.query(`
        INSERT INTO "role_permissions" ("role_id", "permission_id", "is_enabled") 
        VALUES ('${superAdminRoleId}', '${permission.id}', true)
      `);
    }

    // 5. Asignar todos los módulos al SUPER_ADMIN
    const allModulesQuery = await queryRunner.query(
      `SELECT id FROM "modules" WHERE "is_active" = true`
    );

    for (const module of allModulesQuery) {
      await queryRunner.query(`
        INSERT INTO "role_modules" ("role_id", "module_id", "is_enabled") 
        VALUES ('${superAdminRoleId}', '${module.id}', true)
      `);
    }

    // 6. Configurar permisos básicos para otros roles
    await this.assignPermissionsToRole(queryRunner, 'ADMIN', [
      'CREATE_USER',
      'READ_USER',
      'UPDATE_USER',
      'DELETE_USER',
      'READ_ROLE',
      'CREATE_PATIENT',
      'READ_PATIENT',
      'UPDATE_PATIENT',
      'DELETE_PATIENT',
      'CREATE_APPOINTMENT',
      'READ_APPOINTMENT',
      'UPDATE_APPOINTMENT',
      'DELETE_APPOINTMENT',
      'VIEW_DASHBOARD',
      'VIEW_REPORTS',
    ]);

    await this.assignPermissionsToRole(queryRunner, 'DOCTOR', [
      'READ_USER',
      'READ_PATIENT',
      'UPDATE_PATIENT',
      'CREATE_PATIENT',
      'CREATE_APPOINTMENT',
      'READ_APPOINTMENT',
      'UPDATE_APPOINTMENT',
      'VIEW_DASHBOARD',
      'VIEW_REPORTS',
    ]);

    await this.assignPermissionsToRole(queryRunner, 'NURSE', [
      'READ_PATIENT',
      'UPDATE_PATIENT',
      'READ_APPOINTMENT',
      'UPDATE_APPOINTMENT',
      'VIEW_DASHBOARD',
    ]);

    await this.assignPermissionsToRole(queryRunner, 'RECEPTIONIST', [
      'READ_PATIENT',
      'CREATE_PATIENT',
      'UPDATE_PATIENT',
      'CREATE_APPOINTMENT',
      'READ_APPOINTMENT',
      'UPDATE_APPOINTMENT',
      'VIEW_DASHBOARD',
    ]);

    await this.assignPermissionsToRole(queryRunner, 'USER', ['VIEW_DASHBOARD']);

    // 7. Asignar módulos a roles
    await this.assignModulesToRole(queryRunner, 'ADMIN', [
      'USERS',
      'DASHBOARD',
      'PATIENTS',
      'APPOINTMENTS',
      'REPORTS',
    ]);

    await this.assignModulesToRole(queryRunner, 'DOCTOR', [
      'DASHBOARD',
      'PATIENTS',
      'APPOINTMENTS',
      'REPORTS',
    ]);

    await this.assignModulesToRole(queryRunner, 'NURSE', [
      'DASHBOARD',
      'PATIENTS',
      'APPOINTMENTS',
    ]);

    await this.assignModulesToRole(queryRunner, 'RECEPTIONIST', [
      'DASHBOARD',
      'PATIENTS',
      'APPOINTMENTS',
    ]);

    await this.assignModulesToRole(queryRunner, 'USER', ['DASHBOARD']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "role_modules"`);
    await queryRunner.query(`DELETE FROM "role_permissions"`);
    await queryRunner.query(`DELETE FROM "permissions"`);
    await queryRunner.query(`DELETE FROM "modules"`);
    await queryRunner.query(
      `DELETE FROM "roles" WHERE "role_name" IN ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'USER')`
    );
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  private async assignPermissionsToRole(
    queryRunner: QueryRunner,
    roleName: string,
    permissionNames: string[]
  ): Promise<void> {
    const roleQuery = await queryRunner.query(
      `SELECT id FROM "roles" WHERE "role_name" = '${roleName}'`
    );
    const roleId = roleQuery[0].id;

    for (const permissionName of permissionNames) {
      const permissionQuery = await queryRunner.query(
        `SELECT id FROM "permissions" WHERE "permission_name" = '${permissionName}'`
      );

      if (permissionQuery.length > 0) {
        const permissionId = permissionQuery[0].id;
        await queryRunner.query(`
          INSERT INTO "role_permissions" ("role_id", "permission_id", "is_enabled") 
          VALUES ('${roleId}', '${permissionId}', true)
        `);
      }
    }
  }

  private async assignModulesToRole(
    queryRunner: QueryRunner,
    roleName: string,
    moduleNames: string[]
  ): Promise<void> {
    const roleQuery = await queryRunner.query(
      `SELECT id FROM "roles" WHERE "role_name" = '${roleName}'`
    );
    const roleId = roleQuery[0].id;

    for (const moduleName of moduleNames) {
      const moduleQuery = await queryRunner.query(
        `SELECT id FROM "modules" WHERE "module_name" = '${moduleName}'`
      );

      if (moduleQuery.length > 0) {
        const moduleId = moduleQuery[0].id;
        await queryRunner.query(`
          INSERT INTO "role_modules" ("role_id", "module_id", "is_enabled") 
          VALUES ('${roleId}', '${moduleId}', true)
        `);
      }
    }
  }
}
