import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Module } from './module.entity';

@Entity('role_modules')
export class RoleModule {
  @PrimaryColumn({ name: 'role_id' })
  roleId: string;

  @PrimaryColumn({ name: 'module_id' })
  moduleId: string;

  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  // Relations
  @ManyToOne(() => Role, (role) => role.roleModules)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Module, (module) => module.roleModules)
  @JoinColumn({ name: 'module_id' })
  module: Module;
}
