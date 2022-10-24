import Redis from 'ioredis';
import { DynamicModule, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { RedisCacheModuleOptions, RedisCacheModuleAsyncOptions } from './options';
import { MetricsModule } from '../../../common/metrics/metrics.module';
import { REDIS_CLIENT_TOKEN, REDIS_OPTIONS_TOKEN } from './entities/common.constants';

@Module({})
export class RedisCacheModule {
  static forRoot(options: RedisCacheModuleOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [
        MetricsModule,
      ],
      providers: [
        {
          provide: REDIS_CLIENT_TOKEN,
          useValue: new Redis(options.config),
        },
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
        MetricsModule,
      ],
      providers: [
        {
          inject: asyncOptions.inject || [],
          provide: REDIS_OPTIONS_TOKEN,
          useFactory: asyncOptions.useFactory,
        },
        {
          inject: [REDIS_OPTIONS_TOKEN],
          provide: REDIS_CLIENT_TOKEN,
          useFactory: (factoryOptions: RedisCacheModuleOptions) => new Redis(factoryOptions.config),
        },
        RedisCacheService,
      ],
      exports: [
        RedisCacheService,
      ],
    };
  }
}
