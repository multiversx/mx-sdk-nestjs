export class DateUtils {
  static createUTC(year: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number): Date {
    const date = new Date();
    date.setUTCFullYear(year, (month ?? 1) - 1, day ?? 1);
    date.setUTCHours(hours ?? 0, minutes ?? 0, seconds ?? 0, milliseconds ?? 0);

    return date;
  }

  static create(year: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number): Date {
    const date = new Date();
    date.setFullYear(year, (month ?? 1) - 1, day ?? 1);
    date.setHours(hours ?? 0, minutes ?? 0, seconds ?? 0, milliseconds ?? 0);

    return date;
  }
}
