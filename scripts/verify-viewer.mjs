/* Verification for the CAW Social web viewer (docs/viewer.js), run
   against LIVE QL1 data. Checks:
   1. the feed decodes (posts + likes present in the raw walk);
   2. the row rule: likes never render (isVisibleRow), everything
      else does;
   3. names come from the token CARD (tokenURI) — cross-checked
      against an independent tokenURI read, plus the identity-
      incident case: token 190's card says "neptune" while the
      shifted usernames(190) says "loveforqom" (and is NOT used);
   4. resolveNameId('neptune') -> token 190;
   5. a Recaw's original resolves from the post index;
   6. reply/quote markers on real posts: stripped from the body,
      classified, and collectPostContext finds the child under its
      parent (thread order oldest-first).
   v9 adds: the signing core rebuilding a real batch byte-for-byte,
   the single tokenURI read per card, linkify, relative time.
   v10 adds: the persistent card cache (a stored card costs zero
   tokenURI reads in a fresh session), the new-head comparison
   helper, keyword highlighting, and the follow-build chunk cap.
   v11 adds: the live name check (valid / taken / available with
   the price cross-read directly), the hand-computed mint
   calldata, the NFT preview byte-compared with token 190's real
   on-chain card, and the write-path guards (exactly one send
   site in viewer.js, no signing method named anywhere).
   v12 adds: the built-in posting wallet, verified offline —
   the BIP39/BIP32 derivation against the public Hardhat vector
   (wordlist + PBKDF2 + CKD + secp256k1 + keccak together), the
   private-key vector, an action signature whose ecrecover equals
   the signer (the contract's own check), the vault roundtrip +
   wrong-password rejection, a fixed legacy transaction
   byte-compared with an ethers-generated expectation, the
   deposit/withdraw calldata, and the rewritten write-path
   guards (no raw-sign request strings anywhere, exactly one
   injected-provider send site for mint, exactly one raw send
   site for the local wallet, the safety copy in both shells,
   the wordlist file holding exactly 2048 words).
   v22 adds: the app v0.7.0 parity screens — drawer rows for
   HuntersDEX + BurnHawk in both navs of both shells, the
   BurnHawk money rules byte-checked (burnToMint selector,
   100:1, round-down), the wallet page's KET / HAWK / PHOENIX
   rows, the DEX quote wiring (router + selectors cross-read
   from the app repo, quotes proven live — direct where a
   pool exists, two-hop via QOM where it does not), the swap
   calldata layouts, and the corrected 5,000,000 O SuperRecaw
   button label with the legacy-burn constants untouched.
   Run: node scripts/verify-viewer.mjs */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const V = require('../docs/viewer.js');

let pass = 0, fail = 0;
const ok = (cond, label, extra) => {
  if (cond) { pass++; console.log('  ok  ' + label + (extra ? ' — ' + extra : '')); }
  else { fail++; console.log('  FAIL ' + label + (extra ? ' — ' + extra : '')); }
};

/* independent raw reads (do not reuse the viewer's name code) */
async function rawCall(to, data) {
  const res = await fetch('https://evm-rpc-ql1.mschihuahua.org', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_call', params: [{ to, data }, 'latest'] }),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}
function rawString(hex) {
  const h = hex.replace(/^0x/, '');
  const off = Number(BigInt('0x' + h.slice(0, 64))) * 2;
  const len = Number(BigInt('0x' + h.slice(off, off + 64)));
  const raw = h.slice(off + 64, off + 64 + len * 2);
  return new TextDecoder().decode(new Uint8Array((raw.match(/../g) || []).map(x => parseInt(x, 16))));
}
async function rawCardName(id) {
  const uri = rawString(await rawCall(V.CAW_NAME, V.SEL.tokenURI + V.word(id)));
  const meta = JSON.parse(Buffer.from(uri.split(',')[1], 'base64').toString('utf8'));
  return meta.name;
}

console.log('— feed decode + row rule —');
const head = await V.fetchPage(null);
ok(head.items.length > 0, 'head page decoded actions', head.items.length + ' actions');
const rawTypes = new Set(head.items.map(i => i.type));
ok(rawTypes.has(0), 'raw walk contains posts (type 0)');
ok(rawTypes.has(1), 'raw walk contains likes (type 1) — the filter has something to filter');
const visible = head.items.filter(V.isVisibleRow);
ok(visible.every(i => i.type !== 1), 'no like renders as a row');
ok(visible.length < head.items.length || !rawTypes.has(1), 'filter actually removes the likes');

/* walk a few pages: gather posts, a recaw, and marker samples */
let cursor = head.next, pages = 1;
const all = [...head.items];
let markerSamples = { reply: null, quote: null };
const scanMarkers = items => {
  for (const it of items) {
    if (it.type !== 0) continue;
    const { ref, body } = V.parsePostText(it.text);
    if (ref && !markerSamples[ref.kind]) markerSamples[ref.kind] = { item: it, ref, body };
  }
};
scanMarkers(all);
while (cursor && pages < 160 && (!markerSamples.reply || !markerSamples.quote)) {
  const p = await V.fetchPage(cursor);
  all.push(...p.items);
  scanMarkers(p.items);
  cursor = p.next; pages++;
}
console.log('  walked ' + pages + ' pages, ' + all.length + ' actions');

console.log('— names from the card (tokenURI), not usernames() —');
const shifted = rawString(await rawCall(V.CAW_NAME, V.SEL.usernames + V.word(190n)));
const card190 = await rawCardName(190n);
ok(card190 === 'neptune', 'token 190 card name is "neptune"', 'card=' + card190);
ok(shifted !== card190, 'usernames(190) disagrees (it is shifted)', 'usernames(190)=' + shifted);
const viewerName190 = await V.resolveName(190n);
ok(viewerName190 === 'neptune', 'viewer resolveName(190) returns the CARD name', String(viewerName190));
const resNep = await V.resolveNameId('neptune');
ok(resNep.status === 'ok' && resNep.id === 190n, 'resolveNameId("neptune") -> token 190', JSON.stringify(resNep, (k, v) => typeof v === 'bigint' ? v.toString() : v));
/* cross-check a sample of live senders against independent card reads */
const senderIds = [...new Set(all.filter(i => i.type === 0).map(i => i.senderId.toString()))].slice(0, 6);
let nameMismatch = 0;
for (const sid of senderIds) {
  const [a, b] = await Promise.all([V.resolveName(BigInt(sid)), rawCardName(BigInt(sid))]);
  if (a !== b) { nameMismatch++; console.log('    mismatch id ' + sid + ': viewer=' + a + ' card=' + b); }
}
ok(nameMismatch === 0, 'sampled sender names match independent tokenURI reads', senderIds.length + ' names');

console.log('— recaw resolves its original —');
const recaw = all.find(i => i.type === 2);
ok(!!recaw, 'found a Recaw in the walked pages');
if (recaw) {
  const orig = await V.findPostByCawId(recaw.cawId, 12);
  ok(!!orig && orig.type === 0 && orig.cawId.toLowerCase() === recaw.cawId.toLowerCase(),
    'original post resolved for the Recaw', orig ? 'by @id ' + orig.senderId : 'not found');
}

console.log('— reply / quote markers on real posts —');
/* A marker built with the app's published algorithm (base64url of a
   real post's cawId, appended as the final line), for the codec
   round-trip check used when a kind has no live sample yet. */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function appMarker(kind, cawIdHex) {
  const bytes = [...Buffer.from(cawIdHex.replace(/^0x/, ''), 'hex')];
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1] ?? 0, b2 = bytes[i + 2] ?? 0;
    s += B64[b0 >> 2] + B64[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) s += B64[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) s += B64[b2 & 63];
  }
  return '[caw:' + kind + ':' + s + ']';
}
for (const kind of ['reply', 'quote']) {
  const s = markerSamples[kind];
  if (!s) {
    /* No live sample of this kind: fall back to a spec round-trip —
       a marker built exactly as the app builds it must classify and
       strip, a mid-text marker must NOT count, and a malformed one
       must stay plain text. (Verified 2026-11-08 by an exhaustive
       122-page walk: the chain holds quote posts but zero replies
       so far, so the reply bucket shares the quote-proven code path
       and is covered here at the codec level.) */
    const somePost = all.find(i => i.type === 0);
    const text = 'round trip body\n' + appMarker(kind, somePost.cawId);
    const parsed = V.parsePostText(text);
    ok(parsed.ref && parsed.ref.kind === kind && parsed.ref.parentCawId.toLowerCase() === somePost.cawId.toLowerCase()
      && parsed.body === 'round trip body',
      kind + ': no live sample exists yet — spec round-trip classifies + strips (codec level)');
    const mid = V.parsePostText(appMarker(kind, somePost.cawId) + '\ntrailing text');
    ok(mid.ref === null && mid.body.includes('[caw:'), kind + ': a marker NOT on the final line stays plain text');
    const bad = V.parsePostText('body\n[caw:' + kind + ':AAAA]');
    ok(bad.ref === null, kind + ': a malformed marker stays plain text');
    continue;
  }
  ok(true, 'found a live ' + kind + ' sample in the walked pages');
  ok(!s.body.includes('[caw:'), kind + ': marker line stripped from the display body');
  ok(/^0x[0-9a-f]{64}$/.test(s.ref.parentCawId), kind + ': parent cawId decoded to 32 bytes', s.ref.parentCawId.slice(0, 18) + '…');
  const parent = await V.findPostByCawId(s.ref.parentCawId, 25);
  ok(!!parent, kind + ': parent post resolvable', parent ? 'parent by id ' + parent.senderId : 'missing');
  if (parent) {
    const ctx = await V.collectPostContext(parent, 80);
    const bucket = kind === 'reply' ? ctx.replies : ctx.quotes;
    ok(bucket.some(c => c.cawId.toLowerCase() === s.item.cawId.toLowerCase()),
      kind + ': child appears under its parent in collectPostContext');
    if (kind === 'reply') {
      const sorted = [...ctx.replies].sort((a, b) => (a.block ?? 0) - (b.block ?? 0));
      ok(JSON.stringify(sorted.map(r => r.cawId)) === JSON.stringify(ctx.replies.map(r => r.cawId)),
        'replies are oldest-first');
    }
    if (kind === 'quote') {
      ok(!ctx.replies.some(c => c.cawId.toLowerCase() === s.item.cawId.toLowerCase()),
        'quote is NOT counted as a reply (kept distinct)');
    }
  }
}

