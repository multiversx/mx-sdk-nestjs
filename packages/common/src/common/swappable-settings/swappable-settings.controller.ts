import { Body, Controller, Post, Delete, Param, Get } from '@nestjs/common';
import { SwappableSettingsService } from './swappable-settings.service';

@Controller()
export class SwappableSettingsController {
  constructor(
    private readonly swappableSettingsService: SwappableSettingsService,
  ) { }

  @Post('/swappable-settings')
  setSetting(
    @Body() body: { key: string, value: string },
  ): Promise<any> {
    return this.swappableSettingsService.set(body.key, body.value);
  }

  @Get('/swappable-settings/:key')
  getSetting(
    @Param('key') key: string,
  ): Promise<any> {
    return this.swappableSettingsService.get(key);
  }

  @Delete('/swappable-settings/:key')
  deleteSetting(
    @Param('key') key: string,
  ): Promise<any> {
    return this.swappableSettingsService.delete(key);
  }
}
