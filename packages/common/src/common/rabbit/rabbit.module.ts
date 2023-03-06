import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { RabbitModuleAsyncOptions } from './async-options';
import { RABBIT_ADDITIONAL_OPTIONS } from './constants';
import { OptionsInterface } from './entities/options.interface';
import { RabbitModuleOptions } from './options';
import { RabbitPublisherService } from './publisher.service';
import { RabbitContextCheckerService } from './rabbit-context-checker.service';

@Module({
  providers: [RabbitContextCheckerService],
  exports: [RabbitContextCheckerService],
})
export class RabbitModule {
  static forRoot(rabbitOptions: RabbitModuleOptions, auxOptions?: OptionsInterface): DynamicModule {
    return {
      module: RabbitModule,
      global: true,
      imports: [
        RabbitMQModule.forRoot(RabbitMQModule, rabbitOptions),
      ],
      providers: [
        RabbitPublisherService,
        {
          provide: RABBIT_ADDITIONAL_OPTIONS,
          useValue: auxOptions,
        },
      ],
      exports: [RabbitPublisherService],
    };
  }

  static forRootAsync(rabbitAsyncOptions: RabbitModuleAsyncOptions, auxOptions?: OptionsInterface): DynamicModule {
    return {
      module: RabbitModule,
      global: true,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          ...rabbitAsyncOptions,
        }),
      ],
      providers: [
        {
          provide: RABBIT_ADDITIONAL_OPTIONS,
          useValue: auxOptions,
        },
        RabbitPublisherService,
        RabbitContextCheckerService,
      ],
      exports: [
        RabbitPublisherService,
        RabbitContextCheckerService,
      ],
    };
  }
}
