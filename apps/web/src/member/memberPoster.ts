export interface MemberPosterContent {
  day: number;
  dateLabel: string;
  completedCount: number;
  totalTasks: number;
  completedDays: number;
  encouragement: string;
  nextStep: string;
}

export type MemberPosterShareResult = "shared" | "downloaded" | "dismissed";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapPosterText(value: string, maxCharacters: number) {
  const characters = [...value];
  const lines: string[] = [];
  for (let index = 0; index < characters.length; index += maxCharacters) {
    lines.push(characters.slice(index, index + maxCharacters).join(""));
  }
  return lines.slice(0, 4);
}

function textLines(value: string, x: number, firstY: number, lineHeight: number) {
  return wrapPosterText(value, 17)
    .map(
      (line, index) =>
        `<tspan x="${x}" y="${firstY + index * lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join("");
}

export function buildMemberPosterSvg(content: MemberPosterContent) {
  const completionRatio = Math.round((content.completedCount / content.totalTasks) * 100);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7f8f7"/>
      <stop offset="0.52" stop-color="#edf3f1"/>
      <stop offset="1" stop-color="#f7f0e4"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.2" cy="0.15" r="0.75">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.96"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#background)"/>
  <rect width="1080" height="1350" fill="url(#glow)"/>
  <circle cx="850" cy="195" r="180" fill="#4e7d6f" opacity="0.08"/>
  <circle cx="920" cy="1140" r="250" fill="#b0813f" opacity="0.08"/>
  <text x="92" y="112" fill="#24282c" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="38" font-weight="700" letter-spacing="4">One Day</text>
  <text x="92" y="178" fill="#4e7d6f" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="24" letter-spacing="5">DAY ${content.day} · ${escapeXml(content.dateLabel)}</text>
  <text x="92" y="330" fill="#24282c" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="86" font-weight="700">${content.completedCount} / ${content.totalTasks}</text>
  <text x="92" y="382" fill="#5a6067" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="28">今天点亮的行动 · 完成率 ${completionRatio}%</text>
  <rect x="92" y="438" width="896" height="12" rx="6" fill="#ffffff"/>
  <rect x="92" y="438" width="${Math.round(896 * (completionRatio / 100))}" height="12" rx="6" fill="#4e7d6f"/>
  <text fill="#24282c" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="42" font-weight="600">${textLines(content.encouragement, 92, 570, 64)}</text>
  <rect x="92" y="850" width="896" height="230" rx="42" fill="#ffffff" fill-opacity="0.76"/>
  <text x="142" y="925" fill="#4e7d6f" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="24" font-weight="600" letter-spacing="3">明天的一小步</text>
  <text fill="#5a6067" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="32">${textLines(content.nextStep, 142, 990, 48)}</text>
  <text x="92" y="1210" fill="#8d939b" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="25">7 天旅程 · 已记录 ${content.completedDays} 天</text>
  <text x="92" y="1270" fill="#4e7d6f" font-family="PingFang SC, Microsoft YaHei, sans-serif" font-size="28" font-weight="600">今天怎样度过，一生便怎样展开。</text>
</svg>`;
}

export function createMemberPosterFile(content: MemberPosterContent) {
  return new File([buildMemberPosterSvg(content)], `one-day-day-${content.day}.svg`, {
    type: "image/svg+xml",
  });
}

export function downloadMemberPoster(content: MemberPosterContent) {
  const file = createMemberPosterFile(content);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function shareMemberPoster(
  content: MemberPosterContent,
): Promise<MemberPosterShareResult> {
  const file = createMemberPosterFile(content);
  const shareNavigator = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  const shareData: ShareData = {
    title: "One Day 今日记录",
    text: `Day ${content.day} · 今天点亮 ${content.completedCount}/${content.totalTasks}`,
    files: [file],
  };

  if (shareNavigator.share) {
    let supportsFileShare = true;
    try {
      supportsFileShare = !shareNavigator.canShare || shareNavigator.canShare(shareData);
    } catch {
      supportsFileShare = false;
    }

    if (supportsFileShare) {
      try {
        await shareNavigator.share(shareData);
        return "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return "dismissed";
      }
    }
  }

  downloadMemberPoster(content);
  return "downloaded";
}
