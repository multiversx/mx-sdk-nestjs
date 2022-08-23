Array.prototype.groupBy = function (predicate: Function, asArray = false) {
  let result = this.reduce(function (rv, x) {
    (rv[predicate(x)] = rv[predicate(x)] || []).push(x);
    return rv;
  }, {});

  if (asArray === true) {
    result = Object.keys(result).map(key => {
      return {
        key: key,
        values: result[key],
      };
    });
  }

  return result;
};

Array.prototype.selectMany = function (predicate: Function) {
  const result = [];

  for (const item of this) {
    result.push(...predicate(item));
  }

  return result;
};

Array.prototype.firstOrUndefined = function (predicate?: Function) {
  if (this.length === 0) {
    return undefined;
  }

  if (!predicate) {
    return this[0];
  }

  for (const item of this) {
    const result = predicate(item);
    if (result) {
      return item;
    }
  }

  return undefined;
};

Array.prototype.first = function (predicate?: Function) {
  if (this.length === 0) {
    throw new Error('Sequence contains no elements');
  }

  if (!predicate) {
    return this[0];
  }

  for (const item of this) {
    if (predicate(item)) {
      return item;
    }
  }

  throw new Error('Sequence contains no elements');
};

Array.prototype.lastOrUndefined = function (predicate?: Function) {
  if (this.length === 0) {
    return undefined;
  }

  if (!predicate) {
    return this[this.length - 1];
  }

  let lastItem = undefined;
  for (const item of this) {
    if (predicate(item)) {
      lastItem = item;
    }
  }

  return lastItem;
};

Array.prototype.single = function (predicate?: Function) {
  if (this.length === 0) {
    throw new Error('Invalid sequence size');
  }

  if (predicate) {
    let count = 0;
    let singleItem = undefined;
    for (const item of this) {
      if (predicate(item)) {
        count++;
        singleItem = item;

        if (count > 1) {
          throw new Error('Invalid sequence size');
        }
      }
    }

    if (singleItem === undefined) {
      throw new Error('Invalid sequence size');
    }

    return singleItem;
  }

  if (this.length > 1) {
    throw new Error('Invalid sequence size');
  }

  return this[0];
};

Array.prototype.singleOrUndefined = function (predicate?: Function) {
  if (this.length === 0) {
    return undefined;
  }

  if (predicate) {
    let count = 0;
    let singleItem = undefined;
    for (const item of this) {
      if (predicate(item)) {
        count++;
        singleItem = item;

        if (count > 1) {
          return undefined;
        }
      }
    }

    return singleItem;
  }

  if (this.length > 1) {
    return undefined;
  }

  return this[0];
};

Array.prototype.last = function (predicate?: Function) {
  if (this.length === 0) {
    throw new Error('Sequence contains no elements');
  }

  if (!predicate) {
    return this[this.length - 1];
  }

  let lastItem = undefined;
  let found = false;
  for (const item of this) {
    if (predicate(item)) {
      lastItem = item;
      found = true;
    }
  }

  if (!found) {
    throw new Error('Sequence contains no elements');
  }

  return lastItem;
};

Array.prototype.zip = function <TSecond, TResult>(second: TSecond[], predicate: Function): TResult[] {
  return this.map((element: any, index: number) => predicate(element, second[index]));
};

Array.prototype.remove = function <T>(element: T): number {
  const index = this.indexOf(element);
  if (index >= 0) {
    this.splice(index, 1);
  }

  return index;
};

Array.prototype.except = function <T>(second: T[]) {
  const missing: T[] = [];
  for (const item of this) {
    if (!second.includes(item)) {
      missing.push(item);
    }
  }

  return missing;
};

Array.prototype.distinct = function <TCollection, TResult>(predicate?: (element: TCollection) => TResult): TCollection[] {
  if (!predicate) {
    return [...new Set(this)];
  }

  const distinctProjections: TResult[] = [];
  const result: TCollection[] = [];

  for (const element of this) {
    const projection = predicate(element);
    if (!distinctProjections.includes(projection)) {
      distinctProjections.push(projection);
      result.push(element);
    }
  }

  return result;
};

