import { QueryRange } from "./query.range";

export class RangeGreaterThanOrEqual extends QueryRange {
  constructor(value: number) {
    super('gte', value);
  }
}