/* Build the v36 (M14) language files for the CAW Social web viewer.
 *
 * The viewer's string table lives in docs/viewer.js with en + ja
 * embedded. The other eighteen languages of the Android app
 * (~/workspace/caw-social-app/src/i18n.ts) are ported mechanically:
 *
 *   docs/dict-<lang>.js   — window.__CAW_T = the viewer's FULL key
 *                           set for that language: the app's string
 *                           for every web key that maps to an app
 *                           key, the English web string otherwise
 *                           (counted and printed — never invented).
 *   docs/<lang>.html      — a shell generated from docs/en.html:
 *                           static strings replaced through the
 *                           en<->ja line diff (each differing chunk
 *                           looked up in the app dicts the same
 *                           way), hrefs repointed at the new shell,
 *                           <html lang> set, dir="rtl" for fa/ar,
 *                           and the dict script loaded before
 *                           viewer.js.
 *
 * A web key maps to an app key when (a) the English values are
 * identical (Japanese disambiguates duplicates), (b) they are
 * identical after light normalisation, or (c) the pair is listed
 * in MANUAL below — a hand-checked semantic match made against
 * both apps' EN + JA texts. A mapping is only used when the app
 * string's {placeholders} are a subset of the web string's (an
 * app string needing a placeholder the web never supplies would
 * print it raw); per language, an app translation that breaks
 * that rule falls back to English for that key.
 *
 * Run: node scripts/build-i18n.mjs   (re-run after editing the
 * en/ja dicts in viewer.js or the en/ja shells; en.html/ja.html
 * themselves are maintained by hand and never overwritten.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = path.join(ROOT, 'docs');
const APP_I18N = path.join(ROOT, '..', 'caw-social-app', 'src', 'i18n.ts');

export const LANGS = [
  ['en', 'English'], ['ja', '日本語'], ['zh', '简体中文'], ['ko', '한국어'],
  ['es', 'Español'], ['tr', 'Türkçe'], ['fa', 'فارسی'], ['id', 'Bahasa Indonesia'],
  ['vi', 'Tiếng Việt'], ['th', 'ภาษาไทย'], ['it', 'Italiano'], ['pt', 'Português'],
  ['nl', 'Nederlands'], ['pl', 'Polski'], ['uk', 'Українська'], ['de', 'Deutsch'],
  ['ru', 'Русский'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['fr', 'Français'],
];
export const RTL_LANGS = ['fa', 'ar'];
const APP_OBJ = { en: 'EN', ja: 'JA', zh: 'ZH', ko: 'KO', es: 'ES', tr: 'TR', fa: 'FA', id: 'ID', vi: 'VI', th: 'TH', it: 'IT', pt: 'PT', nl: 'NL', pl: 'PL', uk: 'UK', de: 'DE', ru: 'RU', ar: 'AR', hi: 'HI', fr: 'FR' };

/* Hand-checked semantic pairs (web key -> app key): the app's
   wording for the same UI slot, verified against both the EN and
   JA texts of both codebases. Keys not listed here and not matched
   mechanically are web-only and fall back to the English string. */
