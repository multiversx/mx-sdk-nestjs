export enum GuestCacheMethodEnum {
  GET = 'GET',
  POST = 'POST'
}

export interface IGuestCacheEntity {
  method: GuestCacheMethodEnum;
  body?: any,
  path: string;
}

export interface IGuestCacheOptions {
  cacheTtl?: number,
  targetUrl: string,
  cacheTriggerHitsThreshold?: number;
}

export const DATE_FORMAT = "YYYY-MM-DD_HH:mm";
export const REDIS_PREFIX = "guestCache";
