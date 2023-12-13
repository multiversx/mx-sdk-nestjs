import { AbstractQuery } from "./abstract.query"
import { ExistsQuery } from "./exists.query"
import { MatchQuery } from "./match.query"
import { MustQuery } from "./must.query"
import { NestedQuery } from "./nested.query"
import { QueryOperator } from "./query.operator"
import { QueryRange } from "./query.range"
import { RangeQuery } from "./range.query"
import { ShouldQuery } from "./should.query"
import { WildcardQuery } from "./wildcard.query"
import { StringQuery } from "./string.query"

export class QueryType {
  static Match = (key: string, value: any | undefined, operator: QueryOperator | undefined = undefined): MatchQuery => {
    return new MatchQuery(key, value, operator)
  }

  static Exists = (key: string): ExistsQuery => {
    return new ExistsQuery(key)
  }

  static Range = (key: string, ...ranges: QueryRange[]): RangeQuery => {
    return new RangeQuery(key, ranges)
  }

  static Wildcard = (key: string, value: string): WildcardQuery => {
    return new WildcardQuery(key, value)
  }

  static Nested = (key: string, value: MatchQuery[]): NestedQuery => {
    return new NestedQuery(key, value)
  }

  static Should = (queries: AbstractQuery[]): ShouldQuery => {
    return new ShouldQuery(queries)
  }

  static Must = (queries: AbstractQuery[], mustNotQueries: AbstractQuery[] = []): MustQuery => {
    return new MustQuery(queries, mustNotQueries)
  }

  static String = (key: string | string[], value: any | undefined): StringQuery => {
    return new StringQuery(key, value)
  }
}
