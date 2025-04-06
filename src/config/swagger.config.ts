import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";

export class SwaggerConfig {
  static setupOpenApi(app: INestApplication) {
    const configEnv = app.get(ConfigService);
    if (configEnv.get("server.doc-prefix", "swagger")) {
      const config = new DocumentBuilder()
        .setTitle("Margiet API Document")
        .setVersion(configEnv.get("app.version"))
        .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup(configEnv.get("server.doc-prefix", "swagger"), app, document);
    }
  }
}
