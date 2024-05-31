import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { ApiService } from "@multiversx/sdk-nestjs-http";
import { MetricsService, ElasticMetricType, PerformanceProfiler } from "@multiversx/sdk-nestjs-monitoring";
import { ElasticQuery } from "./entities/elastic.query";
import { ElasticModuleOptions } from "./entities/elastic.module.options";
import { ContextTracker } from "@multiversx/sdk-nestjs-common";

@Injectable()
export class ElasticService {
  constructor(
    private readonly options: ElasticModuleOptions,
    @Inject(forwardRef(() => ApiService))
    private readonly apiService: ApiService,
    @Inject(forwardRef(() => MetricsService))
    private readonly metricsService: MetricsService,
  ) { }

  async getCount(collection: string, elasticQuery: ElasticQuery | undefined = undefined) {
    const url = `${this.options.url}/${collection}/_count`;

    const profiler = new PerformanceProfiler();

    const result: any = await this.post(url, elasticQuery?.toJson());

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.count, profiler.duration);

    const count = result.data.count;

    return count;
  }

  async getItem(collection: string, key: string, identifier: string) {
    const url = `${this.options.url}/${collection}/_search?q=_id:${identifier}`;

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

  private async getListResult(url: string, collection: string, elasticQuery: ElasticQuery) {
    const scrollSettings = ContextTracker.get()?.scrollSettings;

    const elasticQueryJson: any = elasticQuery.toJson();
    if (scrollSettings && scrollSettings.scrollCollection === collection) {
      let documents: any[] = [];

      if (scrollSettings.scrollAfter) {
        documents = await this.getScrollAfterResult(url, elasticQuery, scrollSettings.scrollAfter, scrollSettings.ids, elasticQuery.pagination?.size ?? 25);
      } else if (scrollSettings.scrollAt) {
        documents = await this.getScrollAtResult(url, elasticQuery, scrollSettings.scrollAt);
      } else if (scrollSettings.scrollCreate) {
        documents = await this.getScrollCreateResult(url, elasticQuery);
      } else {
        throw new Error('Invalid scroll settings');
      }

      this.storeScrollResult(documents);
    }

    const result = await this.post(url, elasticQueryJson);
    return result.data.hits.hits;
  }

  private async getScrollCreateResult(url: string, elasticQuery: ElasticQuery) {
    const result = await this.post(url, elasticQuery.toJson());
    const documents = result.data.hits.hits;

    if (documents.length === 0) {
      return documents;
    }

    return documents;
  }

  private storeScrollResult(documents: any[]) {
    const ids = this.getLastIds(documents);
    const firstDocumentSort = documents[0].sort;
    const lastDocumentSort = documents[documents.length - 1].sort;

    // and store this in cache on a specific key
    ContextTracker.assign({
      scrollResult: {
        lastIds: ids,
        lastSort: lastDocumentSort,
        firstSort: firstDocumentSort,
      },
    });
  }

  private async getScrollAtResult(url: string, elasticQuery: ElasticQuery, scrollAt: any) {
    const elasticQueryJson: any = elasticQuery.toJson();
    elasticQueryJson.search_after = scrollAt;

    const result = await this.post(url, elasticQueryJson);
    return result.data.hits.hits;
  }

  private async getScrollAfterResult(url: string, elasticQuery: ElasticQuery, scrollAfter: any, ids: string[], size: number) {
    const MAX_SIZE = 10000;

    const elasticQueryJson: any = elasticQuery.toJson();

    elasticQueryJson.search_after = scrollAfter;
    elasticQueryJson.size += ids.length;

    let remainingSize = 0;
    if (elasticQueryJson.size > MAX_SIZE) {
      remainingSize = elasticQueryJson.size - MAX_SIZE;
      elasticQueryJson.size = MAX_SIZE;
    }

    const queryResult = await this.post(url, elasticQueryJson);
    const allDocuments = this.excludeIds(queryResult.data.hits.hits, ids, elasticQuery.pagination?.size);

    let result: any[] = [];

    if (remainingSize && allDocuments.length > 0) {
      ids = this.getLastIds(allDocuments);
      const lastDocumentSort = allDocuments[allDocuments.length - 1].sort;

      elasticQueryJson.size = remainingSize + ids.length;
      elasticQueryJson.search_after = lastDocumentSort;

      const remainingResult = await this.post(url, elasticQueryJson);
      const remainingDocuments = this.excludeIds(remainingResult.data.hits.hits, ids, remainingSize);

      result = allDocuments.concat(remainingDocuments);
    } else {
      result = allDocuments.slice(0, size);
    }

    return result;
  }

  private excludeIds(documents: any[], ids: string[], maxSize: number | undefined) {
    return documents.filter((document: any) => !ids.includes(document._id)).slice(0, maxSize ?? 25);
  }

  async getList(collection: string, key: string, elasticQuery: ElasticQuery, overrideUrl?: string): Promise<any[]> {
    const url = `${overrideUrl ?? this.options.url}/${collection}/_search`;

    // attempt to get scroll settings
    const profiler = new PerformanceProfiler();

    const documents = await this.getListResult(url, collection, elasticQuery);

    profiler.stop();

    this.metricsService.setElasticDuration(collection, ElasticMetricType.list, profiler.duration);

    return documents.map((document: any) => this.formatItem(document, key));
  }

  private getLastIds(documents: any[]) {
    const lastDocument = documents[documents.length - 1];
    const lastDocumentSort = lastDocument.sort;
    const lastDocumentSortJson = JSON.stringify(lastDocumentSort);

    // then take the ids of all elements that have the same sort
    const ids: string[] = [];

    for (let index = documents.length - 1; index >= 0; index--) {
      const document = documents[index];

      const documentSortJson = JSON.stringify(document.sort);

      if (documentSortJson === lastDocumentSortJson) {
        ids.push(document._id);
      } else {
        break;
      }
    }

    return ids;
  }

  async getScrollableList(collection: string, key: string, elasticQuery: ElasticQuery, action: (items: any[]) => Promise<void>, options?: { scrollTimeout?: string, delayBetweenScrolls?: number }): Promise<void> {
    const scrollTimeout = options?.scrollTimeout ?? '1m';

    const url = `${this.options.url}/${collection}/_search?scroll=${scrollTimeout}`;

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

        const scrollResult = await this.post(`${this.options.url}/_search/scroll`, {
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
      await this.delete(`${this.options.url}/_search/scroll`, {
        scroll_id: scrollId,
      });
    }
  }

  async getCustomValue(collection: string, identifier: string, attribute: string): Promise<any> {
    const customValuePrefix = this.options.customValuePrefix;
    if (!customValuePrefix) {
      throw new Error('Custom value prefix not defined in the elastic service options');
    }

    const url = `${this.options.url}/${collection}/_search?q=_id:${encodeURIComponent(identifier)}`;

    const profiler = new PerformanceProfiler();
    const fullAttribute = customValuePrefix + '_' + attribute;

    const payload = {
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

    const url = `${this.options.url}/${collection}/_update/${identifier}`;

    const profiler = new PerformanceProfiler();

    const doc: Record<string, T> = {};
    for (const [key, value] of Object.entries(dict)) {
      doc[customValuePrefix + '_' + key] = value;
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

    const url = `${this.options.url}/${collection}/_update/${identifier}`;

    const profiler = new PerformanceProfiler();
    const fullAttribute = customValuePrefix + '_' + attribute;

    const payload = {
      doc: {
        [fullAttribute]: value,
      },
    };

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
