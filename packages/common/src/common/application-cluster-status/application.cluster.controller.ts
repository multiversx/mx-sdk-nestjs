
import {
  Controller, Get,
} from '@nestjs/common';
import { ApplicationClusterStatusService } from './application.cluster.status.service';

@Controller({
  path: 'application-cluster-status',
  version: '1',
})
// @UseGuards(XPortalThrottlerGuard, NativeXPortalJwtGuard)
export class ApplicationClusterStatusController {
  constructor(
    private readonly applicationClusterStatusService: ApplicationClusterStatusService,
  ) { }

  @Get()
  getEconomics(): any {
    return this.applicationClusterStatusService.getData();
  }
}
