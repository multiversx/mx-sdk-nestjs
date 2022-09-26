import { Logger, LoggerService } from "@nestjs/common";
import { ContextTracker } from "./context.tracker";

export class OriginLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(
    private readonly context: string
  ) {
    this.logger = new Logger();
  }

  private getContext(): string {
    let actualContext = this.context;

    const trackedContext = ContextTracker.get();
    if (trackedContext && trackedContext.origin) {
      actualContext += ':' + trackedContext.origin;
    }

    return actualContext;
  }

  log(message: any, ..._optionalParams: any[]) {
    this.logger.log(message, this.getContext());
  }

  error(message: any, ..._optionalParams: any[]) {
    this.logger.error(message, message.stack ?? new Error().stack, this.getContext());
  }

  warn(message: any, ..._optionalParams: any[]) {
    this.logger.warn(message, this.getContext());
  }
}
