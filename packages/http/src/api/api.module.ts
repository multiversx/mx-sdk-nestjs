import { DynamicModule, Global, Module, Provider } from "@nestjs/common";
import { MetricsModule } from "@multiversx/sdk-nestjs-monitoring";
import { ApiService } from "./api.service";
import { ApiModuleAsyncOptions } from "./entities/api.module.async.options";
import { ApiModuleOptions } from "./entities/api.module.options";

@Global()
@Module({})
export class ApiModule {
  static forRoot(options: ApiModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ApiModuleOptions,
        useFactory: () => options,
      },
      ApiService,
    ];

    return {
      module: ApiModule,
      imports: [
        MetricsModule,
      ],
      providers,
      exports: [
        ApiService,
      ],
    };
  }

  static forRootAsync(options: ApiModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: ApiModuleOptions,
        useFactory: options.useFactory,
        inject: options.inject,
      },
      ApiService,
    ];

    const references = [];
    if (options.imports) {
      for (const ref of options.imports) {
        references.push(ref);
      }
    }
    return {
      module: ApiModule,
      imports: [
        MetricsModule, ...references,
      ],
      providers,
      exports: [
        ApiService,
      ],
    };
  }
}
