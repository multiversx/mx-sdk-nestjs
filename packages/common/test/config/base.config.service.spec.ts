import { ConfigService } from '@nestjs/config';
import { BaseConfigService } from '../../src/common/config';

describe('BaseConfigService', () => {
  let baseConfigService: BaseConfigService;
  let configServiceMock: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configServiceMock = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;

    baseConfigService = new BaseConfigService(configServiceMock);

    jest.resetAllMocks()
  });

  it('should be defined', () => {
    expect(baseConfigService).toBeDefined()
  })

  it('should retrieve a simple string value from config.yaml', () => {
    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('stringValue')

    const result = baseConfigService.get<string>('testString');
    expect(result).toBe('stringValue');
  });

  it('should retrieve a simple number value from config.yaml', () => {
    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce(42)

    const result = baseConfigService.get<string>('testNumber');
    expect(result).toBe(42);
  });

  it('should retrieve a string value from .env with and without the prefix', () => {
    configServiceMock.get.mockReturnValueOnce(undefined)  // no override
    configServiceMock.get.mockReturnValueOnce('${str:MY_PREFIXED_VALUE}')
    configServiceMock.get.mockReturnValueOnce('hello')

    let result = baseConfigService.get<number>('testPrefixed');
    expect(result).toBe('hello');

    configServiceMock.get.mockReturnValueOnce(undefined)  // no override
    configServiceMock.get.mockReturnValueOnce('${MY_UNPREFIXED_VALUE}')
    configServiceMock.get.mockReturnValueOnce('world')

    result = baseConfigService.get<number>('testNoPrefix');
    expect(result).toBe('world');
  });

  it('should retrieve a string value from .env and return a number', () => {
    configServiceMock.get.mockReturnValueOnce(undefined)  // no override
    configServiceMock.get.mockReturnValueOnce('${num:MY_NUMBER}')
    configServiceMock.get.mockReturnValueOnce('42')

    const result = baseConfigService.get<number>('testNumber');
    expect(result).toBe(42);
  });

  it('should retrieve a string value from .env and return a boolean', () => {
    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('${bool:MY_TRUE_BOOLEAN}')
    configServiceMock.get.mockReturnValueOnce('true')

    let result = baseConfigService.get<boolean>('testBooleanTrue');
    expect(result).toBe(true);

    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('${bool:MY_FALSE_BOOLEAN}')
    configServiceMock.get.mockReturnValueOnce('false')

    result = baseConfigService.get<boolean>('testBooleanFalse');
    expect(result).toBe(false);
  });

  it('should retrieve a string value from .env and return a json', () => {
    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('${json:MY_JSON}')
    configServiceMock.get.mockReturnValueOnce('{"hello":"world","my_number":123,"my_bool":false,"nested":{"all":"good"}}')

    const result = baseConfigService.get<boolean>('testBoolean');
    expect(result).toEqual({
      hello: "world",
      my_number: 123,
      my_bool: false,
      nested: { all: "good" }
    });
  });

  it('should retrieve a string value from .env and return a string array', () => {
    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('${arr:MY_ARRAY}')
    configServiceMock.get.mockReturnValueOnce('hello,world')

    let result = baseConfigService.get<string[]>('testArray');
    expect(result).toEqual(['hello', 'world']);

    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('${arr:str:MY_ARRAY}')
    configServiceMock.get.mockReturnValueOnce('hello2,world2')

    result = baseConfigService.get<string[]>('testArray');
    expect(result).toEqual(['hello2', 'world2']);
  });

  it('should retrieve a string value from .env and return a number array', () => {
    configServiceMock.get.mockReturnValueOnce(undefined) // no override
    configServiceMock.get.mockReturnValueOnce('${arr:num:MY_ARRAY}')
    configServiceMock.get.mockReturnValueOnce('123,456')

    const result = baseConfigService.get<string[]>('testArray');
    expect(result).toEqual([123, 456]);
  });

  it('should retrieve a string value from .env with override', () => {
    configServiceMock.get.mockReturnValueOnce('str:overriden value')

    const result = baseConfigService.get<string[]>('testArray');
    expect(configServiceMock.get).toHaveBeenCalledWith('MVX_OVERRIDE_TEST_ARRAY')

    expect(result).toBe('overriden value');
  });

  it('should retrieve a number value from .env with override', () => {
    configServiceMock.get.mockReturnValueOnce('num:123')

    const result = baseConfigService.get<string[]>('testArray.nested');
    expect(configServiceMock.get).toHaveBeenCalledWith('MVX_OVERRIDE_TEST_ARRAY_NESTED')

    expect(result).toBe(123);
  });

  it('should retrieve a boolean value from .env with override', () => {
    configServiceMock.get.mockReturnValueOnce('bool:false')

    const result = baseConfigService.get<string[]>('wrappedEGLDIdentifier.nested');
    expect(configServiceMock.get).toHaveBeenCalledWith('MVX_OVERRIDE_WRAPPED_EGLD_IDENTIFIER_NESTED')

    expect(result).toBe(false);
  });

});

