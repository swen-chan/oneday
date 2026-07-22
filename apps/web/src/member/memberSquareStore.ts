export const memberSquareVersion = 1 as const;
export type MemberSquareVersion = typeof memberSquareVersion;
export const memberSquareStoragePrefix = "oneday-member-square-v1";
export const memberSquareMaxNoteLength = 500;
export const memberSquareMaxCommentLength = 180;
export const memberSquareMaxImageBytes = 240 * 1024;

const memberSquareMaxImageDataLength = Math.ceil(memberSquareMaxImageBytes * 1.4) + 128;
const memberSquareMaxOwnPosts = 8;
const memberSquareMaxLocalComments = 60;

export type MemberSquarePostKind = "checkin" | "note";

export interface MemberSquareAuthor {
  id: string;
  displayName: string;
  avatar: string;
  synthetic: boolean;
}

export interface MemberSquareCheckinContent {
  day: number;
  dateLabel: string;
  completedCount: number;
  totalTasks: number;
  encouragement: string;
  visibleTaskTitles: string[];
}

export interface MemberSquareComment {
  id: string;
  author: MemberSquareAuthor;
  body: string;
  createdAt: string;
  own: boolean;
  synthetic: boolean;
}

export interface MemberSquarePost {
  id: string;
  kind: MemberSquarePostKind;
  author: MemberSquareAuthor;
  body: string;
  imageDataUrl?: string;
  checkin?: MemberSquareCheckinContent;
  createdAt: string;
  commentsEnabled: boolean;
  liked: boolean;
  likeCount: number;
  comments: MemberSquareComment[];
  own: boolean;
  synthetic: boolean;
}

export interface MemberSquareSnapshot {
  viewer: MemberSquareAuthor;
  posts: MemberSquarePost[];
}

export interface PublishMemberSquareNoteInput {
  body: string;
  imageDataUrl?: string;
  commentsEnabled: boolean;
}

export interface PublishMemberSquareCheckinInput {
  sourceKey: string;
  day: number;
  dateLabel: string;
  completedCount: number;
  totalTasks: number;
  encouragement: string;
  visibleTaskTitles: string[];
}

interface StoredMemberSquarePost {
  id: string;
  kind: MemberSquarePostKind;
  body: string;
  imageDataUrl?: string;
  checkin?: MemberSquareCheckinContent;
  createdAt: string;
  commentsEnabled: boolean;
  sourceKey?: string;
}

interface StoredMemberSquareComment {
  id: string;
  postId: string;
  body: string;
  createdAt: string;
}

interface StoredMemberSquareState {
  version: typeof memberSquareVersion;
  posts: StoredMemberSquarePost[];
  likedPostIds: string[];
  comments: StoredMemberSquareComment[];
}

interface SyntheticMemberSquarePost {
  id: string;
  kind: MemberSquarePostKind;
  author: MemberSquareAuthor;
  body: string;
  ageMinutes: number;
  likeCount: number;
  commentsEnabled: boolean;
  checkin?: MemberSquareCheckinContent;
  comments: Array<{
    id: string;
    author: MemberSquareAuthor;
    body: string;
    ageMinutes: number;
  }>;
}

export interface MemberSquareProvider {
  snapshot(identity: string): MemberSquareSnapshot;
  publishNote(identity: string, input: PublishMemberSquareNoteInput): MemberSquareSnapshot;
  publishCheckin(
    identity: string,
    input: PublishMemberSquareCheckinInput,
  ): MemberSquareSnapshot;
  toggleLike(identity: string, postId: string): MemberSquareSnapshot;
  addComment(identity: string, postId: string, body: string): MemberSquareSnapshot;
  deleteOwnComment(identity: string, commentId: string): MemberSquareSnapshot;
  deleteOwnPost(identity: string, postId: string): MemberSquareSnapshot;
  setOwnPostCommentsEnabled(
    identity: string,
    postId: string,
    enabled: boolean,
  ): MemberSquareSnapshot;
}

