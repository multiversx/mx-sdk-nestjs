export class ApiModuleOptions {
  constructor(init?: Partial<ApiModuleOptions>) {
    Object.assign(this, init);
  }

  useKeepAliveAgent: boolean = true;

  axiosTimeout: number = 61000;

  serverTimeout: number = 60000;

  maxContentLength: number = 2000;

  maxBodyLength: number = 2000;

  rateLimiterSecret?: string;
}
