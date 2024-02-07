import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";
export class RangeGreaterThanOrEqual extends QueryRange {
  constructor(value: number, type: RangeDataType = RangeDataType.number) {
    super('gte', value, type);
  }
}