Array.prototype.toRecord = function <TIN, TOUT>(keyPredicate: (item: TIN) => string, valuePredicate?: (item: TIN) => TOUT): Record<string, TOUT> {
  const result: Record<string, TOUT> = {};

  for (const item of this) {
    result[keyPredicate(item)] = valuePredicate ? valuePredicate(item) : item;
  }

  return result;
};

Array.prototype.toRecordAsync = async function <TIN, TOUT>(keyPredicate: (item: TIN) => string, valuePredicate: (item: TIN) => Promise<TOUT>): Promise<Record<string, TOUT>> {
  const result: Record<string, TOUT> = {};

  const values = await Promise.all(this.map(x => valuePredicate(x)));

  for (const [index, item] of this.entries()) {
    result[keyPredicate(item)] = values[index];
  }

  return result;
};

Array.prototype.sorted = function <T>(...predicates: ((item: T) => number)[]): T[] {
  const cloned = [...this];

  if (predicates.length > 0) {
    cloned.sort((a, b) => {
      for (const predicate of predicates) {
        const result = predicate(a) - predicate(b);
        if (Math.abs(result) <= 0.0000000000001) {
          continue;
        }

        return result;
      }

      return 0;
    });
  } else {
    cloned.sort((a, b) => a - b);
  }

  return cloned;
};

Array.prototype.sortedDescending = function <T>(...predicates: ((item: T) => number)[]): T[] {
  const sorted = this.sorted(...predicates);

  sorted.reverse();

  return sorted;
};

Array.prototype.sum = function <T>(predicate?: (item: T) => number): number {
  if (predicate) {
    return this.map(predicate).reduce((a, b) => a + b);
  }

  return this.reduce((a, b) => a + b);
};

Array.prototype.sumBigInt = function <T>(predicate?: (item: T) => bigint): bigint {
  if (predicate) {
    return this.map(predicate).reduce((a, b) => BigInt(a) + BigInt(b), BigInt(0));
  }

  return this.reduce((a, b) => BigInt(a) + BigInt(b), BigInt(0));
};

Array.prototype.remove = function <T>(element: T): void {
  let index = this.indexOf(element);
  while (index >= 0) {
    this.splice(index, 1);

    index = this.indexOf(element);
  }
};

declare interface Array<T> {
  groupBy(predicate: (item: T) => any): any;
  selectMany<TOUT>(predicate: (item: T) => TOUT[]): TOUT[];
  first(predicate?: (item: T) => boolean): T | undefined;
  firstOrUndefined(predicate?: (item: T) => boolean): T | undefined;
  last(predicate?: (item: T) => boolean): T | undefined;
  lastOrUndefined(predicate?: (item: T) => boolean): T | undefined;
  single(predicate?: (item: T) => boolean): T | undefined;
  singleOrUndefined(predicate?: (item: T) => boolean): T | undefined;
  zip<TSecond, TResult>(second: TSecond[], predicate: (first: T, second: TSecond) => TResult): TResult[];
  except(second: T[]): T[];
  distinct<TResult>(predicate?: (element: T) => TResult): T[];
  sorted(...predicates: ((item: T) => number)[]): T[];
  sortedDescending(...predicates: ((item: T) => number)[]): T[];
  sum(predicate?: (item: T) => number): number;
  sumBigInt(predicate?: (item: T) => bigint): bigint;
  toRecord<TOUT>(keyPredicate: (item: T) => string, valuePredicate?: (item: T) => TOUT): Record<string, TOUT>;
  toRecordAsync<TOUT>(keyPredicate: (item: T) => string, valuePredicate: (item: T) => Promise<TOUT>): Promise<Record<string, TOUT>>;
  remove(element: T): void;
}