type MemberSquareStorage = Pick<Storage, "getItem" | "setItem">;

interface MemberSquareProviderOptions {
  now?: () => Date;
  createId?: () => string;
}

const syntheticAuthors = {
  qingfeng: {
    id: "synthetic-qingfeng",
    displayName: "清风同行者",
    avatar: "🌿",
    synthetic: true,
  },
  xinghe: {
    id: "synthetic-xinghe",
    displayName: "星河记录者",
    avatar: "✨",
    synthetic: true,
  },
  songlu: {
    id: "synthetic-songlu",
    displayName: "松露慢行者",
    avatar: "🍃",
    synthetic: true,
  },
  chenlu: {
    id: "synthetic-chenlu",
    displayName: "晨露小队友",
    avatar: "🌤️",
    synthetic: true,
  },
  shanhai: {
    id: "synthetic-shanhai",
    displayName: "山海练习生",
    avatar: "⛰️",
    synthetic: true,
  },
  daomang: {
    id: "synthetic-daomang",
    displayName: "稻芒收集者",
    avatar: "🌾",
    synthetic: true,
  },
} satisfies Record<string, MemberSquareAuthor>;

const syntheticPosts: SyntheticMemberSquarePost[] = [
  {
    id: "synthetic-checkin-01",
    kind: "checkin",
    author: syntheticAuthors.qingfeng,
    body: "把今天能做的小事先做完，不急着给自己加码。",
    ageMinutes: 8,
    likeCount: 14,
    commentsEnabled: true,
    checkin: {
      day: 4,
      dateLabel: "今天",
      completedCount: 5,
      totalTasks: 6,
      encouragement: "你已经把分散的注意力收回到具体行动里。",
      visibleTaskTitles: ["完成一轮 15 分钟单任务"],
    },
    comments: [
      {
        id: "synthetic-comment-01",
        author: syntheticAuthors.chenlu,
        body: "五个泡泡已经很棒了，明天继续。",
        ageMinutes: 5,
      },
    ],
  },
  {
    id: "synthetic-note-01",
    kind: "note",
    author: syntheticAuthors.xinghe,
    body: "今天试着把“我要全部做完”换成“我先开始十分钟”。开始之后，事情真的没有想象中那么重。",
    ageMinutes: 24,
    likeCount: 22,
    commentsEnabled: true,
    comments: [],
  },
  {
    id: "synthetic-checkin-02",
    kind: "checkin",
    author: syntheticAuthors.songlu,
    body: "允许部分完成，也是在认真照顾今天的节奏。",
    ageMinutes: 49,
    likeCount: 9,
    commentsEnabled: true,
    checkin: {
      day: 2,
      dateLabel: "今天",
      completedCount: 3,
      totalTasks: 6,
      encouragement: "完成三件真实的小事，已经让今天向前移动。",
      visibleTaskTitles: [],
    },
    comments: [],
  },
  {
    id: "synthetic-note-02",
    kind: "note",
    author: syntheticAuthors.chenlu,
    body: "把明天第一件事写在便签上之后，脑子安静了不少。现在只需要明早照着开始。",
    ageMinutes: 82,
    likeCount: 17,
    commentsEnabled: true,
    comments: [
      {
        id: "synthetic-comment-02",
        author: syntheticAuthors.daomang,
        body: "这个方法我也想试试。",
        ageMinutes: 60,
      },
    ],
  },
  {
    id: "synthetic-checkin-03",
    kind: "checkin",
    author: syntheticAuthors.shanhai,
    body: "今天六个泡泡都亮了，给自己一个不赶路的晚上。",
    ageMinutes: 130,
    likeCount: 31,
    commentsEnabled: true,
    checkin: {
      day: 6,
      dateLabel: "今天",
      completedCount: 6,
      totalTasks: 6,
      encouragement: "你完成了今天的全部行动，也保留了继续前进的余地。",
      visibleTaskTitles: ["写下明天最小的第一步", "交付一个最小可见结果"],
    },
    comments: [],
  },
  {
    id: "synthetic-note-03",
    kind: "note",
    author: syntheticAuthors.daomang,
    body: "今天和一位很久没联系的朋友打了招呼。没有聊很久，但那一步比我预想的轻。",
    ageMinutes: 196,
    likeCount: 26,
    commentsEnabled: false,
    comments: [],
  },
  {
    id: "synthetic-checkin-04",
    kind: "checkin",
    author: syntheticAuthors.xinghe,
    body: "先留下完成证据，再考虑下一步。",
    ageMinutes: 280,
    likeCount: 12,
    commentsEnabled: true,
    checkin: {
      day: 3,
      dateLabel: "昨天",
      completedCount: 4,
      totalTasks: 6,
      encouragement: "今天的行动已经留下痕迹，不需要额外证明。",
      visibleTaskTitles: ["保存一份今日完成证据"],
    },
    comments: [],
  },
  {
    id: "synthetic-note-04",
    kind: "note",
    author: syntheticAuthors.qingfeng,
    body: "一个小发现：把问题写成一句具体的话，比在脑子里来回想更容易找到下一步。",
    ageMinutes: 390,
    likeCount: 19,
    commentsEnabled: true,
    comments: [],
  },
  {
    id: "synthetic-checkin-05",
    kind: "checkin",
    author: syntheticAuthors.chenlu,
    body: "今天只完成两个，但都是真实发生的行动。",
    ageMinutes: 520,
    likeCount: 8,
    commentsEnabled: true,
    checkin: {
      day: 1,
      dateLabel: "昨天",
      completedCount: 2,
      totalTasks: 6,
      encouragement: "从两个低门槛动作开始，已经足够成为第一天。",
      visibleTaskTitles: [],
    },
    comments: [],
  },
  {
    id: "synthetic-note-05",
    kind: "note",
    author: syntheticAuthors.songlu,
    body: "把一件不重要的事从清单里删掉，也是一种完成。",
    ageMinutes: 720,
    likeCount: 16,
    commentsEnabled: true,
    comments: [],
  },
  {
    id: "synthetic-checkin-06",
    kind: "checkin",
    author: syntheticAuthors.daomang,
    body: "今天先把节奏找回来。",
    ageMinutes: 940,
    likeCount: 11,
    commentsEnabled: true,
    checkin: {
      day: 5,
      dateLabel: "昨天",
      completedCount: 4,
      totalTasks: 6,
      encouragement: "你没有追求速度，而是重新找到可以继续的节奏。",
      visibleTaskTitles: ["慢走或舒展 10 分钟"],
    },
    comments: [],
  },
  {
    id: "synthetic-note-06",
    kind: "note",
    author: syntheticAuthors.shanhai,
    body: "给协作伙伴说明了今天能完成什么，反而少了很多来回确认。边界清楚以后，心里也更稳。",
    ageMinutes: 1180,
    likeCount: 28,
    commentsEnabled: true,
    comments: [],
  },
];

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value.trim().toLowerCase()) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function memberSquareStorageKey(identity: string) {
  return `${memberSquareStoragePrefix}:${stableHash(identity).toString(16).padStart(8, "0")}`;
}

