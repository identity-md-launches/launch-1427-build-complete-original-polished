const paths: Record<string, string> = {
  arrow: '<path d="M4 12h15M13 5l7 7-7 7"/>',
  diagonal: '<path d="M5 19 19 5M5 5h14v14"/>',
  sound:
    '<path d="m11 4-6 5H2v6h3l6 5V4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 6 6m0-6-6 6"/>',
  pause: '<path d="M8 4v16M16 4v16" stroke-width="4"/>',
  play: '<path d="m7 4 13 8-13 8V4Z"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  target:
    '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v5m0 12v5M1 12h5m12 0h5"/>',
  power: '<path d="m13 2-9 12h7l-1 8 10-13h-8l1-7Z"/>',
  crystal: '<path d="m12 2 8 8-8 12L4 10l8-8ZM4 10h16M12 2v20"/>',
  army: '<path d="M8 18H2v-2a5 5 0 0 1 5-5m10 0a5 5 0 0 1 5 5v2h-6M7 22v-5a5 5 0 0 1 10 0v5H7Z"/><circle cx="12" cy="7" r="4"/>',
  shield:
    '<path d="m12 2 9 4v7c0 5-9 9-9 9s-9-4-9-9V6l9-4Z"/><path d="m7 12 3 3 7-7"/>',
  cult: '<path d="m12 2 10 18H2L12 2Z"/><path d="m7 14 5-6 5 6-5 3-5-3Z"/>',
  book: '<path d="M12 5C7 2 2 4 2 4v16s5-2 10 1c5-3 10-1 10-1V4s-5-2-10 1Zm0 0v16"/>',
  back: '<path d="M20 12H4m7-7-7 7 7 7"/>',
  home: '<path d="m2 11 10-9 10 9M5 9v12h14V9m-10 12v-8h6v8"/>',
  stop: '<path d="M5 5h14v14H5Z"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  signal: '<path d="M5 20v-4m5 4v-8m5 8V8m5 12V4"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  plus: '<path d="M12 4v16M4 12h16"/>',
  minus: '<path d="M4 12h16"/>',
};
export const icon = (name: string, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">${paths[name] ?? paths.target}</svg>`;
export const mark = `<svg class="brand-mark" viewBox="0 0 38 38" aria-hidden="true"><path d="M3 8 19 1l16 7v15L19 37 3 23Z" fill="currentColor"/><path d="m10 11 7-4 4 1 7 4-1 11-8 7-9-7Z" fill="#10180f"/><path d="m10 15 6-2 3 3 4-3 5 2-2 6-7 4-8-4Z" fill="currentColor"/><path d="M12 18h4m6 0h4m-13 4 6 1 6-1" stroke="#10180f" stroke-width="2"/></svg>`;