export const MANUAL = {
  loadFail: 'tl.loadFail', empty: 'tl.empty', lookupTitle: 'search.title',
  lookupFail: 'search.loadFail', checking: 'get.checking',
  recawedBy: 'tl.recawedBy', originalMissing: 'tl.originalMissing',
  looking: 'profile.searching', recaws: 'tl.recaw', back: 'common.back',
  inName: 'profile.inName', copied: 'settings.copied',
  followEmpty: 'followlist.empty', getInvalid: 'get.invalid',
  getSeeProfile: 'get.viewProfile', getCheckFail: 'get.checkFail',
  getPreviewLbl: 'get.preview', yourQcaw: 'get.yourQcaw',
  yourQom: 'home.qom', getConfirmApprove: 'get.confirmApprove',
  getConfirmMint: 'get.confirmMint', notEnoughQcaw: 'get.notEnough',
  recording: 'get.waiting', sendFail: 'get.failed', mintDone: 'get.done',
  viewProfileBtn: 'get.viewProfile', mintChanged: 'get.changed',
  priceChanged: 'get.changed',
  myNamesTitle: 'mine.title', noNames: 'mine.none',
  pwCreateBtn: 'wallet.create', pwImportBtn: 'wallet.import',
  pwCreateExplain: 'wallet.createDesc', pwShowPhraseTitle: 'wallet.wordsTitle',
  pwPhraseWarn: 'wallet.wordsWarn', pwWroteIt: 'wallet.savedIt',
  pwCancelBtn: 'settings.cancel', pwSetPasswordTitle: 'wallet.setupTitle',
  pwPasswordPh: 'wallet.pwPh', pwPassword2Ph: 'wallet.pw2Ph',
  pwPasswordShort: 'wallet.pwShort', pwPasswordMismatch: 'wallet.pwMismatch',
  pwSaveBtn: 'wallet.done', pwImportExplain: 'wallet.importDesc',
  pwImportBadKey: 'wallet.badKey', pwImportBadWords: 'wallet.badWords',
  pwCreateAddrLbl: 'wallet.address', pwWalletKindPhrase: 'wallets.kindWords',
  pwWalletsTitle: 'wallets.title', pwAmtTapHint: 'card.tapHint',
  pwCawInNameLbl: 'card.inName', setAddressLbl: 'settings.address',
  setBackup: 'settings.backup', setAboutTitle: 'settings.about',
  setSetupBtn: 'wallet.setupTitle', pwLockedTitle: 'unlock.title',
  pwRevealTitle: 'reveal.title', pwRevealHide: 'reveal.tapHide',
  mediaAudioLbl: 'media.audio', mediaSet: 'custom.save',
  mediaClear: 'bm.remove', mediaBusy: 'media.uploading',
  mediaDone: 'media.uploaded', attachLbl: 'compose.addImages',
  attachFail: 'compose.attachFailed', pwUnlockWrong: 'unlock.wrong',
  pwQomLbl: 'home.qom', pwQcawLbl: 'home.qcaw',
  pwNameBalanceLbl: 'card.inName', pwNoNamesYet: 'mine.none',
  pwLockBtn: 'settings.lockNow', pwRemoveBtn: 'settings.delete',
  pwRemoveWarn: 'settings.deleteWarn', pwRemoveConfirmBtn: 'settings.deleteConfirm',
  pwAmountPh: 'mine.amountPh', pwAmountBad: 'mine.badAmount',
  pwApproveFirst: 'mine.approveFirst', pwBusySending: 'mine.sending',
  pwBusyWaiting: 'mine.waiting', pwDoneOk: 'mine.done',
  pwSendFailPlain: 'mine.failed', pwUnconfirmed: 'hs.unconfirmed',
  pwSendTitle: 'send.title', pwSendToBad: 'send.badAddress',
  confirmTitleSend: 'send.confirmTitle', sendTo: 'send.to',
  sendSending: 'send.sending', fcClaiming: 'faucet.claiming',
  compPostBtn: 'compose.post', compCancelRef: 'settings.cancel',
  compHintSetupBtn: 'wallet.setupTitle', compHintNoName: 'compose.needName',
  compCost: 'compose.cost', compCostFrom: 'compose.costFrom',
  actQuote: 'act.quoteRecaw', actFollowing: 'act.following',
  actOwnProfile: 'profile.yourName', confirmTitlePost: 'compose.confirmTitle',
  confirmSignBtn: 'compose.send', confirmCancelBtn: 'settings.cancel',
  actSending: 'act.sending', actWaiting: 'get.waiting', actDone: 'act.done',
  actFail: 'act.failed', actUnconfirmed: 'hs.unconfirmed',
  actSelfFollow: 'act.selfFollow', bmRemove: 'bm.remove',
  bmMissing: 'bm.unavailable', navProfile: 'nav.profile',
  navGetName: 'nav.getName', navReactions: 'inbox.title',
  ntOpenWallet: 'hub.wallet', mirrorOpenWallet: 'hub.wallet',
  mirrorSave: 'custom.save', customNote: 'custom.note',
  customMediaNote: 'media.note', mineSummary: 'mine.summary',
  mineWalletBal: 'home.qcaw', draftAutoSaved: 'draft.autoSaved',
  dirBuilding: 'search.loading', compCloseLbl: 'common.close',
  dexChecking: 'hs.checking', dexYouGet: 'dex.youGet',
  dexNoRoute: 'dex.noPool', dexOverBal: 'send.over',
  dexSwapStep: 'hs.sending', dexDone: 'dex.done',
  dexMoved: 'hs.priceMoved', dexRouteGone: 'hs.noRoute',
  bhIntro: 'bh.intro', bhRoundNote: 'bh.roundNote',
  bhTooSmall: 'bh.minNote', bhOverBal: 'send.over', bhCta: 'bh.burnCta',
  bhApproveStep: 'bh.stepApprove', bhBurnStep: 'bh.stepBurn',
  bhDone: 'bh.done', bhFail: 'bh.failed',
  followingLbl: 'tl.tabFollowing', tabFollowing: 'tl.tabFollowing',
  tipTo: 'tip.to',
};

