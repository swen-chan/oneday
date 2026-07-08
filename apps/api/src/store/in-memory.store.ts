import { Injectable } from '@nestjs/common';
import type { ParsedExport } from '../chat-import/chat-parser';

// Phase 0 demo 存储：内存仓储。
// Prisma/Postgres 接入被 Docker 环境阻塞（见 thread 记录），接口形状与
// prisma/schema.prisma 对齐，换存储时控制器不动。demo-first 决策下可接受。

export interface StoredBrand {
  id: string;
  name: string;
  industry: string;
  tagline: string;
  defaultTheme: string;
  groupIds: string[];
}

export interface StoredGroup {
  id: string;
  brandId?: string;
  name: string;
  imports: {
    id: string;
    filename: string;
    messageCount: number;
    memberCount: number;
    periodStart: Date;
    periodEnd: Date;
    createdAt: Date;
  }[];
  members: Map<
    string,
    {
      alias: string;
      firstSeenAt: Date;
      lastActiveAt: Date;
      messageCount: number;
    }
  >;
  latestPeriodEnd: Date | null;
}

@Injectable()
export class InMemoryStore {
  private brands = new Map<string, StoredBrand>();
  private groups = new Map<string, StoredGroup>();
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}_${this.seq.toString(36).padStart(6, '0')}`;
  }

  createBrand(input: {
    name: string;
    industry: string;
    tagline: string;
    defaultTheme: string;
  }): StoredBrand {
    const brand: StoredBrand = {
      id: this.nextId('brd'),
      groupIds: [],
      ...input,
    };
    this.brands.set(brand.id, brand);
    return brand;
  }

  listBrands(): StoredBrand[] {
    return [...this.brands.values()];
  }

  findBrand(id: string): StoredBrand | undefined {
    return this.brands.get(id);
  }

  createGroup(name: string, brandId?: string): StoredGroup {
    const group: StoredGroup = {
      id: this.nextId('grp'),
      brandId,
      name,
      imports: [],
      members: new Map(),
      latestPeriodEnd: null,
    };
    this.groups.set(group.id, group);
    if (brandId) this.brands.get(brandId)?.groupIds.push(group.id);
    return group;
  }

  findGroup(id: string): StoredGroup | undefined {
    return this.groups.get(id);
  }

  memberCountOf(groupId: string): number {
    return this.groups.get(groupId)?.members.size ?? 0;
  }

  applyImport(
    group: StoredGroup,
    filename: string,
    parsed: ParsedExport,
  ): StoredGroup['imports'][number] {
    for (const m of parsed.members) {
      const existing = group.members.get(m.alias);
      if (existing) {
        existing.messageCount += m.messageCount;
        if (m.lastActiveAt > existing.lastActiveAt)
          existing.lastActiveAt = m.lastActiveAt;
        if (m.firstSeenAt < existing.firstSeenAt)
          existing.firstSeenAt = m.firstSeenAt;
      } else {
        group.members.set(m.alias, { ...m });
      }
    }
    const record = {
      id: this.nextId('imp'),
      filename,
      messageCount: parsed.messages.length,
      memberCount: parsed.members.length,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      createdAt: new Date(),
    };
    group.imports.push(record);
    if (!group.latestPeriodEnd || parsed.periodEnd > group.latestPeriodEnd) {
      group.latestPeriodEnd = parsed.periodEnd;
    }
    return record;
  }
}
