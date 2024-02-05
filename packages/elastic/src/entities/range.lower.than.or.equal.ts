import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";
export class RangeLowerThanOrEqual extends QueryRange {
  constructor(value: string | number, withType: RangeDataType = RangeDataType.number) {
    super('lte', withType === RangeDataType.string ? value.toString() : value, withType);
  }
}