/* ---------- generic object-literal extraction ---------- */
export function extractObject(src, startIdx) {
  let i = src.indexOf('{', startIdx);
  let depth = 0, inStr = null, esc = false;
  const start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === inStr) inStr = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  throw new Error('unbalanced object literal');
}
const evalObj = text => new Function('return (' + text + ')')();

export function loadWebDicts(viewerSrc) {
  const t = evalObj(extractObject(viewerSrc, viewerSrc.indexOf('const T')));
  return t; // { en: {...}, ja: {...} }
}
export function loadAppDicts(appSrc) {
  const out = {};
  for (const [code, name] of Object.entries(APP_OBJ)) {
    const m = new RegExp('const ' + name + '(?:: Dict)? = \\{').exec(appSrc);
    if (!m) throw new Error('app dict not found: ' + name);
    out[code] = evalObj(extractObject(appSrc, m.index));
  }
  return out;
}

const tokensOf = s => [...String(s).matchAll(/\{[a-zA-Z]+\}/g)].map(m => m[0]);
const tokensFit = (appVal, webVal) => {
  const web = new Set(tokensOf(webVal));
  return tokensOf(appVal).every(t => web.has(t));
};
const norm = s => String(s).toLowerCase().replace(/[…]+/g, '...')
  .replace(/\s+/g, ' ').replace(/[.。]+$/g, '').trim();

/* web key -> app key (or null). Validates placeholders per language
   at build time in buildDicts. */
export function buildMapping(web, app) {
  const byEn = new Map(), byNorm = new Map();
  for (const [k, v] of Object.entries(app.en)) {
    if (!byEn.has(v)) byEn.set(v, []);
    byEn.get(v).push(k);
    const n = norm(v);
    if (!byNorm.has(n)) byNorm.set(n, []);
    byNorm.get(n).push(k);
  }
  const mapping = {};
  for (const k of Object.keys(web.en)) {
    if (MANUAL[k]) { mapping[k] = MANUAL[k]; continue; }
    let cands = byEn.get(web.en[k]) || [];
    if (cands.length > 1) {
      const byJa = cands.filter(ck => app.ja[ck] === web.ja[k]);
      if (byJa.length) cands = byJa;
    }
    if (cands.length > 1) {
      const sig = cands.map(ck => LANGS.map(([l]) => app[l][ck] ?? app.en[ck]).join(''));
      if (sig.every(s => s === sig[0])) cands = [cands[0]];
    }
    if (cands.length === 1) { mapping[k] = cands[0]; continue; }
    let nc = byNorm.get(norm(web.en[k])) || [];
    if (nc.length > 1) {
      const byJa = nc.filter(ck => norm(app.ja[ck] || '') === norm(web.ja[k]));
      if (byJa.length) nc = byJa;
    }
    if (nc.length === 1) { mapping[k] = nc[0]; continue; }
    mapping[k] = null;
  }
  return mapping;
}

/* Full dict for one language: translated where mapped + the app's
   string fits the web placeholders, English otherwise. Returns
   { dict, fallbacks: [keys] }. */
export function buildDict(lang, web, app, mapping) {
  const dict = {}, fallbacks = [];
  for (const k of Object.keys(web.en)) {
    const ak = mapping[k];
    const av = ak ? app[lang][ak] : undefined;
    if (av !== undefined && tokensFit(av, web.en[k])) dict[k] = av;
    else { dict[k] = web.en[k]; fallbacks.push(k); }
  }
  return { dict, fallbacks };
}

