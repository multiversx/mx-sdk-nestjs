import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";
export class RangeGreaterThanOrEqual extends QueryRange {
  constructor(value: string | number, withType: RangeDataType = RangeDataType.number) {
    super('gte', withType === RangeDataType.string ? value.toString() : value, withType);
  }
}
