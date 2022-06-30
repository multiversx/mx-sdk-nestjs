export class CachingModuleOptions {
  constructor(init?: Partial<CachingModuleOptions>) {
    Object.assign(this, init);
  }

  url: string = '';

  poolLimit: number = 100;

  processTtl: number = 60;
}