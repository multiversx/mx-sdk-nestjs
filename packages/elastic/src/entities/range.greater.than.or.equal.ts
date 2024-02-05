import { QueryRange } from "./query.range";
import { RangeDataType } from "./range.data.type.enum";

export class RangeGreaterThanOrEqual extends QueryRange {
  constructor(value: string | number, withType: RangeDataType = RangeDataType.number) {
    if (withType === RangeDataType.string) {
      value = value.toString();
    }
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    super('gte', numericValue, withType);
  }
}
