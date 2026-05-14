import { IsString, IsNumber, IsIn } from 'class-validator';

export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: string;

  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  DATABASE_USERNAME: string;

  @IsString()
  DATABASE_PASSWORD: string;

  @IsString()
  DATABASE_NAME: string;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  JWT_EXPIRES_IN: string;

  @IsString()
  JWT_REFRESH_SECRET: string;

  @IsString()
  JWT_REFRESH_EXPIRES_IN: string;

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  API_PREFIX: string;

  @IsNumber()
  BCRYPT_SALT_ROUNDS: number;

  @IsString()
  BILLING_API_URL: string;

  @IsNumber()
  BILLING_API_TIMEOUT_MS: number;

  @IsNumber()
  BILLING_API_MAX_RETRIES: number;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = {
    ...config,
    PORT: parseInt(config.PORT as string, 10),
    DATABASE_PORT: parseInt(config.DATABASE_PORT as string, 10),
    BCRYPT_SALT_ROUNDS: parseInt(config.BCRYPT_SALT_ROUNDS as string, 10) || 10,
    BILLING_API_TIMEOUT_MS: config.BILLING_API_TIMEOUT_MS
      ? parseInt(config.BILLING_API_TIMEOUT_MS as string, 10)
      : undefined,
    BILLING_API_MAX_RETRIES: config.BILLING_API_MAX_RETRIES
      ? parseInt(config.BILLING_API_MAX_RETRIES as string, 10)
      : undefined,
  };

  return validatedConfig;
}
