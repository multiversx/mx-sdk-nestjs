import { ParseHashArrayPipe } from "./parse.hash.array.pipe";

export class ParseTranasctionHashArrayPipe extends ParseHashArrayPipe {
  constructor() {
    super('transaction', 64);
  }
}
