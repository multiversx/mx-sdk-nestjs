import { TokenUtils } from "../utils/token.utils";
import { RegexPipe } from "./regex.pipe";

export class ParseTokenPipe extends RegexPipe {
  constructor() {
    super(TokenUtils.tokenValidateRegex, 'Invalid token identifier');
  }
}