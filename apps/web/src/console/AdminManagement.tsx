"use client";

import { type FormEvent, useCallback, useState } from "react";
import {
  createAdminAccount,
  defaultAdminAccounts,
  hotelNamesForAccount,
  updateAdminAccount,
  type AdminAccount,
  type AdminStatus,
} from "./adminAccounts";
import { hotelOptions, type HotelId } from "./commercialData";

interface AdminManagementProps {
  brandId: string;
  isOwner: boolean;
  accounts: readonly AdminAccount[];
  onAccountsChange: (accounts: AdminAccount[]) => void;
}
const statusLabels: Record<AdminStatus, string> = {
  active: "启用",
  paused: "停用",
};

export function AdminManagement({
  brandId,
  isOwner,
  accounts,
  onAccountsChange,
}: AdminManagementProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowedHotelIds, setAllowedHotelIds] = useState<HotelId[]>(["wumingchu"]);
  const [status, setStatus] = useState<AdminStatus>("active");
  const [notice, setNotice] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setUsername("");
    setEmail("");
    setPassword("");
    setAllowedHotelIds(["wumingchu"]);
    setStatus("active");
  }, []);

  const startEdit = (account: AdminAccount) => {
    setEditingId(account.id);
    setUsername(account.username);
    setEmail(account.email);
    setPassword("");
    setAllowedHotelIds(account.allowedHotelIds);
    setStatus(account.status);
    setNotice(null);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOwner) return;
    const input = { username, email, password, allowedHotelIds, status };
    const result = editingId
      ? updateAdminAccount(accounts, editingId, input)
      : createAdminAccount(accounts, brandId, input, `${brandId}-admin-${Date.now()}`);
    if (result.error) {
      setNotice(result.error);
      return;
    }
    onAccountsChange(result.accounts);
    setNotice(editingId ? "管理员信息已更新" : "管理员已创建，可在当前浏览器登录");
    resetForm();
  };

  const toggleHotel = (hotelId: HotelId) => {
    setAllowedHotelIds((current) =>
      current.includes(hotelId)
        ? current.filter((currentId) => currentId !== hotelId)
        : [...current, hotelId],
    );
  };

  const toggleStatus = (accountId: string) => {
    if (!isOwner) return;
    onAccountsChange(
      accounts.map((account) =>
        account.id === accountId
          ? { ...account, status: account.status === "active" ? "paused" : "active" }
          : account,
      ),
    );
    setNotice("管理员状态已更新");
  };

  const removeAccount = (accountId: string) => {
    if (!isOwner) return;
    onAccountsChange(accounts.filter((account) => account.id !== accountId));
    if (editingId === accountId) resetForm();
    setNotice("管理员已删除");
  };

  return (
    <section className="mb-12" data-testid="admin-management">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-brand">ACCESS CONTROL</p>
          <h2 className="mt-2 text-xl font-bold">管理员权限</h2>
          <p className="mt-1 text-sm text-ink-muted">
            管理酒店范围与登录状态；本轮为同一浏览器内的演示账号
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              onAccountsChange(defaultAdminAccounts(brandId));
              resetForm();
              setNotice("已恢复两家酒店的默认管理员");
            }}
            className="rounded-full border border-line px-4 py-2 text-xs font-medium text-ink-muted transition hover:border-brand hover:text-brand"
          >
            恢复默认管理员
          </button>
        )}
      </div>

      {!isOwner ? (
        <div className="rounded-3xl border border-line bg-surface p-6">
          <p className="text-sm font-bold">仅品牌负责人可管理管理员</p>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            当前管理员只能查看被授权酒店的经营与供应链数据，不能进入账号管理表单。
          </p>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
          <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">{editingId ? "编辑管理员" : "新增管理员"}</h3>
                <p className="mt-1 text-xs text-ink-muted">
                  所有这里创建的账号均为管理员，无需选择角色
                </p>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setNotice(null);
                  }}
                  className="text-xs text-ink-muted transition hover:text-brand"
                >
                  取消编辑
                </button>
              )}
            </div>

            {notice && (
              <p className="mb-4 rounded-xl bg-brand-soft px-3 py-2 text-xs text-brand" role="status">
                {notice}
              </p>
            )}

            <div className="grid gap-3">
              <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                用户名
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                  placeholder="如：无名初店长"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                邮箱
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                  placeholder="admin@hotel.demo"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                {editingId ? "重设密码（留空则不修改）" : "初始密码"}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                  placeholder={editingId ? "不修改可留空" : "设置初始密码"}
                />
              </label>
              <fieldset className="rounded-2xl border border-line bg-bg p-4">
                <legend className="px-1 text-xs font-medium text-ink-muted">可管理酒店（多选）</legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {hotelOptions.map((hotel) => (
                    <label
                      key={hotel.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                        allowedHotelIds.includes(hotel.id)
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-white text-ink-soft"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={allowedHotelIds.includes(hotel.id)}
                        onChange={() => toggleHotel(hotel.id)}
                        className="accent-[#4e7d6f]"
                      />
                      {hotel.name}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="grid gap-1.5 text-xs font-medium text-ink-muted">
                状态
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as AdminStatus)}
                  className="rounded-xl border border-line bg-white px-4 py-3 text-sm font-normal text-ink outline-none focus:border-brand"
                >
                  <option value="active">启用</option>
                  <option value="paused">停用</option>
                </select>
              </label>
              <button
                type="submit"
                className="rounded-full bg-brand px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                {editingId ? "保存管理员" : "新增管理员"}
              </button>
            </div>
          </form>

          <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">管理员账号</h3>
                <p className="mt-1 text-xs text-ink-muted">品牌负责人账号受保护，不在此列表编辑</p>
              </div>
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs text-ink-muted">
                {accounts.length} 人
              </span>
            </div>
            {accounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-ink-muted">
                暂无管理员，可从左侧创建或恢复默认账号。
              </div>
            ) : (
              <div className="grid gap-3">
                {accounts.map((account) => (
                  <article key={account.id} className="rounded-2xl border border-line bg-bg px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold">{account.username}</p>
                        <p className="mt-1 text-xs text-ink-muted">{account.email}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs ${
                          account.status === "active"
                            ? "bg-brand-soft text-brand"
                            : "bg-warn-soft text-warn"
                        }`}
                      >
                        {statusLabels[account.status]}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {hotelNamesForAccount(account).map((hotelName) => (
                        <span key={hotelName} className="rounded-full bg-surface px-2.5 py-1 text-xs text-ink-soft">
                          {hotelName}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
                      <p className="text-xs text-ink-muted">最近活跃：{account.lastActiveAt}</p>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <button type="button" onClick={() => startEdit(account)} className="font-medium text-brand">
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(account.id)}
                          className="font-medium text-ink-muted transition hover:text-brand"
                        >
                          {account.status === "active" ? "停用" : "启用"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAccount(account.id)}
                          className="font-medium text-warn"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
