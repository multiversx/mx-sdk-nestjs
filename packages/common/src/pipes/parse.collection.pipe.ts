import { TokenUtils } from "../utils/token.utils";
import { RegexPipe } from "./regex.pipe";

export class ParseCollectionPipe extends RegexPipe {
  constructor() {
    super(TokenUtils.tokenValidateRegex, 'Invalid collection identifier');
  }
}
