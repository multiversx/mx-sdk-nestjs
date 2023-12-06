import { MatchUtils } from "../../src/utils/match.utils";

describe('Match Utils', () => {
    it('getTagsFromBase64Attributes', () => {
      let match = MatchUtils.getTagsFromBase64Attributes('bWV0YWRhdGE6');
      expect(match).toBeNull();
  
      match = MatchUtils.getTagsFromBase64Attributes('bWV0YWRhdGE6YXNkYWRzYTt0YWdzOjEsMiwzLDQ=');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['tags']).toEqual('1,2,3,4');
      }
      match = MatchUtils.getTagsFromBase64Attributes('dGFnczpuZnQtdGlja2V0LHJvYWQ7bWV0YWRhdGE6UW1SY1A5NGtYcjV6WmpSR3ZpN21KNnVuN0xweFVoWVZSNFI0UnBpY3h6Z1lrdA==');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['tags']).toEqual('nft-ticket,road');
      }
    });
    it('getMetadataFromBase64Attributes', () => {
      let match = MatchUtils.getMetadataFromBase64Attributes('bWV0YWRhdGE6dGVzdDt0YWdzOjEsMiwzLDQ=');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['metadata']).toEqual('test');
      }
  
      match = MatchUtils.getMetadataFromBase64Attributes('bWV0YWRhdGE6dGVzdC93aXRoLjt0YWdzOjEsMiwzLDQ=');
      expect(match).toBeDefined();
      if (match?.groups) {
        expect(match.groups['metadata']).toEqual('test/with.');
      }
  
      match = MatchUtils.getMetadataFromBase64Attributes('dGFnczoxLDIsMyw0');
      expect(match).toBeNull();
    });
  });
  
