import { AbstractQuery } from './abstract.query';

export class PrefixQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: string,
  ) {
    super();
  }

  getQuery(): any {
    return {
      prefix: {
        [this.key]: {
          value: this.value,
          case_insensitive: true,
        },
      },
    };
  }
}
