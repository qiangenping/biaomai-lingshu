export interface IsolatedAccountSession {
  accountId: string;
  platform: string;
  displayLabel: string;
  partition: string;
  cdpPort: number;
  createdAt: string;
}

/**
 * Multi-account isolated Electron WebContentsView session manager.
 * Guarantees each social account uses an independent `persist:bm-acc-<platform>-<id>` partition
 * so cookies, localStorage, and IndexedDB never leak across accounts.
 */
export class IsolatedSessionManager {
  private readonly sessions = new Map<string, IsolatedAccountSession>();
  private readonly baseCdpPort: number;

  constructor(baseCdpPort = 19220) {
    this.baseCdpPort = baseCdpPort;
  }

  static buildPartitionName(platform: string, accountId: string): string {
    const safePlatform = platform.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeId = accountId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!safePlatform || !safeId) {
      throw new Error('Platform and accountId must contain alphanumeric characters');
    }
    return `persist:bm-acc-${safePlatform}-${safeId}`;
  }

  createOrGet(platform: string, accountId: string, displayLabel: string): IsolatedAccountSession {
    const partition = IsolatedSessionManager.buildPartitionName(platform, accountId);
    const existing = this.sessions.get(partition);
    if (existing) return existing;

    const session: IsolatedAccountSession = {
      accountId,
      platform,
      displayLabel,
      partition,
      cdpPort: this.baseCdpPort + this.sessions.size,
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(partition, session);
    return session;
  }

  getByPartition(partition: string): IsolatedAccountSession | undefined {
    return this.sessions.get(partition);
  }

  listSessions(): IsolatedAccountSession[] {
    return Array.from(this.sessions.values());
  }

  remove(partition: string): boolean {
    return this.sessions.delete(partition);
  }
}
