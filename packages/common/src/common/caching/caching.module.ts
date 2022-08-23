import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { LoggingModule } from "../logging/logging.module";
import { MetricsModule } from "../metrics/metrics.module";
import { CachingService } from "./caching.service";
import { CachingModuleAsyncOptions } from "./entities/caching.module.async.options";
import { CachingModuleOptions } from "./entities/caching.module.options";
import { LocalCacheService } from "./local.cache.service";

@Global()
@Module({
  imports: [
    MetricsModule,
    LoggingModule,
  ],
  providers: [
    CachingService, LocalCacheService,
  ],
  exports: [
    CachingService,
  ],
})
export class CachingModule {
  static forRoot(options: CachingModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: CachingModuleOptions,
        useFactory: () => options,
      },
      CachingService,
      LocalCacheService,
    ];

    return {
      module: CachingModule,
      imports: [
        MetricsModule,
      ],
      providers,
      exports: [
        CachingService,
      ],
    };
  }

  static forRootAsync(options: CachingModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: CachingModuleOptions,
        useFactory: options.useFactory,
        inject: options.inject,
      },
      CachingService,
    ];

    let references = []
    if (options.imports) {
      for (const ref of options.imports) {
        references.push(ref);
      }
    }

    return {
      module: CachingModule,
      imports: [
        MetricsModule,
        ...references
      ],
      providers,
      exports: [
        CachingService,
      ],
    };
  }
}
