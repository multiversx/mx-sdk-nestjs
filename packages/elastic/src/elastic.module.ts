import { DynamicModule, Global, Provider } from "@nestjs/common";
import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { Module } from "@nestjs/common";
import { ApiModule } from "@multiversx/sdk-nestjs-http";
import { ElasticService } from "./elastic.service";
import { ElasticModuleOptions } from "./entities/elastic.module.options";
import { ElasticModuleAsyncOptions } from "./entities/elastic.module.async.options";

@Global()
@Module({})
export class ElasticModule {
  static forRoot(options: ElasticModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ElasticModuleOptions,
        useFactory: () => options,
      },
      ElasticService,
    ];

    return {
      module: ElasticModule,
      imports: [
        ApiModule,
        MetricsModule,
      ],
      providers,
      exports: [
        ElasticService,
      ],
    };
  }

  static forRootAsync(options: ElasticModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ElasticModuleOptions,
        useFactory: options.useFactory,
        inject: options.inject,
      },
      ElasticService,
    ];

    const references = [];
    if (options.imports) {
      for (const ref of options.imports) {
        references.push(ref);
      }
    }

    return {
      module: ElasticModule,
      imports: [
        ApiModule,
        MetricsModule,
        ...references,
      ],
      providers,
      exports: [
        ElasticService,
      ],
    };
  }
}
