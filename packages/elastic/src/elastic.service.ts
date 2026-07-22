import { BadRequestException, forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { MetricsService, ElasticMetricType, PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { ElasticQuery } from "./entities/elastic.query";
import { ElasticModuleOptions } from "./entities/elastic.module.options";

@Injectable()
export class ElasticService {
  constructor(
    private readonly options: ElasticModuleOptions,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) { }

  private buildElasticUrl(baseUrl: string, pathSegments: string[], queryParams?: Record<string, string | number | boolean | undefined>): string {
    // Build URLs through the URL API so path segments are encoded instead of concatenated raw.
    const parsedUrl = new URL(baseUrl);

    const basePath = parsedUrl.pathname.endsWith('/') ? parsedUrl.pathname.slice(0, -1) : parsedUrl.pathname;
    const encodedPath = pathSegments.map(segment => encodeURIComponent(segment)).join('/');

    parsedUrl.pathname = [basePath, encodedPath].filter(Boolean).join('/');
    parsedUrl.search = '';
    parsedUrl.hash = '';

    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        if (value !== undefined) {
          parsedUrl.searchParams.set(key, String(value));
        }
      }
    }

    return parsedUrl.toString();
  }

  private assertSafeFieldName(fieldName: string, fieldContext: string): string {
    // Reject names that could turn into prototype pollution or nested field injection.
    if (!fieldName) {
      throw new BadRequestException(`${fieldContext} must not be empty`);
    }

    if (fieldName === '__proto__' || fieldName === 'prototype' || fieldName === 'constructor') {
      throw new BadRequestException(`${fieldContext} contains an unsafe field name`);
    }

    if (fieldName.includes('.')) {
      throw new BadRequestException(`${fieldContext} must not contain dots`);
    }

    return fieldName;
  }

  async getCount(collection: string, elasticQuery: ElasticQuery | undefined = undefined) {
    const url = this.buildElasticUrl(this.options.url, [collection, '_count']);

    const profiler = new PerformanceProfiler();

    const result: any = await this.post(url, elasticQuery?.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.count, profiler.duration);

    const count = result.data.count;

    return count;
  }

  async getItem(collection: string, key: string, identifier: string) {
    const url = this.buildElasticUrl(this.options.url, [collection, '_search']);

    const profiler = new PerformanceProfiler();

    // Keep the lookup in the request body so identifier content cannot break the query string.
    const result = await this.post(url, {
      query: {
        term: {
          _id: identifier,
        },
      },
    });

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
    const { _id, _source, sort } = document;
    const item: any = {};
    item[key] = _id;

    const result = { ...item, ..._source };

    if (sort !== undefined) {
      result.searchAfter = this.encodeCursor(sort);
    }

    return result;
  }

  private async getListResult(url: string, elasticQuery: ElasticQuery, searchAfter?: string | any[]) {
    if (searchAfter) {
      return this.getScrollAfterResult(url, elasticQuery, this.decodeCursor(searchAfter));
    }

    const elasticQueryJson: any = elasticQuery.toJson();

    const result = await this.post(url, elasticQueryJson);
    return result.data.hits.hits;
  }

  private async getScrollAfterResult(url: string, elasticQuery: ElasticQuery, searchAfter: any[]) {
    const elasticQueryJson: any = elasticQuery.toJson();

    // search_after replaces offset pagination; ES rejects from > 0 alongside it
    elasticQueryJson.search_after = searchAfter;
    delete elasticQueryJson.from;

    const queryResult = await this.post(url, elasticQueryJson);
    return queryResult.data.hits.hits;
  }

  private formatDocuments(documents: any[], key: string): any[] {
    return documents.map((document: any) => this.formatItem(document, key));
  }

  private encodeCursor(sort: any[]): string {
    return Buffer.from(JSON.stringify(sort), 'utf8').toString('base64');
  }

  private decodeCursor(searchAfter: string | any[]): any[] {
    if (Array.isArray(searchAfter)) {
      return searchAfter;
    }

    try {
      const decoded = JSON.parse(Buffer.from(searchAfter, 'base64').toString('utf8'));
      if (!Array.isArray(decoded)) {
        throw new Error('Invalid cursor payload');
      }

      return decoded;
    } catch {
      throw new BadRequestException('Invalid searchAfter');
    }
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string, searchAfter?: string | any[]): Promise<any[]> {
    const url = this.buildElasticUrl(overrideUrl ?? this.options.url, [collection, '_search']);

    const profiler = new PerformanceProfiler();

    const documents = await this.getListResult(url, elasticQuery, searchAfter);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    return this.formatDocuments(documents, key);
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>, options?: { scrollTimeout?: string, delayBetweenScrolls?: number }): Promise<void> {
    const scrollTimeout = options?.scrollTimeout ?? '1m';

    const url = this.buildElasticUrl(this.options.url, [collection, '_search'], { scroll: scrollTimeout });

    const profiler = new PerformanceProfiler();

    const result = await this.post(url, elasticQuery.toJson());
    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    const documents = result.data.hits.hits;
    const scrollId = result.data._scroll_id;

    try {
      await action(documents.map((document: any) => this.formatItem(document, key)));

      while (true) {
        const scrollProfiler = new PerformanceProfiler();

        const scrollResult = await this.post(this.buildElasticUrl(this.options.url, ['_search', 'scroll']), {
          scroll: scrollTimeout,
          scroll_id: scrollId,
        });

        scrollProfiler.stop();
        this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

        const scrollDocuments = scrollResult.data.hits.hits;
        if (scrollDocuments.length === 0) {
          break;
        }

        await action(scrollDocuments.map((document: any) => this.formatItem(document, key)));

        if (options?.delayBetweenScrolls) {
          await new Promise(resolve => setTimeout(resolve, options.delayBetweenScrolls));
        }
      }
    } finally {
      await this.delete(this.buildElasticUrl(this.options.url, ['_search', 'scroll']), {
        scroll_id: scrollId,
      });
    }
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    const customValuePrefix = this.options.customValuePrefix;
    if (!customValuePrefix) {
      throw new Error('Custom value prefix not defined in the elastic service options');
    }

    const url = this.buildElasticUrl(this.options.url, [collection, '_search']);

    const profiler = new PerformanceProfiler();
    // The final stored field name is still validated after prefixing to avoid unsafe mapping keys.
    const fullAttribute = this.assertSafeFieldName(customValuePrefix + '_' + this.assertSafeFieldName(attribute, 'Attribute'), 'Custom value field');

    const payload = {
      query: {
        term: {
          _id: identifier,
        },
      },
      _source: fullAttribute,
    };

    const result = await this.post(url, payload);

    profiler.stop();
    this.metricsService.setElasticDuration(collection, ElasticMetricType.item, profiler.duration);

    const hits = result.data?.hits?.hits;
    if (hits && hits.length > 0) {
      const document = hits[0];

      return document._source[fullAttribute];
    }

    return null;
  }

  async setCustomValues<T>(collection: string, identifier: string, dict: Record<string, T>): Promise<void> {
    const customValuePrefix = this.options.customValuePrefix;
    if (!customValuePrefix) {
      throw new Error('Custom value prefix not defined in the elastic service options');
    }

    const url = this.buildElasticUrl(this.options.url, [collection, '_update', identifier]);

    const profiler = new PerformanceProfiler();

    // Use a null-prototype object so malicious keys cannot inherit Object.prototype behavior.
    const doc: Record<string, T> = Object.create(null) as Record<string, T>;
    for (const [key, value] of Object.entries(dict)) {
      const fullAttribute = this.assertSafeFieldName(customValuePrefix + '_' + this.assertSafeFieldName(key, 'Custom value key'), 'Custom value field');
      doc[fullAttribute] = value;
    }

    const payload = { doc };

    await this.post(url, payload);

    profiler.stop();
    this.metricsService.setElasticDuration(collection, ElasticMetricType.item, profiler.duration);
  }

  async setCustomValue<T>(collection: string, identifier: string, attribute: string, value: T): Promise<void> {
    const customValuePrefix = this.options.customValuePrefix;
    if (!customValuePrefix) {
      throw new Error('Custom value prefix not defined in the elastic service options');
    }

    const url = this.buildElasticUrl(this.options.url, [collection, '_update', identifier]);

    const profiler = new PerformanceProfiler();
    // The single-field update uses the same validation as the bulk update path.
    const fullAttribute = this.assertSafeFieldName(customValuePrefix + '_' + this.assertSafeFieldName(attribute, 'Attribute'), 'Custom value field');

    const payload = {
      doc: Object.create(null) as Record<string, T>,
    };

    payload.doc[fullAttribute] = value;

    await this.post(url, payload);

    profiler.stop();
    this.metricsService.setElasticDuration(collection, ElasticMetricType.item, profiler.duration);
  }

  public async get(url: string) {
    return await this.apiService.get(url);
  }

  public async post(url: string, body: any) {
    return await this.apiService.post(url, body);
  }

  public async delete(url: string, body: any) {
    return await this.apiService.delete(url, body);
  }
}
