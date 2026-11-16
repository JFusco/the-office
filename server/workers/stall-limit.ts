/**
 * How long a stage worker may produce no output before it is treated as stalled. The longest
 * silence measured in real developer sessions was just under 10 minutes (one long command at the
 * CLI's own command limit); Codex stage workers stayed under 3. Twenty minutes of nothing is not
 * a slow command.
 */
export const STAGE_STALL_LIMIT_MS = 20 * 60 * 1000;
