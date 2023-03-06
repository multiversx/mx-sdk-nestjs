import { DynamicModule, Module } from '@nestjs/common';
import { RedisCacheModuleOptions, RedisCacheService } from '../caching';
import { RedisCacheModuleAsyncOptions } from '../caching/redis-cache/options';
import { RedisModule } from '../redis/redis.module';
import { SwappableSettingsService } from './swappable-settings.service';

@Module({})
export class SwappableSettingsModule {
  public static forRoot(redisCacheOptions: RedisCacheModuleOptions): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [RedisModule.forRoot(redisCacheOptions)],
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

  public static forRootAsync(redisCacheOptions: RedisCacheModuleAsyncOptions): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [
        RedisModule.forRootAsync(redisCacheOptions),
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
