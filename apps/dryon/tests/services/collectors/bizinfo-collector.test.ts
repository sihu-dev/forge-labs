import { BizinfoCollector } from '../../../src/services/collectors/bizinfo-collector';

describe('BizinfoCollector', () => {
  let collector: BizinfoCollector;

  beforeEach(() => {
    collector = new BizinfoCollector();
  });

  describe('collect', () => {
    it('should return an array of announcements', async () => {
      const result = await collector.collect();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by keywords if provided', async () => {
      const keywords = ['창업', '스타트업'];
      const result = await collector.collect(keywords);

      if (result.length > 0) {
        const hasKeyword = result.some((item) =>
          keywords.some(
            (keyword) =>
              item.title.includes(keyword) ||
              item.description?.includes(keyword)
          )
        );
        expect(hasKeyword).toBe(true);
      }
    });

    it('should handle API errors gracefully', async () => {
      // Mock API failure
      const mockCollector = new BizinfoCollector();
      // @ts-ignore - testing error handling
      mockCollector.apiKey = 'invalid_key';

      await expect(mockCollector.collect()).rejects.toThrow();
    });
  });

  describe('announcement structure', () => {
    it('should have required fields', async () => {
      const result = await collector.collect();

      if (result.length > 0) {
        const item = result[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
        expect(item).toHaveProperty('source');
        expect(item.source).toBe('bizinfo');
      }
    });
  });
});
