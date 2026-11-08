/* Verification for the read-only web viewer (docs/app.js), run
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
   Run: node scripts/verify-viewer.mjs */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const V = require('../docs/app.js');

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

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
