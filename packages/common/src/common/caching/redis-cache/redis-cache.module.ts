import { DynamicModule, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { RedisCacheModuleOptions, RedisCacheModuleAsyncOptions } from './options';
import { MetricsModule } from '../../../common/metrics/metrics.module';
import { RedisModule } from '../../redis/redis.module';

@Module({})
export class RedisCacheModule {
  static forRoot(options: RedisCacheModuleOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [
        RedisModule.forRoot(options),
        MetricsModule,
      ],
      providers: [
        RedisCacheService,
      ],
      exports: [
        RedisCacheService,
      ],
    };
  }

  static forRootAsync(asyncOptions: RedisCacheModuleAsyncOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [
        RedisModule.forRootAsync(asyncOptions),
        MetricsModule,
      ],
      providers: [
        RedisCacheService,
      ],
      exports: [
        RedisCacheService,
      ],
    };
  }
}
