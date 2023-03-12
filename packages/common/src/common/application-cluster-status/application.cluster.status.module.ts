import { Module } from "@nestjs/common";
import { ApplicationClusterStatusController } from "./application.cluster.controller";
import { ApplicationClusterStatusService } from "./application.cluster.status.service";

@Module({
  controllers: [
    ApplicationClusterStatusController,
  ],
  providers: [
    ApplicationClusterStatusService,
  ],
  exports: [
    ApplicationClusterStatusService,
  ],
})
export class ApplicationClusterStatusModule { }