/* ---------- shell generation ---------- */
/* Character-level diff of two lines -> merged change chunks
   [{en, ja}] with short equal runs (<= 4 chars) absorbed. */
export function lineChunks(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ops = []; // [kind, text] kind: eq|en|ja
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push(['eq', a[i]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(['en', a[i]]); i++; }
    else { ops.push(['ja', b[j]]); j++; }
  }
  while (i < n) { ops.push(['en', a[i]]); i++; }
  while (j < m) { ops.push(['ja', b[j]]); j++; }
  /* merge into runs */
  const runs = [];
  for (const [kind, ch] of ops) {
    const last = runs[runs.length - 1];
    if (last && last.kind === kind) last.text += ch;
    else runs.push({ kind, text: ch });
  }
  /* absorb short eq runs between changes into the change chunk */
  const chunks = [];
  let p = 0;
  while (p < runs.length) {
    if (runs[p].kind === 'eq') { p++; continue; }
    let en = '', ja = '', q = p;
    while (q < runs.length) {
      if (runs[q].kind === 'en') { en += runs[q].text; q++; }
      else if (runs[q].kind === 'ja') { ja += runs[q].text; q++; }
      else if (runs[q].text.length <= 4 && q + 1 < runs.length && runs[q + 1].kind !== 'eq') {
        en += runs[q].text; ja += runs[q].text; q++;
      } else break;
    }
    chunks.push({ en, ja });
    p = q;
  }
  return chunks;
}

export function lookupChunk(enChunk, jaChunk, app, lang) {
  const core = enChunk.trim(), jaCore = (jaChunk || '').trim();
  if (!core) return null;
  let cands = Object.keys(app.en).filter(k => app.en[k] === core);
  if (cands.length > 1 && jaCore) {
    const byJa = cands.filter(k => (app.ja[k] || '').trim() === jaCore);
    if (byJa.length) cands = byJa;
  }
  if (cands.length > 1) {
    /* several app keys share this string (Profile, See more…):
       usable only when they all agree in the target language */
    const vals = new Set(cands.map(k => app[lang][k]));
    if (vals.size !== 1) return null;
    const v0 = app[lang][cands[0]];
    const lead = enChunk.slice(0, enChunk.indexOf(core));
    const trail = enChunk.slice(enChunk.indexOf(core) + core.length);
    return lead + v0 + trail;
  }
  if (cands.length !== 1) return null;
  const v = app[lang][cands[0]];
  if (v === undefined) return null;
  /* keep the chunk's surrounding whitespace/punctuation shape */
  const lead = enChunk.slice(0, enChunk.indexOf(core));
  const trail = enChunk.slice(enChunk.indexOf(core) + core.length);
  return lead + v + trail;
}