/* Static guards for the 2026-11-08 desktop outage: retired service
   workers sabotage the script name app.js (pause worker stubs it,
   cache-first shells serve their cached copy), so the viewer must
   ship as viewer.js, the shells must watchdog the boot flag, every
   fetch must carry a timeout, and the icon set must be the real
   PNGs at the sizes the manifest promises. */
console.log('— stale-worker / asset guards —');
const read = rel => fs.readFileSync(new URL(rel, import.meta.url), 'utf8');
const enHtml = read('../docs/en.html'), jaHtml = read('../docs/ja.html');
const swSrc = read('../docs/sw.js'), viewerSrc = read('../docs/viewer.js');
for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
  ok(html.includes('viewer.js?v=') && !html.includes('app.js'), label + ' loads viewer.js, never app.js');
  ok(html.includes('__cawViewerBooted'), label + ' has the boot watchdog');
}
ok(swSrc.includes("'viewer.js'") && !swSrc.includes("'app.js'"), 'sw.js shell caches viewer.js, not app.js');
ok(/const CACHE = 'caw-view-v\d+'/.test(swSrc), 'sw.js cache name is versioned');
ok(viewerSrc.includes('window.__cawViewerBooted = true'), 'viewer.js sets the boot flag');
ok(viewerSrc.includes('AbortController') && viewerSrc.includes('fetchTimeout'), 'viewer.js fetches carry a timeout');
function pngSize(rel) {
  const b = fs.readFileSync(new URL(rel, import.meta.url));
  if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}
ok(JSON.stringify(pngSize('../docs/icon-192.png')) === '[192,192]', 'icon-192.png is a 192x192 PNG');
ok(JSON.stringify(pngSize('../docs/icon-512.png')) === '[512,512]', 'icon-512.png is a 512x512 PNG');
ok(JSON.stringify(pngSize('../docs/apple-touch-icon.png')) === '[180,180]', 'apple-touch-icon.png is a 180x180 PNG');

console.log('— v9: signing core rebuilds a real batch byte-for-byte —');
ok(V.keccakHex(new Uint8Array(0)) === 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
  'keccak256("") matches the known vector');
ok(V.keccakHex(new TextEncoder().encode('hello')) === '1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8',
  'keccak256("hello") matches the known vector');
{
  /* Pull one real processAction tx straight from the explorer API,
     decode its actions with the viewer, lift the (v, r, s) arrays
     out of the same calldata, and rebuild the whole batch. */
  const res = await fetch('https://scan.qom.network/api/v2/addresses/' + V.CAW_ACTIONS + '/transactions');
  const j = await res.json();
  const wAt = (body, i) => body.slice(i * 64, i * 64 + 64);
  const wi = (body, i) => Number(BigInt('0x' + wAt(body, i)));
  let rebuilt = false, tried = 0;
  for (const it of (j.items || [])) {
    if (!it.raw_input || !it.raw_input.startsWith('0x84e33f2f')) continue;
    const actions = V.decodeActions(it.raw_input);
    if (!actions.length) continue;
    tried++;
    try {
      const body = it.raw_input.slice(10);
      const headAt = wi(body, 1) / 32;
      const arrAt = offIdx => headAt + wi(body, headAt + offIdx) / 32;
      const vAt = arrAt(1), rAt = arrAt(2), sAt = arrAt(3);
      const n = wi(body, vAt);
      if (n !== actions.length || wi(body, rAt) !== n || wi(body, sAt) !== n) continue;
      const sigs = [];
      for (let k = 0; k < n; k++) {
        sigs.push({
          v: wi(body, vAt + 1 + k),
          r: '0x' + wAt(body, rAt + 1 + k),
          s: '0x' + wAt(body, sAt + 1 + k),
        });
      }
      if (V.encodeBatch(actions, sigs).toLowerCase() === it.raw_input.toLowerCase()) { rebuilt = true; break; }
    } catch (e) { /* try the next tx */ }
  }
  ok(rebuilt, 'encodeBatch rebuilt a real live batch byte-for-byte', tried + ' candidate txs tried');
}

console.log('— v9: one tokenURI read per name card —');
V.resetCardCacheForTest();
{
  const [nm, im] = await Promise.all([V.resolveName(190n), V.avatarFor(190n)]);
  ok(nm === 'neptune' && !!im, 'cardFor serves name + image together', 'name=' + nm);
  ok(V.cardStats.tokenUriReads === 1, 'exactly one tokenURI eth_call for name+image', 'reads=' + V.cardStats.tokenUriReads);
}

console.log('— v9: linkify + relative time —');
{
  const lf = V.linkify('x <script>alert(1)</script> & https://a.example/b?c=1. ping @neptune');
  ok(!lf.includes('<script>') && lf.includes('&lt;script&gt;'), 'linkify escapes HTML first');
  ok(lf.includes('href="https://a.example/b?c=1"'), 'linkify links URLs (trailing dot kept outside)');
  ok(lf.includes('?name=neptune') && lf.includes('@neptune'), 'linkify links @mentions to profiles');
  const NOW = 1700000000;
  ok(V.relTime(NOW - 30, NOW) === 'now', 'relTime: under a minute is "now"');
  ok(V.relTime(NOW - 300, NOW) === '5m', 'relTime: minutes');
  ok(V.relTime(NOW - 3 * 3600, NOW) === '3h', 'relTime: hours');
  ok(V.relTime(NOW - 2 * 86400, NOW) === '2d', 'relTime: days');
  ok(V.relTime(NOW - 40 * 86400, NOW).includes('2023'), 'relTime: over ~30d falls back to the date');
}

console.log('— v25: version guards (v10 checks, updated values) —');
ok(enHtml.includes('?v=27') && jaHtml.includes('?v=27'), 'shells reference ?v=27 assets');
ok(swSrc.includes("caw-view-v27"), 'sw.js cache name is caw-view-v27');
ok(enHtml.includes('rel="preconnect"') && jaHtml.includes('rel="preconnect"'), 'shells preconnect to the RPC + explorer API hosts');
ok(enHtml.includes('og:title') && jaHtml.includes('og:title'), 'shells carry OGP meta tags');

console.log('— v24: menu destinations audit (profile must not land on the wallet) —');
{
  const expect = { home: '', search: '?lookup=1', reactions: '?reactions=1', wallet: '?wallet=1',
    getname: '?getname=1', dex: '?dex=1', burnhawk: '?burnhawk=1', bookmarks: '?bookmarks=1', mirror: '?mirror=1' };
  for (const [label, html, file] of [['en.html', enHtml, 'en.html'], ['ja.html', jaHtml, 'ja.html']]) {
    const anchors = [...html.matchAll(/<a[^>]*data-nav="([^"]+)"[^>]*>/g)];
    let bad = [];
    for (const m of anchors) {
      const nav = m[1], tag = m[0];
      const href = (tag.match(/href="([^"]*)"/) || [])[1] || '';
      if (nav === 'lang') continue;
      if (nav === 'profile' || nav === 'mynames') {
        // state-dependent rows: static placeholders are the wallet view
        // (profile carries ?next=profile since v25), syncChrome rewrites
        // them per session state
        const want = nav === 'profile' ? file + '?wallet=1&next=profile' : file + '?wallet=1';
        if (href !== want) bad.push(nav + ' placeholder ' + href);
        continue;
      }
      if (!(nav in expect)) { bad.push('unknown nav ' + nav); continue; }
      if (href !== file + expect[nav]) bad.push(nav + ' -> ' + href);
    }
    ok(anchors.length >= 20 && bad.length === 0, label + ' every menu item points at its own view' + (bad.length ? ' (bad: ' + bad.join('; ') + ')' : ''));
  }
  ok(viewerSrc.includes("sumEl.setAttribute('href', profTarget)"),
    'syncChrome rewrites the summary header href with the shared profile target');
  ok(viewerSrc.includes("'sideSummary'") && viewerSrc.includes("'drawerSummary'"),
    'both summary headers (sidebar + drawer) are passed to setSummary');
  ok(viewerSrc.includes('const profTarget = acting ? profUrl(acting.username)') &&
     viewerSrc.includes("pwSession ? pageFile + '?getname=1'") &&
     viewerSrc.includes("pageFile + '?wallet=1&next=profile'"),
    'v25: profile target is three-way (own profile / name desk / wallet with ?next=profile)');
  ok(viewerSrc.includes("if (nextQuery === 'profile')") &&
     viewerSrc.includes("location.replace(a ? profUrl(a.username) : pageFile + '?getname=1')"),
    'v25: after unlock, ?next=profile continues to the own profile (name desk when nameless)');
  ok((viewerSrc.match(/pwNextProfile:/g) || []).length === 2 &&
     viewerSrc.includes("nextQuery === 'profile' ? '<p class=\"pw-next-hint\">'"),
    'v25: the locked wallet view explains the profile continuation (both languages)');
  ok((enHtml.match(/next=profile/g) || []).length >= 4 && (jaHtml.match(/next=profile/g) || []).length >= 4,
    'v25: static placeholders carry ?next=profile on the profile rows + summary headers');
}

console.log('— v20: the 入れる／出す jump button never dead-ends —');
ok(viewerSrc.includes('id="pwDepJump"') && viewerSrc.includes("esc(T.depostLbl)"),
  'the jump button still renders on every unlocked wallet');
ok(viewerSrc.includes('\'<p class="warn" id="pwNoNamesWarn">\' + esc(T.pwNoNamesYet)'),
  'the no-names warning carries id="pwNoNamesWarn" so the jump can land on it');
ok(viewerSrc.includes("const target = $('pwDepCard') || $('pwNoNamesWarn');"),
  'the jump handler targets the deposit card, falling back to the no-names warning');
ok(viewerSrc.includes("target.classList.add('pw-flash')") &&
  viewerSrc.includes("target.classList.remove('pw-flash'), 1600"),
  'the jump flash-highlights its target and clears the flash after 1.6s');
{
  const css = read('../docs/style.css');
  ok(css.includes('.pw-flash{') && css.includes('@keyframes pw-flash-pulse'),
    'style.css defines the .pw-flash pulse used by both jump targets');
}

