import * as crypto from 'crypto-js';

export class PendingExecuter {
  private dictionary: Record<string, Promise<any>> = {};

  constructor(
    private readonly executer?: (value: any) => Promise<any>,
  ) { }

  async execute<TOut>(
    value: any,
    executer?: (value: any) => Promise<TOut>,
  ): Promise<TOut> {
    const localExecuter = executer ?? this.executer;
    if (!localExecuter) {
      throw new Error('No Executor passed.');
    }
    const key = crypto.MD5(JSON.stringify(value)).toString();

    const pendingRequest = this.dictionary[key];
    if (pendingRequest) {
      return await pendingRequest;
    }

    try {
      return await (this.dictionary[key] = localExecuter(value));
    } finally {
      delete this.dictionary[key];
    }
  }
}
