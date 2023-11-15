import { RedlockModuleOptions } from './redlock.module.options';
import { ModuleMetadata } from '@nestjs/common';

export interface RedlockModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RedlockModuleOptions> | RedlockModuleOptions;
  inject?: any[];
  imports?: any[];
}
