/**
 * Which browser tools an Office QA worker can use. Workers run under a background service, so a
 * desktop computer-use or app-hosted browser tool has no host to reach; a failure from one says
 * nothing about the browser. A handoff that names a loopback debugging port means that browser
 * is already running and is attached to, not replaced.
 */
export const BROWSER_ATTACH_RULE = `BROWSER TOOL: You run as a background service worker. Desktop computer-use and app-hosted browser tools (for example a CUA or desktop browser-control tool) have no host here; do not use them, and never report an error from one as the browser being unavailable. Drive the browser with the installed agent-browser CLI (chrome-devtools for console, network or performance diagnostics). When the handoff names a running browser's loopback debugging port, first confirm that process and port are live (for example GET http://127.0.0.1:<port>/json/version), then attach to that same browser over the Chrome DevTools Protocol (agent-browser --cdp <port>) and verify the real tab URL, title and signed-in actor through it. Do not launch a second browser or copy its profile. Report browser setup blocked only when the attach itself fails, and retain the exact attach command and its error.`;
