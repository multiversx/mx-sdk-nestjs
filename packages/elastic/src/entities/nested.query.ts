import { AbstractQuery } from "./abstract.query";
import { MatchQuery } from "./match.query";

export class NestedQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly value: MatchQuery[]
  ) {
    super();
  }

  getQuery(): any {
    return {
      nested: {
        path: this.key,
        query: {
          bool: {
            must: this.value.map((item) => item.getQuery()),
          },
        },
      },
    };
  }
}
