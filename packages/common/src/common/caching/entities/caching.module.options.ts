export class CachingModuleOptions {
  constructor(init?: Partial<CachingModuleOptions>) {
    Object.assign(this, init);
  }

  url: string = '';

  port: number = 6379;

  poolLimit: number = 100;

  processTtl: number = 60;
}
