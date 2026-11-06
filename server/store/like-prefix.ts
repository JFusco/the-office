/** A bound LIKE pattern matching values that start with `prefix` literally; pair it with `LIKE ? ESCAPE '\'`. */
export function likePrefix(prefix: string): string {
    return `${prefix.replace(/[\\%_]/g, character => `\\${character}`)}%`;
}
