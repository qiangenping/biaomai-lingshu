import { sanitizeComments, type RawCommentItem, type SanitizedCommentItem } from './pii-sanitizer.js';

export type LeadIntentTier = 'S' | 'A' | 'B' | 'C';

export interface ScoredCommentLead {
  comment: SanitizedCommentItem;
  intentScore: number;
  tier: LeadIntentTier;
  reason: string;
  replyDrafts: {
    consultant: string;
    friendly: string;
  };
}

export interface PrefillReplyCommand {
  commentId: string;
  replyText: string;
  stopBeforeSubmit: true; // Compliance invariant: ALWAYS stop before clicking Send
}

const S_TIER_KEYWORDS = ['怎么收费', '多少钱', '报价', '求链接', '怎么买', '合作', '私有化', 'how much', 'pricing', 'link please', 'dm me', 'buy'];
const A_TIER_KEYWORDS = ['支持', '适合', '教程', '怎么用', '导出', '对比', 'does it support', 'tutorial', 'compatible', 'compare'];

/**
 * Adapter for browserbase/stagehand (MIT) semantic extraction & resilient reply prefill.
 * Provides deterministic local intent scoring fallback + Stagehand extraction schema definitions.
 */
export function scoreExtractedComments(rawComments: RawCommentItem[]): ScoredCommentLead[] {
  const clean = sanitizeComments(rawComments);
  return clean
    .map((comment): ScoredCommentLead => {
      const lower = comment.content.toLowerCase();
      const hitS = S_TIER_KEYWORDS.some((kw) => lower.includes(kw));
      const hitA = A_TIER_KEYWORDS.some((kw) => lower.includes(kw));

      let intentScore = 35;
      let tier: LeadIntentTier = 'C';
      let reason = 'General engagement';

      if (hitS) {
        intentScore = 92;
        tier = 'S';
        reason = 'Direct purchase / pricing / link inquiry';
      } else if (hitA) {
        intentScore = 74;
        tier = 'A';
        reason = 'Product capability or usage detail question';
      } else if (comment.content.length >= 12) {
        intentScore = 52;
        tier = 'B';
        reason = 'Meaningful discussion comment';
      }

      const isEnglish = /^[ -~]+$/.test(comment.content);
      return {
        comment,
        intentScore,
        tier,
        reason,
        replyDrafts: isEnglish
          ? {
              consultant: 'Thanks for asking! Happy to share the full details and setup link—feel free to check our pinned guide.',
              friendly: 'Great question! Yes, it works out of the box—drop by our bio link for the quick-start guide!',
            }
          : {
              consultant: '您好，感谢咨询！详细方案与使用说明已整理好，欢迎查看置顶链接或私信获取资料。',
              friendly: '问得太精准啦！完全支持的，主页置顶有详细演示和体验入口，欢迎随时交流～',
            },
      };
    })
    .sort((a, b) => b.intentScore - a.intentScore);
}

/**
 * Creates a compliant Human-in-the-Loop prefill instruction.
 * Enforces stopBeforeSubmit: true so the operator always performs the final click.
 */
export function createCompliantPrefillCommand(commentId: string, replyText: string): PrefillReplyCommand {
  if (!replyText.trim()) {
    throw new Error('Reply text cannot be empty');
  }
  return {
    commentId,
    replyText: replyText.trim(),
    stopBeforeSubmit: true,
  };
}
