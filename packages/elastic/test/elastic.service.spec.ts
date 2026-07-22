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
});
