import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";

export class RangeLowerThan extends QueryRange {
  constructor(value: number, type: RangeDataType = RangeDataType.number) {
    super('lt', value, type);
  }
}
