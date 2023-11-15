import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MetricsModule } from '@multiversx/sdk-nestjs-monitoring';
import { RedisModule } from '@multiversx/sdk-nestjs-redis';
import { RedlockService } from './redlock.service';
import { RedlockModuleAsyncOptions, RedlockModuleOptions } from './entities';
import Redis from 'ioredis';

@Module({})
export class RedlockModule {
  static forRoot(redisOptionsArray: RedlockModuleOptions[]): DynamicModule {
    const redisProviders: Provider[] = redisOptionsArray.map((option, index) => ({
      provide: `REDIS_CLIENT_${index}`,
      useFactory: () => new Redis(option.config),
    }));

    const redisClientsProvider: Provider = {
      provide: 'REDIS_CLIENTS',
      useFactory: (...clients: Redis[]) => clients,
      inject: redisProviders.map((_, index) => `REDIS_CLIENT_${index}`),
    };

    return {
      module: RedlockModule,
      imports: [
        RedisModule, // Import RedisModule normally
        MetricsModule,
      ],
      providers: [
        ...redisProviders,
        redisClientsProvider,
        RedlockService,
      ],
      exports: [
        'REDIS_CLIENTS',
        RedlockService,
      ],
    };
  }

  static forRootAsync(asyncOptionsArray: RedlockModuleAsyncOptions[]): DynamicModule {
    const asyncProviders: Provider[] = asyncOptionsArray.map((asyncOptions, index) => ({
      provide: `REDIS_CLIENT_${index}`,
      useFactory: async (...args: any[]) => {
        const options = await asyncOptions.useFactory(...args);
        return new Redis(options.config);
      },
      inject: asyncOptions.inject || [],
    }));

    const redisClientsAsyncProvider: Provider = {
      provide: 'REDIS_CLIENTS',
      useFactory: (...clients: Redis[]) => clients,
      inject: asyncProviders.map((_, index) => `REDIS_CLIENT_${index}`),
    };

    return {
      module: RedlockModule,
      imports: [
        RedisModule, // Import RedisModule normally
        MetricsModule,
        ...asyncOptionsArray.map(ao => ao.imports).flat(),
      ],
      providers: [
        ...asyncProviders,
        redisClientsAsyncProvider,
        RedlockService,
      ],
      exports: [
        'REDIS_CLIENTS',
        RedlockService,
      ],
    };
  }
}
