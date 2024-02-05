import { RangeDataType } from "./range.data.type.enum";

export abstract class QueryRange {
  constructor(
    readonly key: string,
    readonly value: string | number,
    readonly type: RangeDataType = RangeDataType.number
  ) { }
}
