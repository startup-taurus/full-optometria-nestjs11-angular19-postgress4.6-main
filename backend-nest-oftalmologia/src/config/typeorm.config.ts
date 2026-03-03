import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { join } from 'path';

config();

const configService = new ConfigService();

// Detecta si ya se está ejecutando desde el build compilado (dist/) o desde el fuente (src/)
// __dirname en producción será algo como /app/dist/config, en dev será src/config
const isCompiledBuild = __dirname.includes('dist');

const entities = isCompiledBuild
  ? [join(__dirname, '../**/*.entity.js')]
  : [join(__dirname, '../**/*.entity{.ts,.js}')];

const migrations = isCompiledBuild
  ? [join(__dirname, '../database/migrations/*.js')]
  : [join(__dirname, '../database/migrations/*{.ts,.js}')];

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username:
    configService.get('DB_USER') || configService.get('DATABASE_USERNAME'),
  password:
    configService.get('DB_PASSWORD') || configService.get('DATABASE_PASSWORD'),
  database: configService.get('DB_NAME') || configService.get('DATABASE_NAME'),
  synchronize: false,
  logging: ['error'],
  entities,
  migrations,
  migrationsTableName: 'migrations',
});

export default AppDataSource;
