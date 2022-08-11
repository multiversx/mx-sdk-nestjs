import { TokenUtils } from "../utils/token.utils";
import { ParseRegexPipe } from "./parse.regex.pipe";

export class ParseCollectionPipe extends ParseRegexPipe {
  constructor() {
    super(TokenUtils.tokenValidateRegex, 'Invalid collection identifier');
  }
}
