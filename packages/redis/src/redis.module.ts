import Redis from 'ioredis';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RedisModuleAsyncOptions, RedisModuleOptions, RedisModuleOptionsFactory } from './options';
import { REDIS_CLIENT_TOKEN, REDIS_OPTIONS_TOKEN } from './entities/common.constants';

@Module({})
export class RedisModule {

  public static forRoot(connectionOptions: RedisModuleOptions, customClientToken?: string): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: customClientToken || REDIS_CLIENT_TOKEN,
          useValue: RedisModule.createClient(connectionOptions),
        },
      ],
      exports: [customClientToken || REDIS_CLIENT_TOKEN],
    };
  }

  public static forRootAsync(connectOptions: RedisModuleAsyncOptions, customClientToken?: string): DynamicModule {

    if (!(connectOptions.useExisting || connectOptions.useFactory || connectOptions.useClass)) {
      throw new Error('[Redis Module] Please provide useFactory, useClass or useExisting');
    }

    const clientProvider = {
      inject: [REDIS_OPTIONS_TOKEN],
      provide: customClientToken || REDIS_CLIENT_TOKEN,
      useFactory: (factoryOptions: RedisModuleOptions) => RedisModule.createClient(factoryOptions),
    };

    return {
      module: RedisModule,
      imports: connectOptions.imports || [],
      providers: [
        ...this.createConnectOptionsProviders(connectOptions),
        clientProvider,
      ],
      exports: [clientProvider],
    };
  }

  /**
   * ioredis 6 defaults to RESP3; keep the RESP2 wire protocol used by ioredis 5 unless `protocol` is set explicitly.
   */
  private static createClient(options: RedisModuleOptions): Redis {
    return new Redis({ protocol: 2, ...options.config });
  }

  private static createConnectOptionsProviders(
    options: RedisModuleAsyncOptions,
  ): Provider[] {

    if (options.useExisting || options.useFactory) {
      return [this.createConnectOptionsProvider(options)];
    }

    return [
      this.createConnectOptionsProvider(options),
      {
        //@ts-ignore
        provide: options.useClass,
        //@ts-ignore
        useClass: options.useClass,
      },
    ];
  }

  private static createConnectOptionsProvider(
    options: RedisModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: REDIS_OPTIONS_TOKEN,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }

    return {
      provide: REDIS_OPTIONS_TOKEN,
      useFactory: async (optionsFactory: RedisModuleOptionsFactory) =>
        await optionsFactory.createRedisModuleOptions(),
      //@ts-ignore
      inject: [options.useExisting || options.useClass],
    };
  }
}
