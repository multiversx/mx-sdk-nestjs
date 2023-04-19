import { DynamicModule, Module } from '@nestjs/common';
import { SwappableSettingsService } from './swappable-settings.service';
import { SwappableSettingsStorageInterface } from './entities/swappable-settings-storage.interface';
import { SWAPPABLE_SETTINGS_STORAGE_CLIENT } from './entities/constants';
import { SwappableSettingsAsyncOptions } from './entities/swappable-settings-async-options.interface';

@Module({})
export class SwappableSettingsModule {
  public static forRoot(storage: SwappableSettingsStorageInterface): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: [],
      providers: [
        SwappableSettingsService,
        {
          provide: SWAPPABLE_SETTINGS_STORAGE_CLIENT,
          useValue: storage,
        },
      ],
      exports: [
        SwappableSettingsService,
      ],
    };
  }

  public static forRootAsync(storageOptions: SwappableSettingsAsyncOptions): DynamicModule {
    return {
      module: SwappableSettingsModule,
      imports: storageOptions.imports || [],
      providers: [
        {
          provide: SWAPPABLE_SETTINGS_STORAGE_CLIENT,
          useFactory: (factoryOptions) => factoryOptions,
        },
        SwappableSettingsService,
      ],
      exports: [
        SwappableSettingsService,
      ],
    };
  }
}
