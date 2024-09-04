import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Versions } from '../constant';

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
    const host = options.hostInput || configService.get('SERVER_HOST');
    const port = options.portInput || +configService.get('SERVER_PORT');
    const prefix =
      options.prefixInput ||
      configService.get('SERVER_API_DOCUMENT_PREFIX') ||
      'doc';
    const config =
      options.configInput ||
      new DocumentBuilder()
        .setTitle('API Document')
        .setVersion(Versions.V1)
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(prefix, app, document);
    Logger.log(
      `API document host at http://${host}:${port}/${prefix}`,
      SwaggerConfig.name,
    );
  }
}
