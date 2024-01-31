<a href="https://www.npmjs.com/package/@multiversx/sdk-nestjs-common" target="_blank"><img src="https://img.shields.io/npm/v/@multiversx/sdk-nestjs-common.svg" alt="NPM Version" /></a>

# MultiversX NestJS Microservice Utilities

This package contains a set of utilities commonly used in the MultiversX Microservice ecosystem.

It relies on the following peer dependencies which must be installed in the parent package:

- @multiversx/sdk-core
- @multiversx/sdk-wallet
- @nestjs/common v9
- @nestjs/swagger v9

## Documentation

- [Multiversx Docs](https://docs.multiversx.com/sdk-and-tools/sdk-nestjs)

## CHANGELOG

[CHANGELOG](CHANGELOG.md)

## Packages

This monorepo contains the source code for the following packages:

- @multiversx/sdk-nestjs-common [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-common)
- @multiversx/sdk-nestjs-auth [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-auth)
- @multiversx/sdk-nestjs-http [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-http)
- @multiversx/sdk-nestjs-monitoring [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-monitoring)
- @multiversx/sdk-nestjs-elastic [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-elastic)
- @multiversx/sdk-nestjs-redis [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-redis)
- @multiversx/sdk-nestjs-rabbitmq [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-rabbitmq)
- @multiversx/sdk-nestjs-cache [npm](https://www.npmjs.com/package/@multiversx/sdk-nestjs-cache)


## Installation

`sdk-nestjs-${package}` is delivered via **npm** and it can be installed as follows:

```
npm install @multiversx/sdk-nestjs-${package}
```

## Code examples

In this section we will provide some code examples of how these packages can be used in your microservice.

These examples requires basic knowledge of NestJS framework, if you are not familiar with some of the key concepts like (Modules, Providers, Guards, Incerceptors, etc.) please make sure to check their documentation before proceeding with these examples. [NestJS Docs](https://docs.nestjs.com/#introduction)

As a rule of thumb, we recommend to import these modules everytime you use them, do not try to import them just once in the application root module.

Also, if you discover a feature that is missing and might be useful, we would appreciate if you open a PR to integrate it.

### Caching

Caching is one of the most important components when talking about high scalable applications that needs to serve thousands of requests per second.
`sdk-nestjs-cache` uses both remote (redis) and local (in-memory) cache.

#### Import

In your module:

```
@Module({
  imports: [
    CacheModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) => new CacheModuleOptions({
        url: apiConfigService.getRedisUrl(),
        poolLimit: apiConfigService.getPoolLimit(),
        processTtl: apiConfigService.getProcessTtl(),
      }),
      inject: [ApiConfigService],
    });
  ],
  providers: [FeatureService]
})
export class FeatureModule{}
```

In your provider:

```
import { CacheService } from "@multiversx/sdk-nestjs-cache";

@Injectable()
export class FeatureService {
  constructor(
    private readonly cacheService: CacheService,
  ) { }
```

#### Main Features

`get`

Returns a Promise with the value stored in cache at a specific key or undefined if key isn't in cache.
It searches the key first in local and then in remote cache.

```
const value = await this.cacheService.get<ExpectedType>(key);
```

`set`

Set both local and remote cache keys with the value you provided. It also accepts a ttl value which represents the persistence time in seconds, if no value is provided it will use default ttl of 6 seconds.

```
await this.cacheService.set(key, value, ttl);
```

`getOrSet`

Returns a Promise with the value stored in cache at a specific key or set that key with the value you provided.
If you don't provide a remote ttl, it will use the default value of 6 seconds.
If you don't provide a local ttl, it will use half of the remote ttl value.
It also accepts a forceRefresh (boolean) parameter for situations you explicitly need to update the cache.

```
const value = await this.cacheService.getOrSet(
      key,
      async () => await rawValue,
      remoteCacheTtl,
      localCacheTtl
    );
```

These are the most used features of the CacheModule, there are some more advanced features related to batch processing.
If you need something else please make sure to check our [CacheService](packages/cache/src/cache/cache.service.ts).

### Smart Contract Interactions

This package is for dApps that interacts with smart contracts

#### Contract Loader

Uses Singleton pattern and load a [SmartContract](https://github.com/multiversx/mx-sdk-erdjs/blob/main/src/smartcontracts/smartContract.ts) from an abi path.
You can also load multiple contracts with same abi.

```
const cLoader = new ContractLoader(ABI_PATH, CONTRACT_INTERFACE);

const sc = await cLoader.getContract(CONTRACT_ADDRESS);
```

#### Contract Query Runner

Execute contract queries using a multiversx proxy provider (api/gateway).

```
const cRunner = new ContractQueryRunner(new ApiNetworkProvider(this.apiConfigService.getApiUrl()));

const contract = await this.contractLoader.getContract(CONTRACT_ADDRESS);

const interaction: Interaction = contract.methodsExplicit.getTotalLockedAssetSupply([]);

const queryResponse = await cRunner.runQuery(contract, interaction);
```

#### Contract Transaction Generator

Create transactions from smart contract interactions using and multiversx proxy provider (api/gateway).

```
const txGenerator = new ContractTransactionGenerator(provider);

const tx = await this.transactionGenerator.createTransaction(interaction, signer.getAddress());
```
