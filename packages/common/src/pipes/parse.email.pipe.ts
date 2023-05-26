import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import isEmail from 'validator/lib/isEmail';

@Injectable()
export class EmailValidationPipe implements PipeTransform {
  transform(value: any): string {
    if (!isEmail(value)) {
      throw new BadRequestException('Invalid email address');
    }
    return value;
  }
}
