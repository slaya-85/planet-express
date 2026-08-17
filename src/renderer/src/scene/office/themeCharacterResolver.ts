export interface ThemeCharacterTheme<Name extends string> {
  cast: {
    byName: Record<string, { name: Name }>;
    defaultCharacter: Name;
  };
  boss: {
    character: Name;
  };
}

export interface ThemeCharacterSubject<Name extends string> {
  id: string;
  character?: Name;
  isGod?: boolean;
}

function stableHash(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function resolveThemeCharacter<Name extends string>(
  theme: ThemeCharacterTheme<Name>,
  subject: ThemeCharacterSubject<Name>,
): Name {
  if (subject.isGod) return theme.boss.character;
  if (subject.character && theme.cast.byName[subject.character]) return subject.character;

  const members = Object.values(theme.cast.byName);
  const workerPool = members.filter((member) => member.name !== theme.boss.character);
  const pool = workerPool.length > 0 ? workerPool : members;
  if (pool.length === 0) return theme.cast.defaultCharacter;

  const key = subject.id || subject.character || theme.cast.defaultCharacter;
  return pool[stableHash(key) % pool.length].name;
}
