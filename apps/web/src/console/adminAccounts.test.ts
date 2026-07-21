import { describe, expect, it } from "vitest";
import {
  adminAccountsStorageKey,
  authenticateAdminAccount,
  createAdminAccount,
  defaultAdminAccounts,
  demoPasswordDigest,
  digestDemoPassword,
  readAdminAccounts,
  saveAdminAccounts,
  updateAdminAccount,
} from "./adminAccounts";

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

describe("console administrator accounts", () => {
  it("provides two active hotel administrators with one-to-one hotel scopes", () => {
    const accounts = defaultAdminAccounts("brand-test");
    expect(accounts).toHaveLength(2);
    expect(accounts.map((account) => account.username)).toEqual(["无名初酒店", "君亭酒店"]);
    expect(accounts.map((account) => account.allowedHotelIds)).toEqual([
      ["wumingchu"],
      ["junting"],
    ]);
    expect(accounts.every((account) => account.email.endsWith(".demo"))).toBe(true);
    expect(accounts.every((account) => account.role === "operator")).toBe(true);
    expect(
      accounts.every(
        (account) =>
          authenticateAdminAccount(accounts, account.email, demoPasswordDigest)?.id ===
          account.id,
      ),
    ).toBe(true);
  });

  it("requires a password on create and stores only its digest", () => {
    const accounts = defaultAdminAccounts("brand-test");
    const missingPassword = createAdminAccount(
      accounts,
      "brand-test",
      {
        username: "新管理员",
        email: "new-admin@oneday.demo",
        password: "",
        allowedHotelIds: ["wumingchu"],
        status: "active",
      },
      "admin-new",
    );
    expect(missingPassword.error).toContain("必须设置初始密码");

    const password = "local-demo-password";
    const created = createAdminAccount(
      accounts,
      "brand-test",
      {
        username: "新管理员",
        email: "new-admin@oneday.demo",
        password,
        allowedHotelIds: ["wumingchu", "junting"],
        status: "active",
      },
      "admin-new",
    );
    expect(created.error).toBeUndefined();
    expect(created.account?.passwordDigest).toBe(digestDemoPassword(password));
    expect(created.account).not.toHaveProperty("password");
    expect(JSON.stringify(created.accounts)).not.toContain(password);
    expect(created.account?.role).toBe("operator");
  });

  it("keeps the existing digest when an edit leaves password blank", () => {
    const accounts = defaultAdminAccounts("brand-test");
    const originalDigest = accounts[0].passwordDigest;
    const updated = updateAdminAccount(accounts, accounts[0].id, {
      username: "无名初店长",
      email: accounts[0].email,
      password: "",
      allowedHotelIds: ["wumingchu"],
      status: "active",
    });

    expect(updated.account?.username).toBe("无名初店长");
    expect(updated.account?.passwordDigest).toBe(originalDigest);
  });

  it("persists account digests locally and safely repairs malformed data", () => {
    const storage = memoryStorage();
    const accounts = defaultAdminAccounts("brand-test");
    saveAdminAccounts("brand-test", accounts, storage);
    const raw = storage.getItem(adminAccountsStorageKey("brand-test"));
    expect(raw).toContain(demoPasswordDigest);
    expect(readAdminAccounts("brand-test", storage)).toEqual(accounts);

    storage.setItem(adminAccountsStorageKey("brand-test"), "not-json");
    expect(readAdminAccounts("brand-test", storage)).toEqual(defaultAdminAccounts("brand-test"));
  });
});