console.log('— v18: link-only share, shortened through cawl —');
ok(viewerSrc.includes("const CAWL_BASE = 'https://c.qql1.com'") &&
  viewerSrc.includes('async function shortenViaCawl'),
  'shares shorten through the cawl service (the app\u2019s shortener)');
ok(viewerSrc.includes('navigator.share({ url })'),
  'post share hands the OS sheet the (short) URL only — no text');
ok(!viewerSrc.includes('navigator.share({ text })') &&
  !viewerSrc.includes('· CAW Social\';') &&
  viewerSrc.includes('(await shortenViaCawl(location.href)) || location.href'),
  'no text-share composition remains; the page share shortens location.href with a full-URL fallback');

console.log('— v10: new-head comparison helper —');
{
  const base = { block: 100, txIndex: 5, ts: 1700000000, cawId: '0xaaa' };
  ok(V.isNewerItem({ ...base, txIndex: 6 }, base) === true, 'head compare: higher txIndex in the same block is newer');
  ok(V.isNewerItem({ ...base, block: 101, txIndex: 0 }, base) === true, 'head compare: higher block is newer');
  ok(V.isNewerItem({ ...base }, base) === false, 'head compare: the same item is not newer');
  ok(V.isNewerItem({ ...base, block: 99, txIndex: 99 }, base) === false, 'head compare: older block is not newer');
}

console.log('— v10: keyword highlight —');
{
  const hl = V.highlightKeyword(V.linkify('I love CAW, see https://a.example/caw please'), 'caw');
  ok(hl.includes('<mark>CAW</mark>'), 'highlight wraps matches in <mark> (case-insensitive)');
  ok(hl.includes('href="https://a.example/caw"'), 'highlight does not corrupt link URLs');
  const esc = V.highlightKeyword(V.linkify('<b>hi</b> caw'), 'caw');
  ok(!esc.includes('<b>') && esc.includes('&lt;b&gt;'), 'highlight input stays escaped (no raw HTML from post text)');
}

console.log('— v10: follow build chunk cap —');
ok(V.FOLLOW_CHUNK_PAGES === 25, 'follow build walks at most 25 pages per activation', 'cap=' + V.FOLLOW_CHUNK_PAGES);
ok(typeof V.followBuildState === 'function' && typeof V.followBuildState().complete === 'boolean',
  'follow build state is inspectable (complete flag)');

console.log('— v10: persistent card cache —');
{
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const fresh = all.find(i => i.type === 0 &&
      i.senderId.toString() !== '190' && !senderIds.includes(i.senderId.toString()));
    ok(!!fresh, 'found a fresh sender id for the persistence check');
    if (fresh) {
      const fid = fresh.senderId;
      V.resetCardCacheForTest(); // memory only — the store must survive
      const n1 = await V.resolveName(fid);
      ok(!!n1 && V.cardStats.tokenUriReads === 1, 'first resolve of a fresh id reads its card once',
        'reads=' + V.cardStats.tokenUriReads + ' name=' + n1);
      ok(store.has('caw-cards-v1'), 'resolved card persisted under caw-cards-v1');
      V.resetCardCacheForTest(); // simulate a new session: memory gone, store kept
      const [n2] = await Promise.all([V.resolveName(fid), V.avatarFor(fid)]);
      ok(n2 === n1 && V.cardStats.tokenUriReads === 0,
        'persisted card costs ZERO tokenURI reads in a new session', 'reads=' + V.cardStats.tokenUriReads);
    }
  } finally {
    delete globalThis.localStorage;
  }
}

console.log('— v11: name check against the live chain —');
{
  const nep = await V.checkName('neptune');
  ok(nep.valid === true && nep.taken === true && nep.name === 'neptune',
    'checkName("neptune") -> valid + taken', 'cost=' + nep.cost);
  const directNep = BigInt(await rawCall(V.MINTER, V.SEL.costOfName + V.encStr('neptune')));
  ok(nep.cost === directNep, 'checkName("neptune") price matches a direct costOfName read');
  const upper = await V.checkName('NEPTUNE');
  ok(upper.name === 'neptune' && upper.taken === true,
    'checkName("NEPTUNE") normalises like the app input -> the same taken name');
  const bad = await V.checkName('bad name');
  ok(bad.valid === false, 'checkName("bad name") -> invalid (the contract rejects spaces)');
  const probeName = 'zzq' + Date.now().toString(36) + 'xwq9';
  const free = await V.checkName(probeName);
  ok(free.valid === true && free.taken === false,
    'checkName(random unregistered name) -> valid + available', probeName);
  const directFree = BigInt(await rawCall(V.MINTER, V.SEL.costOfName + V.encStr(probeName)));
  ok(free.cost === directFree && directFree > 0n,
    'available name price equals a direct costOfName read', 'cost=' + free.cost);
}

console.log('— v11: mint calldata builders (hand-computed expectations) —');
{
  const expApprove = '0x095ea7b3' +
    '000000000000000000000000' + 'fc2f8743e3b09a6c973b114c3a082433e974ed9f' +
    '00000000000000000000000000000000000000000000000000000000000f4240';
  ok(V.buildApproveCalldata(1000000n) === expApprove,
    'approve calldata = approve selector + minter word + cost word (1,000,000)');
  const expMint = '0xd85d3d27' +
    '0000000000000000000000000000000000000000000000000000000000000020' +
    '0000000000000000000000000000000000000000000000000000000000000007' +
    '6e657074756e65' + '0'.repeat(50);
  ok(V.buildMintCalldata('neptune') === expMint,
    'mint calldata = mint selector + string tail for "neptune"');
}

console.log('— v11: NFT preview port —');
{
  ok(V.nameNftFontSize('abc') === 99, 'nameNftFontSize: 3 chars -> 99');
  ok(V.nameNftFontSize('neptune') === 49, 'nameNftFontSize: 7 chars -> 49');
  ok(V.nameNftFontSize('a'.repeat(17)) === 22, 'nameNftFontSize: 17 chars -> 22');
  const svg = V.nameNftSvg('neptune');
  ok(svg.includes('>neptune</text>') && svg.includes('font-size="49px"'),
    'nameNftSvg("neptune") carries the name text at 49px');
  const uri190 = rawString(await rawCall(V.CAW_NAME, V.SEL.tokenURI + V.word(190n)));
  const meta190 = JSON.parse(Buffer.from(uri190.split(',')[1], 'base64').toString('utf8'));
  const onchainSvg = Buffer.from(meta190.image.split(',')[1], 'base64').toString('utf8');
  ok(svg === onchainSvg, 'nameNftSvg("neptune") is byte-identical to token 190\'s on-chain card');
}

console.log('— v12: built-in wallet crypto vectors (offline) —');
const HK_PHRASE = 'test test test test test test test test test test test junk';
const HK_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const HK_ADDR = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
{
  const derived = await V.deriveFromPhrase(HK_PHRASE);
  ok(derived.address === HK_ADDR,
    'BIP39 vector: the Hardhat phrase derives the Hardhat address (wordlist+PBKDF2+BIP32+secp256k1+keccak)',
    derived.address);
  ok((await V.validateMnemonic(HK_PHRASE)) === true, 'BIP39 checksum accepts the vector phrase');
  ok((await V.validateMnemonic(HK_PHRASE.replace('junk', 'zoo'))) === false,
    'BIP39 checksum rejects a tampered phrase');
  ok(V.privateKeyToAddress(HK_KEY) === HK_ADDR,
    'private-key vector: the Hardhat key maps to the same address');
  const made = await V.generateMnemonic();
  ok(made.split(' ').length === 12 && (await V.validateMnemonic(made)) === true,
    'generated recovery phrase is 12 words and checksum-valid');
}
{
  /* A sample post action, signed the in-page way; ecrecover over
     the ported digest must return the signer — exactly what the
     contract checks on submission. */
  const d = await V.deriveFromPhrase(HK_PHRASE);
  const action = {
    type: 0, senderId: 190n, receiverId: 0n, ts: 1700000000,
    sender: d.address, cawId: V.randomCawId(), text: 'hello CAW from the web',
  };
  const sig = await V.signDigestRaw(d.keyBytes, V.actionDigest(action));
  ok(sig.v === 27 || sig.v === 28, 'action signature carries v in {27,28}', 'v=' + sig.v);
  ok(V.ecrecoverAddress(V.actionDigest(action), sig) === d.address,
    'ecrecover(actionDigest) == signer (the contract-side check)');
  const other = { ...action, text: 'a different post' };
  ok(V.ecrecoverAddress(V.actionDigest(other), sig) !== d.address,
    'the same signature does NOT recover the signer for a different action');
}
{
  const secret = { kind: 'phrase', secret: HK_PHRASE };
  const stored = await V.vaultEncrypt('correct horse battery', secret);
  ok(stored.iters >= 210000, 'vault PBKDF2 runs at least 210,000 iterations', 'iters=' + stored.iters);
  const back = await V.vaultDecrypt('correct horse battery', stored);
  ok(back.kind === 'phrase' && back.secret === HK_PHRASE, 'vault roundtrip returns the stored secret');
  let wrongThrew = false;
  try { await V.vaultDecrypt('not the password', stored); } catch (e) { wrongThrew = true; }
  ok(wrongThrew, 'vault rejects a wrong password (GCM authentication)');
  ok(!JSON.stringify(stored).includes('test test'),
    'the stored vault holds no plaintext phrase');
}
{
  /* Fixed legacy transaction, byte-compared. The expectation was
     generated during development with the ethers bundled in the
     Android app repo (signTransaction of the same fields with
     the Hardhat key); deterministic RFC6979 signing makes the
     bytes identical, so this pins RLP, the secp256k1 signer,
     EIP-155 v and the key->address path all at once. */
  const EXPECTED_TX = '0xf8ac038504a817c80083030d4094d2140e16adf37194036865e90bbca1139b739d0d80b844095ea7b3000000000000000000000000fc2f8743e3b09a6c973b114c3a082433e974ed9f00000000000000000000000000000000000000000000000000000000000f4240820620a0255ae7c4e5f50789bf243db664aa6d6e0a085f32a244b9d4536c4174efe13075a01aef3b8fe9ea19aad81724a726bcecedf47d42ee0c3ba9deba411fde849f8ac0';
  const d = await V.deriveFromPhrase(HK_PHRASE);
  const raw = await V.signLegacyTx(d.keyBytes, {
    nonce: 3n, gasPrice: 20000000000n, gasLimit: 200000n,
    to: V.QCAW, value: 0n,
    data: V.buildApproveCalldata(1000000n), chainId: 766,
  });
  ok(raw === EXPECTED_TX, 'fixed legacy tx is byte-identical to the ethers expectation');
}
{
  const expDep = '0x6170c4b1' +
    '00000000000000000000000000000000000000000000000000000000000000be' +
    '00000000000000000000000000000000000000000000000000000000000f4240';
  ok(V.buildDepositCalldata(190n, 1000000n) === expDep,
    'deposit calldata = deposit selector + token word + amount word');
  const expWd = '0x43387983' +
    '00000000000000000000000000000000000000000000000000000000000000be' +
    '00000000000000000000000000000000000000000000000000000000000f4240';
  ok(V.buildWithdrawCalldata(190n, 1000000n) === expWd,
    'withdraw calldata = withdraw selector + token word + amount word');
  const acting = { type: 1, senderId: 190n, receiverId: 7n, ts: 1700000000, sender: HK_ADDR, cawId: '0x' + '11'.repeat(32), text: 'LIKE' };
  const batch = V.encodeBatch([acting], [{ r: '0x' + '22'.repeat(32), s: '0x' + '33'.repeat(32), v: 28 }]);
  /* 868 bytes for this fixed sample: the selector + 27 words
     (action words, the text tail, the signature words) — the
     same layout the v9 check rebuilds byte-for-byte from a real
     on-chain batch. */
  ok(batch.startsWith('0x84e33f2f') && batch.length === 2 + 868 * 2,
    'processAction calldata = action selector + the batch layout (868 bytes for the fixed sample)');
  const marker = V.postRefMarker('reply', '0x' + 'ab'.repeat(32));
  const parsed = V.parsePostText('body text\n' + marker);
  ok(parsed.ref && parsed.ref.kind === 'reply' && parsed.ref.parentCawId === '0x' + 'ab'.repeat(32) &&
     parsed.body === 'body text',
    'reply marker encode -> parsePostText decode round-trips');
  ok(V.parseAmount('100') === 100n * 10n ** 18n && V.parseAmount('12.5') === 125n * 10n ** 17n &&
     V.parseAmount('1.0000000000000000001') === null && V.parseAmount('x') === null,
    'parseAmount honours the whole-qCAW decimal rule (18 places max)');
}

