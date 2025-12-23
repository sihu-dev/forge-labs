import { KStartupCollector } from '../../../src/services/collectors/kstartup-collector';

describe('KStartupCollector', () => {
  let collector: KStartupCollector;

  beforeEach(() => {
    collector = new KStartupCollector();
  });

  describe('collect', () => {
    it('should return an array of announcements', async () => {
      const result = await collector.collect();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter by keywords if provided', async () => {
      const keywords = ['창업', 'AI'];
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

    it('should parse dates correctly', async () => {
      const result = await collector.collect();

      if (result.length > 0) {
        const item = result[0];
        if (item.deadline) {
          expect(item.deadline).toBeInstanceOf(Date);
          expect(item.deadline.getTime()).toBeGreaterThan(0);
        }
      }
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
        expect(item.source).toBe('k-startup');
      }
    });
  });
});
