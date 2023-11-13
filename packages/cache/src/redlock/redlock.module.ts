import { DynamicModule, Module } from '@nestjs/common';
import { RedlockModuleAsyncOptions, RedlockModuleOptions } from './options';
import { MetricsModule } from '@multiversx/sdk-nestjs-monitoring';
import { RedisModule } from '@multiversx/sdk-nestjs-redis';
import { REDLOCK_TOKEN } from './redlock.constants';
import { RedlockService } from './redlock.service';

@Module({})
export class RedlockModule {
  static forRoot(options: RedlockModuleOptions): DynamicModule {
    return {
      module: RedlockModule,
      imports: [
        RedisModule.forRoot(options, REDLOCK_TOKEN),
        MetricsModule,
      ],
      providers: [
        RedlockService,
      ],
      exports: [
        RedlockService,
      ],
    };
  }

  static forRootAsync(asyncOptions: RedlockModuleAsyncOptions): DynamicModule {
    return {
      module: RedlockModule,
      imports: [
        RedisModule.forRootAsync(asyncOptions, REDLOCK_TOKEN),
        MetricsModule,
      ],
      providers: [
        RedlockService,
      ],
      exports: [
        RedlockService,
      ],
    };
  }
}
