import { TokenUtils } from "../utils/token.utils";
import { ParseRegexPipe } from "./parse.regex.pipe";

export class ParseTokenOrNftPipe extends ParseRegexPipe {
  constructor() {
    super([TokenUtils.tokenValidateRegex, TokenUtils.nftValidateRegex], 'Invalid token / NFT identifier');
  }
}
