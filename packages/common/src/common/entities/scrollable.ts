class ScrollableSettings {
  collection: string = '';

  constructor(init?: Partial<ScrollableSettings>) {
    Object.assign(this, init);
  }
}

export class ScrollableCreateSettings extends ScrollableSettings {
  create: boolean = false;

  constructor(init?: Partial<ScrollableCreateSettings>) {
    super(init);
    Object.assign(this, init);
  }
}

export class ScrollableAfterSettings extends ScrollableSettings {
  after: any;
  ids: any[] = [];

  constructor(init?: Partial<ScrollableAfterSettings>) {
    super(init);
    Object.assign(this, init);
  }
}
