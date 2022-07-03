Date.prototype.isToday = function (): boolean {
  return this.toISODateString() === new Date().toISODateString();
};

Date.prototype.toISODateString = function (): string {
  return this.toISOString().slice(0, 10);
};

Date.prototype.isGreaterThan = function (other: Date): boolean {
  return this.getTime() > other.getTime();
};

Date.prototype.isLessThan = function (other: Date): boolean {
  return this.getTime() < other.getTime();
};

Date.prototype.startOfHour = function (): Date {
  const copy = new Date(this);
  copy.setUTCMinutes(0, 0, 0);

  return copy;
}

Date.prototype.startOfDay = function (): Date {
  const copy = new Date(this);
  copy.setUTCHours(0, 0, 0, 0);

  return copy;
}

Date.prototype.startOfMonth = function (): Date {
  const copy = new Date(this);
  copy.setDate(1);
  copy.setUTCHours(0, 0, 0, 0);

  return copy;
}

Date.prototype.startOfYear = function (): Date {
  const copy = new Date(this);
  copy.setMonth(0, 1);
  copy.setUTCHours(0, 0, 0, 0);

  return copy;
}

Date.prototype.addSeconds = function (seconds: number): Date {
  return new Date(this.getTime() + (seconds * 1000));
}

Date.prototype.addMinutes = function (minutes: number): Date {
  return new Date(this.getTime() + (minutes * 60 * 1000));
}

Date.prototype.addHours = function (hours: number): Date {
  return new Date(this.getTime() + (hours * 60 * 60 * 1000));
}

Date.prototype.addDays = function (days: number): Date {
  return new Date(this.getTime() + (days * 24 * 60 * 60 * 1000));
}

declare interface Date {
  toISODateString(): string;
  isToday(): boolean;
  isGreaterThan(other: Date): boolean;
  isLessThan(other: Date): boolean;
  startOfHour(): Date;
  startOfDay(): Date;
  startOfMonth(): Date;
  startOfYear(): Date;
  addSeconds(seconds: number): Date;
  addMinutes(minutes: number): Date;
  addHours(hours: number): Date;
  addDays(days: number): Date;
}
