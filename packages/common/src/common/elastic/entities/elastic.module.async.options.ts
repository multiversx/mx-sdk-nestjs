import { ModuleMetadata } from "@nestjs/common";
import { ElasticModuleOptions } from "./elastic.module.options";

export interface ElasticModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<ElasticModuleOptions> | ElasticModuleOptions;
  inject?: any[];
}