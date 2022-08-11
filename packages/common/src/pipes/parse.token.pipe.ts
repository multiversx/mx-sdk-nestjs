import { TokenUtils } from "../utils/token.utils";
import { ParseRegexPipe } from "./parse.regex.pipe";

export class ParseTokenPipe extends ParseRegexPipe {
  constructor() {
    super(TokenUtils.tokenValidateRegex, 'Invalid token identifier');
  }
}
