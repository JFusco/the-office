import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => vi.unstubAllGlobals());
async function resolver() {
  vi.resetModules();
  const colors = await import('../../../src/tokens/scene-colors');
  const values = new Map<string, string>(Object.values(colors.SCENE_COLOR_TOKENS).map(name => [name, '  #123456  ']));
  const element = {};
  vi.stubGlobal('document', { documentElement: element });
  const read = vi.fn((target: unknown) => {
    expect(target).toBe(element);
    return { getPropertyValue: (name: string) => values.get(name) || '' };
  });
  vi.stubGlobal('getComputedStyle', read);
  return { ...colors, values, read };
}

test('resolves and trims the palette once across repeated frame reads', async () => {
  const { sceneColors, read } = await resolver();
  const first = sceneColors();
  expect(Object.values(first).every(value => value === '#123456')).toBe(true);
  expect(sceneColors()).toBe(first);
  expect(read).toHaveBeenCalledTimes(1);
});

test('names the missing token and retries a complete palette instead of caching partial resolution', async () => {
  const { sceneColors, values, read, SCENE_COLOR_TOKENS } = await resolver();
  const [key, token] = Object.entries(SCENE_COLOR_TOKENS).at(-1)!;
  values.delete(token);
  expect(() => sceneColors()).toThrow(`Scene color token ${token} is not defined`);
  values.set(token, '  #abcdef  ');
  expect(sceneColors()[key as keyof typeof SCENE_COLOR_TOKENS]).toBe('#abcdef');
  expect(read).toHaveBeenCalledTimes(2);
});
