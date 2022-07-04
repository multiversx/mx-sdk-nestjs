export class DateUtils {
  static create(year: number, month?: number, day?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number): Date {
    return new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, seconds ?? 0, milliseconds ?? 0);
  }
}
