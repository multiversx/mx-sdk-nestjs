export class PendingExecuter {
  private readonly dictionary: Record<string, Promise<any>> = {};

  async execute<TOut>(
    key: string,
    executer: () => Promise<TOut>,
  ): Promise<TOut> {
    const pendingRequest = this.dictionary[key];
    if (pendingRequest) {
      return await pendingRequest;
    }

    try {
      return await (this.dictionary[key] = executer());
    } finally {
      delete this.dictionary[key];
    }
  }
}
