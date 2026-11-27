import { DynamicModule, Module, Provider } from '@nestjs/common';
import { MetricsModule } from '@multiversx/sdk-nestjs-monitoring';
import { RedisModule } from '@multiversx/sdk-nestjs-redis';
import { RedlockService } from './redlock.service';
import { RedlockConnectionAsyncOptions, RedlockConnectionOptions } from './entities';
import Redis from 'ioredis';

@Module({})
export class RedlockModule {
  static forRoot(...redisOptionsArray: RedlockConnectionOptions[]): DynamicModule {
    const redisProviders: Provider[] = redisOptionsArray.map((option, index) => ({
      provide: `REDIS_CLIENT_${index}`,
      useFactory: () => RedlockModule.createClient(option),
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

  static forRootAsync(asyncOptions: RedlockConnectionAsyncOptions): DynamicModule {
    const asyncProviders: Provider[] = [{
      provide: 'REDIS_CLIENTS',
      useFactory: async (...args: any[]): Promise<Redis[]> => {
        const optionsArray = await asyncOptions.useFactory(...args);
        return optionsArray.map(options => RedlockModule.createClient(options));
      },
      inject: asyncOptions.inject || [],
    }];

    return {
      module: RedlockModule,
      imports: [
        RedisModule,
        MetricsModule,
        ...(asyncOptions.imports || []),
      ],
      providers: [
        ...asyncProviders,
        RedlockService,
      ],
      exports: [
        'REDIS_CLIENTS',
        RedlockService,
      ],
    };
  }

  /**
   * ioredis 6 defaults to RESP3; keep the RESP2 wire protocol used by ioredis 5 unless `protocol` is set explicitly.
   */
  private static createClient(options: RedlockConnectionOptions): Redis {
    return new Redis({ protocol: 2, ...options });
  }
}
