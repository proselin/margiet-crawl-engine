import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Versions } from '@/common';

export class SwaggerConfig {
  static setupOpenApi(
    app: INestApplication,
    options: {
      hostInput?: string;
      portInput?: number;
      prefixInput?: string;
      configInput?: Omit<OpenAPIObject, 'paths'>;
    },
  ) {
    const configService = app.get(ConfigService);
    const prefix =
      options.prefixInput ||
      configService.get('SERVER_API_DOCUMENT_PREFIX', 'swagger');
    const config =
      options.configInput ||
      new DocumentBuilder()
        .setTitle('API Document')
        .setVersion(Versions.V1)
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(prefix, app, document);
  }
}
