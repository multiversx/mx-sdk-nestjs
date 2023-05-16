import { isRabbitContext } from '@golevelup/nestjs-rabbitmq';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RabbitContextCheckerService {
  check(context: ExecutionContext): boolean {
    return isRabbitContext(context);
  }
}
