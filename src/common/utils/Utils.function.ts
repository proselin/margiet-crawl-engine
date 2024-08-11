import { plainToClass } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Logger } from '@nestjs/common';

export function envValidation(environmentClass: any) {
  const validatedConfig = plainToClass(environmentClass, process.env, {
    enableImplicitConversion: true,
  }) as any;
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    Logger.error(errors.toString(), environmentClass.name);
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
