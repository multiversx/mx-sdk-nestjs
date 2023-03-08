import { DynamicModule, Module } from '@nestjs/common';
import { RedisOptions } from 'ioredis';
import { RedisCacheService } from '../caching';
import { RedisModuleAsyncOptions } from '../redis/options';
import { RedisModule } from '../redis/redis.module';
import { SwappableSettingsService } from './swappable-settings.service';

@Module({})
export class SwappableSettingsModule {
  public static forRoot(redisOptions: { config: RedisOptions }): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [RedisModule.forRoot(redisOptions)],
      providers: [
        RedisCacheService,
        SwappableSettingsService,
      ],
      exports: [
        RedisCacheService,
        SwappableSettingsService,
      ],
    };
  }

  public static forRootAsync(redisAyncOptions: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [
        RedisModule.forRootAsync(redisAyncOptions),
      ],
      providers: [
        RedisCacheService,
        SwappableSettingsService,
      ],
      exports: [
        RedisCacheService,
        SwappableSettingsService,
      ],
    };
  }
}
