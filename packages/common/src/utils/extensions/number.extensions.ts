Number.prototype.toRounded = function (digits?: number): number {
  return parseFloat(this.toFixed(digits ?? 0));
};

Number.prototype.in = function (...elements: number[]): boolean {
  return elements.includes(this.valueOf());
}

declare interface Number {
  toRounded(digits?: number): number;
  in(...elements: number[]): boolean;
}
