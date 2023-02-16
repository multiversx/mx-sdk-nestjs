import { DynamicModule, Module } from '@nestjs/common';
import { ElrondCachingService } from './elrond-caching.service';
import { InMemoryCacheModule } from '../in-memory-cache/in-memory-cache.module';
import { RedisCacheModule } from '../redis-cache/redis-cache.module';
import { RedisCacheModuleAsyncOptions, RedisCacheModuleOptions } from '../redis-cache/options';
import { InMemoryCacheOptions } from '../in-memory-cache/entities/in-memory-cache-options.interface';

@Module({})
export class ElrondCachingModule {
  static forRoot(
    redisCacheModuleOptions: RedisCacheModuleOptions,
    inMemoryCacheModuleOptions?: InMemoryCacheOptions
  ): DynamicModule {
    return {
      module: ElrondCachingModule,
      imports: [
        InMemoryCacheModule.forRoot(inMemoryCacheModuleOptions),
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
    inMemoryCacheModuleOptions?: InMemoryCacheOptions
  ): DynamicModule {
    return {
      module: ElrondCachingModule,
      imports: [
        InMemoryCacheModule.forRoot(inMemoryCacheModuleOptions),
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
