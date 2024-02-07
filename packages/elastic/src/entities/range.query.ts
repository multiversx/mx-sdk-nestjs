import { AbstractQuery } from "./abstract.query";
import { QueryRange } from "./query.range";

export class RangeQuery extends AbstractQuery {
  constructor(
    private readonly key: string,
    private readonly ranges: QueryRange[],
  ) {
    super();
  }

  getQuery(): any {
    const conditions: Record<string, string> = {};

    for (const range of this.ranges) {
      conditions[range.key] = range.value.toString();
    }

    return { range: { [this.key]: conditions } };
  }
}
