import { Inject, Injectable } from '@nestjs/common';
import { SWAPPABLE_SETTINGS_STORAGE_CLIENT } from './entities/constants';
import { SwappableSettingsStorageInterface } from './entities/swappable-settings-storage.interface';

@Injectable()
export class SwappableSettingsService {
  private readonly prefix = 'swappable-setting:';

  constructor(
    @Inject(SWAPPABLE_SETTINGS_STORAGE_CLIENT) private readonly storage: SwappableSettingsStorageInterface,
  ) { }

  public async get(key: string): Promise<any | null> {
    const data = await this.storage.get(`${this.prefix}${key}`);
    return data;
  }

  public async set(key: string, value: string, redisEx?: string, redisTtl?: number): Promise<void> {
    await this.storage.set(`${this.prefix}${key}`, value, redisEx, redisTtl);
  }

  public async delete(key: string): Promise<void> {
    await this.storage.delete(`${this.prefix}${key}`);
  }
}