export function buildShell(lang, enHtml, jaHtml, app) {
  const rtl = RTL_LANGS.includes(lang);
  const enLines = enHtml.split('\n'), jaLines = jaHtml.split('\n');
  if (enLines.length !== jaLines.length) throw new Error('shell line counts differ');
  let fallbacks = 0;
  const out = enLines.map((enLine, idx) => {
    const jaLine = jaLines[idx];
    let line = enLine;
    if (idx === 1) { /* <html lang="en" dir="ltr"> */
      return '<html lang="' + lang + '" dir="' + (rtl ? 'rtl' : 'ltr') + '">';
    }
    if (enLine !== jaLine) {
      const chunks = lineChunks(enLine, jaLine)
        .filter(c => c.en && c.en !== 'en.html' && c.en.trim());
      /* substitute from the END so earlier offsets stay valid */
      const subs = [];
      let cursor = 0;
      for (const c of chunks) {
        const at = enLine.indexOf(c.en, cursor);
        if (at < 0) continue;
        subs.push({ at, len: c.en.length, chunk: c });
        cursor = at + c.en.length;
      }
      line = enLine;
      for (const s of subs.reverse()) {
        if (s.chunk.en === 'en' && s.chunk.ja === 'ja') continue; // lang attr handled above / watchdog
        const rep = lookupChunk(s.chunk.en, s.chunk.ja, app, lang);
        if (rep === null) { fallbacks++; line = line.slice(0, s.at) + s.chunk.en + line.slice(s.at + s.len); }
        else line = line.slice(0, s.at) + rep + line.slice(s.at + s.len);
      }
    }
    line = line.split('en.html').join(lang + '.html');
    return line;
  });
  let html = out.join('\n');
  /* the theme script: bake this language's labels in directly
     (the en/ja shells branch on a `ja` boolean instead). The
     labels are web-only strings: English fallback, counted. */
  fallbacks += 2;
  html = html.replace(/<script>\n\(function \(\) \{\n  var ja =[\s\S]*?<\/script>/, () =>
    '<script>\n(function () {\n' +
    '  function isDark() { return document.documentElement.dataset.theme === \'dark\'; }\n' +
    '  function render() {\n' +
    '    var d = isDark();\n' +
    '    var label = d ? \'☀️ Light\' : \'🌙 Dark\';\n' +
    '    var a = document.getElementById(\'themeLabel\');\n' +
    '    if (a) a.textContent = label;\n' +
    '    var b = document.getElementById(\'themeLabelDrawer\');\n' +
    '    if (b) b.textContent = label;\n' +
    '    var m = document.getElementById(\'themeColorMeta\');\n' +
    '    if (m) m.setAttribute(\'content\', d ? \'#000000\' : \'#ffffff\');\n' +
    '  }\n' +
    '  function toggle() {\n' +
    '    var next = isDark() ? \'light\' : \'dark\';\n' +
    '    document.documentElement.dataset.theme = next;\n' +
    '    try { localStorage.setItem(\'guppy-theme\', next); } catch (e) {}\n' +
    '    render();\n' +
    '  }\n' +
    '  var t1 = document.getElementById(\'themeToggle\');\n' +
    '  if (t1) t1.addEventListener(\'click\', toggle);\n' +
    '  var t2 = document.getElementById(\'themeToggleDrawer\');\n' +
    '  if (t2) t2.addEventListener(\'click\', toggle);\n' +
    '  render();\n' +
    '})();\n</script>');
  /* load this language's dict before viewer.js */
  html = html.replace('<script src="viewer.js?v=41"></script>',
    '<script src="dict-' + lang + '.js?v=41"></script>\n<script src="viewer.js?v=41"></script>');
  if (rtl) html = html.split('>←<').join('>→<');
  /* v37 (B-PR1): the profile text-back label ("← Back") leads
     with its arrow inside the text chunk, so flip that one too. */
  if (rtl) html = html.replace(/(text-back"[^>]*>)← /, '$1→ ');
  return { html, fallbacks };
}

/* ---------- main ---------- */
function main() {
  const viewerSrc = fs.readFileSync(path.join(DOCS, 'viewer.js'), 'utf8');
  const appSrc = fs.readFileSync(APP_I18N, 'utf8');
  const web = loadWebDicts(viewerSrc);
  const app = loadAppDicts(appSrc);
  const mapping = buildMapping(web, app);
  const mappedCount = Object.values(mapping).filter(Boolean).length;
  console.log('web keys: ' + Object.keys(web.en).length + ', mapped to app keys: ' + mappedCount);
  const enHtml = fs.readFileSync(path.join(DOCS, 'en.html'), 'utf8');
  const jaHtml = fs.readFileSync(path.join(DOCS, 'ja.html'), 'utf8');
  for (const [code] of LANGS) {
    if (code === 'en' || code === 'ja') continue;
    const { dict, fallbacks } = buildDict(code, web, app, mapping);
    const body = '/* CAW Social web viewer — ' + code + ' strings, generated by\n' +
      '   scripts/build-i18n.mjs from the Android app\'s i18n table\n' +
      '   (unmapped web-only keys keep the English string: ' + fallbacks.length + ').\n' +
      '   Loaded by ' + code + '.html before viewer.js. */\n' +
      'window.__CAW_T = ' + JSON.stringify(dict, null, 1) + ';\n';
    fs.writeFileSync(path.join(DOCS, 'dict-' + code + '.js'), body);
    const { html, fallbacks: shellFb } = buildShell(code, enHtml, jaHtml, app);
    fs.writeFileSync(path.join(DOCS, code + '.html'), html);
    console.log(code + ': dict fallbacks ' + fallbacks.length + ' / ' + Object.keys(web.en).length +
      ', shell static fallbacks ' + shellFb);
  }
}

if (process.argv[1] && process.argv[1].endsWith('build-i18n.mjs')) main();
