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

export function getFileExtensionFromContentType(contentType: string): string | null {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    case 'image/bmp':
      return 'bmp';
    case 'image/tiff':
      return 'tiff';
    case 'image/svg+xml':
      return 'svg';
    default:
      return null; // Unsupported content type
  }
}
