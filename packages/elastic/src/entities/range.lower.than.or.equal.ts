import { QueryRange } from "./query.range";

export class RangeLowerThanOrEqual extends QueryRange {
  constructor(value: number) {
    super('lte', value);
  }
}
