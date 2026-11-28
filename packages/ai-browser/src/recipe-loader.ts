import { z } from 'zod';
import xiaohongshu from '../recipes/xiaohongshu.json' with { type: 'json' };
import douyin from '../recipes/douyin.json' with { type: 'json' };
import linkedin from '../recipes/linkedin.json' with { type: 'json' };
import youtube from '../recipes/youtube.json' with { type: 'json' };
import googleMaps from '../recipes/google-maps.json' with { type: 'json' };
import amap from '../recipes/amap.json' with { type: 'json' };

export const SiteRecipeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  domains: z.array(z.string().min(1)).min(1),
  kind: z.enum(['social', 'b2b_directory', 'b2b_and_social']),
  selectors: z.record(z.string(), z.array(z.string().min(1)).min(1)),
  humanConfirmBeforeSubmit: z.literal(true),
});

export type SiteRecipe = z.infer<typeof SiteRecipeSchema>;

export const BUILTIN_SITE_RECIPES: SiteRecipe[] = [
  xiaohongshu,
  douyin,
  linkedin,
  youtube,
  googleMaps,
  amap,
].map((raw) => SiteRecipeSchema.parse(raw));

/**
 * Resolve a site selector recipe by URL or recipe id.
 */
export function resolveSiteRecipe(urlOrId: string): SiteRecipe | undefined {
  const needle = urlOrId.trim().toLowerCase();
  if (!needle) return undefined;
  return BUILTIN_SITE_RECIPES.find(
    (recipe) =>
      recipe.id.toLowerCase() === needle ||
      recipe.domains.some((domain) => needle.includes(domain.toLowerCase()))
  );
}
