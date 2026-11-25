import { z } from 'zod';

export const LocaleSchema = z.enum(['zh-CN', 'en-US']);
export type Locale = z.infer<typeof LocaleSchema>;

export const RegionIdSchema = z.enum(['cn-official', 'global-official', 'self-hosted']);
export type RegionId = z.infer<typeof RegionIdSchema>;

export const ApprovalPolicySchema = z.enum(['auto', 'ask-once', 'always-ask']);
export type ApprovalPolicy = z.infer<typeof ApprovalPolicySchema>;

export const PermissionManifestSchema = z.object({
  fsReadPaths: z.array(z.string()).default([]),
  fsWritePaths: z.array(z.string()).default([]),
  netDomains: z.array(z.string()).default([]),
  browserCdp: z.boolean().default(false),
  shellExec: z.boolean().default(false),
  imNotify: z.boolean().default(false),
  defaultApproval: ApprovalPolicySchema.default('ask-once'),
  alwaysAskActions: z.array(z.string()).default([]),
});
export type PermissionManifest = z.infer<typeof PermissionManifestSchema>;

export const BilingualTextSchema = z.object({
  'zh-CN': z.string().min(1),
  'en-US': z.string().min(1),
});
export type BilingualText = z.infer<typeof BilingualTextSchema>;

export const SkillContributionSchema = z.object({
  name: z.string().min(1),
  description: z.union([z.string(), BilingualTextSchema]),
  file: z.string().min(1),
  localizedFiles: z
    .object({
      'zh-CN': z.string().optional(),
      'en-US': z.string().optional(),
    })
    .optional(),
});

export const McpServerContributionSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  transport: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('stdio'),
      command: z.string().min(1),
      args: z.array(z.string()).default([]),
    }),
    z.object({
      type: z.literal('http'),
      url: z.string().min(1),
      authHeader: z.string().optional(),
    }),
    z.object({
      type: z.literal('sse'),
      url: z.string().min(1),
      authHeader: z.string().optional(),
    }),
  ]),
  enabled: z.boolean().default(true),
  regionDynamic: z.boolean().default(false),
});

export const CanvasContributionSchema = z.object({
  id: z.string().min(1),
  title: BilingualTextSchema,
  icon: z.string().default('layout'),
  componentPath: z.string().min(1),
  defaultForAssistants: z.array(z.string()).default([]),
});
export type CanvasContribution = z.infer<typeof CanvasContributionSchema>;

export const AssistantContributionSchema = z.object({
  id: z.string().min(1),
  name: z.union([z.string(), BilingualTextSchema]),
  description: z.union([z.string(), BilingualTextSchema]),
  presetAgentType: z.string().default('opencode'),
  contextFile: z.string().min(1),
  localizedContextFiles: z
    .object({
      'zh-CN': z.string().optional(),
      'en-US': z.string().optional(),
    })
    .optional(),
  enabledSkills: z.array(z.string()).default([]),
  defaultCanvasId: z.string().optional(),
  prompts: z.array(z.string()).default([]),
});

export const AcpAdapterContributionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  connectionType: z.enum(['cli', 'http']),
  cliCommand: z.string().optional(),
  acpArgs: z.array(z.string()).optional(),
  endpoint: z.string().optional(),
  supportsStreaming: z.boolean().default(true),
});

export const ThemeContributionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  mode: z.enum(['dark', 'light']).default('dark'),
  file: z.string().min(1),
});

/**
 * Unified .bmpack / aion-extension.json schema
 * 100% compatible with iOfficeAI/AionUi extension manifest while adding
 * ToB declarative permissions & dynamic Canvas UI contributions.
 */
export const IndustryPackManifestSchema = z.object({
  name: z.string().min(1),
  displayName: z.union([z.string(), BilingualTextSchema]),
  version: z.string().min(1),
  description: z.union([z.string(), BilingualTextSchema]),
  author: z.string().min(1),
  license: z.string().default('Apache-2.0'),
  category: z.enum(['leadgen', 'local-office', 'tob-vertical', 'developer', 'utility']).default('utility'),
  i18n: z
    .object({
      localesDir: z.string().default('i18n'),
      defaultLocale: LocaleSchema.default('en-US'),
    })
    .optional(),
  permissions: PermissionManifestSchema.default({}),
  contributes: z.object({
    acpAdapters: z.array(AcpAdapterContributionSchema).default([]),
    skills: z.array(SkillContributionSchema).default([]),
    mcpServers: z.array(McpServerContributionSchema).default([]),
    assistants: z.array(AssistantContributionSchema).default([]),
    themes: z.array(ThemeContributionSchema).default([]),
    canvases: z.array(CanvasContributionSchema).default([]),
    settingsTabs: z.string().optional(),
  }),
});
export type IndustryPackManifest = z.infer<typeof IndustryPackManifestSchema>;

export const RegionProfileSchema = z.object({
  id: RegionIdSchema,
  name: BilingualTextSchema,
  defaultLocale: LocaleSchema.nullable(),
  currency: z.string().min(1),
  currencySymbol: z.string().min(1),
  mcp: z.object({
    httpEndpoint: z.string().url(),
    sseEndpoint: z.string().url(),
    authHeader: z.string().default('x-api-key'),
    expectedKeyPrefix: z.string().nullable(),
  }),
  relays: z.object({
    serverRelay: z.string().url(),
    aiRelay: z.string().url(),
  }),
  defaultModels: z.object({
    video: z.array(z.string()),
    image: z.array(z.string()),
    llm: z.array(z.string()),
  }),
  platformsEndpoint: z.string().url().optional(),
  platforms: z.array(
    z.object({
      id: z.string(),
      name: BilingualTextSchema,
      aspect: z.string(),
    }),
  ),
});
export type RegionProfile = z.infer<typeof RegionProfileSchema>;
