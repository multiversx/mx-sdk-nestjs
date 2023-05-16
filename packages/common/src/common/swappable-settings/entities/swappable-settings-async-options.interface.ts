import { ModuleMetadata } from "@nestjs/common";
import { SwappableSettingsStorageInterface } from "./swappable-settings-storage.interface";

export interface SwappableSettingsAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  inject?: any[];
  useFactory?: (...args: any[]) => Promise<SwappableSettingsStorageInterface> | SwappableSettingsStorageInterface;
}
