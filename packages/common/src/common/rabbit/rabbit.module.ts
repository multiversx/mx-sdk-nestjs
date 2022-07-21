import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { RabbitModuleAsyncOptions } from './async-options';
import { RabbitModuleOptions } from './options';
import { RabbitPublisherService } from './publisher.service';

@Module({})
export class RabbitModule {
  static forRoot(options: RabbitModuleOptions): DynamicModule {
    return {
      module: RabbitModule,
      imports: [
        RabbitMQModule.forRoot(RabbitMQModule, options),
      ],
      providers: [
        RabbitPublisherService,
      ],
      exports: [RabbitPublisherService],
    };
  }

  static forRootAsync(asyncOptions: RabbitModuleAsyncOptions): DynamicModule {
    return {
      module: RabbitModule,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          imports: asyncOptions.imports,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject,
        }),
      ],
      providers: [
        RabbitPublisherService,
      ],
      exports: [
        RabbitPublisherService,
      ],
    };
  }
}
