import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiService } from "../api/api.service";
import { PerformanceProfiler } from "../../utils/performance.profiler";
import { MetricsService } from "src/common/metrics/metrics.service";
import { NestjsApiConfigService } from "../api-config/nestjs.api.config.service";
import { ElasticQuery } from "./entities/elastic.query";
import { ElasticMetricType } from "../metrics/entities/elastic.metric.type";

@Injectable()
export class ElasticService {
  private readonly url: string;

  constructor(
    private apiConfigService: NestjsApiConfigService,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService
  ) {
    this.url = apiConfigService.getElasticUrl();
  }

  async getCount(collection: string, elasticQuery: ElasticQuery | undefined = undefined) {
    const url = `${this.apiConfigService.getElasticUrl()}/${collection}/_count`;

    const profiler = new PerformanceProfiler();

    const result: any = await this.post(url, elasticQuery?.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.count, profiler.duration);

    const count = result.data.count;

    return count;
  }

  async getItem(collection: string, key: string, identifier: string) {
    const url = `${this.url}/${collection}/_search?q=_id:${identifier}`;

    const profiler = new PerformanceProfiler();

    const result = await this.get(url);

    profiler.stop();
    this.metricsService.setElasticDuration(collection, ElasticMetricType.item, profiler.duration);

    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const document = hits[0];

      return this.formatItem(document, key);
    }

    return undefined;
  }

  private formatItem(document: any, key: string) {
    const { _id, _source } = document;
    const item: any = {};
    item[key] = _id;

    return { ...item, ..._source };
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    const url = `${overrideUrl ?? this.url}/${collection}/_search`;

    const profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    const documents = result.data.hits.hits;
    return documents.map((document: any) => this.formatItem(document, key));
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>): Promise<void> {
    const url = `${this.url}/${collection}/_search?scroll=10m`;

    const profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    const documents = result.data.hits.hits;
    const scrollId = result.data._scroll_id;

    await action(documents.map((document: any) => this.formatItem(document, key)));

    while (true) {
      const scrollProfiler = new PerformanceProfiler();

      const scrollResult = await this.post(`${this.url}/_search/scroll`, {
        scroll: '20m',
        scroll_id: scrollId,
      });

      scrollProfiler.stop();
      this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

      const scrollDocuments = scrollResult.data.hits.hits;
      if (scrollDocuments.length === 0) {
        break;
      }

      await action(scrollDocuments.map((document: any) => this.formatItem(document, key)));
    }
  }

  public async get(url: string) {
    return await this.apiService.get(url);
  }

  public async post(url: string, body: any) {
    return await this.apiService.post(url, body);
  }
}
