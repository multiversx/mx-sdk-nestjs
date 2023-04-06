import { ModuleMetadata } from "@nestjs/common";
import { CachingModuleOptions } from "./caching.module.options";

export interface CachingModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<CachingModuleOptions> | CachingModuleOptions;
  inject?: any[];
}
