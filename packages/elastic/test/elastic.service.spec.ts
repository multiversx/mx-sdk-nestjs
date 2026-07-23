import { BadRequestException } from "@nestjs/common";
import { ElasticService } from "../src/elastic.service";
import { ElasticModuleOptions } from "../src/entities/elastic.module.options";

describe('ElasticService security hardening', () => {
  const apiService = {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  };

  const metricsService = {
    setElasticDuration: jest.fn(),
  };

  const createService = (url = 'https://elastic.example.com/base') => new ElasticService(
    new ElasticModuleOptions({ url, customValuePrefix: 'meta' }),
    apiService as any,
    metricsService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encodes collection and identifier path segments before posting', async () => {
    apiService.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [],
        },
      },
    });

    const service = createService();

    await service.setCustomValue('index/name', 'id/with?special#chars', 'status', 'ok');

    expect(apiService.post).toHaveBeenCalledWith(
      'https://elastic.example.com/base/index%2Fname/_update/id%2Fwith%3Fspecial%23chars',
      {
        doc: expect.any(Object),
      },
    );

    expect(apiService.post.mock.calls[0][1].doc.meta_status).toBe('ok');
    expect(Object.getPrototypeOf(apiService.post.mock.calls[0][1].doc)).toBeNull();
  });

  it('preserves comma-separated multi-index collections in the built URL', async () => {
    apiService.post.mockResolvedValueOnce({
      data: {
        count: 0,
      },
    });

    const service = createService();

    await service.getCount('idx-a,idx-b');

    expect(apiService.post).toHaveBeenCalledWith(
      'https://elastic.example.com/base/idx-a,idx-b/_count',
      undefined,
    );
  });

  it('supports scheme-less configured base URLs without dropping request paths', async () => {
    apiService.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [],
        },
      },
    });

    const service = createService('localhost:9200');

    await service.getItem('index', 'id', '123');

    expect(apiService.post).toHaveBeenCalledWith(
      'localhost:9200/index/_search',
      {
        query: {
          term: {
            _id: '123',
          },
        },
      },
    );
  });

  it('uses a search body instead of a query string for item lookups', async () => {
    apiService.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [],
        },
      },
    });

    const service = createService();

    await service.getItem('index/name', 'id', 'abc/def');

    expect(apiService.post).toHaveBeenCalledWith(
      'https://elastic.example.com/base/index%2Fname/_search',
      {
        query: {
          term: {
            _id: 'abc/def',
          },
        },
      },
    );
  });

  it('rejects unsafe update field names that could pollute objects or create nested mappings', async () => {
    const service = createService();

    await expect(service.setCustomValue('index', 'id', '__proto__', 'value')).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.setCustomValue('index', 'id', 'nested.field', 'value')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a dotted custom field that would previously have reached Elasticsearch for a write operation', async () => {
    const service = createService();

    await expect(
      service.setCustomValues('index', 'id', {
        'profile.isAdmin': true as any,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('allows dotted custom fields on reads so existing stored data stays reachable', async () => {
    apiService.post.mockResolvedValueOnce({
      data: {
        hits: {
          hits: [
            {
              _source: {
                'meta_profile.role': 'admin',
              },
            },
          ],
        },
      },
    });

    const service = createService();

    await expect(service.getCustomValue('index', 'id', 'profile.role')).resolves.toBe('admin');

    expect(apiService.post).toHaveBeenCalledWith(
      'https://elastic.example.com/base/index/_search',
      {
        query: {
          term: {
            _id: 'id',
          },
        },
        _source: 'meta_profile.role',
      },
    );
  });

  it('builds bulk update payloads with a null prototype and prefixed keys', async () => {
    apiService.post.mockResolvedValueOnce({
      data: {
        result: 'updated',
      },
    });

    const service = createService();

    await service.setCustomValues('index', 'id', {
      status: 'ok',
      version: 2,
    });

    expect(apiService.post).toHaveBeenCalledWith(
      'https://elastic.example.com/base/index/_update/id',
      {
        doc: expect.any(Object),
      },
    );

    const doc = apiService.post.mock.calls[0][1].doc;
    expect(doc.meta_status).toBe('ok');
    expect(doc.meta_version).toBe(2);
    expect(Object.getPrototypeOf(doc)).toBeNull();
  });
});
