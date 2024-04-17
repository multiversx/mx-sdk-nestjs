import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseConfigUtils } from "./base.config.utils";

@Injectable()
export class BaseConfigService {
  constructor(protected readonly configService: ConfigService) { }

  get<T = any>(key: string): T | undefined {
    const keyOverride = BaseConfigUtils.getKeyOverride(key, (key) => this.configService.get(key));
    if (keyOverride !== undefined) {
      return keyOverride as T;
    }

    const configValue = this.configService.get<T>(key);

    const valueOverride = BaseConfigUtils.getValueOverride(key, configValue, (key) => this.configService.get(key));
    if (valueOverride !== undefined) {
      return valueOverride as T;
    }

    return configValue;
  }
}
