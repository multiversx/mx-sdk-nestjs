import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { InMemoryCacheModule, InMemoryCacheService, RedisCacheService } from '../caching';
import { RedisModule } from '../redis/redis.module';
import { RabbitModuleAsyncOptions } from './async-options';
import { RABBIT_ADDITIONAL_OPTIONS } from './constants';
import { OptionsInterface } from './entities/options.interface';
import { RabbitModuleOptions } from './options';
import { RabbitPublisherService } from './publisher.service';
import { RabbitContextCheckerService } from './rabbit-context-checker.service';
import { RedisOptions } from 'ioredis';
import { RedisModuleAsyncOptions } from '../redis/options';
import { SwappableSettingsModule, SwappableSettingsService } from '../swappable-settings';

@Module({
  providers: [RabbitContextCheckerService],
  exports: [RabbitContextCheckerService],
})
export class RabbitModule {
  static forRoot(rabbitOptions: RabbitModuleOptions, redisOptions?: RedisOptions, auxOptions?: OptionsInterface): DynamicModule {

    const imports = [RabbitMQModule.forRoot(RabbitMQModule, rabbitOptions)];
    const providers: Provider[] = [
      RabbitPublisherService,
      {
        provide: RABBIT_ADDITIONAL_OPTIONS,
        useValue: auxOptions,
      },
    ];

    if (redisOptions) {
      imports.push(RedisModule.forRoot({ config: redisOptions }));
      imports.push(InMemoryCacheModule.forRoot());
      imports.push(SwappableSettingsModule.forRoot({ config: redisOptions }));

      providers.push(RedisCacheService);
      providers.push(InMemoryCacheService);
      providers.push(SwappableSettingsService);
    }

    return {
      module: RabbitModule,
      global: true,
      imports,
      providers,
      exports: [RabbitPublisherService],
    };
  }

  static forRootAsync(rabbitAsyncOptions: RabbitModuleAsyncOptions, redisAsyncOptions?: RedisModuleAsyncOptions, auxOptions?: OptionsInterface): DynamicModule {

    const imports = [RabbitMQModule.forRootAsync(RabbitMQModule, rabbitAsyncOptions)];
    const providers: Provider[] = [
      RabbitPublisherService,
      {
        provide: RABBIT_ADDITIONAL_OPTIONS,
        useValue: auxOptions,
      },
    ];

    if (redisAsyncOptions) {
      imports.push(RedisModule.forRootAsync(redisAsyncOptions));
      imports.push(InMemoryCacheModule.forRoot());
      imports.push(SwappableSettingsModule.forRootAsync(redisAsyncOptions));

      providers.push(RedisCacheService);
      providers.push(InMemoryCacheService);
      providers.push(SwappableSettingsService);
    }

    return {
      module: RabbitModule,
      global: true,
      imports,
      providers,
      exports: [
        RabbitPublisherService,
        RabbitContextCheckerService,
      ],
    };
  }
}