console.log('— v12: write-path guards (rewritten for the two-write design) —');
{
  /* v12 has exactly two writes, kept apart: minting sends through
     the visitor's injected wallet (one helper), and everything
     else is signed in-page by the built-in wallet and broadcast
     raw (one sender). Raw-sign REQUESTS to an external wallet are
     never made — the refused method names must not even appear. */
  const sendSites = (viewerSrc.match(/eth_sendTransaction/g) || []).length;
  ok(sendSites === 1, 'viewer.js has exactly ONE injected-provider send site (the mint helper)', 'sites=' + sendSites);
  const rawSites = (viewerSrc.match(/eth_sendRawTransaction/g) || []).length;
  ok(rawSites === 1, 'viewer.js has exactly ONE raw broadcast site (the local wallet sender)', 'sites=' + rawSites);
  ok(!/eth_sign/.test(viewerSrc) && !/personal_sign/.test(viewerSrc),
    'viewer.js never names a raw-sign method anywhere (nothing is ever requested)');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="getname"') && html.includes('id="mintNameInput"') &&
       html.includes('id="mintCheckBtn"') && html.includes('id="walletArea"') &&
       html.includes('id="mintArea"') && html.includes('id="myNames"'),
       label + ' carries the get-a-name section and its controls');
    ok(html.includes('id="pwallet"') && html.includes('id="pwArea"') &&
       html.includes('id="composerArea"') && html.includes('id="confirmOverlay"'),
       label + ' carries the posting wallet, the composer and the confirm panel');
  }
  ok(enHtml.includes('Never type the recovery phrase of your main wallet') &&
     enHtml.includes('Anyone who sees your recovery phrase owns this wallet'),
     'en.html carries the posting-wallet safety copy');
  ok(jaHtml.includes('本命ウォレットの復元フレーズは絶対に入力しないでください') &&
     jaHtml.includes('復元フレーズを見た人は、そのウォレットを使えてしまいます'),
     'ja.html carries the posting-wallet safety copy');
  ok(enHtml.includes('bip39-words.js') && jaHtml.includes('bip39-words.js') &&
     swSrc.includes('bip39-words.js'),
     'the wordlist script is loaded by both shells and the service worker shell');
  ok(Array.isArray(V.BIP39_WORDS) && V.BIP39_WORDS.length === 2048 &&
     V.BIP39_WORDS[0] === 'abandon' && V.BIP39_WORDS[2047] === 'zoo' &&
     new Set(V.BIP39_WORDS).size === 2048,
     'the wordlist file holds exactly the 2048 BIP39 English words');
}

console.log('— v13: X-style UI overhaul (display layer, app v0.6.x parity) —');
{
  const cssSrc = read('../docs/style.css');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="drawer"') && html.includes('id="drawerBtn"') &&
       html.includes('id="drawerScrim"') && html.includes('id="sidebar"'),
       label + ' carries the app-style drawer + sidebar chrome');
    ok(html.includes('id="viewBookmarks"') && html.includes('id="bmList"'),
       label + ' carries the bookmarks view');
    ok(html.includes('id="choiceOverlay"') && html.includes('id="choiceSuperBtn"'),
       label + ' carries the Recaw choice sheet (incl. the SuperRecaw entry)');
    ok(html.includes('id="fabBtn"') && html.includes('id="railSearchForm"'),
       label + ' carries the compose FAB and the rail search pill');
    ok(html.includes('id="likedByBlock"') && html.includes('id="sharedByBlock"'),
       label + ' carries the post-page Liked by / Recawed by sections');
  }
  const idSet = h => new Set([...h.matchAll(/ id="([^"]+)"/g)].map(m => m[1]));
  const enIds = idSet(enHtml), jaIds = idSet(jaHtml);
  ok(enIds.size === jaIds.size && [...enIds].every(i => jaIds.has(i)),
    'en.html and ja.html expose the IDENTICAL element-id set', 'en=' + enIds.size + ' ja=' + jaIds.size);
  for (const tok of ['#1d9bf0', '#0f1419', '#536471', '#eff3f4', '#ffac33', 'rgba(255,172,51,0.10)']) {
    ok(cssSrc.toLowerCase().includes(tok), 'style.css carries the app design token ' + tok);
  }
  ok(!viewerSrc.includes('data-views') && !enHtml.includes('data-views') && !jaHtml.includes('data-views'),
    'no view/impression counter element exists anywhere (it cannot be counted, so it is not faked)');
  ok(viewerSrc.includes('data-act="super"') && viewerSrc.includes('data-act="bookmark"') &&
     viewerSrc.includes('data-act="share"'),
     'the action row carries SuperLike / bookmark / share in the app order');
}
{
  /* The bookmark store (app lib/bookmarks.ts rule): per-address
     localStorage key, newest first, ids only. */
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const addr = '0xAbC0000000000000000000000000000000000001';
    const idA = '0x' + 'aa'.repeat(32), idB = '0x' + 'bb'.repeat(32);
    ok(V.BOOKMARKS_KEY_PREFIX === 'caw-bookmarks-v1-', 'bookmark key prefix matches the app');
    ok(V.bmToggle(addr, idA) === true && V.bmHas(addr, idA), 'bmToggle saves a post');
    ok(V.bmToggle(addr, idB) === true, 'bmToggle saves a second post');
    ok(JSON.stringify(V.bmList(addr)) === JSON.stringify([idB, idA]),
      'bookmarks list is newest-first');
    ok(store.has('caw-bookmarks-v1-' + addr.toLowerCase()),
      'bookmarks persist under caw-bookmarks-v1-<lowercased address>');
    ok(V.bmToggle(addr, idA) === false && !V.bmHas(addr, idA), 'bmToggle again removes the post');
    ok(V.bmList('0x0000000000000000000000000000000000000002').length === 0,
      'another address sees none of them (per-wallet scoping)');
  } finally {
    delete globalThis.localStorage;
  }
}

