import { DynamicModule, Module } from '@nestjs/common';
import { ElrondCachingService } from './elrond-caching.service';
import { InMemoryCacheModule } from '../in-memory-cache/in-memory-cache.module';
import { RedisCacheModule } from '../redis-cache/redis-cache.module';
import { RedisCacheModuleAsyncOptions, RedisCacheModuleOptions } from '../redis-cache/options';

@Module({})
export class ElrondCachingModule {
  static forRoot(
    redisCacheModuleOptions: RedisCacheModuleOptions,
  ): DynamicModule {
    return {
      module: ElrondCachingModule,
      imports: [
        InMemoryCacheModule,
        RedisCacheModule.forRoot(redisCacheModuleOptions),
      ],
      providers: [
        ElrondCachingService,
      ],
      exports: [
        ElrondCachingService,
      ],
    };
  }

  static forRootAsync(
    redisCacheModuleAsyncOptions: RedisCacheModuleAsyncOptions,
  ): DynamicModule {
    return {
      module: ElrondCachingModule,
      imports: [
        InMemoryCacheModule,
        RedisCacheModule.forRootAsync(redisCacheModuleAsyncOptions),
      ],
      providers: [
        ElrondCachingService,
      ],
      exports: [
        ElrondCachingService,
      ],
    };
  }
}
