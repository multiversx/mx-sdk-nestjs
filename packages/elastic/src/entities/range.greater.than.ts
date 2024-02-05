import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";

export class RangeGreaterThan extends QueryRange {
  constructor(value: string | number, withType: RangeDataType = RangeDataType.number) {
    super('gt', withType === RangeDataType.string ? value.toString() : value, withType);
  }
}
