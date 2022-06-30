import { ModuleMetadata } from "@nestjs/common";
import { ApiModuleOptions } from "./api.module.options";

export interface ApiModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ApiModuleOptions> | ApiModuleOptions;
  inject?: any[];
}