export function memberSquareViewer(identity: string): MemberSquareAuthor {
  const hash = stableHash(identity);
  const first = ["晨光", "山岚", "松风", "星河", "稻芒", "白露", "云杉", "海盐"];
  const second = ["旅人", "同伴", "记录者", "练习生"];
  const avatars = ["🌱", "🌿", "🍃", "🌤️", "✨", "🌾", "🌊", "⛰️"];
  return {
    id: `viewer-${hash.toString(16).padStart(8, "0")}`,
    displayName: `${first[hash % first.length]}${second[(hash >>> 5) % second.length]} ${String(
      (hash % 89) + 10,
    ).padStart(2, "0")}`,
    avatar: avatars[(hash >>> 9) % avatars.length],
    synthetic: false,
  };
}

function emptyState(): StoredMemberSquareState {
  return {
    version: memberSquareVersion,
    posts: [],
    likedPostIds: [],
    comments: [],
  };
}

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validImageDataUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= memberSquareMaxImageDataLength &&
    /^data:image\/(?:png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(value)
  );
}

function parseCheckin(value: unknown): MemberSquareCheckinContent | undefined {
  if (!value || typeof value !== "object") return undefined;
  const checkin = value as Partial<MemberSquareCheckinContent>;
  if (
    typeof checkin.day !== "number" ||
    typeof checkin.completedCount !== "number" ||
    typeof checkin.totalTasks !== "number"
  ) {
    return undefined;
  }
  const day = Math.max(1, Math.min(7, Math.floor(checkin.day)));
  const totalTasks = Math.max(1, Math.min(12, Math.floor(checkin.totalTasks)));
  const completedCount = Math.max(
    0,
    Math.min(totalTasks, Math.floor(checkin.completedCount)),
  );
  const dateLabel = cleanText(checkin.dateLabel, 24);
  const encouragement = cleanText(checkin.encouragement, 240);
  const visibleTaskTitles = Array.isArray(checkin.visibleTaskTitles)
    ? [...new Set(checkin.visibleTaskTitles)]
        .map((title) => cleanText(title, 80))
        .filter(Boolean)
        .slice(0, 6)
    : [];
  if (!dateLabel || !encouragement) return undefined;
  return {
    day,
    dateLabel,
    completedCount,
    totalTasks,
    encouragement,
    visibleTaskTitles,
  };
}

