import { forwardRef, Inject, Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import Agent from "agentkeepalive";
import { PerformanceProfiler, MetricsService } from "@multiversx/sdk-nestjs-monitoring";
import { ApiSettings } from "./entities/api.settings";
import { ApiModuleOptions } from "./entities/api.module.options";
import { ContextTracker, PendingExecuter } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class ApiService {
  private readonly defaultTimeout: number = 30000;
  private keepaliveAgent: Agent | undefined | null = null;

  private readonly axiosInstance: AxiosInstance;
  private static concurrentRequests: number = 0;

  constructor(
    private readonly options: ApiModuleOptions,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) {
    this.axiosInstance = axios.create({
      httpAgent: this.getKeepAliveAgent(),
      transformResponse: [
        (data) => {
          try {
            return JSON.parse(data);
          } catch (error) {
            return data;
          }
        },
      ],
    });

    if (options.logConnectionKeepAlive) {
      const logger = new Logger(ApiService.name);

      this.axiosInstance.interceptors.request.use(request => {
        logger.log(`URL: ${request.url}, Request Headers: ${request.headers['connection'] ?? 'Not set'}`);
        return request;
      });

      this.axiosInstance.interceptors.response.use(response => {
        logger.log(`URL: ${response.config?.url}, Response Headers: ${response.headers['connection'] ?? 'Not set'}`);
        return response;
      });
    }
  }

  private getKeepAliveAgent(): Agent | undefined {
    if (this.keepaliveAgent === null) {
      if (this.options.useKeepAliveAgent) {
        this.keepaliveAgent = new Agent({
          keepAlive: true,
          maxSockets: Infinity,
          maxFreeSockets: this.options.keepAliveMaxFreeSockets ?? 10,
          timeout: this.options.axiosTimeout, // active socket keepalive
          freeSocketTimeout: this.options.keepAliveFreeSocketTimeout ?? 30000, // free socket keepalive for 30 seconds
        });
      } else {
        this.keepaliveAgent = undefined;
      }
    }

    return this.keepaliveAgent;
  }

  private async getConfig(settings: ApiSettings): Promise<AxiosRequestConfig> {
    const timeout = settings.timeout || this.defaultTimeout;
    const maxRedirects = settings.skipRedirects === true ? 0 : undefined;

    const headers = settings.headers ?? {};

    if (this.options.useKeepAliveHeader) {
      headers['connection'] = 'keep-alive';
    }

    const rateLimiterSecret = this.options.rateLimiterSecret;
    if (rateLimiterSecret) {
      headers['x-rate-limiter-secret'] = rateLimiterSecret;
    }

    if (settings.nativeAuthSigner) {
      const accessTokenInfo = await settings.nativeAuthSigner.getToken();
      headers['authorization'] = `Bearer ${accessTokenInfo.token}`;
    }

    const context = ContextTracker.get();
    if (context && context.requestId) {
      headers['x-request-id'] = context.requestId;
    }

    const config: AxiosRequestConfig = {
      timeout,
      maxRedirects,
      httpsAgent: settings.httpsAgent,
      responseType: settings.responseType,
      auth: settings.auth,
      params: settings.params,
      headers,
    };

    if (settings.validateStatus) {
      config.validateStatus = settings.validateStatus;
    }

    return config;
  }

  private requestsExecuter = new PendingExecuter();

  private incrementConcurrentRequests(url: string) {
    ApiService.concurrentRequests++;
    this.metricsService.setApiConcurrentRequests(url, ApiService.concurrentRequests);
  }

  private decrementConcurrentRequests(url: string) {
    ApiService.concurrentRequests--;
    this.metricsService.setApiConcurrentRequests(url, ApiService.concurrentRequests);
  }

  async get(url: string, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();
    const config = await this.getConfig(settings);
    this.incrementConcurrentRequests(this.getHostname(url));

    try {
      return await this.requestsExecuter.execute(url, async () => await this.axiosInstance.get(url, config));
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const customError = this.getCustomError('GET', url, null, error);

        const logger = new Logger(ApiService.name);
        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
      this.decrementConcurrentRequests(this.getHostname(url));
    }
  }

  async put(url: string, data: any, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();
    const config = await this.getConfig(settings);
    this.incrementConcurrentRequests(this.getHostname(url));

    try {
      return await this.axiosInstance.put(url, data, config);
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const logger = new Logger(ApiService.name);
        const customError = {
          method: 'PUT',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
      this.decrementConcurrentRequests(this.getHostname(url));
    }
  }

  async patch(url: string, data: any, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();
    const config = await this.getConfig(settings);
    this.incrementConcurrentRequests(this.getHostname(url));

    try {
      return await this.axiosInstance.patch(url, data, config);
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const logger = new Logger(ApiService.name);
        const customError = {
          method: 'PATCH',
          url,
          response: error.response?.data,
          status: error.response?.status,
          message: error.message,
          name: error.name,
        };

        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
      this.decrementConcurrentRequests(this.getHostname(url));
    }
  }

  async post(url: string, data: any, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();
    const config = await this.getConfig(settings);
    this.incrementConcurrentRequests(this.getHostname(url));

    try {
      const response = await this.axiosInstance.post(url, data, config);
      return response;
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const customError = this.getCustomError('POST', url, data, error);

        const logger = new Logger(ApiService.name);
        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
      this.decrementConcurrentRequests(this.getHostname(url));
    }
  }

  async delete(url: string, data: any, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();
    const config = await this.getConfig(settings);
    this.incrementConcurrentRequests(this.getHostname(url));

    try {
      const response = await this.axiosInstance.delete(url, {
        data,
        ...config,
      });
      return response;
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const customError = this.getCustomError('DELETE', url, data, error);

        const logger = new Logger(ApiService.name);
        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
      this.decrementConcurrentRequests(this.getHostname(url));
    }
  }

  async head(url: string, settings: ApiSettings = new ApiSettings(), errorHandler?: (error: any) => Promise<boolean>): Promise<any> {
    const profiler = new PerformanceProfiler();
    const config = await this.getConfig(settings);
    this.incrementConcurrentRequests(this.getHostname(url));

    try {
      const response = await this.axiosInstance.head(url, config);
      return response;
    } catch (error: any) {
      let handled = false;
      if (errorHandler) {
        handled = await errorHandler(error);
      }

      if (!handled) {
        const customError = this.getCustomError('HEAD', url, null, error);

        const logger = new Logger(ApiService.name);
        logger.error(customError);

        throw customError;
      }
    } finally {
      profiler.stop();
      this.metricsService.setExternalCall(this.getHostname(url), profiler.duration);
      this.decrementConcurrentRequests(this.getHostname(url));
    }
  }

  private getHostname(url: string): string {
    return new URL(url).hostname;
  }

  private getCustomError(method: string, url: string, data: any, error: any): any {
    return {
      method,
      url,
      body: data,
      response: error.response?.data,
      status: error.response?.status,
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
}
