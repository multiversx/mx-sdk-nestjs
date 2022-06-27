import { forwardRef } from "@nestjs/common";
import { MetricsModule } from "src/common/metrics/metrics.module";
import { Global, Module } from "@nestjs/common";
import { NestjsApiConfigModule } from "../api-config/nestjs.api.config.module";
import { ApiModule } from "../api/api.module";
import { ElasticService } from "./elastic.service";

@Global()
@Module({
  imports: [
    NestjsApiConfigModule,
    ApiModule,
    forwardRef(() => MetricsModule),
  ],
  providers: [
    ElasticService,
  ],
  exports: [
    ElasticService,
  ],
})
export class ElasticModule { }
