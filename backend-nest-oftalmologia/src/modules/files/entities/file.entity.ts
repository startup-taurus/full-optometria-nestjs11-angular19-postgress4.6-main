import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'filename' })
  filename: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'path' })
  path: string;

  @Column({ name: 'size' })
  size: number;

  @Column({ name: 'mime_type' })
  mimeType: string;

  @Column({ name: 'entity_type' })
  entityType: string;

  @Column({ name: 'entity_id' })
  entityId: string;

  @Column({ name: 'file_category', nullable: true })
  fileCategory: string;

  @Column({ name: 'is_cover', default: false })
  isCover: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
