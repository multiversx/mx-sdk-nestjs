import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";

export class RangeGreaterThan extends QueryRange {
  constructor(value: number, type: RangeDataType = RangeDataType.number) {
    super('gt', value, type);
  }
}