console.log('— v14: SuperLike / SuperRecaw (app v0.6.3 spec, ported) —');
{
  const E18 = 10n ** 18n;
  ok(V.O_TOKEN === '0x6c39b68a28bA90F4EB80032ec0eB32ad81cbbEd4',
    'O token is the app\'s Childhoods End address on QL1');
  ok(V.BURN_ADDRESS === '0x000000000000000000000000000000000000dEaD', 'burn address matches the app');
  ok(V.SUPERLIKE_TOTAL_O === 5000000 && V.SUPERLIKE_AUTHOR_O === 4000000 && V.SUPERLIKE_BURN_O === 1000000,
    'SuperLike split: 5,000,000 total = 4,000,000 author + 1,000,000 burn (v21 prices)');
  ok(V.SUPERRECAW_TOTAL_O === 5000000 && V.SUPERRECAW_AUTHOR_O === 2000000 && V.SUPERRECAW_BURN_O === 3000000,
    'SuperRecaw split: 5,000,000 total = 2,000,000 author + 3,000,000 burn (v21 prices)');
  ok(V.SUPERLIKE_TOTAL_RAW === 5000000n * E18 && V.SUPERLIKE_AUTHOR_RAW === 4000000n * E18 &&
     V.SUPERLIKE_BURN_RAW === 1000000n * E18 && V.SUPERRECAW_AUTHOR_RAW === 2000000n * E18 &&
     V.SUPERRECAW_BURN_RAW === 3000000n * E18 && V.LEGACY_MARKED_BURN_RAW === 1000000n * E18 &&
     V.V063_SUPERLIKE_BURN_RAW === 10000000n * E18 && V.V063_SUPERRECAW_BURN_RAW === 20000000n * E18,
     'raw amounts are the whole-O amounts at 18 decimals (incl. the v0.6.3 detection amounts)');
  ok(V.SUPERLIKE_MAGIC === '534c4b31' && V.SUPERRECAW_MAGIC === '53524331',
    'marker magics are SLK1 / SRC1');
  ok(V.MARKED_BURN_START_BLOCK === 13400000, 'marked-burn scan starts at block 13,400,000');
  const id = '0x' + 'ab'.repeat(32);
  const slData = V.buildSuperlikeData(id);
  const slMark = V.parseMarkedBurnInput(slData);
  ok(!!slMark && slMark.magic === V.SUPERLIKE_MAGIC && slMark.amount === V.SUPERLIKE_BURN_RAW &&
     slMark.cawId === id && slMark.to === V.BURN_ADDRESS.toLowerCase(),
     'SuperLike burn calldata round-trips through the strict parser');
  const srcData = V.buildSuperRecawData(id);
  const srcMark = V.parseMarkedBurnInput(srcData);
  ok(!!srcMark && srcMark.magic === V.SUPERRECAW_MAGIC && srcMark.amount === V.SUPERRECAW_BURN_RAW,
     'SuperRecaw burn calldata round-trips through the strict parser');
  ok(V.parseMarkedBurnInput(V.buildAuthorPayData('0x1111111111111111111111111111111111111111', 5n)) === null,
     'a plain (unmarked) transfer does NOT parse as a marked burn');
  ok(V.parseMarkedBurnInput(slData + 'ff') === null && V.parseMarkedBurnInput('0xa9059cbb') === null,
     'the parser rejects wrong-length inputs');
  ok(V.burnAmountsForMagic(V.SUPERLIKE_MAGIC).includes(V.LEGACY_MARKED_BURN_RAW) &&
     V.burnAmountsForMagic(V.SUPERRECAW_MAGIC).includes(V.LEGACY_MARKED_BURN_RAW) &&
     V.burnAmountsForMagic(V.SUPERLIKE_MAGIC).includes(V.V063_SUPERLIKE_BURN_RAW) &&
     V.burnAmountsForMagic(V.SUPERRECAW_MAGIC).includes(V.V063_SUPERRECAW_BURN_RAW) &&
     V.burnAmountsForMagic(V.SUPERLIKE_MAGIC).includes(V.SUPERLIKE_BURN_RAW) &&
     V.burnAmountsForMagic(V.SUPERRECAW_MAGIC).includes(V.SUPERRECAW_BURN_RAW),
     'detection sets accept the current burn, the v0.6.3 burn AND the legacy 1,000,000 burn for both markers');
  ok(V.superlikeBlockReason({ senderId: 5n, myTokenIds: [5n], authorOwner: '0xabc', myAddress: '0xdef' }) === 'self',
     'SuperLike blocked when the post\'s name is one of mine');
  ok(V.superlikeBlockReason({ senderId: 9n, myTokenIds: [], authorOwner: '0xABC', myAddress: '0xabc' }) === 'self',
     'SuperLike blocked when the author owner is my own address');
  ok(V.superlikeBlockReason({ senderId: 9n, myTokenIds: [1n], authorOwner: '0xabc', myAddress: '0xdef' }) === null,
     'SuperLike allowed for someone else\'s post');
  ok(V.superlikeShortfall(V.SUPERLIKE_TOTAL_RAW - 1n) === true && V.superlikeShortfall(V.SUPERLIKE_TOTAL_RAW) === false,
     'the shortfall gate is the full 5,000,000 total');
  ok(V.MB_KV_KEY === 'caw-marked-burns-v1' && V.SRC_BURN_KV_KEY === 'caw-superrecaw-burn-v1' &&
     V.AUTHOR_PAY_KV_KEY === 'caw-author-pay-v1',
     'pending/scan storage keys match the app');
  ok((viewerSrc.match(/eth_sendRawTransaction/g) || []).length === 1 &&
     (viewerSrc.match(/eth_sendTransaction/g) || []).length === 1 &&
     !/eth_sign/.test(viewerSrc) && !/personal_sign/.test(viewerSrc),
     'v14 keeps the single broadcast site and the single mint send site; no raw-sign methods named');
  ok(viewerSrc.includes("new Error('self-superlike')") && viewerSrc.includes('performSuperRecawBurn') &&
     viewerSrc.includes('performAuthorPay'),
     'the flows carry the self-block and the leg-only retries');
}
{
  /* Pending-leg stores: record -> read back -> clear, under the
     app's keys and key shapes. */
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const me = '0xAbC0000000000000000000000000000000000001';
    const id = '0x' + 'cd'.repeat(32);
    V.recordAuthorPay(me, 'sl', { cawId: id, author: '0x2222222222222222222222222222222222222222', amountRaw: V.SUPERLIKE_AUTHOR_RAW, ts: 1700000000 });
    const p = V.pendingAuthorPayFor(me, 'sl', id);
    ok(!!p && p.amountRaw === V.SUPERLIKE_AUTHOR_RAW && p.author === '0x2222222222222222222222222222222222222222',
      'author-pay debt records and reads back (amount as decimal string in storage)');
    ok(store.has('caw-author-pay-v1') && (store.get('caw-author-pay-v1') || '').includes(me.toLowerCase() + ':sl:' + id),
      'author-pay debt persists under caw-author-pay-v1 with the sender:kind:cawId key');
    ok(V.authorPayAmountFor('sl') === V.SUPERLIKE_AUTHOR_RAW && V.authorPayAmountFor('src') === V.SUPERRECAW_AUTHOR_RAW,
      'author-pay amounts come from the one spec table');
    V.clearAuthorPay(me, 'sl', id);
    ok(V.pendingAuthorPayFor(me, 'sl', id) === null, 'a paid debt clears');
    V.recordSrcBurn(me, { cawId: id, ts: 1700000000, author: '0x3333333333333333333333333333333333333333' });
    const b = V.pendingSrcBurnFor(me, id);
    ok(!!b && b.author === '0x3333333333333333333333333333333333333333',
      'SuperRecaw burn debt records and reads back');
    ok(store.has('caw-superrecaw-burn-v1') && (store.get('caw-superrecaw-burn-v1') || '').includes(me.toLowerCase() + ':' + id),
      'burn debt persists under caw-superrecaw-burn-v1 with the sender:cawId key');
    V.clearSrcBurn(me, id);
    ok(V.pendingSrcBurnFor(me, id) === null, 'a burned debt clears');
  } finally {
    delete globalThis.localStorage;
  }
}
{
  /* Live: the marked-burn scan must reach the chain head — the
     counts the rows show are only ever sums of completed scans.
     (No real send is tested: there are no keys or funds here;
     the first live SuperLike from the page is the user's.) */
  const headBefore = Number(BigInt(await V.rpc('eth_blockNumber', [])));
  await V.scanMarkedBurns();
  const headAfter = Number(BigInt(await V.rpc('eth_blockNumber', [])));
  ok(V.mbCursor() >= headBefore - 1 && V.mbCursor() <= headAfter,
    'live marked-burn scan reaches the QL1 head', 'cursor=' + V.mbCursor() + ' head=' + headAfter);
}

console.log('— v15: home is the timeline only; wallet / lookup / name desk are views —');
{
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="viewWallet"') && html.includes('id="viewLookup"') && html.includes('id="viewGetname"'),
      label + ' carries the wallet / lookup / get-a-name views');
    const seg = (a, b) => { const i = html.indexOf(a); return i < 0 ? '' : html.slice(i, html.indexOf(b, i)); };
    const home = seg('id="viewHome"', 'id="viewSearch"');
    ok(home.includes('id="composerArea"') && home.includes('id="timeline"') &&
       !home.includes('id="pwallet"') && !home.includes('id="lookup"') && !home.includes('id="getname"') &&
       !home.includes('statsCardMain'),
       label + ': the home view is the composer + timeline only (no stacked blocks)');
    ok(seg('id="viewWallet"', 'id="viewLookup"').includes('id="pwallet"') &&
       seg('id="viewWallet"', 'id="viewLookup"').includes('id="pwArea"'),
       label + ': the posting wallet lives inside the wallet view, not in the home flow');
    ok(seg('id="viewLookup"', 'id="viewGetname"').includes('id="lookup"'),
       label + ': the lookup block lives inside the lookup view');
    ok(seg('id="viewGetname"', '</main>').includes('id="getname"') &&
       seg('id="viewGetname"', '</main>').includes('id="myNames"'),
       label + ': mint + my names live inside the get-a-name view');
    ok(!html.includes('#pwallet') && !html.includes('#lookup') && !html.includes('#getname'),
       label + ': no link points at a stacked home block any more');
    ok((html.match(/\?wallet=1/g) || []).length >= 5 && html.includes('?lookup=1'),
       label + ': the wallet view opens from the summaries, both wallet rows and the tab bar; the lookup view has an entry too',
       'wallet links=' + (html.match(/\?wallet=1/g) || []).length);
    ok(/data-nav="mynames" href="[^"]*\?wallet=1"/.test(html),
       label + ': "My names" defaults to the wallet view (v16: syncChrome re-points it to the names side of the name desk once a name acts — see the v16 section)');
    const chrome = html.slice(0, html.indexOf('<nav class="bottomnav"'));
    const order = ['profile', 'wallet', 'mynames', 'getname', 'bookmarks']
      .map(k => chrome.indexOf('data-nav="' + k + '"'));
    ok(order.every(i => i >= 0) && order.every((v, i) => i === 0 || v > order[i - 1]),
       label + ': sidebar rows follow the app drawer order (profile / wallet / my names / get a name / bookmarks)');
    const dr = html.slice(html.indexOf('id="drawer"'));
    const dOrder = ['profile', 'wallet', 'mynames', 'getname', 'bookmarks']
      .map(k => dr.indexOf('data-nav="' + k + '"'));
    ok(dOrder.every(i => i >= 0) && dOrder.every((v, i) => i === 0 || v > dOrder[i - 1]),
       label + ': drawer rows follow the app order too');
    ok(!chrome.includes('data-nav="search"') && !chrome.includes('data-nav="app"') && !chrome.includes('data-nav="home"'),
       label + ': sidebar + drawer hold ONLY the app rows (no home / search / app rows, no dead buttons)');
    ok(html.includes('class="nav-it nav-settings"'),
       label + ': the settings group row exists above the theme/language rows');
  }
  ok(viewerSrc.includes("pageFile + '?wallet=1'") && !viewerSrc.includes("$('pwallet')"),
    'viewer.js routes wallet guidance to the wallet VIEW (no scroll-to-block left)');
  ok(viewerSrc.includes("get('wallet')") && viewerSrc.includes("get('getname')") && viewerSrc.includes("get('lookup')"),
    'viewer.js opens the new views from their query params');
}

