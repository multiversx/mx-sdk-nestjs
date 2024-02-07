import { RangeDataType } from "./range.data.type.enum";

export abstract class QueryRange {
  constructor(
    readonly key: string,
    readonly value: number,
    readonly type: RangeDataType = RangeDataType.number
  ) { }
}
