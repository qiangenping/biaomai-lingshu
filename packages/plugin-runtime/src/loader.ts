import fs from 'node:fs';
import path from 'node:path';
import {
  CanvasRegistry,
  IndustryPackManifestSchema,
  type IndustryPackManifest,
  type Locale,
} from '@biaomai/plugin-sdk';

export interface LoadedPack {
  dir: string;
  manifest: IndustryPackManifest;
  enabled: boolean;
  locales: Partial<Record<Locale, Record<string, unknown>>>;
}

/**
 * Hot-pluggable Industry Pack Loader.
 * Loads standard aion-extension.json / .bmpack directories, validates schemas,
 * mounts canvases into CanvasRegistry, and supports zero-restart enable/disable/reload.
 */
export class PackLoader {
  private readonly loaded = new Map<string, LoadedPack>();

  constructor(private readonly canvasRegistry: CanvasRegistry) {}

  loadFromDirectory(packDir: string): LoadedPack {
    const manifestPath = path.join(packDir, 'aion-extension.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Missing aion-extension.json in ${packDir}`);
    }

    const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const manifest = IndustryPackManifestSchema.parse(raw);

    const locales: Partial<Record<Locale, Record<string, unknown>>> = {};
    if (manifest.i18n?.localesDir) {
      const i18nDir = path.join(packDir, manifest.i18n.localesDir);
      for (const loc of ['zh-CN', 'en-US'] as const) {
        const locFile = path.join(i18nDir, `${loc}.json`);
        if (fs.existsSync(locFile)) {
          locales[loc] = JSON.parse(fs.readFileSync(locFile, 'utf8'));
        }
      }
    }

    // Re-register canvases cleanly for hot reload
    this.canvasRegistry.unregisterPack(manifest.name);
    for (const canvas of manifest.contributes.canvases) {
      this.canvasRegistry.register(manifest.name, canvas);
    }

    const pack: LoadedPack = { dir: packDir, manifest, enabled: true, locales };
    this.loaded.set(manifest.name, pack);
    return pack;
  }

  unload(packName: string): boolean {
    if (!this.loaded.has(packName)) return false;
    this.canvasRegistry.unregisterPack(packName);
    this.loaded.delete(packName);
    return true;
  }

  listLoaded(): LoadedPack[] {
    return Array.from(this.loaded.values());
  }

  get(packName: string): LoadedPack | undefined {
    return this.loaded.get(packName);
  }
}