console.log('— v16: post-row anatomy fixes (action pills, record link, recaw stacking, name lines, chrome rows) —');
{
  const css = read('../docs/style.css');
  const rule = sel => {
    const i = css.indexOf(sel);
    if (i < 0) return '';
    const j = css.indexOf('}', i);
    return j < 0 ? '' : css.slice(i, j);
  };
  /* 1 — the blue pills: the generic primary-button style must
     not reach the action row; .xact neutralises it explicitly */
  const xact = rule('.xact {');
  ok(xact.includes('background: transparent') && xact.includes('border: 0') &&
     xact.includes('box-shadow: none') && xact.includes('min-height: 0'),
     'action buttons explicitly neutralise the generic button style (transparent bg, no border / shadow / min-height)');
  const iconPx = parseFloat((rule('.xact .icring svg').match(/width:\s*([\d.]+)px/) || [])[1]);
  ok(iconPx >= 16 && iconPx <= 18, 'action icon size is the app size (16–18px)', iconPx + 'px');
  ok(rule('.xact .xcount').includes('font-size: 13px'),
     'action counts sit next to the icon at 13px (never wrapped under it)');
  ok(rule('.pfoot {').includes('flex-wrap: nowrap'), 'the action row never wraps');
  ok(!css.includes('var(--secondary)') && !css.includes('var(--hairline)'),
     'no style references the never-defined --secondary / --hairline variables');
  /* 2 — exactly one record link per row, from one builder */
  ok((viewerSrc.match(/class="recordline"/g) || []).length === 1,
     'the record-link markup is built in exactly ONE place (recordLineHtml)');
  ok(viewerSrc.includes('if (!opts.nested) html += recordLineHtml(a.hash);'),
     'nested rows render no record link — the outer row owns the one link');
  const recawSrc = viewerSrc.slice(viewerSrc.indexOf('async function recawCard'), viewerSrc.indexOf('async function ctxRow'));
  ok(recawSrc.includes('recordLineHtml(a.hash)'),
     'the recaw row takes its one record link from the same single builder');
  /* 3 — recaw stacking: attribution full-width on top */
  ok(rule('.post.recaw-row').includes('flex-direction: column'),
     'recaw rows stack in a column (no squeezed side columns)');
  ok(/\.recaw-attr\s*\{[^}]*display:\s*flex/.test(css),
     'the attribution is a full-width line of its own at the top of the row');
  ok(recawSrc.indexOf('recaw-attr') >= 0 && recawSrc.indexOf('recaw-attr') < recawSrc.indexOf('frameslot') &&
     recawSrc.indexOf('frameslot') < recawSrc.indexOf('recordLineHtml'),
     'recaw row order: attribution line, then the original, then the one record link');
  ok(rule('.post-nested {').includes('background: transparent'),
     'the nested original is transparent, so the SuperRecaw wash covers the whole row');
  /* 4 — the "@" lives on line 2 only */
  ok(viewerSrc.includes('const display = name ? name : who;') && viewerSrc.includes("esc('@' + name)"),
     'post header: line 1 is the display name as-is, the "@" appears only on line 2');
  /* drawer / sidebar rows: always shown, routed by state */
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(!/data-nav="(profile|mynames)"[^>]*display:none/.test(html),
       label + ': the profile / my-names rows exist in the DOM and are never hidden (locked state included)');
    ok((html.match(/M19\.4 15/g) || []).length === 2,
       label + ': the gear icon survives only on the two Settings headings (not on the theme rows)');
    const segOf = id => { const i = html.indexOf('id="' + id + '"'); return i < 0 ? '' : html.slice(i, html.indexOf('</button>', i)); };
    ok(!segOf('themeToggle').includes('nav-ic') && segOf('themeToggle').includes('themeLabel') &&
       !segOf('themeToggleDrawer').includes('nav-ic') && segOf('themeToggleDrawer').includes('themeLabelDrawer'),
       label + ': theme rows are 🌙/☀️ + label only (no second gear)');
  }
  ok(viewerSrc.includes('const profTarget = acting ? profUrl(acting.username)'),
     'profile rows route by state (v25): acting → own profile, nameless → name desk, locked → wallet + ?next=profile');
  ok(viewerSrc.includes("acting ? pageFile + '?getname=1#myNames' : pageFile + '?wallet=1'"),
     'my-names rows route by state: acting → the names list, locked → the wallet view');
  ok(!viewerSrc.includes('prow.style.display') && !viewerSrc.includes("el.style.display = acting"),
     'syncChrome no longer hides the profile / my-names rows in any state');
}

console.log('— v17: tab bar order + the notifications view (reactions to your name) —');
{
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    const navStart = html.indexOf('<nav class="bottomnav"');
    const nav = html.slice(navStart, html.indexOf('</nav>', navStart));
    const order = ['home', 'search', 'reactions', 'wallet'].map(k => nav.indexOf('data-nav="' + k + '"'));
    ok(order.every(i => i >= 0) && order.every((v, i) => i === 0 || v > order[i - 1]),
       label + ': the tab bar is home / search / notifications / wallet (notifications second from the right, wallet last)');
    ok(!nav.includes('data-nav="bookmarks"'),
       label + ': bookmarks is NOT on the tab bar (its drawer / sidebar rows remain the entry)');
    ok(nav.includes('id="ntDot"'), label + ': the notifications tab carries the unread-dot element');
    ok(html.includes('id="viewReactions"') && html.includes('id="ntList"') && html.includes('id="ntMoreBtn"'),
       label + ': carries the reactions view (list + scan-further-back button)');
    ok(html.includes('class="nt-note"'),
       label + ': the reactions view carries the honest scope note (recent record, not a complete history)');
  }
  /* the filter predicate, driven unit-style: reactions to my
     posts / my name are picked up, everything else falls away */
  const MINE = '0x' + 'aa'.repeat(32), OTHER = '0x' + 'bb'.repeat(32);
  const myPosts = new Set([MINE]);
  const me = 7n;
  const item = over => ({ type: 0, senderId: 9n, receiverId: 0n, cawId: OTHER, text: '', ...over });
  ok(V.ntClassify(item({ type: 1, cawId: MINE }), me, myPosts) === 'like',
     'ntClassify: a like aimed at my post is a reaction');
  ok(V.ntClassify(item({ type: 2, cawId: MINE }), me, myPosts) === 'recaw',
     'ntClassify: a Recaw of my post is a reaction');
  ok(V.ntClassify(item({ type: 3, receiverId: me }), me, myPosts) === 'follow',
     'ntClassify: a follow of my name is a reaction');
  ok(V.ntClassify(item({ type: 0, text: V.appendPostRef('hi', 'reply', MINE) }), me, myPosts) === 'reply',
     'ntClassify: a marker reply to my post is a reaction');
  ok(V.ntClassify(item({ type: 0, text: V.appendPostRef('hi', 'quote', MINE) }), me, myPosts) === 'quote',
     'ntClassify: a marker quote of my post is a reaction');
  ok(V.ntClassify(item({ type: 1, cawId: OTHER }), me, myPosts) === null,
     'ntClassify: a like aimed at someone else\'s post falls away');
  ok(V.ntClassify(item({ type: 3, receiverId: 8n }), me, myPosts) === null,
     'ntClassify: a follow of someone else falls away');
  ok(V.ntClassify(item({ type: 1, senderId: me, cawId: MINE }), me, myPosts) === null,
     'ntClassify: my own action is never a reaction to me');
  ok(V.ntClassify(item({ type: 0, text: 'just a post' }), me, myPosts) === null,
     'ntClassify: an unrelated post falls away');
  ok(V.ntClassify(item({ type: 4, receiverId: me }), me, myPosts) === null,
     'ntClassify: an unfollow is not listed as a reaction');
  /* the marked-burn event list: dedupe by tx, newest last */
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const ev = { k: 'sl', id: MINE, from: '0xabc0000000000000000000000000000000000001', block: 100, tx: '0xtx1' };
    const before = V.mbEventsFor().length; // the live scan above may already hold real events
    V.mbEventRecord(ev);
    V.mbEventRecord({ ...ev, block: 101 });
    V.mbEventRecord({ ...ev, tx: '0xtx2', block: 102 });
    const list = V.mbEventsFor();
    ok(list.length === before + 2 && list[list.length - 1].tx === '0xtx2',
       'marked-burn events dedupe by tx and keep scan order');
    ok(store.has(V.MB_EVENTS_KEY), 'marked-burn events persist under ' + V.MB_EVENTS_KEY);
  } finally {
    delete globalThis.localStorage;
  }
  /* locked-state guidance + the seen-mark dot rule */
  ok(viewerSrc.includes('loadReactionsView') && viewerSrc.includes('T.ntNeedWallet') &&
     viewerSrc.includes("pageFile + '?wallet=1'"),
     'with no acting name the reactions view shows wallet guidance (never an empty or dead tab)');
  ok(viewerSrc.includes("const NT_SEEN_KEY = 'caw-notif-seen-v1'") && viewerSrc.includes('ntSeenBlock') &&
     viewerSrc.includes('ntTapItems(page.items)'),
     'the unread dot is driven only by real scans against the stored last-seen block');
}

