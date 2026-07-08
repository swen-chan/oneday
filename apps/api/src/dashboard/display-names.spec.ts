import { buildDisplayNames } from './display-names';

// 展示层化名（验收条件，Reviewer msg=20b07216）：
// 由底层代号确定性推导、更像人；同一组内必须与代号 1:1（撞名自动加后缀消歧），
// 数据层代号不动——脱敏与碰撞防护不受影响。

const alias = (hex: string) => `成员${hex}`;

describe('buildDisplayNames', () => {
  it('确定性：同一代号集合永远得到同样的化名', () => {
    const aliases = [alias('A1B2C3D4'), alias('00FF00FF')];
    expect(buildDisplayNames(aliases)).toEqual(buildDisplayNames(aliases));
  });

  it('化名不含"成员"技术前缀、不含 8 位十六进制原码', () => {
    const names = buildDisplayNames([alias('A1B2C3D4')]);
    const name = names.get(alias('A1B2C3D4'))!;
    expect(name).not.toContain('成员');
    expect(name).not.toContain('A1B2C3D4');
    expect(name).toMatch(/^学员·/);
  });

  it('组内 1:1：不同代号绝不产生相同化名（构造撞名场景验证兜底）', () => {
    // 构造大量代号，其中必然出现基础化名碰撞，验证消歧后仍唯一
    const aliases = Array.from({ length: 800 }, (_, i) =>
      alias(i.toString(16).padStart(8, '0').toUpperCase()),
    );
    const names = buildDisplayNames(aliases);
    const values = [...names.values()];
    expect(new Set(values).size).toBe(aliases.length);
  });

  it('撞名消歧后缀仍然确定性（与集合顺序无关）', () => {
    const many = Array.from({ length: 300 }, (_, i) =>
      alias(i.toString(16).padStart(8, '0').toUpperCase()),
    );
    const shuffled = [...many].reverse();
    const a = buildDisplayNames(many);
    const b = buildDisplayNames(shuffled);
    for (const key of many) {
      expect(a.get(key)).toBe(b.get(key));
    }
  });

  it('非法代号格式原样返回（不猜）', () => {
    const names = buildDisplayNames(['王小美']);
    expect(names.get('王小美')).toBe('王小美');
  });
});
