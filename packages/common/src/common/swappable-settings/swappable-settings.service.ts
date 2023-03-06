import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '../caching/redis-cache';

@Injectable()
export class SwappableSettingsService {
  constructor(
    private readonly redisCacheService: RedisCacheService,
  ) { }

  public async get(key: string): Promise<any | null> {
    return await this.redisCacheService.get(key);
  }

  public async set(key: string, value: string): Promise<void> {
    await this.redisCacheService.set(key, value);
  }

  public async delete(key: string): Promise<void> {
    await this.redisCacheService.delete(key);
  }
}
