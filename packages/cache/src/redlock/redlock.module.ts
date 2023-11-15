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
      useFactory: () => new Redis(option),
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
        return optionsArray.map(options => new Redis(options));
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

}
