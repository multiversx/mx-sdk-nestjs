import { TokenUtils } from "../utils/token.utils";
import { RegexPipe } from "./regex.pipe";

export class ParseNftPipe extends RegexPipe {
  constructor() {
    super(TokenUtils.tokenValidateRegex, 'Invalid NFT identifier');
  }
}