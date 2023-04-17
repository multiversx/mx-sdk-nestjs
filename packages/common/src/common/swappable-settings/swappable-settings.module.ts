import { DynamicModule, Module } from '@nestjs/common';
import { RedisOptions } from 'ioredis';
import { RedisModuleAsyncOptions, RedisModule } from '@multiversx/sdk-nestjs-redis';
import { SWAPPABLE_SETTINGS_REDIS_CLIENT } from './entities/constants';
import { SwappableSettingsService } from './swappable-settings.service';

@Module({})
export class SwappableSettingsModule {
  public static forRoot(redisOptions: { config: RedisOptions }): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [RedisModule.forRoot(redisOptions, SWAPPABLE_SETTINGS_REDIS_CLIENT)],
      providers: [
        SwappableSettingsService,
      ],
      exports: [
        SwappableSettingsService,
      ],
    };
  }

  public static forRootAsync(redisAyncOptions: RedisModuleAsyncOptions): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [
        RedisModule.forRootAsync(redisAyncOptions, SWAPPABLE_SETTINGS_REDIS_CLIENT),
      ],
      providers: [
        SwappableSettingsService,
      ],
      exports: [
        SwappableSettingsService,
      ],
    };
  }
}
