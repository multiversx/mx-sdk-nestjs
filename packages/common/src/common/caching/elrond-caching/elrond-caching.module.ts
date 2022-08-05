import { DynamicModule, Global, Module } from '@nestjs/common';
import { ElrondCachingService } from './elrond-caching.service';
import { HACacheModule } from '../ha-cache/ha-cache.module';
import { InMemoryCacheModule } from '../in-memory-cache/in-memory-cache.module';
import { RedisCacheModule } from '../redis-cache/redis-cache.module';
import { RedisCacheModuleAsyncOptions, RedisCacheModuleOptions } from '../redis-cache/options';

@Global()
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
        HACacheModule.forRoot(redisCacheModuleOptions),
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
        HACacheModule.forRootAsync(redisCacheModuleAsyncOptions),
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
