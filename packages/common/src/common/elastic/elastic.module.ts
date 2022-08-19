import { DynamicModule, Provider } from "@nestjs/common";
import { MetricsModule } from "../../common/metrics/metrics.module";
import { Module } from "@nestjs/common";
import { ApiModule } from "../api/api.module";
import { ElasticService } from "./elastic.service";
import { ElasticModuleOptions } from "./entities/elastic.module.options";
import { ElasticModuleAsyncOptions } from "./entities/elastic.module.async.options";

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

    let references = []
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
        ...imps
      ],
      providers,
      exports: [
        ElasticService,
      ],
    };
  }
}
