import fs from 'node:fs';
import path from 'node:path';
import {
  RegionProfileSchema,
  type Locale,
  type RegionId,
  type RegionProfile,
} from '@biaomai/plugin-sdk';

export interface RegionMismatchDiagnostic {
  isMismatch: boolean;
  suggestedRegion?: RegionId;
  message: Record<Locale, string>;
}

/**
 * Dual-Region (CN / Global / Self-Hosted) & Bilingual (zh-CN / en-US) Router.
 * Keeps region and locale strictly decoupled (4-combination matrix) and isolates API keys per region.
 */
export class RegionRouter {
  private readonly profiles = new Map<RegionId, RegionProfile>();
  private readonly apiKeys = new Map<RegionId, string>();
  private activeRegion: RegionId = 'global-official';
  private activeLocale: Locale = 'en-US';

  loadProfilesFromDir(configDir: string): void {
    const files = ['china.profile.json', 'global.profile.json', 'self-hosted.profile.json'];
    for (const file of files) {
      const full = path.join(configDir, file);
      if (fs.existsSync(full)) {
        const parsed = RegionProfileSchema.parse(JSON.parse(fs.readFileSync(full, 'utf8')));
        this.profiles.set(parsed.id, parsed);
      }
    }
  }

  setRegion(regionId: RegionId, syncDefaultLocale = false): RegionProfile {
    const profile = this.profiles.get(regionId);
    if (!profile) {
      throw new Error(`Unknown region profile: ${regionId}`);
    }
    this.activeRegion = regionId;
    if (syncDefaultLocale && profile.defaultLocale) {
      this.activeLocale = profile.defaultLocale;
    }
    return profile;
  }

  setLocale(locale: Locale): void {
    // Switching locale never resets activeRegion (supports CN+EN and Global+zh-CN)
    this.activeLocale = locale;
  }

  getActiveProfile(): RegionProfile {
    const profile = this.profiles.get(this.activeRegion);
    if (!profile) {
      throw new Error(`Active region profile not loaded: ${this.activeRegion}`);
    }
    return profile;
  }

  getActiveLocale(): Locale {
    return this.activeLocale;
  }

  setApiKey(regionId: RegionId, apiKey: string): void {
    this.apiKeys.set(regionId, apiKey.trim());
  }

  getApiKey(regionId: RegionId = this.activeRegion): string | undefined {
    return this.apiKeys.get(regionId);
  }

  /**
   * 401 Region-Key mismatch guard: detects prefix mismatch or HTTP 401 and recommends one-click switch.
   */
  diagnoseAuthMismatch(apiKey: string, httpStatus?: number): RegionMismatchDiagnostic {
    const current = this.getActiveProfile();
    for (const [id, profile] of this.profiles.entries()) {
      const prefix = profile.mcp.expectedKeyPrefix;
      if (prefix && apiKey.startsWith(prefix) && id !== current.id) {
        return {
          isMismatch: true,
          suggestedRegion: id,
          message: {
            'zh-CN': `检测到当前 API Key 属于「${profile.name['zh-CN']}」，与当前环境「${current.name['zh-CN']}」不匹配，是否一键切换？`,
            'en-US': `Detected API Key belongs to "${profile.name['en-US']}", which does not match "${current.name['en-US']}". Switch now?`,
          },
        };
      }
    }

    if (httpStatus === 401) {
      const fallback: RegionId = current.id === 'cn-official' ? 'global-official' : 'cn-official';
      return {
        isMismatch: true,
        suggestedRegion: fallback,
        message: {
          'zh-CN': '鉴权失败 (HTTP 401)：当前 API Key 可能与所选国内/国际区域不匹配，建议检查或一键切换环境。',
          'en-US': 'Authentication failed (HTTP 401): your API Key may belong to another region (CN/Global).',
        },
      };
    }

    return {
      isMismatch: false,
      message: { 'zh-CN': '环境与密钥匹配正常', 'en-US': 'Region and API key verified' },
    };
  }
}
