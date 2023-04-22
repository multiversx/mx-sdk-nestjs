export class ParseArrayPipeOptions {
  maxArraySize?: number;
  allowEmptyString: boolean;

  constructor(allowEmptyString: boolean = false, maxArraySize?: number) {
    this.allowEmptyString = allowEmptyString;
    this.maxArraySize = maxArraySize;
  }
}