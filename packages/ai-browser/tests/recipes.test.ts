import { describe, expect, it } from 'vitest';
import { BUILTIN_SITE_RECIPES, SiteRecipeSchema, resolveSiteRecipe } from '../src/recipe-loader.js';

describe('AI Browser modular site recipes', () => {
  it('validates all built-in site recipes against SiteRecipeSchema', () => {
    expect(BUILTIN_SITE_RECIPES.length).toBeGreaterThanOrEqual(6);
    for (const recipe of BUILTIN_SITE_RECIPES) {
      expect(() => SiteRecipeSchema.parse(recipe)).not.toThrow();
      expect(recipe.humanConfirmBeforeSubmit).toBe(true);
      expect(Object.keys(recipe.selectors).length).toBeGreaterThan(0);
    }
  });

  it('resolves recipes by URL or id', () => {
    expect(resolveSiteRecipe('https://www.linkedin.com/feed/')?.id).toBe('linkedin');
    expect(resolveSiteRecipe('https://www.google.com/maps/search/cnc')?.id).toBe('google-maps');
    expect(resolveSiteRecipe('xiaohongshu')?.id).toBe('xiaohongshu');
    expect(resolveSiteRecipe('https://example.com')).toBeUndefined();
  });
});
