import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { DynamicModule, Module } from '@nestjs/common';
import { RabbitModuleAsyncOptions } from './async-options';
import { RabbitModuleOptions } from './options';
import { RabbitPublisherService } from './publisher.service';
import { RabbitContextCheckerService } from './rabbit-context-checker.service';

@Module({
  providers: [RabbitContextCheckerService],
  exports: [RabbitContextCheckerService],
})
export class RabbitModule {
  static forRoot(options: RabbitModuleOptions): DynamicModule {
    return {
      module: RabbitModule,
      imports: [
        RabbitMQModule.forRootAsync(RabbitMQModule, {
          useFactory: () => {
            return options;
          }
        }),
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
          ...asyncOptions,
        }),
      ],
      providers: [
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
