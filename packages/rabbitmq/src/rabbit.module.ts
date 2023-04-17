import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { InMemoryCacheModule, InMemoryCacheService } from '@multiversx/sdk-nestjs-cache';
import { RedisModule, RedisDefaultOptions as RedisOptions, RedisModuleAsyncOptions } from '@multiversx/sdk-nestjs-redis';
import { RabbitModuleAsyncOptions, OptionsInterface, RABBIT_ADDITIONAL_OPTIONS, RabbitModuleOptions } from './entities';
import { RabbitPublisherService } from './publisher.service';
import { RabbitContextCheckerService } from './rabbit-context-checker.service';
import { SwappableSettingsModule, SwappableSettingsService, SWAPPABLE_SETTINGS_REDIS_CLIENT } from '@multiversx/sdk-nestjs-common';

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
      imports.push(RedisModule.forRoot({ config: redisOptions }, SWAPPABLE_SETTINGS_REDIS_CLIENT));
      imports.push(InMemoryCacheModule.forRoot());
      imports.push(SwappableSettingsModule.forRoot({ config: redisOptions }));

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
      imports.push(RedisModule.forRootAsync(redisAsyncOptions, SWAPPABLE_SETTINGS_REDIS_CLIENT));
      imports.push(InMemoryCacheModule.forRoot());
      imports.push(SwappableSettingsModule.forRootAsync(redisAsyncOptions));

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