export function parseMemberSquareState(raw: string | null): StoredMemberSquareState {
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw) as Partial<StoredMemberSquareState>;
    if (parsed.version !== memberSquareVersion) return emptyState();
    const posts = Array.isArray(parsed.posts)
      ? parsed.posts
          .map((value): StoredMemberSquarePost | null => {
            if (!value || typeof value !== "object") return null;
            const post = value as Partial<StoredMemberSquarePost>;
            const id = cleanText(post.id, 80);
            const body = cleanText(post.body, memberSquareMaxNoteLength);
            if (
              !id ||
              (post.kind !== "checkin" && post.kind !== "note") ||
              !validIsoDate(post.createdAt) ||
              typeof post.commentsEnabled !== "boolean"
            ) {
              return null;
            }
            const checkin = post.kind === "checkin" ? parseCheckin(post.checkin) : undefined;
            if (post.kind === "checkin" && !checkin) return null;
            const imageDataUrl = validImageDataUrl(post.imageDataUrl)
              ? post.imageDataUrl
              : undefined;
            if (post.kind === "note" && !body && !imageDataUrl) return null;
            return {
              id,
              kind: post.kind,
              body,
              imageDataUrl,
              checkin,
              createdAt: post.createdAt,
              commentsEnabled: post.commentsEnabled,
              sourceKey: cleanText(post.sourceKey, 80) || undefined,
            };
          })
          .filter((post): post is StoredMemberSquarePost => Boolean(post))
          .slice(0, memberSquareMaxOwnPosts)
      : [];
    const postIds = new Set([
      ...posts.map((post) => post.id),
      ...syntheticPosts.map((post) => post.id),
    ]);
    const likedPostIds = Array.isArray(parsed.likedPostIds)
      ? [...new Set(parsed.likedPostIds)]
          .filter((id): id is string => typeof id === "string" && postIds.has(id))
          .slice(0, postIds.size)
      : [];
    const comments = Array.isArray(parsed.comments)
      ? parsed.comments
          .map((value): StoredMemberSquareComment | null => {
            if (!value || typeof value !== "object") return null;
            const comment = value as Partial<StoredMemberSquareComment>;
            const id = cleanText(comment.id, 80);
            const postId = cleanText(comment.postId, 80);
            const body = cleanText(comment.body, memberSquareMaxCommentLength);
            if (!id || !postIds.has(postId) || !body || !validIsoDate(comment.createdAt)) {
              return null;
            }
            return { id, postId, body, createdAt: comment.createdAt };
          })
          .filter((comment): comment is StoredMemberSquareComment => Boolean(comment))
          .slice(0, memberSquareMaxLocalComments)
      : [];
    return {
      version: memberSquareVersion,
      posts,
      likedPostIds,
      comments,
    };
  } catch {
    return emptyState();
  }
}

