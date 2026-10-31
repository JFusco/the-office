import { useCallback, useEffect, useRef, useState } from 'react';
import { ROLE_NAMES, type Role } from '../shared';

export const PARTY_DURATION = 120_000;
export const OFFICE_CAST: Record<Role, string> = {
  cto: 'Michael Scott', pm: 'Pam Beesly', developer: 'Jim Halpert',
  lead: 'Dwight Schrute', qa: 'Angela Martin', it: 'Ryan Howard',
};
// A bounded prefix buffer keeps hidden typing out of the ordinary letter shortcuts.
export function secretPhrase(buffer: string, key: string) {
  const phrases = ['dance', 'the office'];
  const next = buffer + key.toLowerCase();
  const match = phrases.find(phrase => next.endsWith(phrase));
  if (match) return { buffer: '', match, consumed: true };
  for (let i = 0; i < next.length; i++) {
    const suffix = next.slice(i);
    if (phrases.some(phrase => phrase.startsWith(suffix))) return { buffer: suffix, match: '', consumed: true };
  }
  return { buffer: '', match: '', consumed: false };
}

export function useOfficeEasterEggs() {
  const [partyUntil, setPartyUntil] = useState(0), [cast, setCast] = useState(false);
  const typing = useRef({ buffer: '', at: 0 });
  useEffect(() => {
    if (!partyUntil) return;
    const expire = () => { if (Date.now() >= partyUntil) setPartyUntil(0); };
    const timer = setTimeout(expire, Math.max(0, partyUntil - Date.now()));
    document.addEventListener('visibilitychange', expire);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', expire); };
  }, [partyUntil]);
  const handleSecret = useCallback((event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.isComposing || event.repeat ||
        (event.target instanceof Element && event.target.closest('input,select,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]'))) {
      typing.current = { buffer: '', at: 0 }; return false;
    }
    if (event.key.length !== 1) { typing.current = { buffer: '', at: 0 }; return false; }
    const now = Date.now();
    const result = secretPhrase(now - typing.current.at > 2500 ? '' : typing.current.buffer, event.key);
    typing.current = { buffer: result.buffer, at: now };
    if (result.match === 'dance') setPartyUntil(now + PARTY_DURATION);
    if (result.match === 'the office') setCast(true);
    if (result.consumed) event.preventDefault();
    return result.consumed;
  }, []);
  return { party: partyUntil > Date.now(), cast, names: cast ? OFFICE_CAST : ROLE_NAMES, handleSecret };
}
