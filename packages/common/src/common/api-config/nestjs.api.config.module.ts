import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "../../../config/configuration";
import { LoggingModule } from "../logging/logging.module";
import { NestjsApiConfigService } from "./nestjs.api.config.service";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    LoggingModule,
  ],
  providers: [
    NestjsApiConfigService,
  ],
  exports: [
    NestjsApiConfigService,
  ],
})
export class NestjsApiConfigModule { }
