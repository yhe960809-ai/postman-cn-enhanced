// Self-contained so the same tested translator can run in Electron's preload.
export function createTemplateTranslator(entries) {
  const patterns = [];
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const [source, target] of entries) {
    const tokens = [...source.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)];
    if (!tokens.length || tokens.length > 6) continue;
    const fixed = source.replace(/\{[A-Za-z_][A-Za-z0-9_]*\}/g, '');
    if (!/[A-Za-z]{3}/.test(fixed) || /[{}\r\n]/.test(fixed)) continue;
    const names = [...new Set(tokens.map(t => t[1]))];
    const targets = [...new Set([...target.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(t => t[1]))];
    if (names.length !== targets.length || names.some(n => !targets.includes(n))) continue;
    let cursor = 0;
    let pattern = '^';
    const groups = new Map();
    for (const token of tokens) {
      pattern += escape(source.slice(cursor, token.index));
      if (groups.has(token[1])) pattern += '\\' + groups.get(token[1]);
      else { groups.set(token[1], groups.size + 1); pattern += '(.+?)'; }
      cursor = token.index + token[0].length;
    }
    pattern += escape(source.slice(cursor)) + '$';
    patterns.push({regex:new RegExp(pattern),target,groups});
  }
  return value => {
    for (const {regex,target,groups} of patterns) {
      const match = regex.exec(value);
      if (match) return target.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_,name) => match[groups.get(name)]);
    }
    return value;
  };
}
