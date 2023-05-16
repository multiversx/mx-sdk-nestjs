import { ModuleMetadata } from '@nestjs/common';
import { RabbitModuleOptions } from './options';

export interface RabbitModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RabbitModuleOptions> | RabbitModuleOptions;
  inject?: any[];
}