console.log('— v19: X -> CAW mirror inbox (receive side, the ETH web inbox pattern) —');
{
  const indexHtml = read('../docs/index.html');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="viewMirror"') && html.includes('id="mirrorArea"'),
      label + ' carries the mirror inbox view');
    const chrome = html.slice(0, html.indexOf('<nav class="bottomnav"'));
    ok(chrome.indexOf('data-nav="mirror"') > chrome.indexOf('data-nav="bookmarks"') &&
       chrome.indexOf('data-nav="bookmarks"') >= 0 && chrome.includes('?mirror=1'),
      label + ': the sidebar mirror row sits right after bookmarks and opens ?mirror=1');
    const dr = html.slice(html.indexOf('id="drawer"'));
    ok(dr.indexOf('data-nav="mirror"') > dr.indexOf('data-nav="bookmarks"'),
      label + ': the drawer mirror row sits right after bookmarks too');
    const rail = html.slice(html.indexOf('class="rightrail"'), html.indexOf('id="drawer"'));
    ok(!rail.includes('mirror'),
      label + ': the right rail does NOT advertise the mirror inbox (personal, token-gated)');
  }
  ok(indexHtml.includes('location.search'),
    'the language gate keeps the query string (?mirror=1&item=<id> survives to the shell)');
  ok(V.MIRROR.baseUrl === 'https://eth-caw-mirror.nepicobsv.workers.dev',
    'the mirror client points at the eth-caw-mirror Worker');
  ok(viewerSrc.includes("mirrorFetch('/pending'") && viewerSrc.includes("mirrorFetch('/done'") &&
     viewerSrc.includes("mirrorFetch('/subscribe'") && viewerSrc.includes("mirrorFetch('/vapid-public'"),
    'viewer.js reads /pending + /vapid-public and posts only /done + /subscribe');
  ok(V.MIRROR_TOKEN_KEY === 'caw-mirror-token' && viewerSrc.includes("headers['X-Inbox-Token'] = token"),
    'the inbox token rides the X-Inbox-Token header, from the caw-mirror-token storage key');
  ok(!/X-Inbox-Token['"]?\s*[:=]\s*['"][A-Za-z0-9]/.test(viewerSrc) &&
     !enHtml.includes('X-Inbox-Token') && !jaHtml.includes('X-Inbox-Token'),
    'no token VALUE is baked into any source (the header is set from the stored token only)');
  ok(swSrc.includes("addEventListener('push'") && swSrc.includes("addEventListener('notificationclick'"),
    'sw.js handles push + notificationclick for the mirror inbox');
  ok(swSrc.includes("'?mirror=1&item=' + encodeURIComponent(data.id)") && swSrc.includes("'?mirror=1'"),
    'sw.js lands taps on ?mirror=1&item=<id> (plain ?mirror=1 without an id), resolved against its scope');
  /* the byte-limit truncation: the QL1 limit is 420 BYTES,
     not the ETH inbox's 420 characters */
  const tShort = V.truncateToPostBytes('hello');
  ok(tShort.text === 'hello' && tShort.truncated === false, 'truncate: short text passes through');
  ok(V.truncateToPostBytes('a'.repeat(420)).truncated === false, 'truncate: exactly 420 bytes is kept whole');
  const tOver = V.truncateToPostBytes('a'.repeat(421));
  ok(tOver.truncated && V.textBytes(tOver.text) === 420, 'truncate: 421 ASCII bytes cut to exactly 420');
  const tJp = V.truncateToPostBytes('あ'.repeat(200));
  ok(tJp.truncated && V.textBytes(tJp.text) === 420 && !tJp.text.includes('\uFFFD'),
    'truncate: multibyte text cuts on a UTF-8 boundary', V.textBytes(tJp.text) + ' bytes');
  const tSplit = V.truncateToPostBytes('a' + 'あ'.repeat(200));
  ok(tSplit.truncated && V.textBytes(tSplit.text) <= 420 && !tSplit.text.includes('\uFFFD'),
    'truncate: a sequence split by the cut leaves no replacement char', V.textBytes(tSplit.text) + ' bytes');
  const tWords = V.truncateToPostBytes('word '.repeat(120));
  ok(tWords.truncated && tWords.text.endsWith('word') && V.textBytes(tWords.text) <= 420,
    'truncate: a late word break is preferred over a mid-word cut');
  /* the draft record: text + item id + truncation flag */
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    V.mirrorDraftSave('hello mirror', 'item-7', true);
    const md = V.mirrorDraftLoad();
    ok(md && md.text === 'hello mirror' && String(md.id) === 'item-7' && md.truncated === true &&
       store.has(V.MIRROR_DRAFT_KEY),
      'the mirror draft record round-trips under ' + V.MIRROR_DRAFT_KEY);
    V.mirrorDraftSave('manual text', null, false);
    ok(V.mirrorDraftLoad().id === null, 'manual intake stores a null item id (nothing to resolve)');
    V.mirrorDraftClear();
    ok(V.mirrorDraftLoad() === null, 'the mirror draft record clears');
  } finally {
    delete globalThis.localStorage;
  }
  /* /done wiring: dismiss + the post-success resolver only */
  ok((viewerSrc.match(/mirrorDone\(/g) || []).length === 3,
    '/done fires from exactly two call sites — dismiss and the post-success resolver (plus its definition)');
  const composerBlock = viewerSrc.slice(viewerSrc.indexOf('postBtn.onclick'), viewerSrc.indexOf('async function doSimpleAction'));
  ok(composerBlock.includes('mirrorResolveAfterPost()'),
    'the composer post-success path resolves the mirrored item (a failed send never reaches it)');
  ok(viewerSrc.includes("get('mirror')") && viewerSrc.includes("get('item')"),
    'viewer.js opens the mirror view from ?mirror= and reads the ?item= deep link');
}

