export interface MidsceneVisionConfig {
  enabled: boolean;
  modelName: string;
  fallbackOnCanvasOrModal: boolean;
}

/**
 * Optional vision fallback configuration for web-infra-dev/midscene (MIT).
 * Activated only when DOM/accessibility-tree extraction encounters Canvas or non-standard overlays.
 */
export function createDefaultMidsceneConfig(enabled = false): MidsceneVisionConfig {
  return {
    enabled,
    modelName: 'qwen-vl-max',
    fallbackOnCanvasOrModal: true,
  };
}
