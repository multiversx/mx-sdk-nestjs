import { DynamicModule, Global, Module } from '@nestjs/common';
import { CachingService } from './caching.service';
import { InMemoryCacheModule } from '../in-memory-cache/in-memory-cache.module';
import { RedisCacheModule } from '../redis-cache/redis-cache.module';
import { RedisCacheModuleAsyncOptions, RedisCacheModuleOptions } from '../redis-cache/options';
import { InMemoryCacheOptions } from '../in-memory-cache/entities/in-memory-cache-options.interface';
import { ADDITIONAL_CACHING_OPTIONS } from '../entities/common';

@Global()
@Module({})
export class CachingModule {
  static forRoot(
    redisCacheModuleOptions: RedisCacheModuleOptions,
    inMemoryCacheModuleOptions?: InMemoryCacheOptions
  ): DynamicModule {
    return {
      module: CachingModule,
      imports: [
        InMemoryCacheModule.forRoot(inMemoryCacheModuleOptions),
        RedisCacheModule.forRoot(redisCacheModuleOptions),
      ],
      providers: [
        {
          provide: ADDITIONAL_CACHING_OPTIONS,
          useValue: redisCacheModuleOptions.additionalOptions,
        },
        CachingService,
      ],
      exports: [
        CachingService,
      ],
    };
  }

  static forRootAsync(
    redisCacheModuleAsyncOptions: RedisCacheModuleAsyncOptions,
    inMemoryCacheModuleOptions?: InMemoryCacheOptions
  ): DynamicModule {
    return {
      module: CachingModule,
      imports: [
        InMemoryCacheModule.forRoot(inMemoryCacheModuleOptions),
        RedisCacheModule.forRootAsync(redisCacheModuleAsyncOptions),
        ...(redisCacheModuleAsyncOptions.imports || []),
      ],
      providers: [
        {
          provide: ADDITIONAL_CACHING_OPTIONS,
          useFactory: async (...args: any[]) => {
            const factoryData = await redisCacheModuleAsyncOptions.useFactory(...args);
            return factoryData.additionalOptions;
          },
          inject: redisCacheModuleAsyncOptions.inject || [],
        },
        CachingService,
      ],
      exports: [
        CachingService,
      ],
    };
  }
}
