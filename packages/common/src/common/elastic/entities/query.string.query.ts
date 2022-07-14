import {AbstractQuery} from "./abstract.query";

export class QueryStringQuery extends AbstractQuery {
  constructor(
    private readonly key: string | string[],
    private readonly value: number | undefined,
  ) {
    super();
  }

  getQuery(): any {

    if (this.key instanceof Array) {
      return { query_string: { query: this.value, fields: this.key } };
    }

    return { query_string: { query: this.value, default_field: this.key } };
  }
}