function syntheticCreatedAt(now: Date, ageMinutes: number) {
  return new Date(now.getTime() - ageMinutes * 60_000).toISOString();
}

function snapshotFromState(
  identity: string,
  state: StoredMemberSquareState,
  now: Date,
): MemberSquareSnapshot {
  const viewer = memberSquareViewer(identity);
  const likedIds = new Set(state.likedPostIds);
  const localCommentsByPost = new Map<string, StoredMemberSquareComment[]>();
  for (const comment of state.comments) {
    const existing = localCommentsByPost.get(comment.postId) ?? [];
    existing.push(comment);
    localCommentsByPost.set(comment.postId, existing);
  }

  const ownPosts: MemberSquarePost[] = state.posts.map((post) => ({
    ...post,
    author: viewer,
    liked: likedIds.has(post.id),
    likeCount: likedIds.has(post.id) ? 1 : 0,
    comments: (localCommentsByPost.get(post.id) ?? [])
      .map((comment) => ({
        id: comment.id,
        author: viewer,
        body: comment.body,
        createdAt: comment.createdAt,
        own: true,
        synthetic: false,
      }))
      .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)),
    own: true,
    synthetic: false,
  }));

  const demoPosts: MemberSquarePost[] = syntheticPosts.map((post) => {
    const localComments = (localCommentsByPost.get(post.id) ?? []).map((comment) => ({
      id: comment.id,
      author: viewer,
      body: comment.body,
      createdAt: comment.createdAt,
      own: true,
      synthetic: false,
    }));
    return {
      id: post.id,
      kind: post.kind,
      author: post.author,
      body: post.body,
      checkin: post.checkin,
      createdAt: syntheticCreatedAt(now, post.ageMinutes),
      commentsEnabled: post.commentsEnabled,
      liked: likedIds.has(post.id),
      likeCount: post.likeCount + (likedIds.has(post.id) ? 1 : 0),
      comments: [
        ...post.comments.map((comment) => ({
          id: comment.id,
          author: comment.author,
          body: comment.body,
          createdAt: syntheticCreatedAt(now, comment.ageMinutes),
          own: false,
          synthetic: true,
        })),
        ...localComments,
      ].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)),
      own: false,
      synthetic: true,
    };
  });

  return {
    viewer,
    posts: [...ownPosts, ...demoPosts].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    ),
  };
}

