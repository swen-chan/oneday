import {
  anonymizeDisplayName,
  maskPhoneNumbers,
  maskWeChatIds,
} from '../guardrails/guardrails';

// 微信群聊天记录导出（txt）解析。数据接入路线 A（手动导出上传）。
// 隐私原则：解析即脱敏——真名/手机号/微信号在进入任何存储或展示前处理掉，
// 原始文件不落库（DATA_SECURITY_BASELINE_TODO.md 第 1 条）。

export interface ParsedMessage {
  senderAlias: string;
  sentAt: Date;
  contentType: 'text' | 'media';
  content: string;
}

export interface ParsedMember {
  alias: string;
  firstSeenAt: Date;
  lastActiveAt: Date;
  messageCount: number;
}

export interface ParsedExport {
  messages: ParsedMessage[];
  members: ParsedMember[];
  periodStart: Date;
  periodEnd: Date;
}

const HEADER_RE = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\s+(.+)$/;
const MEDIA_RE = /^\[(图片|视频|语音|文件|表情|链接|小程序|转账|红包)\]$/;

/** 导出记录默认按中国时区书写。 */
function parseTimestamp(raw: string): Date {
  return new Date(`${raw.replace(' ', 'T')}+08:00`);
}

export function parseWeChatExport(
  raw: string,
  options: { groupId: string },
): ParsedExport {
  const lines = raw.split(/\r?\n/);
  const messages: ParsedMessage[] = [];

  let current: { sender: string; sentAt: Date; body: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    const text = current.body.join('\n').trim();
    const isMedia = MEDIA_RE.test(text);
    messages.push({
      senderAlias: anonymizeDisplayName(current.sender, options.groupId),
      sentAt: current.sentAt,
      contentType: isMedia ? 'media' : 'text',
      content: isMedia ? text : maskWeChatIds(maskPhoneNumbers(text)),
    });
    current = null;
  };

  for (const line of lines) {
    const header = line.match(HEADER_RE);
    if (header) {
      flush();
      current = { sender: header[2].trim(), sentAt: parseTimestamp(header[1]), body: [] };
    } else if (current && line.trim() !== '') {
      current.body.push(line);
    } else if (current && line.trim() === '' && current.body.length > 0) {
      // 空行结束一条消息（导出格式中消息间以空行分隔）
      flush();
    }
  }
  flush();

  if (messages.length === 0) {
    throw new Error('无法识别的聊天记录格式：未解析出任何消息');
  }

  const byMember = new Map<string, ParsedMember>();
  for (const msg of messages) {
    const existing = byMember.get(msg.senderAlias);
    if (existing) {
      existing.messageCount += 1;
      if (msg.sentAt > existing.lastActiveAt) existing.lastActiveAt = msg.sentAt;
      if (msg.sentAt < existing.firstSeenAt) existing.firstSeenAt = msg.sentAt;
    } else {
      byMember.set(msg.senderAlias, {
        alias: msg.senderAlias,
        firstSeenAt: msg.sentAt,
        lastActiveAt: msg.sentAt,
        messageCount: 1,
      });
    }
  }

  const sorted = [...messages].sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());

  return {
    messages,
    members: [...byMember.values()],
    periodStart: sorted[0].sentAt,
    periodEnd: sorted[sorted.length - 1].sentAt,
  };
}
