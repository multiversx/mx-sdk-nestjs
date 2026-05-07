import { Inject } from '@nestjs/common';
import { SwappableSettingsService } from '../common/swappable-settings';

export function SwappableSetting(settingKey: string) {
  const swappableSettingsServiceInjector = Inject(SwappableSettingsService);

  return function (
    target: Object,
    _key: string | symbol,
    descriptor: PropertyDescriptor,
  ) {
    swappableSettingsServiceInjector(target, 'swappableSettingsService');

    const childMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      //@ts-ignore
      const swappableSettingsService: SwappableSettingsService = this.swappableSettingsService;
      const setting = await swappableSettingsService.get(settingKey);
      if (setting) {
        return setting;
      }

      return await childMethod.apply(this, args);
    };
    return descriptor;
  };
}