function defaultId() {
  if (typeof globalThis.crypto?.randomUUID === "function") return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createLocalMemberSquareProvider(
  storage: MemberSquareStorage,
  options: MemberSquareProviderOptions = {},
): MemberSquareProvider {
  const now = options.now ?? (() => new Date());
  const createId = options.createId ?? defaultId;

  const read = (identity: string) =>
    parseMemberSquareState(storage.getItem(memberSquareStorageKey(identity)));
  const write = (identity: string, state: StoredMemberSquareState) => {
    storage.setItem(memberSquareStorageKey(identity), JSON.stringify(state));
    return snapshotFromState(identity, state, now());
  };
  const snapshot = (identity: string) => snapshotFromState(identity, read(identity), now());
  const postExists = (state: StoredMemberSquareState, postId: string) =>
    state.posts.some((post) => post.id === postId) ||
    syntheticPosts.some((post) => post.id === postId);
  const commentsEnabled = (state: StoredMemberSquareState, postId: string) => {
    const ownPost = state.posts.find((post) => post.id === postId);
    if (ownPost) return ownPost.commentsEnabled;
    return syntheticPosts.find((post) => post.id === postId)?.commentsEnabled ?? false;
  };

  return {
    snapshot,
    publishNote(identity, input) {
      const state = read(identity);
      const body = cleanText(input.body, memberSquareMaxNoteLength);
      const imageDataUrl = validImageDataUrl(input.imageDataUrl)
        ? input.imageDataUrl
        : undefined;
      if (!body && !imageDataUrl) throw new Error("EMPTY_NOTE");
      const post: StoredMemberSquarePost = {
        id: `post-${createId()}`,
        kind: "note",
        body,
        imageDataUrl,
        createdAt: now().toISOString(),
        commentsEnabled: input.commentsEnabled,
      };
      return write(identity, {
        ...state,
        posts: [post, ...state.posts].slice(0, memberSquareMaxOwnPosts),
      });
    },
    publishCheckin(identity, input) {
      const state = read(identity);
      const sourceKey = cleanText(input.sourceKey, 80);
      const checkin = parseCheckin(input);
      if (!sourceKey || !checkin) throw new Error("INVALID_CHECKIN");
      const existing = state.posts.find((post) => post.sourceKey === sourceKey);
      const post: StoredMemberSquarePost = {
        id: existing?.id ?? `post-${createId()}`,
        kind: "checkin",
        body: `今天点亮了 ${checkin.completedCount} 个行动，给自己留一份可见的进步。`,
        checkin,
        createdAt: now().toISOString(),
        commentsEnabled: existing?.commentsEnabled ?? true,
        sourceKey,
      };
      return write(identity, {
        ...state,
        posts: [post, ...state.posts.filter((item) => item.id !== post.id)].slice(
          0,
          memberSquareMaxOwnPosts,
        ),
      });
    },
    toggleLike(identity, postId) {
      const state = read(identity);
      if (!postExists(state, postId)) return snapshotFromState(identity, state, now());
      const liked = new Set(state.likedPostIds);
      if (liked.has(postId)) liked.delete(postId);
      else liked.add(postId);
      return write(identity, { ...state, likedPostIds: [...liked] });
    },
    addComment(identity, postId, value) {
      const state = read(identity);
      const body = cleanText(value, memberSquareMaxCommentLength);
      if (!body) throw new Error("EMPTY_COMMENT");
      if (!postExists(state, postId) || !commentsEnabled(state, postId)) {
        throw new Error("COMMENTS_DISABLED");
      }
      const comment: StoredMemberSquareComment = {
        id: `comment-${createId()}`,
        postId,
        body,
        createdAt: now().toISOString(),
      };
      return write(identity, {
        ...state,
        comments: [...state.comments, comment].slice(-memberSquareMaxLocalComments),
      });
    },
    deleteOwnComment(identity, commentId) {
      const state = read(identity);
      return write(identity, {
        ...state,
        comments: state.comments.filter((comment) => comment.id !== commentId),
      });
    },
    deleteOwnPost(identity, postId) {
      const state = read(identity);
      if (!state.posts.some((post) => post.id === postId)) {
        return snapshotFromState(identity, state, now());
      }
      return write(identity, {
        ...state,
        posts: state.posts.filter((post) => post.id !== postId),
        likedPostIds: state.likedPostIds.filter((id) => id !== postId),
        comments: state.comments.filter((comment) => comment.postId !== postId),
      });
    },
    setOwnPostCommentsEnabled(identity, postId, enabled) {
      const state = read(identity);
      if (!state.posts.some((post) => post.id === postId)) {
        return snapshotFromState(identity, state, now());
      }
      return write(identity, {
        ...state,
        posts: state.posts.map((post) =>
          post.id === postId ? { ...post, commentsEnabled: enabled } : post,
        ),
      });
    },
  };
}
