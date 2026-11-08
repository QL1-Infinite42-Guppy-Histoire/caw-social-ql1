/* Verification for the read-only web viewer (docs/viewer.js), run
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

console.log('— v11: version guards (v10 checks, updated values) —');
ok(enHtml.includes('?v=11') && jaHtml.includes('?v=11'), 'shells reference ?v=11 assets');
ok(swSrc.includes("caw-view-v11"), 'sw.js cache name is caw-view-v11');
ok(enHtml.includes('rel="preconnect"') && jaHtml.includes('rel="preconnect"'), 'shells preconnect to the RPC + explorer API hosts');
ok(enHtml.includes('og:title') && jaHtml.includes('og:title'), 'shells carry OGP meta tags');

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

console.log('— v11: write-path guards —');
{
  const sendSites = (viewerSrc.match(/eth_sendTransaction/g) || []).length;
  ok(sendSites === 1, 'viewer.js has exactly ONE send site (the sendTx helper)', 'sites=' + sendSites);
  ok(!/eth_sign/.test(viewerSrc) && !/personal_sign/.test(viewerSrc),
    'viewer.js never names a signing method anywhere');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="getname"') && html.includes('id="mintNameInput"') &&
       html.includes('id="mintCheckBtn"') && html.includes('id="walletArea"') &&
       html.includes('id="mintArea"') && html.includes('id="myNames"'),
       label + ' carries the get-a-name section and its controls');
  }
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
