import { DynamicModule, Global, Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RedisCacheModuleOptions, RedisCacheModuleAsyncOptions } from './options';

@Global()
@Module({})
export class RedisCacheModule {
  static forRoot(options: RedisCacheModuleOptions): DynamicModule {
    return {
      module: RedisCacheModule,
      imports: [
        RedisModule.forRoot(options),
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
