import { DynamicModule, Module } from '@nestjs/common';
import { IN_MEMORY_CACHE_OPTIONS } from './entities/common.constants';
import { InMemoryCacheOptions } from './entities/in-memory-cache-options.interface';
import { InMemoryCacheService } from './in-memory-cache.service';

@Module({})
export class InMemoryCacheModule {
  public static forRoot(inMemoryCacheOptions?: InMemoryCacheOptions): DynamicModule {
    return {
      module: InMemoryCacheModule,
      providers: [
        {
          provide: IN_MEMORY_CACHE_OPTIONS,
          useValue: inMemoryCacheOptions,
        },
        InMemoryCacheService,
      ],
      exports: [InMemoryCacheService],
    };
  }
}
