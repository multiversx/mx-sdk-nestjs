import { QueryRange } from "./query.range";

export class RangeGreaterThan extends QueryRange {
  constructor(value: number) {
    super('gt', value);
  }
}