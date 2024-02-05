import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";

export class RangeLowerThan extends QueryRange {
  constructor(value: string | number, withType: RangeDataType = RangeDataType.number) {
    super('lt', withType === RangeDataType.string ? value.toString() : value, withType);
  }
}
