export class ApiModuleOptions {
  constructor(init?: Partial<ApiModuleOptions>) {
    Object.assign(this, init);
  }

  useKeepAliveAgent: boolean = true;

  axiosTimeout: number = 61000;

  serverTimeout: number = 60000;

  rateLimiterSecret?: string;

  maxContentLength: number = 2000;
}
