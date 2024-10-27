export class ScrollableOptions {
  collection: string = '';

  constructor(init?: Partial<ScrollableOptions>) {
      Object.assign(this, init);
  }
}

export class ScrollableCreateOptions extends ScrollableOptions {
  create: boolean = false;

  constructor(init?: Partial<ScrollableCreateOptions>) {
      super(init);
      Object.assign(this, init);
  }
}

export class ScrollableAfterOptions extends ScrollableOptions {
  after: any;
  ids: any[] = [];

  constructor(init?: Partial<ScrollableAfterOptions>) {
    super(init);
    Object.assign(this, init);
  }
}
