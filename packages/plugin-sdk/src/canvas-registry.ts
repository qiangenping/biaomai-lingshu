import type { CanvasContribution } from './schema.js';

export interface RegisteredCanvas extends CanvasContribution {
  packName: string;
}

/**
 * Dynamic Canvas Registry for the right-side WorkBuddy contextual workspace.
 * Industry packs register and unregister their canvases at runtime without modifying the micro-kernel.
 */
export class CanvasRegistry {
  private readonly canvases = new Map<string, RegisteredCanvas>();

  register(packName: string, contribution: CanvasContribution): void {
    const key = contribution.id;
    this.canvases.set(key, { ...contribution, packName });
  }

  unregisterPack(packName: string): number {
    let removed = 0;
    for (const [id, canvas] of this.canvases.entries()) {
      if (canvas.packName === packName) {
        this.canvases.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  get(canvasId: string): RegisteredCanvas | undefined {
    return this.canvases.get(canvasId);
  }

  listAll(): RegisteredCanvas[] {
    return Array.from(this.canvases.values());
  }

  listByPack(packName: string): RegisteredCanvas[] {
    return this.listAll().filter((c) => c.packName === packName);
  }

  resolveForAssistant(assistantId: string): RegisteredCanvas | undefined {
    return this.listAll().find((c) => c.defaultForAssistants.includes(assistantId));
  }
}
