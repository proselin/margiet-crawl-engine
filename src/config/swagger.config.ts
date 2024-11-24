import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

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
    const configEnv = app.get(ConfigService);
    const prefix =
      options.prefixInput ||
      configEnv.get('SERVER_API_DOCUMENT_PREFIX', 'swagger');
    const config = new DocumentBuilder()
      .setTitle('Margiet API Document')
      .setVersion(configEnv.get('app.version'))
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(prefix, app, document);
  }
}
