import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RabbitModuleAsyncOptions, OptionsInterface, RABBIT_ADDITIONAL_OPTIONS, RabbitModuleOptions } from './entities';
import { RabbitPublisherService } from './publisher.service';
import { RabbitContextCheckerService } from './rabbit-context-checker.service';
import { SwappableSettingsModule, SwappableSettingsService, SwappableSettingsStorageInterface, SwappableSettingsAsyncOptions } from '@multiversx/sdk-nestjs-common';

@Module({
  providers: [RabbitContextCheckerService],
  exports: [RabbitContextCheckerService],
})
export class RabbitModule {
  static forRoot(rabbitOptions: RabbitModuleOptions, rabbitStorageSettings?: SwappableSettingsStorageInterface, auxOptions?: OptionsInterface): DynamicModule {

    const imports = [RabbitMQModule.forRoot(RabbitMQModule, rabbitOptions)];
    const providers: Provider[] = [
      RabbitPublisherService,
      {
        provide: RABBIT_ADDITIONAL_OPTIONS,
        useValue: auxOptions,
      },
    ];

    if (rabbitStorageSettings) {
      imports.push(SwappableSettingsModule.forRoot(rabbitStorageSettings));

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

  static forRootAsync(rabbitAsyncOptions: RabbitModuleAsyncOptions, rabbitAsyncStorageSettings?: SwappableSettingsAsyncOptions, auxOptions?: OptionsInterface): DynamicModule {

    const imports = [RabbitMQModule.forRootAsync(RabbitMQModule, rabbitAsyncOptions)];
    const providers: Provider[] = [
      RabbitPublisherService,
      {
        provide: RABBIT_ADDITIONAL_OPTIONS,
        useValue: auxOptions,
      },
    ];

    if (rabbitAsyncStorageSettings) {
      imports.push(SwappableSettingsModule.forRootAsync(rabbitAsyncStorageSettings));

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
