export class ParseArrayPipeOptions {
  maxArraySize?: number;
  allowEmptyString: boolean;

  constructor(options: { allowEmptyString?: boolean; maxArraySize?: number } = {}) {
    this.allowEmptyString = options.allowEmptyString ?? false;
    this.maxArraySize = options.maxArraySize;
  }
}
