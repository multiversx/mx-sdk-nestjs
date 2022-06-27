import { Constants } from "../../../utils/constants";

export class CacheValue {
  value?: string;
  ttl: number = Constants.oneSecond() * 6;
}
