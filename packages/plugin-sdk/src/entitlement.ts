export type EditionTier = 'community' | 'pro' | 'team' | 'enterprise' | 'oem';

export type CommercialFeatureFlag =
  | 'cloud.server_relay'
  | 'cloud.ai_relay_credits'
  | 'cloud.cron_24_7'
  | 'team.shared_crm'
  | 'team.im_approval_flow'
  | 'enterprise.sso_rbac'
  | 'enterprise.private_registry'
  | 'enterprise.scrm_connectors'
  | 'enterprise.ad_compliance_guard'
  | 'oem.white_label';

export interface EntitlementSnapshot {
  tier: EditionTier;
  maxSocialAccounts: number;
  maxSeats: number;
  enabledFeatures: CommercialFeatureFlag[];
}

export interface EntitlementProvider {
  getSnapshot(): Promise<EntitlementSnapshot>;
  hasFeature(feature: CommercialFeatureFlag): Promise<boolean>;
}

/**
 * Default Open-Source Community Entitlement Provider.
 * Zero forced network calls, zero nagging popups; local BYOK and single-operator workflows work unrestricted.
 * Cloud Pro/Team/Enterprise editions swap in a commercial plugin provider cleanly.
 */
export class CommunityEntitlementProvider implements EntitlementProvider {
  async getSnapshot(): Promise<EntitlementSnapshot> {
    return {
      tier: 'community',
      maxSocialAccounts: 100, // Unlimited for local BYOK / self-hosted users
      maxSeats: 1,
      enabledFeatures: [],
    };
  }

  async hasFeature(_feature: CommercialFeatureFlag): Promise<boolean> {
    return false;
  }
}