console.log('— v22: BurnHawk + HuntersDEX + the full wallet set —');
{
  const E18 = 10n ** 18n;
  const word = v => BigInt(v).toString(16).padStart(64, '0');
  /* drawer parity: in BOTH shells, BOTH navs (sidebar +
     drawer) carry HuntersDEX and BurnHawk between Get a name
     and Bookmarks — the app drawer's order. */
  for (const [name, html, file] of [['en', enHtml, 'en.html'], ['ja', jaHtml, 'ja.html']]) {
    const seq = [...html.matchAll(/data-nav="([a-z]+)"/g)].map(m => m[1])
      .filter(k => ['profile', 'wallet', 'mynames', 'getname', 'dex', 'burnhawk', 'bookmarks', 'mirror'].includes(k))
      .slice(0, 16);   // sidebar + drawer (a phone tab bar trails the file)
    const want = ['profile', 'wallet', 'mynames', 'getname', 'dex', 'burnhawk', 'bookmarks', 'mirror'];
    ok(JSON.stringify(seq) === JSON.stringify([...want, ...want]),
      name + ': nav order is getname → dex → burnhawk → bookmarks in sidebar AND drawer');
    ok(html.includes('href="' + file + '?dex=1"') && html.includes('href="' + file + '?burnhawk=1"'),
      name + ': the new rows link at ?dex=1 / ?burnhawk=1');
    ok(html.includes('id="viewDex"') && html.includes('id="dexArea"') &&
       html.includes('id="viewBurn"') && html.includes('id="burnArea"'),
      name + ': the viewDex / viewBurn sections exist');
  }
  ok(viewerSrc.includes("get('dex')") && viewerSrc.includes("get('burnhawk')"),
    'viewer.js opens the new views from ?dex= / ?burnhawk=');
  ok(viewerSrc.includes('function loadDexView') && viewerSrc.includes('function loadBurnView'),
    'viewer.js defines loadDexView / loadBurnView');

  /* the corrected SuperRecaw label — and no user-facing
     25,000,000 left anywhere, while the legacy-detection
     constants keep their old values. */
  ok(enHtml.includes('SuperRecaw (5,000,000 O)'), 'en: the SuperRecaw button says 5,000,000 O');
  ok(jaHtml.includes('SuperRecaw（5,000,000 O）'), 'ja: the SuperRecaw button says 5,000,000 O');
  ok(!enHtml.includes('25,000,000') && !jaHtml.includes('25,000,000') && !viewerSrc.includes('25,000,000'),
    'no 25,000,000 text remains in the shells or viewer.js');
  ok(V.SUPERLIKE_TOTAL_O === 5000000 && V.SUPERRECAW_TOTAL_O === 5000000 &&
     V.SUPERLIKE_BURN_O === 1000000 && V.SUPERRECAW_BURN_O === 3000000,
    'the current Super prices are the v21 5,000,000 O totals');
  ok(V.V063_SUPERLIKE_BURN_O === 10000000 && V.V063_SUPERRECAW_BURN_O === 20000000 &&
     V.LEGACY_MARKED_BURN_O === 1000000,
    'legacy-burn detection constants are untouched');

  /* token addresses — cross-checked against the app repo
     (the source of truth this port mirrors). */
  const appAgg = fs.readFileSync(new URL('../../caw-social-app/src/lib/aggEngine.ts', import.meta.url), 'utf8');
  const appBurn = fs.readFileSync(new URL('../../caw-social-app/src/lib/burnHawk.ts', import.meta.url), 'utf8');
  const inApp = (src, addr) => src.toLowerCase().includes(addr.toLowerCase());
  ok(V.HAWK_TOKEN === '0xbC85F14059d60458b614052b4a84734E463878cc' && inApp(appAgg, V.HAWK_TOKEN),
    'HAWK address matches the app', V.HAWK_TOKEN);
  ok(V.PHOENIX_TOKEN === '0xDFe660C5a29c8AADF1daA096543D249135e1938A' && inApp(appAgg, V.PHOENIX_TOKEN),
    'PHOENIX address matches the app', V.PHOENIX_TOKEN);
  ok(V.KET_TOKEN === '0x034c1fe794ab9d30e27e1ce0d89a4591fc9f1fb4' && inApp(appAgg, V.KET_TOKEN),
    'KET address is the QL1 one from the app (not the 42 Chain one)', V.KET_TOKEN);
  ok(V.WQOM_TOKEN === '0xa26dfbf98dd1a32fae56a3d2b2d60a8a41b0bdf0' && inApp(appAgg, V.WQOM_TOKEN),
    'WQOM address matches the app', V.WQOM_TOKEN);
  ok(V.DEX_TOKENS.length === 6 &&
     JSON.stringify(V.DEX_TOKENS.map(t => t.sym)) === JSON.stringify(['QOM', 'qCAW', 'O', 'KET', 'HAWK', 'PHOENIX']),
    'the DEX trades exactly the six app tokens');

  /* BurnHawk money rules (offline, exact) */
  ok(V.BURN_TO_MINT_SELECTOR === '0x05737aae' && appBurn.includes('0x05737aae'),
    'burnToMint selector matches the app', V.BURN_TO_MINT_SELECTOR);
  ok(V.BURN_RATIO === 100n, 'the burn ratio is exactly 100:1');
  ok(V.roundDownBurnRaw(27550n * E18, 18) === 27500n * E18,
    'round-down: 27,550 HAWK burns as 27,500 (the site\'s first real burn)');
  ok(V.roundDownBurnRaw(99n * E18, 18) === 0n && V.roundDownBurnRaw(100n * E18, 18) === 100n * E18,
    'round-down: under 100 HAWK rounds to nothing; exactly 100 stays');
  ok(V.burnReceiveRaw(27500n * E18, 18, 18) === 275n * E18,
    'receive: 27,500 HAWK -> 275 PHOENIX');
  ok(V.buildBurnToMintData(100n) === '0x05737aae' + word(100n),
    'burnToMint calldata is selector + one amount word');
  ok(V.buildApproveToCalldata(V.PHOENIX_TOKEN, 500n) ===
     '0x095ea7b3' + V.PHOENIX_TOKEN.slice(2).toLowerCase().padStart(64, '0') + word(500n),
    'the burn approval targets the PHOENIX contract for the exact amount');

  /* the wallet page reads the three new balances the same
     balanceOf way, formatted at each contract's decimals */
  for (const [sym, id] of [['KET', 'pwKetBal'], ['HAWK', 'pwHawkBal'], ['PHOENIX', 'pwPhoenixBal']]) {
    ok(viewerSrc.includes('id="' + id + '"'), 'wallet page has the ' + sym + ' balance row');
    ok(viewerSrc.includes('readUint(' + sym + '_TOKEN, SEL.balanceOf'), 'wallet page reads ' + sym + ' via balanceOf');
    ok(viewerSrc.includes('readUint(' + sym + '_TOKEN, SEL.decimals'), 'wallet page reads ' + sym + ' decimals from the contract');
  }

  /* DEX wiring: router + selectors match the app; quotes
     are live reads; calldata byte-checked offline */
  ok(inApp(appAgg, V.DEX_ROUTER) && appAgg.includes('0xd06ca61f'),
    'the DEX router + getAmountsOut selector match the app', V.DEX_ROUTER);
  ok(V.GET_AMOUNTS_OUT_SELECTOR === '0xd06ca61f' &&
     V.SWAP_TOKENS_FOR_TOKENS_SELECTOR === '0x38ed1739' &&
     V.SWAP_ETH_FOR_TOKENS_SELECTOR === '0x7ff36ab5' &&
     V.SWAP_TOKENS_FOR_ETH_SELECTOR === '0x18cbafe5',
    'the swap selectors match the app');
  ok(appAgg.toLowerCase().includes(V.DEX_ROUTER.toLowerCase()) &&
     viewerSrc.includes('ethCall(DEX_ROUTER, encodeGetAmountsOut(amountIn, p))'),
    'quotes are eth_call getAmountsOut reads against the router — no other quote source');
  ok(V.encodeGetAmountsOut(1000n, [V.WQOM_TOKEN, V.O_TOKEN]) ===
     '0xd06ca61f' + word(1000n) + word(64) + word(2) +
     V.WQOM_TOKEN.slice(2).toLowerCase().padStart(64, '0') +
     V.O_TOKEN.slice(2).toLowerCase().padStart(64, '0'),
    'getAmountsOut calldata layout matches the app encoding');
  {
    const fake = '0x' + word(32) + word(2) + word(1000n) + word(777n);
    const dec = V.decodeAmountsOut(fake);
    ok(dec && dec.length === 2 && dec[0] === 1000n && dec[1] === 777n, 'decodeAmountsOut reads the amounts array');
    ok(V.decodeAmountsOut('0x') === null, 'decodeAmountsOut: an empty return is no quote');
  }
  {
    const paths = V.dexCandidatePaths(V.KET_TOKEN, V.O_TOKEN);
    ok(paths.length === 2 && paths[0].length === 2 && paths[1].length === 3 &&
       paths[1][1] === V.WQOM_TOKEN.toLowerCase(),
      'candidate paths: direct + via-WQOM for KET->O (via-O is the target itself, dropped)');
    const paths2 = V.dexCandidatePaths(V.KET_TOKEN, V.HAWK_TOKEN);
    ok(paths2.length === 3, 'candidate paths: direct + via-WQOM + via-O when both are free');
    const best = V.dexBestRoute(100n, [
      { path: paths2[0], amounts: [100n, 5n] },
      { path: paths2[1], amounts: [100n, 50n, 9n] },
      { path: paths2[2], amounts: null },
    ]);
    ok(best && best.amountOut === 9n && best.path === paths2[1], 'dexBestRoute picks the largest live output');
    ok(V.dexBestRoute(100n, [{ path: paths2[0], amounts: null }]) === null,
      'dexBestRoute: every path silent -> no route (never an invented quote)');
  }
  ok(V.dexMinOut(1000n, 1) === 990n && V.DEX_SLIPPAGE_PCT === 1, 'min-out applies the stated 1% slippage');
  {
    const to = '0x1111111111111111111111111111111111111111';
    const tt = V.buildSwapCalldata({ fromNative: false, toNative: false, amountIn: 1000n,
      amountOut: 2000n, slippagePct: 1, path: [V.KET_TOKEN, V.WQOM_TOKEN], to, nowSec: 1700000000 });
    ok(tt.data.startsWith('0x38ed1739') && tt.value === 0n && tt.data.length === 2 + 260 * 2,
      'swap tokens->tokens: selector, zero value, app layout length (260 bytes)');
    ok(tt.data.includes(word(1700000000n + 1200n)), 'swap deadline is send time + 20 minutes');
    ok(tt.data.includes(word(1980n)), 'swap calldata carries the 1% min-out (2,000 -> 1,980)');
    const et = V.buildSwapCalldata({ fromNative: true, toNative: false, amountIn: 1000n,
      amountOut: 2000n, slippagePct: 1, path: [V.WQOM_TOKEN, V.O_TOKEN], to, nowSec: 1700000000 });
    ok(et.data.startsWith('0x7ff36ab5') && et.value === 1000n,
      'swap QOM->token: swapExactETHForTokens with the amount as tx value');
    const te = V.buildSwapCalldata({ fromNative: false, toNative: true, amountIn: 1000n,
      amountOut: 2000n, slippagePct: 1, path: [V.O_TOKEN, V.WQOM_TOKEN], to, nowSec: 1700000000 });
    ok(te.data.startsWith('0x18cbafe5') && te.value === 0n,
      'swap token->QOM: swapExactTokensForETH');
  }
  ok(viewerSrc.includes("if (fresh.amountOut * 100n < shown.amountOut * 95n) throw new Error('dex-moved')"),
    'the DEX send re-quotes and stops on a >5% adverse move, like the app');
  ok(viewerSrc.includes("throw new Error('dex-noroute')"),
    'the DEX send stops when the route vanished');

  /* live reads: the three new tokens answer decimals() +
     symbol() as the app's table says, and the router quotes
     the viewer's own calldata — direct where a pool exists,
     two-hop where it does not */
  for (const [sym, addr] of [['KET', V.KET_TOKEN], ['HAWK', V.HAWK_TOKEN], ['PHOENIX', V.PHOENIX_TOKEN]]) {
    const dec = Number(BigInt(await rawCall(addr, '0x313ce567')));
    const s = rawString(await rawCall(addr, '0x95d89b41'));
    ok(dec === 18 && s === sym, 'live: ' + sym + ' is ' + sym + ' with 18 decimals', addr);
  }
  {
    const r = await rawCall(V.DEX_ROUTER, V.encodeGetAmountsOut(100n * E18, [V.WQOM_TOKEN, V.O_TOKEN]));
    const amounts = V.decodeAmountsOut(r);
    ok(amounts && amounts.length === 2 && amounts[1] > 0n,
      'live quote: 100 QOM -> O via the direct pair', amounts ? amounts[1].toString() : 'none');
    let directErr = false;
    try { await rawCall(V.DEX_ROUTER, V.encodeGetAmountsOut(100n * E18, [V.KET_TOKEN, V.O_TOKEN])); }
    catch (e) { directErr = true; }
    ok(directErr, 'live quote: KET -> O has NO direct pair (the read reverts)');
    const r2 = await rawCall(V.DEX_ROUTER,
      V.encodeGetAmountsOut(100n * E18, [V.KET_TOKEN, V.WQOM_TOKEN, V.O_TOKEN]));
    const amounts2 = V.decodeAmountsOut(r2);
    ok(amounts2 && amounts2.length === 3 && amounts2[2] > 0n,
      'live quote: KET -> O routes two-hop via QOM', amounts2 ? amounts2[2].toString() : 'none');
  }
}

/* ---- v26: media server (profile media + post attachments) ---- */
{
  const VS = read('../docs/viewer.js');
  const swJs = read('../docs/sw.js');
  ok(V.MEDIA_API === 'https://vps-2026-11-12-16-49-27.tail303bfa.ts.net:10000', 'MEDIA_API points at the VPS Funnel :10000');
  ok(V.buildMediaMessage({ action: 'set-icon', nameId: '7', sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', ts: 1760000000 }) ===
    'CAW Media v1\naction: set-icon\nname: 7\nsha256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\ncaw: -\ntx: -\nts: 1760000000',
    'buildMediaMessage matches the server format byte for byte');
  ok(V.buildMediaMessage({ action: 'attach', nameId: '7', sha256: 'ab', caw: '0xCC', tx: '0xDD', ts: 5 }) ===
    'CAW Media v1\naction: attach\nname: 7\nsha256: ab\ncaw: 0xCC\ntx: 0xDD\nts: 5',
    'buildMediaMessage attach form carries caw + tx');
  ok(/Promise\.all\(\[cardFor\(idIn\), mediaFor\(idIn\)\]\)/.test(VS), 'avatarFor prefers the media icon over the NFT image');
  ok(VS.includes('pwSignMediaMsg') && VS.includes('Ethereum Signed Message'), 'EIP-191 media signing exists for media writes');
  ok(VS.includes('applyProfileMedia(id).catch(() => {})'), 'profile media applied after the head renders');
  ok(VS.includes("mediaSettingRow('icon'") && VS.includes("mediaSettingRow('header'") && VS.includes("mediaSettingRow('audio'"), 'media settings rows for icon/header/audio');
  ok((VS.match(/hydrateAttachmentsIn\(/g) || []).length >= 4, 'attachments hydrate in timeline, profile bucket and post detail');
  ok(VS.includes('const filesAtPost = compFiles') && VS.includes('mediaAttach(filesCaw, filesTx, f)'), 'composer snapshots files and uploads after the post lands');
  ok(VS.includes("MEDIA_API + '/v1/profile-media'") && VS.includes("MEDIA_API + '/v1/attach'") && VS.includes("MEDIA_API + '/v1/clear'"), 'uploads go to the signed endpoints');
  ok(swJs.includes('caw-view-v27'), 'sw cache is caw-view-v27');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
