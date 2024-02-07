import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";
export class RangeLowerThanOrEqual extends QueryRange {
  constructor(value: number, type: RangeDataType = RangeDataType.number) {
    super('lte', value, type);
  }
}
