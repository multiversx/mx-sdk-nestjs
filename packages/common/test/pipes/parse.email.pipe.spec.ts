import { BadRequestException } from "@nestjs/common";
import { EmailValidationPipe } from "../../src/pipes/parse.email.pipe"
describe('EmailValidationPipe', () => {
  let pipe: EmailValidationPipe;

  beforeEach(() => {
    pipe = new EmailValidationPipe();
  });

  it('should pass when a valid email is provided', () => {
    const email = 'test@example.com';
    const transformedValue = pipe.transform(email);
    expect(transformedValue).toBe(email);
  });

  it('should throw BadRequestException when an invalid email is provided', () => {
    const email = 'invalidemail';
    expect(() => {
      pipe.transform(email);
    }).toThrow(BadRequestException);
  });
});