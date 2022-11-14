import Redis from 'ioredis';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RedisModuleAsyncOptions, RedisModuleOptions, RedisModuleOptionsFactory } from './options';
import { REDIS_CLIENT_TOKEN, REDIS_OPTIONS_TOKEN } from './entities/common.constants';

@Module({})
export class RedisModule {

  public static forRoot(connectionOptions: RedisModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        {
          provide: REDIS_CLIENT_TOKEN,
          useValue: new Redis(connectionOptions.config),
        },
      ],
      exports: [REDIS_CLIENT_TOKEN],
    };
  }

  public static forRootAsync(connectOptions: RedisModuleAsyncOptions): DynamicModule {

    if (!(connectOptions.useExisting || connectOptions.useFactory || connectOptions.useClass)) {
      throw new Error('[Redis Module] Please provide useFactory, useClass or useExisting');
    }

    const clientProvider = {
      inject: [REDIS_OPTIONS_TOKEN],
      provide: REDIS_CLIENT_TOKEN,
      useFactory: (factoryOptions: RedisModuleOptions) => new Redis(factoryOptions.config),
    };

    return {
      module: RedisModule,
      imports: connectOptions.imports || [],
      providers: [
        ...this.createConenctOptionsProviders(connectOptions),
        clientProvider,
      ],
      exports: [clientProvider],
    };
  }

  private static createConenctOptionsProviders(
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
