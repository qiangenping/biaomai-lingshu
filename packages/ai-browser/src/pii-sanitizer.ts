export interface RawCommentItem {
  commentId: string;
  nickname: string;
  content: string;
  likeCount: number;
  profileUrl?: string;
  uid?: string;
}

export interface SanitizedCommentItem {
  commentId: string;
  nickname: string;
  content: string;
  likeCount: number;
  redactedCount: number;
}

const PHONE_CN = /(?<!\d)1[3-9]\d{9}(?!\d)/g;
const PHONE_INTL = /\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const WECHAT_HINT = /(?:微信|vx|v信|wx|wechat)[\s:：号]*[a-zA-Z0-9_-]{5,20}/gi;
const URL_PATTERN = /https?:\/\/[^\s]+/gi;

/**
 * Mandatory PII sanitizer for all embedded browser comment extraction.
 * Strips phone numbers, emails, WeChat IDs, profile URLs, and UIDs before LLM scoring or CRM storage.
 */
export function sanitizeText(input: string): { text: string; redactedCount: number } {
  let redactedCount = 0;
  let text = input;

  for (const pattern of [EMAIL, PHONE_CN, WECHAT_HINT, URL_PATTERN, PHONE_INTL]) {
    text = text.replace(pattern, () => {
      redactedCount += 1;
      return '[REDACTED]';
    });
  }

  return { text: text.trim(), redactedCount };
}

export function sanitizeComment(raw: RawCommentItem): SanitizedCommentItem {
  const { text, redactedCount } = sanitizeText(raw.content);
  const { text: cleanNickname } = sanitizeText(raw.nickname);
  // Intentionally drop profileUrl and uid so zero non-public PII or user identifiers are persisted
  return {
    commentId: raw.commentId,
    nickname: cleanNickname || 'Anonymous',
    content: text,
    likeCount: Math.max(0, Number(raw.likeCount) || 0),
    redactedCount,
  };
}

export function sanitizeComments(list: RawCommentItem[]): SanitizedCommentItem[] {
  return list.map(sanitizeComment);
}
