import { Logger } from "@nestjs/common";

export class LoggerInitializer {
  static initialize(logger: Logger) {
    Logger.overrideLogger(logger);
  }
}
