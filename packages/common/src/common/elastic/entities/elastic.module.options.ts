export class ElasticModuleOptions {
  constructor(init?: Partial<ElasticModuleOptions>) {
    Object.assign(this, init);
  }

  url: string = '';

  customValuePrefix?: string;
}
