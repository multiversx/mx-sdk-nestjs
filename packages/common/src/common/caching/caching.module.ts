import { Global, Module } from "@nestjs/common";
import { NestjsApiConfigModule } from "../api-config/nestjs.api.config.module";
import { MetricsModule } from "../metrics/metrics.module";
import { CachingService } from "./caching.service";
import { LocalCacheService } from "./local.cache.service";

@Global()
@Module({
  imports: [
    MetricsModule,
    NestjsApiConfigModule,
  ],
  providers: [
    CachingService, LocalCacheService,
  ],
  exports: [
    CachingService,
  ],
})
export class CachingModule { }
