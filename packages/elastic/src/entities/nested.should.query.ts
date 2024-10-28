import { AbstractQuery } from "./abstract.query";

export class NestedShouldQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: AbstractQuery[]
  ) {
    super();
  }

  getQuery(): any {
    return {
      nested: {
        path: this.key,
        query: {
          bool: {
            should: this.value.map((item) => item.getQuery()),
          },
        },
      },
    };
  }
}
