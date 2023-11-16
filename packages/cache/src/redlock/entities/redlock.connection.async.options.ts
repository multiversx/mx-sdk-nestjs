import { RedlockConnectionOptions } from './redlock.connection.options';
import { ModuleMetadata } from '@nestjs/common';

export interface RedlockConnectionAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<RedlockConnectionOptions[]> | RedlockConnectionOptions[];
  inject?: any[];
  imports?: any[];
}
