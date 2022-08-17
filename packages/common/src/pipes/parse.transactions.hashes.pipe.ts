import { ParseHashArrayPipe } from "./parse.hash.array.pipe";

export class ParseTransactionsPipe extends ParseHashArrayPipe {
    constructor() {
        super('transactions', 64);
    }
}
