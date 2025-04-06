import "reflect-metadata";

import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerConfig } from "./config";
import { DEFAULT, Versions } from "./common";
import { NestFactory, Reflector } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import { LoggingInterceptor, TimeoutInterceptor, TransformInterceptor } from "./intercept";
import { AllExceptionsFilter } from "./exception/filter/all-exeptions.filter";

class App {
  static async main() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      bufferLogs: true,
    });

    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

    app.useGlobalInterceptors(new LoggingInterceptor());

    app.useGlobalInterceptors(new TransformInterceptor(new Reflector()));

    app.useGlobalInterceptors(new TimeoutInterceptor());

    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: Versions.V1,
    });

    app.enableShutdownHooks();

    app.useGlobalFilters(new AllExceptionsFilter());

    const configService = app.get(ConfigService);
    const port = +configService.get("server.port", DEFAULT.SERVER_PORT);
    const host = configService.get("server.host", DEFAULT.SERVER_HOST);
    const prefix = configService.get("server.prefix", DEFAULT.SERVER_PREFIX);
    const swaggerPrefix = configService.get("server.doc-prefix", DEFAULT.SERVER_API_DOCUMENT_PREFIX);

    app.setGlobalPrefix(prefix);
    SwaggerConfig.setupOpenApi(app);

    app.listen(port, host, () => {
      Logger.log("🚀 Application is running on: " + host + ":" + port);
      Logger.log(" Swagger is running on: " + host + ":" + port + "/" + swaggerPrefix);
    });
  }
}

App.main();
