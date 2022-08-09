import { DynamicModule, Module } from '@nestjs/common';
import { HACacheService } from './ha-cache.service';
import { InMemoryCacheModule } from '../in-memory-cache';
import { RedisCacheModule } from '../redis-cache';
import { RedisCacheModuleAsyncOptions, RedisCacheModuleOptions } from '../redis-cache/options';

@Module({})
export class HACacheModule {
  static forRoot(redisCacheModuleOptions: RedisCacheModuleOptions): DynamicModule {
    return {
      module: HACacheModule,
      imports: [
        InMemoryCacheModule,
        RedisCacheModule.forRoot(redisCacheModuleOptions),
      ],
      providers: [HACacheService],
      exports: [HACacheService],
    };
  }

  static forRootAsync(asyncOptions: RedisCacheModuleAsyncOptions): DynamicModule {
    return {
      module: HACacheModule,
      imports: [
        InMemoryCacheModule,
        RedisCacheModule.forRootAsync(asyncOptions),
      ],
      providers: [HACacheService],
      exports: [HACacheService],
    };
  }
}
