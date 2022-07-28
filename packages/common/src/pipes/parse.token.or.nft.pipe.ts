import { TokenUtils } from "../utils/token.utils";
import { RegexPipe } from "./regex.pipe";

export class ParseTokenOrNftPipe extends RegexPipe {
  constructor() {
    super([TokenUtils.tokenValidateRegex, TokenUtils.nftValidateRegex], 'Invalid token / NFT identifier');
  }
}