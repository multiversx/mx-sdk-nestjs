import { QueryRange } from "./query.range";

export class RangeLowerThan extends QueryRange {
  constructor(value: number) {
    super('lt', value);
  }
}