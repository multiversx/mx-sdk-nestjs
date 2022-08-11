import { TokenUtils } from "../utils/token.utils";
import { ParseRegexPipe } from "./parse.regex.pipe";

export class ParseNftPipe extends ParseRegexPipe {
  constructor() {
    super(TokenUtils.nftValidateRegex, 'Invalid NFT identifier');
  }
}
