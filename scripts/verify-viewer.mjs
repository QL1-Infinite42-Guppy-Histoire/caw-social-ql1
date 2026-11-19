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
   v29 adds: the trade views' locked wall — no more dead end.
   With a vault, the DEX / BurnHawk walls unlock in place
   (the session is page-memory only, so the old wallet-link
   round trip re-locked forever); without one, the wallet
   link carries ?next= and pwStartSession continues back.
   The wall renderer itself is run against a stub DOM below.
   v30 adds: the session persists in tab-scoped sessionStorage
   (the owner's call — the memory-only session re-locked on
   every navigation, which also made posting from the web
   impossible: composer on home, unlock on the wallet view,
   and moving between them killed the session). Boot restore
   respects the vault + the 15 idle minutes and never takes
   the ?next= jumps; lock forgets the stored copy; the secret
   never reaches localStorage. Also: the recovery phrase /
   private key can be viewed again from the unlocked wallet
   (fresh vault decryption behind a password re-entry, never
   the live session secret), and the mobile topbar keeps ONE
   logo (the drawer button's avatar; the .mt-mark img is gone).
   The wallet cluster + composer are run against a stub DOM
   below: a restored session on the home view must render the
   real composer card with can-compose set.
   v31 adds (app-parity batch 1): the home Latest / Following
   segment — the Following feed walks the same record filtered
   to the acting name's follow-index set (posts + Recaws only,
   25 pages per chunk until >= 8 matches), with honest guide /
   empty / building-progress states — and the Tip flow: the
   app's TipSheet (PHOENIX presets 10 / 50 / 100 + custom with
   25/50/75/MAX chips, recipient spot-check line with the last
   four emphasised, balance line, over-balance error, self-tip
   blocked) sending a plain PHOENIX transfer through the
   shared confirm panel, the recipient re-resolved at send
   and cross-checked against the panel's resolution. The tip
   money rules are exported and unit-checked; the sheet, the
   confirm flow and the Following walk run against stub DOMs.
   v32 adds (app-parity batch 2): @mention candidates from the
   whole-name directory, cawl shortening written back into the
   composer before the confirm sheet, the per-wallet plain-post
   draft (restore / discard / autosave; reply and quote never
   touch it), the in-composer name picker, attachment
   thumbnails with per-image remove, own-post insertion at the
   feed head with scanned-record reconciliation, the on-device
   my-actions record painting like/Recaw lit, the protocol
   action costs in the composer and the confirm panels (plus
   the SuperLike sheet's author address line), and reply/quote
   opening the composer in place as a sheet. The pure helpers
   are unit-checked; the composer cluster runs against a stub
   DOM below.
   v33 adds (app-parity batch 3): profile display name + bio as
   on-device customs (the app's store key and merge rules; the
   pure helpers unit-checked, the store round-tripped against
   a stub localStorage); the My names screen on the posting
   wallet (summary + per-name cards + the shared dep/withdraw
   panel); minting moved to the posting wallet (D8 — the v12
   injected-send pin consciously updated to ZERO, the approve /
   mint sends pinned to sendLocalTx through the confirm panel);
   the mint area's Buy CAW link into the DEX view (M13); live
   mint-name character feedback (D19 — the app's
   isMintableUsername rule unit-checked); follow lists building
   automatically with page progress (D9 — no keep-reading
   button); and the Reactions inbox widened to all of my names
   with the unfollow kind, the since-last-open scan with its
   capped note, and the unread COUNT badge (M11/D12 —
   ntClassifyAny + ntBadgeText unit-checked).
   v34 (batch 4a): the single vault becomes a REGISTRY of
   wallets (M6 — each wallet its own AES-GCM ciphertext under
   its own password; add / switch-with-auth / per-wallet
   delete; the pre-v34 vault is adopted on first unlock with
   the same ciphertext, read-back verified, legacy key dropped
   only after — the migration is behaviour-tested below against
   stub storage, together with the no-plaintext-anywhere rule);
   the Settings view (M15 — language / address+copy / backup /
   wallets / lock / about / danger zone, and the right-rail
   About card's stale "no real send yet" line replaced); the
   wallet asset list gains the in-name CAW row and tap-to-exact
   amounts (D11 — fmtExactAmt unit-checked); the reveal gains a
   Copy button fed by the fresh decryption (D17); onboarding
   matches the app (D18 — the derived address shows before the
   password step, import errors name their cause via
   checkMnemonicDetail / classifyImportSecret, password minimum
   6); the bottom tab bar becomes Home / Search / Reactions /
   Profile (D23 — pwProfileTarget extracted and unit-checked);
   the drawer + sidebar gain a Reactions row with the count
   badge, and the My-names icon becomes the acting avatar (D24).
   v35 (batch 4b): the send becomes the app's multi-chain send
   (M8 — BSC / Ethereum / 42 Chain / QL1 through one
   generalized local sender, sendChainTx, with sendLocalTx as
   its QL1 case; the app's token sets, RPC endpoints, gas
   units/reserve and MAX rule are cross-read from the app
   repo and unit-checked; the per-wallet address book's CRUD
   and validation errors are behaviour-tested against stub
   storage); the faucet sheet (M9 — the app's Worker, three
   pools, per-code messages with the cooldown retry-after
   buckets, claim/status clients tested against stub fetches
   and the live Worker's shape); the DEX header extras (M10 —
   Faucet + Send pills, the deposit-address card) and price
   impact (D10 — the app's spot formula on a 1% dust quote,
   unit-checked, shown at >= 1%); the lookup desk's directory
   partial matches with build progress (M12); bookmarks with
   like/Recaw/SuperLike rendered non-wired (D13); and the
   home-feed cache (D20 — sessionStorage, char-capped, public
   post data only, round-trip tested; paint instantly, then
   refresh).
   v36 (M14, the final parity batch): twenty languages — the
   app's full set. en + ja stay embedded in viewer.js; the other
   eighteen ship as dict-<lang>.js tables generated from the
   app's i18n by scripts/build-i18n.mjs (a web key takes the
   app's string when it maps to an app key — exact, normalised
   or the hand-checked MANUAL pairs — and keeps the English
   string otherwise; the shipped dicts are compared against a
   fresh regeneration below, and every value's placeholders
   must fit the English string's). One shell per language,
   generated from en.html (static strings ported through the
   en<->ja chunk diff); fa/ar shells are dir="rtl" and the
   stylesheet mirrors the physically-pinned layout. The
   language picker (drawer/sidebar slots + the Settings list)
   links to the same view in the target shell, query included;
   the root gate routes by the stored caw-lang, then the
   browser language. Stub-DOM boots below prove an es boot and
   an ar boot render from their dicts. (Also fixed en route:
   ja.html had v34's drawer Reactions row duplicated in its
   sidebar and missing from its drawer — the row was moved to
   the drawer, restoring the en/ja structural alignment the
   shell generator relies on.)
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
  /* v37 (B-P2): relTime is the app's formatRelativeTime — the
     seconds count shows ("30s", was the localised "now"), and
     the date fallback starts at a week (was ~30 days). */
  ok(V.relTime(NOW - 30, NOW) === '30s', 'relTime: under a minute shows the seconds (app format)');
  ok(V.relTime(NOW - 300, NOW) === '5m', 'relTime: minutes');
  ok(V.relTime(NOW - 3 * 3600, NOW) === '3h', 'relTime: hours');
  ok(V.relTime(NOW - 2 * 86400, NOW) === '2d', 'relTime: days');
  ok(V.relTime(NOW - 40 * 86400, NOW).includes('2023'), 'relTime: over a week falls back to the date + time');
}

console.log('— v25: version guards (v10 checks, updated values) —');
ok(enHtml.includes('?v=40') && jaHtml.includes('?v=40'), 'shells reference ?v=40 assets');
ok(swSrc.includes("caw-view-v40"), 'sw.js cache name is caw-view-v40');
ok(enHtml.includes('rel="preconnect"') && jaHtml.includes('rel="preconnect"'), 'shells preconnect to the RPC + explorer API hosts');
ok(enHtml.includes('og:title') && jaHtml.includes('og:title'), 'shells carry OGP meta tags');

console.log('— v24: menu destinations audit (profile must not land on the wallet) —');
{
  const expect = { home: '', search: '?lookup=1', reactions: '?reactions=1', wallet: '?wallet=1',
    getname: '?getname=1', dex: '?dex=1', burnhawk: '?burnhawk=1', bookmarks: '?bookmarks=1', mirror: '?mirror=1',
    settings: '?settings=1' };
  for (const [label, html, file] of [['en.html', enHtml, 'en.html'], ['ja.html', jaHtml, 'ja.html']]) {
    const anchors = [...html.matchAll(/<a[^>]*data-nav="([^"]+)"[^>]*>/g)];
    let bad = [];
    for (const m of anchors) {
      const nav = m[1], tag = m[0];
      const href = (tag.match(/href="([^"]*)"/) || [])[1] || '';
      if (nav === 'lang') continue;
      if (nav === 'profile' || nav === 'mynames') {
        // state-dependent rows: profile's static placeholder is the
        // wallet view (carrying ?next=profile since v25) and
        // syncChrome rewrites it per session state. My names points
        // at its own view in every state since v33 — the names
        // screen itself carries the unlock wall / guide.
        const want = nav === 'profile' ? file + '?wallet=1&next=profile' : file + '?names=1';
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
  ok(viewerSrc.includes('function pwProfileTarget(acting, unlocked)') &&
     viewerSrc.includes('if (acting) return profUrl(acting.username);') &&
     viewerSrc.includes("if (unlocked) return pageFile + '?getname=1';") &&
     viewerSrc.includes("return pageFile + '?wallet=1&next=profile';") &&
     viewerSrc.includes('const profTarget = pwProfileTarget(acting, !!pwSession);'),
    'v25: profile target is three-way (own profile / name desk / wallet with ?next=profile) — v34: factored into pwProfileTarget, shared with the tab bar');
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
  /* v12 had exactly two writes, kept apart: minting sent through
     the visitor's injected wallet (one helper), and everything
     else was signed in-page by the built-in wallet and broadcast
     raw (one sender). v33 (D8) REMOVED the injected path
     entirely: minting now goes through the posting wallet like
     everything else, so the injected-provider send count is
     ZERO — eth_sendTransaction must not appear as a call at
     all — and the one raw broadcast site remains the only send
     on the site. Raw-sign REQUESTS to an external wallet are
     never made — the refused method names must not even appear. */
  const sendSites = (viewerSrc.match(/eth_sendTransaction/g) || []).length;
  ok(sendSites === 0, 'viewer.js has ZERO injected-provider send sites (v33 D8: minting moved to the posting wallet)', 'sites=' + sendSites);
  const rawSites = (viewerSrc.match(/eth_sendRawTransaction/g) || []).length;
  ok(rawSites === 1, 'viewer.js has exactly ONE raw broadcast site (the local wallet sender)', 'sites=' + rawSites);
  ok(!/eth_sign/.test(viewerSrc) && !/personal_sign/.test(viewerSrc),
    'viewer.js never names a raw-sign method anywhere (nothing is ever requested)');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="getname"') && html.includes('id="mintNameInput"') &&
       html.includes('id="mintCheckBtn"') && html.includes('id="gnWalletArea"') &&
       html.includes('id="mintArea"') && html.includes('id="viewNames"') &&
       html.includes('id="namesArea"') && !html.includes('id="walletArea"') &&
       !html.includes('id="myNames"'),
       label + ' carries the get-a-name section and its controls (v33: posting-wallet strip + the separate My names view)');
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
     (viewerSrc.match(/eth_sendTransaction/g) || []).length === 0 &&
     !/eth_sign/.test(viewerSrc) && !/personal_sign/.test(viewerSrc),
     'v14 keeps the single broadcast site; v33 (D8) removed the mint send site — zero injected sends; no raw-sign methods named');
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
    /* v37 (B-HM1/B-C1): the home view is the segment + timeline
       only — the composer moved into the compose sheet and the
       title bar / new-posts pill are gone. */
    ok(!home.includes('id="composerArea"') && home.includes('id="timeline"') && home.includes('class="ptabs segtabs"') &&
       !home.includes('id="pwallet"') && !home.includes('id="lookup"') && !home.includes('id="getname"') &&
       !home.includes('statsCardMain') && !home.includes('newPostsPill') && !home.includes('view-head'),
       label + ': the home view is the segment + timeline only (no composer, no stacked blocks)');
    ok(seg('id="viewWallet"', 'id="viewLookup"').includes('id="pwallet"') &&
       seg('id="viewWallet"', 'id="viewLookup"').includes('id="pwArea"'),
       label + ': the posting wallet lives inside the wallet view, not in the home flow');
    ok(seg('id="viewLookup"', 'id="viewGetname"').includes('id="lookup"'),
       label + ': the lookup block lives inside the lookup view');
    ok(seg('id="viewGetname"', '</main>').includes('id="getname"') &&
       seg('id="viewGetname"', '</main>').includes('id="gnWalletArea"') &&
       !seg('id="viewGetname"', '</main>').includes('id="myNames"') &&
       seg('id="viewNames"', '</main>').includes('id="namesArea"'),
       label + ': the mint lives inside the get-a-name view; my names is its own view since v33');
    ok(!html.includes('#pwallet') && !html.includes('#lookup') && !html.includes('#getname'),
       label + ': no link points at a stacked home block any more');
    ok((html.match(/\?wallet=1/g) || []).length >= 5 && html.includes('?lookup=1'),
       label + ': the wallet view opens from the summaries, both wallet rows and the tab bar; the lookup view has an entry too',
       'wallet links=' + (html.match(/\?wallet=1/g) || []).length);
    ok(/data-nav="mynames" href="[^"]*\?names=1"/.test(html),
       label + ': "My names" points at the names view in every state (v33: the screen itself carries the unlock wall / guide; v16–v32 defaulted to the wallet view)');
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
  ok(rule('.xact .xcount').includes('font-size: 12px'),
     'action counts sit next to the icon (never wrapped under it) — 12px since v37 (B-P1, the app\u2019s count size); was 13px');
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
  /* 3 — recaw anatomy (v16 stacked the attribution full-width;
     v37 (B-P3) restores the app's RecawCard: the recawer's
     avatar at the left, the attribution heading the body
     column — the row is the ordinary flex row again) */
  ok(!rule('.post.recaw-row').includes('flex-direction: column'),
     'recaw rows are flex rows again (avatar + body column, the app anatomy)');
  ok(/\.recaw-attr\s*\{[^}]*display:\s*flex/.test(css),
     'the attribution is a line of its own at the top of the body column');
  ok(recawSrc.includes('avatarHtml(img, name)'),
     'the recaw row renders the recawer\u2019s avatar (restored in v37; v16\u2013v36 dropped it)');
  ok(recawSrc.indexOf('recaw-attr') >= 0 && recawSrc.indexOf('recaw-attr') < recawSrc.indexOf('frameslot') &&
     recawSrc.indexOf('frameslot') < recawSrc.indexOf('recordLineHtml'),
     'recaw row order: attribution line, then the original, then the one record link');
  ok(rule('.post-nested {').includes('background: transparent'),
     'the nested original is transparent, so the SuperRecaw wash covers the whole row');
  /* 4 — the "@" lives on line 2 only */
  ok(viewerSrc.includes('const display = custom && custom.displayName ? custom.displayName : (name ? name : who);') &&
     viewerSrc.includes("esc('@' + name)"),
     'post header: line 1 is the display name as-is (v33: this device\'s custom display name wins when set), the "@" appears only on line 2');
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
  ok(viewerSrc.includes('const profTarget = pwProfileTarget(acting, !!pwSession);'),
     'profile rows route by state (v25): acting → own profile, nameless → name desk, locked → wallet + ?next=profile (v34: via pwProfileTarget)');
  ok(viewerSrc.includes("el.setAttribute('href', pageFile + '?names=1')"),
     'my-names rows land on the My names view in every state (v33; the screen carries the wall/guide itself)');
  ok(!viewerSrc.includes('prow.style.display') && !viewerSrc.includes("el.style.display = acting"),
     'syncChrome no longer hides the profile / my-names rows in any state');
}

console.log('— v17: tab bar order + the notifications view (reactions to your name) —');
{
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    const navStart = html.indexOf('<nav class="bottomnav"');
    const nav = html.slice(navStart, html.indexOf('</nav>', navStart));
    const order = ['home', 'search', 'reactions', 'profile'].map(k => nav.indexOf('data-nav="' + k + '"'));
    ok(order.every(i => i >= 0) && order.every((v, i) => i === 0 || v > order[i - 1]) && !nav.includes('data-nav="wallet"'),
       label + ': the tab bar is home / search / notifications / profile (v34 D23: the app set — the wallet tab is gone, profile last)');
    ok(!nav.includes('data-nav="bookmarks"'),
       label + ': bookmarks is NOT on the tab bar (its drawer / sidebar rows remain the entry)');
    ok(nav.includes('id="ntBadge"') && !nav.includes('id="ntDot"'), label + ': the notifications tab carries the unread-count badge element (v33, the dot is gone)');
    ok(html.includes('id="viewReactions"') && html.includes('id="ntList"') && !html.includes('id="ntMoreBtn"'),
       label + ': carries the reactions view (v33: the automatic since-last-open scan — no scan-further-back button)');
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
  ok(V.ntClassify(item({ type: 4, receiverId: me }), me, myPosts) === 'unfollow',
     'ntClassify: an unfollow of my name IS a reaction since v33 (M11 — the app lists it; v17–v32 excluded it)');
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
  ok(viewerSrc.includes("const NT_SEEN_KEY = 'caw-notif-seen-v1'") && viewerSrc.includes('ntSeenMark') &&
     viewerSrc.includes('ntScanInbox') && viewerSrc.includes('ntTapItems(page.items)'),
     'the unread badge is driven only by the real inbox scan against the stored last-seen position (v33: {block, index} mark, count badge)');
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
  ok(swJs.includes('caw-view-v40'), 'sw cache is caw-view-v40');
}

/* ---- v28: plain send out of the posting wallet ----
   v35 (M8) consciously supersedes this block's shape pins:
   the QL1-only card became the app's multi-chain send (the
   asset table is SEND_ASSETS now, the broadcast is the
   generalized sendChainTx — sendLocalTx remains its QL1
   case — the MAX button became the 25/50/75/MAX chips over
   sendMaxSendable, and the confirm title is the app's
   sendConfirmTitle). The invariants this block guarded —
   the card in the unlocked wallet, recipient validation,
   the confirm panel with the cannot-be-undone warning, the
   success record link — are re-pinned in the new shape. */
{
  const VS = read('../docs/viewer.js');
  const depIdx = VS.indexOf('id="pwDepCard"');
  const sendIdx = VS.indexOf('id="pwSendCard"');
  ok(sendIdx > 0 && depIdx > 0 && sendIdx > depIdx, 'send card renders in the unlocked wallet, below the deposit card');
  for (const id of ['pwSendToken', 'pwSendTo', 'pwSendAmount', 'pwSendBtn', 'pwSendStatus']) {
    ok(VS.includes('id="' + id + '"'), 'send card control #' + id + ' exists');
  }
  ok(VS.includes('SEND_ASSETS.filter(a => a.chain === c.key)'), 'send asset selector is built from the multi-chain asset table, grouped by chain');
  ok(VS.includes('/^0x[0-9a-fA-F]{40}$/.test(to)'), 'recipient address is validated before sending');
  const sendBody = VS.slice(VS.indexOf('async function pwDoSend()'), VS.indexOf('/* ----- v35 (M9): the faucet sheet'));
  ok(sendBody.includes('openConfirmPanel({') && sendBody.includes('T.sendConfirmTitle') && sendBody.includes('T.pwSendIrreversible'), 'send goes through the confirm panel with the cannot-be-undone warning');
  ok(sendBody.includes('sendChainTx(pwSession.keyBytes'), 'the send broadcasts through sendChainTx with the posting wallet key');
  ok(sendBody.includes('txLinkHtml(sentHash)'), 'send success shows the record link on the card');
  ok((VS.match(/pwSendTitle:/g) || []).length === 2 && (VS.match(/confirmTitleSend:/g) || []).length === 2, 'send strings exist in both languages');
}

/* ---- v29: the trade views unlock in place (no dead end) ---- */
{
  const VS = read('../docs/viewer.js');
  ok(!VS.includes('tradeUnlockedHtml'), 'v29: the dead-end tradeUnlockedHtml wall is gone');
  ok(VS.includes('function renderTradeWall(area, kind)'), 'v29: the trade wall is a renderer');
  ok(VS.includes("if (!pwSession) { renderTradeWall(area, 'dex'); return; }"), 'v29: the locked DEX view renders its wall');
  ok(VS.includes("if (!pwSession) { renderTradeWall(area, 'burnhawk'); return; }"), 'v29: the locked BurnHawk view renders its wall');
  ok(VS.includes("'?wallet=1&next=' + kind"), 'v29: the no-vault wall links to the wallet carrying ?next=<view>');
  const wallBody = VS.slice(VS.indexOf('function renderTradeWall(area, kind)'), VS.indexOf('const assetRowHtml'));
  ok(wallBody.includes('vaultDecrypt(pw, vaultLoad())') && wallBody.includes('await pwStartSession(secret, { adopt: true })'),
    'v29: the in-place unlock decrypts the vault and starts the session, like the wallet form (v34: the unlock also adopts a pre-v34 vault)');
  ok(wallBody.includes("if (kind === 'dex') loadDexView();") &&
     wallBody.includes("else if (kind === 'names') renderNamesScreen();") &&
     wallBody.includes("else if (kind === 'getname') { renderGetnameWallet(); renderMintArea(); }") &&
     wallBody.includes('else loadBurnView();'),
    'v29: after the in-place unlock, the view\u2019s own loader replaces the wall (v33: names + getname joined the wall family)');
  ok(wallBody.includes('esc(T.pwUnlockWrong)') && wallBody.includes("e.key === 'Enter'"),
    'v29: a wrong password is reported in place and Enter submits');
  ok(VS.includes("else if (nextQuery === 'dex') location.replace(pageFile + '?dex=1');"),
    'v29: pwStartSession continues to the DEX view for ?next=dex');
  ok(VS.includes("else if (nextQuery === 'burnhawk') location.replace(pageFile + '?burnhawk=1');"),
    'v29: pwStartSession continues to the BurnHawk view for ?next=burnhawk');
  ok((VS.match(/pwNextDex:/g) || []).length === 2 && (VS.match(/pwNextBurn:/g) || []).length === 2,
    'v29: the dex/burn continuation hints exist in both languages');
  ok(VS.includes("nextQuery === 'dex' ? '<p class=\"pw-next-hint\">' + esc(T.pwNextDex)") &&
     VS.includes("nextQuery === 'burnhawk' ? '<p class=\"pw-next-hint\">' + esc(T.pwNextBurn)"),
    'v29: the locked wallet view shows the dex/burn continuation hints');
  /* v30 supersedes the v29 "no sessionStorage anywhere" pin:
     the owner asked for the tab-scoped stored session — its
     pins live in the v30 block below. */

  /* behavioural: run the real wall renderer against a stub DOM */
  const mkEl = () => ({ innerHTML: '', value: '', disabled: false, listeners: {},
    addEventListener(k, f) { this.listeners[k] = f; } });
  const bootWall = vault => {
    const els = {}, calls = [];
    const $id = id => (els[id] = els[id] || mkEl());
    const renderTradeWall = new Function('$', 'esc', 'T', 'pageFile', 'vaultLoad', 'vaultDecrypt',
      'pwStartSession', 'syncChrome', 'renderComposer', 'loadDexView', 'loadBurnView',
      wallBody + '\nreturn renderTradeWall;')(
      $id, s => String(s),
      { tradeNeedUnlock: 'GUIDE', mirrorOpenWallet: 'WALLET', pwLockedText: 'LOCKED',
        pwPasswordPh: 'PW', pwUnlockBtn: 'UNLOCK', pwUnlockWrong: 'WRONG' },
      'en.html', () => vault,
      async pw => { if (pw !== 'hunter2') throw new Error('bad password'); return { kind: 'key', secret: 'S' }; },
      async () => { calls.push('session'); },
      () => {}, () => { calls.push('composer'); },
      () => { calls.push('dex'); }, () => { calls.push('burn'); });
    return { els, calls, renderTradeWall, area: mkEl() };
  };
  {
    const w = bootWall(null);
    w.renderTradeWall(w.area, 'dex');
    ok(w.area.innerHTML.includes('?wallet=1&next=dex') && !w.area.innerHTML.includes('UnlockPass'),
      'v29 behaviour: no vault -> the DEX wall is the guide + a ?next=dex wallet link, no form');
    const w2 = bootWall(null);
    w2.renderTradeWall(w2.area, 'burnhawk');
    ok(w2.area.innerHTML.includes('?wallet=1&next=burnhawk'),
      'v29 behaviour: no vault -> the BurnHawk wall links with ?next=burnhawk');
  }
  {
    const w = bootWall({ v: 1, salt: 's', iv: 'i', ct: 'c' });
    w.renderTradeWall(w.area, 'dex');
    ok(w.area.innerHTML.includes('id="dexUnlockPass"') && w.area.innerHTML.includes('id="dexUnlockBtn"'),
      'v29 behaviour: with a vault, the DEX wall renders its own unlock form');
    w.els.dexUnlockPass.value = 'nope';
    await w.els.dexUnlockBtn.onclick();
    ok(w.els.dexUnlockErr.innerHTML.includes('WRONG') && w.calls.length === 0,
      'v29 behaviour: a wrong password stays on the wall with the error shown');
    w.els.dexUnlockPass.value = 'hunter2';
    await w.els.dexUnlockBtn.onclick();
    ok(w.calls.join(',') === 'session,composer,dex',
      'v29 behaviour: the right password starts the session and the DEX panel replaces the wall');
  }
  {
    const w = bootWall({ v: 1, salt: 's', iv: 'i', ct: 'c' });
    w.renderTradeWall(w.area, 'burnhawk');
    ok(w.area.innerHTML.includes('id="burnUnlockPass"') && w.area.innerHTML.includes('id="burnUnlockBtn"'),
      'v29 behaviour: with a vault, the BurnHawk wall renders its own (burn-prefixed) unlock form');
    w.els.burnUnlockPass.value = 'hunter2';
    await w.els.burnUnlockPass.listeners.keydown({ key: 'Enter' });
    /* the Enter handler fires tryUnlock without returning its promise */
    await new Promise(r => setTimeout(r, 10));
    ok(w.calls.join(',') === 'session,composer,burn',
      'v29 behaviour: Enter submits, and the burn panel replaces the wall');
  }
}

/* ---- v30: tab-scoped session, reveal, one topbar logo ---- */
{
  const VS = read('../docs/viewer.js');
  const cssV30 = read('../docs/style.css');

  /* static pins: the stored-session model */
  ok(VS.includes("const PW_SESSION_KEY = 'caw-pw-session';"), 'v30: the one sessionStorage key exists');
  const persistBody = VS.slice(VS.indexOf('function pwPersistSession()'), VS.indexOf('function pwStoredSession()'));
  ok(persistBody.includes('sessionStorage.setItem(PW_SESSION_KEY') && persistBody.includes('touch: pwLastTouch'),
    'v30: the session persists to sessionStorage with its touch time');
  ok(!persistBody.includes('localStorage'), 'v30: the session persist never touches localStorage');
  ok(!VS.includes('localStorage.setItem(PW_SESSION_KEY'), 'v30: the session key is never written to localStorage');
  ok(VS.includes('const pwTouch = () => { pwLastTouch = Date.now(); pwPersistSession(); };'),
    'v30: every touch refreshes the stored session');
  const wipeBody = VS.slice(VS.indexOf('function pwWipeSession()'), VS.indexOf('function pwLock()'));
  ok(wipeBody.includes('pwForgetStoredSession();'), 'v30: wiping the session (any lock) forgets the stored copy');
  const startBody = VS.slice(VS.indexOf('async function pwStartSession('), VS.indexOf('async function pwRestoreSession()'));
  ok(startBody.includes('if (opts && opts.restored) return;') &&
     startBody.indexOf('if (opts && opts.restored) return;') < startBody.indexOf("nextQuery === 'profile'"),
    'v30: a restored session skips the ?next= continuations');
  const restoreBody = VS.slice(VS.indexOf('async function pwRestoreSession()'), VS.indexOf('function renderPwRemove'));
  ok(restoreBody.includes('vaultLoad()') && restoreBody.includes('Date.now() - stored.touch > 15 * 60 * 1000') &&
     restoreBody.includes('{ restored: true }') && restoreBody.includes('pwForgetStoredSession()'),
    'v30: restore requires the vault + the 15-minute window, marks itself restored, forgets the stale');
  ok(VS.includes('pwRestoreSession(); /* v30'), 'v30: boot attempts the restore');

  /* static pins: the reveal */
  const unlockedBody = VS.slice(VS.indexOf('function renderPwUnlocked(area)'), VS.indexOf('async function pwDoDepWd'));
  ok(unlockedBody.includes('id="pwRevealBtn"') && unlockedBody.includes('id="pwRevealArea"') &&
     unlockedBody.includes("renderPwReveal($('pwRevealArea'))"),
    'v30: the unlocked wallet carries the reveal button, its area and the wiring');
  const revealBody = VS.slice(VS.indexOf('function renderPwReveal(box)'), VS.indexOf('function renderPwUnlocked'));
  ok(revealBody.includes('vaultDecrypt(pw, vaultForAddress(pwSession.address) || vaultLoad())'),
    'v30: the reveal decrypts the vault fresh (v34: the SESSION wallet’s own vault — each wallet has its own password)');
  ok(!revealBody.includes('pwSession.secret') && !revealBody.includes('pwSession.keyBytes'),
    'v30: the reveal never reads the live session SECRET (v34: only its address picks which vault to open)');
  ok(revealBody.includes('navigator.clipboard.writeText(obj.secret)'),
    'v34 D17: the reveal Copy button copies the value just decrypted (obj), never a storage re-read');
  for (const k of ['pwRevealBtn', 'pwRevealTitle', 'pwRevealWarn', 'pwRevealHide', 'pwRevealKeyLbl']) {
    ok((VS.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v30: ' + k + ' exists in both languages');
  }

  /* static pins: one logo in the mobile topbar */
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    const mark = (html.match(/<div class="mt-mark">([\s\S]*?)<\/div>/) || [])[1] || '';
    ok(!mark.includes('<img') && mark.includes('>CAW<'),
      'v30: ' + label + ' topbar mark is the CAW wordmark only — one logo, not two');
    ok(html.includes('id="mtAvatar"><img'), 'v30: ' + label + ' drawer button keeps its avatar image');
  }
  ok(!cssV30.includes('.mt-mark img'), 'v30: the unused .mt-mark img rule is gone');

  /* behavioural: run the real wallet cluster + the real composer
     against a stub DOM, sharing one sessionStorage across boots
     (a boot = one full page load = one navigation). */
  const mkEl = () => ({ innerHTML: '', value: '', textContent: '', disabled: false, className: '',
    style: {}, dataset: {}, listeners: {},
    classList: { toggle() {}, add() {}, remove() {} },
    addEventListener(k, f) { this.listeners[k] = f; },
    before() {}, focus() {}, scrollIntoView() {},
    querySelector() { return mkEl(); }, querySelectorAll() { return []; } });
  const mkStorage = () => {
    const m = new Map();
    return { getItem: k => (m.has(k) ? m.get(k) : null),
      setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  };
  const clusterSrc =
    VS.slice(VS.indexOf('let pwSession = null;'), VS.indexOf('function renderPwRemove')) +
    VS.slice(VS.indexOf('function renderComposer() {'), VS.indexOf('/* ----- action buttons on post cards'));
  const HK_ADDR = (await V.deriveFromPhrase(HK_PHRASE)).address;
  const HK_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const bootCluster = ({ sessionStore, vault, next = null, dex = null }) => {
    const els = {}, calls = [], bodyCls = {}, probe = {}, holder = { api: null };
    const $id = id => (els[id] = els[id] || mkEl());
    const doc = { body: { classList: { toggle: (c, on) => { bodyCls[c] = !!on; } } },
      createElement: () => mkEl() };
    const T = { pwLockedTitle: 'LT', pwLockedText: 'LX', pwPasswordPh: 'PW', pwUnlockBtn: 'UNLOCK',
      pwRemoveBtn: 'RM', pwUnlockWrong: 'WRONG', compHintLocked: 'HINT', compHintSetupBtn: 'SETUP',
      compHintNoName: 'NONAME', pwNameBalanceLbl: 'BAL', compZeroBalance: 'ZERO', compPh: 'PH',
      compPostBtn: 'POST', compBytes: '{n}', attachLbl: 'ATTACH' };
    const api = new Function('$', 'document', 'localStorage', 'sessionStorage', 'location',
      'pageFile', 'profUrl', 'esc', 'T', 'nextQuery', 'postQuery', 'profileQuery', 'bmQuery',
      'reactionsQuery', 'mirrorQuery', 'searchQuery', 'dexQuery', 'burnQuery',
      'vaultLoad', 'vaultDecrypt', 'vaultEncrypt', 'vaultSave', 'hexToBytesU', 'deriveFromPhrase',
      'addressOfPriv', 'tokensOf', 'ownerTokensCache', 'syncChrome', 'renderPwUnlocked', 'ntBadgeSet',
      'ntRefreshBadge', 'renderNamesScreen', 'renderGetnameWallet', 'renderMintArea', 'namesQuery', 'getnameQuery',
      'loadPostPage', 'loadProfile', 'loadBookmarksView', 'loadReactionsView', 'loadMirrorView',
      'loadDexView', 'loadBurnView', 'loadTimeline', 'refreshHomeFeed', 'avatarFor', 'avatarHtml', 'fmtQcaw', 'textBytes',
      'pendingComposeRef', 'composerRef', 'compDraft', 'compFiles', 'mirrorNotice',
      'compDraftFor', 'compDraftRestored', 'compDraftTimer', 'compPrepping', 'compFrag',
      'compDirState', 'compNoteState', 'composeHomeSlot',
      /* v34: the registry surface the cluster now calls —
         inert stubs: no persisted registry in this sandbox, so
         the restore gate answers 'unknown' (storage absent) */
      'walletsLoad', 'walletsTargetAddress', 'walletsSetActive', 'walletsEntryFor',
      'pwAdoptLegacyWallet', 'pwSetUnlockTarget', 'walletsAdd', 'privateKeyToAddress',
      'generateMnemonic', 'walletShortLabel', 'walletKindLabel',
      clusterSrc + '\nreturn { pwStartSession, pwRestoreSession, pwLock, pwUnlocked };')(
      $id, doc, mkStorage(), sessionStore,
      { replace: u => calls.push('replace:' + u), href: '' },
      'en.html', n => 'en.html?name=' + n, s => String(s), T,
      next, undefined, undefined, undefined, undefined, undefined, undefined, dex, undefined,
      () => vault, async () => { throw new Error('unused'); }, async () => ({}), () => {},
      h => new Uint8Array((String(h).replace(/^0x/, '').match(/../g) || []).map(x => parseInt(x, 16))),
      V.deriveFromPhrase, V.addressOfPriv,
      async () => [{ id: 7n, balance: 100n, username: 'neptune' }], new Map(),
      () => calls.push('chrome'), () => calls.push('pwUnlocked'), () => {},
      () => {}, () => {}, () => {}, () => {}, undefined, undefined,
      () => calls.push('post'), () => calls.push('profile'), () => calls.push('bm'),
      () => calls.push('reactions'), () => calls.push('mirror'),
      () => { calls.push('dex'); probe.unlockedAtDex = holder.api ? holder.api.pwUnlocked() : null; },
      () => calls.push('burn'), () => calls.push('timeline'), () => calls.push('timeline'),
      async () => null, () => '', x => String(x), V.textBytes,
      null, null, '', [], '',
      null, false, null, false, null, null, '', null,
      () => ({ active: null, wallets: [] }), () => null, () => {}, () => 'unknown',
      async () => false, () => {}, () => {}, V.privateKeyToAddress,
      async () => HK_PHRASE, () => 'WALLET', () => '');
    holder.api = api;
    return { api, els, calls, bodyCls, probe };
  };
  {
    const ss = mkStorage();
    const b1 = bootCluster({ sessionStore: ss, vault: { v: 1 } });
    await b1.api.pwStartSession({ kind: 'phrase', secret: HK_PHRASE });
    ok(b1.api.pwUnlocked(), 'v30 behaviour: the unlock starts the session');
    const saved = JSON.parse(ss.getItem('caw-pw-session') || 'null');
    ok(saved && saved.kind === 'phrase' && saved.secret === HK_PHRASE &&
       saved.address === HK_ADDR && typeof saved.touch === 'number',
      'v30 behaviour: the session is saved to sessionStorage with a touch timestamp');
    /* the reported bug, fixed: unlock on the wallet view, then
       navigate home — the composer must be the real card */
    const b2 = bootCluster({ sessionStore: ss, vault: { v: 1 }, next: 'profile' });
    await b2.api.pwRestoreSession();
    ok(b2.api.pwUnlocked(), 'v30 behaviour: a fresh boot restores the session without a password');
    ok(!b2.calls.some(c => c.startsWith('replace:')),
      'v30 behaviour: restore never takes the ?next= continuation');
    ok(b2.els.composerArea.innerHTML.includes('composer-card') &&
       b2.els.composerArea.innerHTML.includes('id="compText"') &&
       !b2.els.composerArea.innerHTML.includes('composer-hint'),
      'v30 behaviour: the restored home view renders the real composer card, not the locked hint');
    ok(b2.bodyCls['can-compose'] === true, 'v30 behaviour: body carries can-compose after restore');
    /* and on the DEX view the loader re-runs with the session
       live, so the panel (not the wall) renders */
    const b3 = bootCluster({ sessionStore: ss, vault: { v: 1 }, dex: '1' });
    await b3.api.pwRestoreSession();
    ok(b3.calls.includes('dex') && b3.probe.unlockedAtDex === true,
      'v30 behaviour: on the DEX view the restored session re-runs the loader unlocked (panel, not wall)');
  }
  {
    const ssK = mkStorage();
    ssK.setItem('caw-pw-session', JSON.stringify({ kind: 'key', secret: HK_KEY, address: HK_ADDR, touch: Date.now() }));
    const bK = bootCluster({ sessionStore: ssK, vault: { v: 1 } });
    await bK.api.pwRestoreSession();
    ok(bK.api.pwUnlocked(), 'v30 behaviour: a stored private-key session restores too');
  }
  {
    const ss2 = mkStorage();
    ss2.setItem('caw-pw-session', JSON.stringify({ kind: 'phrase', secret: HK_PHRASE, address: HK_ADDR, touch: Date.now() - 16 * 60 * 1000 }));
    const b4 = bootCluster({ sessionStore: ss2, vault: { v: 1 } });
    await b4.api.pwRestoreSession();
    ok(!b4.api.pwUnlocked() && ss2.getItem('caw-pw-session') === null,
      'v30 behaviour: a session older than 15 idle minutes is dropped');
    const ss3 = mkStorage();
    ss3.setItem('caw-pw-session', JSON.stringify({ kind: 'phrase', secret: HK_PHRASE, address: HK_ADDR, touch: Date.now() }));
    const b5 = bootCluster({ sessionStore: ss3, vault: null });
    await b5.api.pwRestoreSession();
    ok(!b5.api.pwUnlocked() && ss3.getItem('caw-pw-session') === null,
      'v30 behaviour: a stored session is dropped when the vault is gone');
  }
  {
    const ss4 = mkStorage();
    const b6 = bootCluster({ sessionStore: ss4, vault: { v: 1 } });
    await b6.api.pwStartSession({ kind: 'phrase', secret: HK_PHRASE });
    ok(ss4.getItem('caw-pw-session') !== null, 'v30 behaviour: the session is stored before the lock');
    b6.api.pwLock();
    ok(!b6.api.pwUnlocked() && ss4.getItem('caw-pw-session') === null,
      'v30 behaviour: locking clears the stored session');
  }

  /* behavioural: the reveal, run against a stub DOM */
  const mkReveal = ret => {
    const els = {};
    const $id = id => (els[id] = els[id] || mkEl());
    const clip = { written: null };
    const renderPwReveal = new Function('$', 'esc', 'T', 'vaultLoad', 'vaultDecrypt',
      'vaultForAddress', 'pwSession', 'navigator',
      revealBody + '\nreturn renderPwReveal;')(
      $id, s => String(s),
      { pwRevealTitle: 'TITLE', pwRevealWarn: 'WARN', pwRevealBtn: 'SHOW', pwRevealHide: 'HIDE',
        pwRevealKeyLbl: 'KEYLBL', pwPasswordPh: 'PWPH', pwUnlockWrong: 'WRONG', pwCancelBtn: 'CANCEL',
        pwRevealCopy: 'COPY', copied: 'COPIED!' },
      () => ({ v: 1 }),
      async pw => { if (pw !== 'hunter2') throw new Error('bad password'); return ret; },
      () => ({ v: 1, own: true }),
      { address: '0x00000000000000000000000000000000000000aa' },
      { clipboard: { writeText: async t => { clip.written = t; } } });
    return { els, renderPwReveal, box: mkEl(), clip };
  };
  {
    const r = mkReveal({ kind: 'phrase', secret: 'alpha bravo charlie' });
    r.renderPwReveal(r.box);
    ok(r.box.innerHTML.includes('id="pwRevealPass"'), 'v30 behaviour: the reveal asks for the password first');
    r.els.pwRevealPass.value = 'nope';
    await r.els.pwRevealGo.onclick();
    ok(r.els.pwRevealErr.innerHTML.includes('WRONG') && !r.box.innerHTML.includes('alpha'),
      'v30 behaviour: a wrong password reveals nothing');
    r.els.pwRevealPass.value = 'hunter2';
    await r.els.pwRevealGo.onclick();
    ok(r.box.innerHTML.includes('phrase-grid') && r.box.innerHTML.includes('alpha') &&
       r.box.innerHTML.includes('charlie'),
      'v30 behaviour: the right password shows the freshly decrypted phrase');
    /* v34 (D17): Copy hands the clipboard the very value shown */
    await r.els.pwRevealCopy.onclick({ target: r.els.pwRevealCopy });
    ok(r.clip.written === 'alpha bravo charlie' && r.els.pwRevealCopy.textContent === 'COPIED!',
      'v34 D17 behaviour: reveal Copy copies the decrypted phrase (space-joined) with copied feedback');
    r.els.pwRevealHide.onclick();
    ok(r.box.innerHTML === '', 'v30 behaviour: Hide clears the reveal');
  }
  {
    const r = mkReveal({ kind: 'key', secret: '0x' + 'ab'.repeat(32) });
    r.renderPwReveal(r.box);
    r.els.pwRevealPass.value = 'hunter2';
    await r.els.pwRevealGo.onclick();
    ok(r.box.innerHTML.includes('pw-key') && r.box.innerHTML.includes('KEYLBL') &&
       r.box.innerHTML.includes('0x' + 'ab'.repeat(32)),
      'v30 behaviour: a key wallet reveals the private key, labelled');
  }
}

/* ---- v31: Following segment + Tip (app-parity batch 1) ---- */
{
  const VS = read('../docs/viewer.js');
  const E18 = 10n ** 18n;

  /* static pins: shells */
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    for (const id of ['feedTabLatest', 'feedTabFollowing', 'followingArea', 'followingFeed', 'followingMoreBtn']) {
      ok(html.includes('id="' + id + '"'), 'v31: ' + label + ' carries the Following segment control #' + id);
    }
    for (const id of ['tipOverlay', 'tipTitle', 'tipBody', 'tipToLine', 'tipBalLine', 'tipPresets',
                      'tipCustomArea', 'tipAmount', 'tipPctChips', 'tipErr', 'tipSendBtn', 'tipCancelBtn']) {
      ok(html.includes('id="' + id + '"'), 'v31: ' + label + ' carries the tip sheet control #' + id);
    }
  }

  /* static pins: strings in both dicts */
  for (const k of ['tabLatest', 'tabFollowing', 'followingEmpty', 'followingNeedWallet', 'followingNeedName',
                   'tipBtn', 'tipTitle', 'tipBody', 'tipBalance', 'tipCustom', 'tipOver', 'tipSend',
                   'tipTo', 'tipMismatch', 'tipDone', 'tipSelf', 'tipShortfall']) {
    ok((VS.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v31: ' + k + ' exists in both languages');
  }

  /* static pins: the tip button's place in the action row */
  const cardBody = VS.slice(VS.indexOf('async function postCard('), VS.indexOf('async function recawCard('));
  const iSuper = cardBody.indexOf('data-act="super"'), iTip = cardBody.indexOf('data-act="tip"'),
        iBm = cardBody.indexOf('data-act="bookmark"');
  ok(iSuper >= 0 && iTip > iSuper && iBm > iTip,
    'v31: the tip button sits in the app order — after SuperLike, before bookmark');
  ok(cardBody.includes('IC_COIN') && cardBody.includes('opts.noTip'),
    'v31: the tip button uses the coin glyph and honours the noTip opt-out');
  const bmBody = VS.slice(VS.indexOf('async function loadBookmarksView()'), VS.indexOf('/* ---------- notifications'));
  ok(bmBody.includes('postCard(post, { noTip: true, noActions: true })'),
    'v31/v35: the bookmarks view leaves tip (v31) and like/Recaw/SuperLike (v35 D13) unwired, like the app');
  const wireBody = VS.slice(VS.indexOf('function wireRowActions('), VS.indexOf('/* The Recaw choice sheet'));
  ok(wireBody.includes("btn('tip')") && wireBody.includes('onTipTap(a)'),
    'v31: the action row wires the tip tap');

  /* static pins: the Following feed */
  ok(VS.includes('function switchFeedMode(') && VS.includes('function setupFollowing()') &&
     VS.includes('async function loadFollowing(append)') && VS.includes('function refreshHomeFeed()'),
    'v31: the Following segment + walk + home refresh exist');
  const refreshBody = VS.slice(VS.indexOf('function refreshViewsForWallet()'), VS.indexOf('async function pwLoadNames()'));
  ok(refreshBody.includes('else refreshHomeFeed();'),
    'v31: wallet-state changes refresh the active home segment');
  const setupBody = VS.slice(VS.indexOf('async function setupFollowing()'), VS.indexOf('async function loadFollowing(append)'));
  ok(setupBody.includes('T.followingNeedWallet') && setupBody.includes('T.followingNeedName'),
    'v31: locked / nameless Following states are guides, not a fake feed');
  ok(setupBody.includes('buildFollowIndex(') && setupBody.includes('T.followBuilding'),
    'v31: the follow-index build shows its real page-count progress');
  ok(setupBody.includes('refinedFollowListsOf(acting.id)'),
    'v31: the follow set comes from the refined follow-index lists');
  const walkBody = VS.slice(VS.indexOf('async function loadFollowing(append)'), VS.indexOf('/* Wallet-state changes refresh'));
  ok(walkBody.includes('folFeedItem(a, folSet)') && walkBody.includes('pages < 25') && walkBody.includes('rendered >= 8'),
    'v31: the Following walk filters by the follow set, 25 pages per chunk until >= 8 matches (the app rule)');
  ok(walkBody.includes('T.followingEmpty'), 'v31: an exhausted walk with no matches shows the empty state');

  /* static pins: the Tip flow */
  ok(VS.includes('function openTipSheet(a)') && VS.includes('async function openTipConfirm(a, amountRaw)') &&
     VS.includes('function onTipTap(a)'), 'v31: the tip sheet + confirm flow exist');
  const tapBody = VS.slice(VS.indexOf('function onTipTap(a)'), VS.indexOf('/* ----- painting the marks'));
  ok(tapBody.includes('pwNames.some(') && tapBody.includes('T.tipSelf'),
    'v31: a post by one of my names is blocked at tap time (the app treatment)');
  const confirmBody = VS.slice(VS.indexOf('async function openTipConfirm(a, amountRaw)'), VS.indexOf('function onTipTap(a)'));
  ok((confirmBody.match(/nameOwnerOf\(a\.senderId\)/g) || []).length >= 2,
    'v31: the recipient is re-resolved for the panel AND again inside the send');
  ok(confirmBody.includes("throw new Error('tip-mismatch')") && confirmBody.includes("throw new Error('self-tip')") &&
     confirmBody.includes("throw new Error('shortfall-tip')"),
    'v31: the send refuses on recipient disagreement, self-tip and shortfall');
  ok(confirmBody.includes('sendLocalTx(pwSession.keyBytes, { to: PHOENIX_TOKEN, data: buildTransferData(fresh, amountRaw), gasFallback: 60000 })'),
    'v31: the tip is a plain PHOENIX transfer through sendLocalTx + buildTransferData');
  const errBody = VS.slice(VS.indexOf('function confirmErrHtml(e)'), VS.indexOf('/* ================= v22'));
  ok(errBody.includes("e.message === 'self-tip'") && errBody.includes("e.message === 'tip-mismatch'") &&
     errBody.includes("e.message === 'shortfall-tip'"),
    'v31: the confirm panel words the tip outcomes with the app strings');
  const sheetBody = VS.slice(VS.indexOf('function openTipSheet(a)'), VS.indexOf('async function openTipConfirm(a, amountRaw)'));
  ok(sheetBody.includes('TIP_PRESETS.map(') && sheetBody.includes("data-tippreset=\"custom\"") &&
     sheetBody.includes("pctChipsHtml('tipchip')") && sheetBody.includes('tipChipAmount('),
    'v31: the sheet renders the presets + custom chip and the % chips from the shared helpers');
  ok(sheetBody.includes("'<b>' + esc(to.slice(-4)) + '</b>'"),
    'v31: the sheet spot-check line emphasises the recipient last four');

  /* unit checks: the exported money / filter rules (the app's lib/tip.ts) */
  ok(JSON.stringify(V.TIP_PRESETS) === '[10,50,100]', 'v31: TIP_PRESETS are 10 / 50 / 100 PHOENIX');
  ok(V.tipPresetRaw(10) === 10n * E18 && V.tipPresetRaw(50) === 50n * E18 && V.tipPresetRaw(100) === 100n * E18,
    'v31: preset raw amounts are whole PHOENIX at 18 decimals');
  ok(V.parseTipAmount('10') === 10n * E18 && V.parseTipAmount('0.5') === 5n * 10n ** 17n &&
     V.parseTipAmount('1.123456789012345678') === 1123456789012345678n,
    'v31: custom tip amounts parse at 18 decimals');
  ok(V.parseTipAmount('0') === null && V.parseTipAmount('-1') === null && V.parseTipAmount('abc') === null &&
     V.parseTipAmount('') === null && V.parseTipAmount('1.1234567890123456789') === null,
    'v31: non-positive / malformed tip amounts are refused');
  ok(V.tipChipAmount(1000n * E18, 25) === 250n * E18 && V.tipChipAmount(1000n * E18, 50) === 500n * E18 &&
     V.tipChipAmount(1000n * E18, 75) === 750n * E18 && V.tipChipAmount(1000n * E18, 100) === 1000n * E18 &&
     V.tipChipAmount(101n, 50) === 50n,
    'v31: balance chips take 25 / 50 / 75 / MAX of the balance (MAX = the whole balance, floored otherwise)');
  ok(V.tipShortfall(100n, 101n) === true && V.tipShortfall(100n, 100n) === false && V.tipShortfall(101n, 100n) === false,
    'v31: the shortfall rule is balance < amount');
  const ME = '0xAaAa00000000000000000000000000000000bBbB', OTHER = '0x1111111111111111111111111111111111111111';
  ok(V.tipBlockReason({ senderId: 5n, myTokenIds: [3n, 5n], authorOwner: OTHER, myAddress: ME }) === 'self',
    'v31: a post by one of my names blocks the tip');
  ok(V.tipBlockReason({ senderId: 5n, myTokenIds: [], authorOwner: ME.toLowerCase(), myAddress: ME }) === 'self',
    'v31: a post whose author owner is my address blocks the tip (case-insensitive)');
  ok(V.tipBlockReason({ senderId: 5n, myTokenIds: [3n], authorOwner: OTHER, myAddress: ME }) === null,
    'v31: someone else\'s post may be tipped');
  const fset = new Set(['11', '22']);
  ok(V.folFeedItem({ type: 0, senderId: 11n }, fset) === true && V.folFeedItem({ type: 2, senderId: 22n }, fset) === true,
    'v31: the Following filter keeps followed posts + Recaws');
  ok(V.folFeedItem({ type: 1, senderId: 11n }, fset) === false && V.folFeedItem({ type: 3, senderId: 11n }, fset) === false &&
     V.folFeedItem({ type: 0, senderId: 99n }, fset) === false && V.folFeedItem({ type: 0, senderId: 11n }, null) === false,
    'v31: the Following filter drops likes, follow rows, unfollowed authors and a missing set');
  const deadBal = await V.phoenixBalanceOf('0x000000000000000000000000000000000000dEaD');
  ok(typeof deadBal === 'bigint' && deadBal >= 0n, 'v31: phoenixBalanceOf reads the live PHOENIX balanceOf');

  /* behavioural: the Following segment + walk against a stub DOM */
  const folSrc = VS.slice(VS.indexOf("let tlMode = 'latest';"), VS.indexOf('/* ---------- "CAW right now" stats card'));
  const mkFolEl = () => {
    const el = { textContent: '', value: '', disabled: false, dataset: {}, children: [],
      className: '', parentElement: null, style: {}, _html: '',
      classList: { _s: new Set(),
        toggle(c, on) { if (on) this._s.add(c); else this._s.delete(c); },
        contains(c) { return this._s.has(c); } },
      appendChild(ch) { this.children.push(ch); ch.parentElement = this; return ch; },
      querySelector() { return this.children.find(c => c.className === 'post') || null; } };
    Object.defineProperty(el, 'innerHTML', {
      get() { return this._html; },
      set(v) { this._html = String(v); this.children = []; },
    });
    return el;
  };
  const bootFol = ({ session, acting, lists, pages }) => {
    const els = {};
    const $id = id => (els[id] = els[id] || mkFolEl());
    $id('moreBtn').parentElement = mkFolEl();
    let pageIdx = 0;
    const api = new Function('$', 'document', 'esc', 'T', 'pageFile', 'pwSession', 'pwActing',
      'skeletonHtml', 'feedLoadingHtml', 'emptyCardHtml', 'fetchPage', 'ntTapItems', 'rowFor', 'hydrateAttachmentsIn',
      'followBuildState', 'buildFollowIndex', 'refinedFollowListsOf', 'followListsOf', 'folFeedItem',
      'modFilterItems', 'modHidden', 'modIsAdmin',
      'loadTimeline',
      folSrc + '\nreturn { switchFeedMode, setupFollowing, loadFollowing, mode: () => tlMode };')(
      $id, { createElement: () => mkFolEl() }, s => String(s),
      { followingNeedWallet: 'NEEDWALLET', followingNeedName: 'NEEDNAME', followingEmpty: 'FOLLOWINGEMPTY',
        followBuilding: 'Reading… {n} pages', ntOpenWallet: 'OPENWALLET', navGetName: 'GETNAME',
        loadFail: 'LOADFAIL', retryBtn: 'RETRY' },
      'en.html', session, acting,
      () => 'SKEL', () => 'LOADING', t => 'EMPTYCARD', async () => pages[Math.min(pageIdx++, pages.length - 1)], () => {},
      async a => { const d = mkFolEl(); d.className = 'post'; d.dataset.cawid = a.cawId; return d; },
      async () => {}, () => ({ complete: true, pages: 0, walking: false, pairs: 0 }),
      async () => ({ complete: true }), async () => lists, () => lists, V.folFeedItem,
      V.modFilterItems, new Set(), () => false, () => {});
    return { api, els };
  };
  const tick = () => new Promise(r => setTimeout(r, 25));
  {
    const f = bootFol({ session: null, acting: () => null, lists: { following: [], followers: [] }, pages: [{ items: [], next: null }] });
    f.api.switchFeedMode('following');
    ok(f.api.mode() === 'following' && f.els.timeline.style.display === 'none' &&
       f.els.followingArea.style.display === '' && f.els.feedTabFollowing.classList.contains('on'),
      'v31 behaviour: switching to Following hides Latest and lights the segment');
    ok(f.els.followingFeed.innerHTML.includes('NEEDWALLET') && f.els.followingFeed.innerHTML.includes('?wallet=1'),
      'v31 behaviour: locked Following is the wallet guide, never a fake feed');
    f.api.switchFeedMode('latest');
    ok(f.els.timeline.style.display === '' && f.els.followingArea.style.display === 'none',
      'v31 behaviour: switching back restores Latest in place');
  }
  {
    const f = bootFol({ session: { address: ME }, acting: () => null, lists: { following: [], followers: [] }, pages: [{ items: [], next: null }] });
    f.api.switchFeedMode('following');
    ok(f.els.followingFeed.innerHTML.includes('NEEDNAME') && f.els.followingFeed.innerHTML.includes('?getname=1'),
      'v31 behaviour: an unlocked wallet with no name gets the get-a-name guide');
  }
  {
    const f = bootFol({ session: { address: ME }, acting: () => ({ id: 7n, username: 'me' }),
      lists: { following: [], followers: [] }, pages: [{ items: [], next: null }] });
    f.api.switchFeedMode('following');
    await tick();
    ok(f.els.followingFeed.innerHTML.includes('FOLLOWINGEMPTY') && f.els.followingMoreBtn.style.display === 'none',
      'v31 behaviour: an acting name that follows nobody gets the explicit empty state');
  }
  {
    const post = (sid, id) => ({ type: 0, senderId: sid, cawId: '0x' + id });
    const pages = [
      { items: [post(11n, 'a1'), { type: 1, senderId: 11n, cawId: '0xl1' }, post(99n, 'b1'),
                { type: 3, senderId: 11n, cawId: '0xf1' }, { type: 2, senderId: 22n, cawId: '0xr1' }],
        next: { p: 2 } },
      { items: [post(22n, 'c1'), post(22n, 'c2'), post(22n, 'c3'), post(22n, 'c4'),
                post(22n, 'c5'), post(22n, 'c6'), post(22n, 'c7')], next: { p: 3 } },
      { items: [post(11n, 'd1')], next: null },
    ];
    const f = bootFol({ session: { address: ME }, acting: () => ({ id: 7n, username: 'me' }),
      lists: { following: [11n, 22n], followers: [] }, pages });
    f.api.switchFeedMode('following');
    await tick();
    const ids1 = f.els.followingFeed.children.filter(c => c.className === 'post').map(c => c.dataset.cawid);
    ok(JSON.stringify(ids1) === JSON.stringify(['0xa1', '0xr1', '0xc1', '0xc2', '0xc3', '0xc4', '0xc5', '0xc6', '0xc7']),
      'v31 behaviour: the walk keeps only followed posts + Recaws and stops a chunk at >= 8 matches');
    ok(f.els.followingMoreBtn.style.display === '', 'v31 behaviour: more remains while the feed is not exhausted');
    await f.api.loadFollowing(true);
    const ids2 = f.els.followingFeed.children.filter(c => c.className === 'post').map(c => c.dataset.cawid);
    ok(ids2.length === 10 && ids2[9] === '0xd1' && f.els.followingMoreBtn.style.display === 'none',
      'v31 behaviour: See more continues the walk to the end of the feed');
  }

  /* behavioural: the tip sheet + confirm flow against a stub DOM */
  const tipSrc = VS.slice(VS.indexOf('let tipState = null;'), VS.indexOf('/* ----- painting the marks'));
  const OWNER = '0x1234567890AbcdEF1234567890abcdef12345678';
  const bootTip = ({ names, ownerSeq, balance }) => {
    const els = {}, captured = { confirms: [], messages: [], sends: [], ownerCalls: 0 };
    const mkEl = () => ({ innerHTML: '', textContent: '', value: '', disabled: false, style: {},
      onclick: null, oninput: null, classList: { toggle() {} } });
    const $id = id => (els[id] = els[id] || mkEl());
    const chip = v => ({ _v: v, onclick: null, getAttribute() { return this._v; }, classList: { toggle() {} } });
    const chips = { '#tipPresets [data-tippreset]': ['10', '50', '100', 'custom'].map(chip),
                    '#tipPctChips [data-tipchip]': ['25', '50', '75', '100'].map(chip) };
    const doc = { querySelectorAll: sel => chips[sel] || [] };
    const api = new Function('$', 'document', 'esc', 'T', 'TIP_PRESETS', 'tipPresetRaw', 'parseTipAmount',
      'tipChipAmount', 'tipShortfall', 'tipBlockReason', 'pctChipsHtml', 'rawToInputStr', 'resolveName',
      'nameOwnerOf', 'phoenixBalanceOf', 'postTargetLabel', 'openConfirmPanel', 'openMessagePanel',
      'pwSession', 'pwNames', 'pwTouch', 'sendLocalTx', 'buildTransferData', 'PHOENIX_TOKEN', 'fmtAmt',
      'shortAddr', 'scrollToWallet',
      tipSrc + '\nreturn { onTipTap, openTipSheet, tipAmountRaw, state: () => tipState };')(
      $id, doc, s => String(s),
      { tipTitle: 'TIPTITLE', tipBody: 'Send PHOENIX to {name}.', tipBalance: 'Balance: {balance}',
        tipCustom: 'CUSTOM', tipOver: 'OVER', tipSend: 'SENDTIP', tipTo: 'SENDTO', tipMismatch: 'MISMATCH',
        tipDone: 'TIPDONE', tipSelf: 'SELF', tipShortfall: 'SHORTFALL', unknownName: 'name #',
        slTarget: 'POST', confirmAmountLbl: 'AMOUNT', confirmCancelBtn: 'CANCEL', actFail: 'FAIL' },
      V.TIP_PRESETS, V.tipPresetRaw, V.parseTipAmount, V.tipChipAmount, V.tipShortfall, V.tipBlockReason,
      () => 'PCTHTML',
      (raw, dec) => { const s = BigInt(raw).toString().padStart(dec + 1, '0');
        const w = s.slice(0, -dec), fr = s.slice(-dec).replace(/0+$/, ''); return fr ? w + '.' + fr : w; },
      async () => 'alice',
      async () => ownerSeq[Math.min(captured.ownerCalls++, ownerSeq.length - 1)],
      async () => balance,
      async () => '@alice — hello',
      opts => { captured.confirms.push(opts); },
      (title, lines, err) => { captured.messages.push({ title, lines, err }); },
      { address: ME, keyBytes: new Uint8Array([7]) }, names, () => {},
      async (kb, o) => { captured.sends.push(o); return { hash: '0xhash' }; },
      V.buildTransferData, V.PHOENIX_TOKEN, V.fmtAmt,
      a => a.slice(0, 6) + '…' + a.slice(-4), () => {});
    return { api, els, captured, chips };
  };
  const post9 = { senderId: 9n, cawId: '0x' + 'ab'.repeat(32), text: 'hello' };
  {
    const t = bootTip({ names: [{ id: 9n }], ownerSeq: [OWNER], balance: 1000n * E18 });
    t.api.onTipTap(post9);
    await tick();
    ok(t.captured.messages.length === 1 && t.captured.messages[0].err === 'SELF' &&
       (!t.els.tipOverlay || t.els.tipOverlay.style.display !== ''),
      'v31 behaviour: tapping Tip on my own name\'s post shows the self message and never opens the sheet');
  }
  {
    const t = bootTip({ names: [], ownerSeq: [OWNER], balance: 1000n * E18 });
    t.api.onTipTap(post9);
    await tick();
    ok(t.els.tipOverlay.style.display === '' && t.api.state() && t.api.state().preset === 10 &&
       t.api.tipAmountRaw() === 10n * E18,
      'v31 behaviour: the sheet opens on the first preset (10 PHOENIX)');
    ok(t.els.tipToLine.innerHTML.includes('<b>5678</b>') && t.els.tipToLine.innerHTML.includes('0x1234…'),
      'v31 behaviour: the recipient line shows the short address with the last four emphasised');
    ok(t.els.tipBalLine.textContent.includes('1,000'), 'v31 behaviour: the balance line shows my PHOENIX balance');
    t.chips['#tipPresets [data-tippreset]'][3].onclick(); /* Custom */
    t.els.tipAmount.value = '2.5';
    t.els.tipAmount.oninput();
    ok(t.api.tipAmountRaw() === 25n * 10n ** 17n, 'v31 behaviour: a custom amount parses from the input');
    t.chips['#tipPctChips [data-tipchip]'][1].onclick(); /* 50% */
    ok(t.els.tipAmount.value === '500' && t.api.tipAmountRaw() === 500n * E18,
      'v31 behaviour: the 50% chip fills half the balance');
    t.els.tipAmount.value = '2000';
    t.els.tipAmount.oninput();
    ok(t.els.tipErr.innerHTML.includes('OVER') && t.els.tipSendBtn.disabled === true,
      'v31 behaviour: over-balance shows the error and disables Send');
    t.els.tipAmount.value = '50';
    t.els.tipAmount.oninput();
    ok(t.els.tipSendBtn.disabled === false, 'v31 behaviour: a valid amount re-enables Send');
    t.els.tipSendBtn.onclick();
    await tick();
    ok(t.els.tipOverlay.style.display === 'none' && t.captured.confirms.length === 1,
      'v31 behaviour: Send closes the sheet into the confirm panel');
    const lines = t.captured.confirms[0].lines.map(l => l.join('=')).join('|');
    ok(lines.includes('50 PHOENIX') && lines.includes('0x1234…5678'),
      'v31 behaviour: the panel shows the amount and the resolved recipient');
    ok(t.captured.ownerCalls === 2, 'v31 behaviour: the recipient was resolved for the sheet and re-resolved for the panel');
    await t.captured.confirms[0].onSign();
    ok(t.captured.ownerCalls === 3 && t.captured.sends.length === 1 &&
       t.captured.sends[0].to === V.PHOENIX_TOKEN &&
       t.captured.sends[0].data === V.buildTransferData(OWNER, 50n * E18) &&
       t.captured.sends[0].gasFallback === 60000,
      'v31 behaviour: the send re-resolves a third time and transfers to that address through sendLocalTx');
  }
  {
    const OTHER2 = '0x9999999999999999999999999999999999999999';
    const t = bootTip({ names: [], ownerSeq: [OWNER, OWNER, OTHER2], balance: 1000n * E18 });
    t.api.onTipTap(post9);
    await tick();
    t.els.tipSendBtn.onclick();
    await tick();
    let threw = null;
    try { await t.captured.confirms[0].onSign(); } catch (e) { threw = e; }
    ok(threw && threw.message === 'tip-mismatch' && t.captured.sends.length === 0,
      'v31 behaviour: a recipient that changes by send time refuses the tip (nothing is sent)');
  }
  {
    const t = bootTip({ names: [], ownerSeq: [ME, ME, ME], balance: 1000n * E18 });
    t.api.onTipTap(post9);
    await tick();
    t.els.tipSendBtn.onclick();
    await tick();
    let threw = null;
    try { await t.captured.confirms[0].onSign(); } catch (e) { threw = e; }
    ok(threw && threw.message === 'self-tip' && t.captured.sends.length === 0,
      'v31 behaviour: an author owner equal to my address refuses the tip inside the send');
  }
  {
    const t = bootTip({ names: [], ownerSeq: [OWNER], balance: 5n * E18 });
    t.api.onTipTap(post9);
    await tick();
    t.els.tipSendBtn.onclick(); /* preset 10 > balance 5 — the panel still opens; the send is the guard */
    await tick();
    let threw = null;
    try { await t.captured.confirms[0].onSign(); } catch (e) { threw = e; }
    ok(threw && threw.message === 'shortfall-tip' && t.captured.sends.length === 0,
      'v31 behaviour: a balance that fell short by send time refuses the tip');
  }
}

/* ---- v32: composer parity batch 2 (M3, M4, D1–D7) ---- */
console.log('— v32: mentions, shortening write-back, drafts, picker, thumbs, own-post, my-actions, costs, in-place composer —');
{
  const E18_32 = 10n ** 18n;
  const VS = read('../docs/viewer.js');
  const css32 = read('../docs/style.css');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    for (const id of ['namePickerOverlay', 'namePickerList', 'namePickerTitle', 'namePickerCancel',
                      'composeOverlay', 'composeModalSlot']) {
      ok(html.includes('id="' + id + '"'), 'v32: ' + label + ' carries #' + id);
    }
    /* v37 (B-C1): the floating sheet ✕ (composeModalClose) is
       gone — the composer's own header carries the close. */
    ok(!html.includes('id="composeModalClose"'), 'v37: ' + label + ' has no composeModalClose (the header ✕ replaced it)');
  }
  for (const k of ['compCost', 'compCostFrom', 'compPostAs', 'draftRestored', 'draftDiscard',
                   'draftAutoSaved', 'confirmCostLbl', 'slAuthorAddr', 'dirBuilding', 'compCloseLbl']) {
    ok((VS.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v32: ' + k + ' exists in both languages');
  }
  ok(VS.includes('function openNamePicker') && VS.includes('function openComposeModal') &&
     VS.includes('function closeComposeModal') && VS.includes('function paintCompFiles') &&
     VS.includes('function paintMentions') && VS.includes('function noteOwnPost') &&
     VS.includes('function insertOwnPostIntoFeed') && VS.includes('ensureNameDirectory'),
    'v32: the picker, the compose sheet, thumbnails, mentions and own-post insertion exist');
  ok((VS.split('T.confirmCostLbl').length - 1) === 3,
    'v32: the protocol cost line appears in the post, like/recaw and follow confirm panels');
  ok(VS.includes('[T.slAuthorAddr,'), 'v32: the SuperLike sheet carries the author owner address line');
  const cardBody32 = VS.slice(VS.indexOf('async function postCard('), VS.indexOf('async function recawCard('));
  ok(cardBody32.includes('MY_KIND_LIKE') && cardBody32.includes('data-myrecaw'),
    'v32: post cards paint my like/Recaw state from the on-device record');
  const simpleBody = VS.slice(VS.indexOf('async function doSimpleAction('), VS.indexOf('/* ----- the X action row'));
  ok(simpleBody.indexOf('myMark(pwSession.address, acting.id, kind, target.cawId, true)') >= 0 &&
     simpleBody.indexOf('myMark(pwSession.address, acting.id, kind, target.cawId, true)') <
     simpleBody.indexOf('submitLocalAction') &&
     simpleBody.includes('myMark(pwSession.address, acting.id, kind, target.cawId, false)'),
    'v32: like/Recaw are recorded as mine before the send and unmarked on failure');
  const srcBody = VS.slice(VS.indexOf('async function performSuperRecaw('), VS.indexOf('async function performSuperRecawBurn('));
  ok(srcBody.indexOf('submitLocalAction') >= 0 &&
     srcBody.indexOf('submitLocalAction') < srcBody.indexOf('myMark(pwSession.address, acting.id, MY_KIND_RECAW, a.cawId, true)'),
    'v32: a SuperRecaw records the Recaw once the Recaw leg itself has landed');
  const compRefBody = VS.slice(VS.indexOf('function setComposerRef('), VS.indexOf('function renderComposer() {'));
  ok(compRefBody.includes('openComposeModal()') && compRefBody.includes("'?compose=' + kind"),
    'v32: reply/quote opens the in-place sheet, with the ?compose= navigation kept as the fallback');
  ok(css32.includes('.x-recaw.on') && css32.includes('.comp-thumb') && css32.includes('.mention-chip') &&
     css32.includes('.name-pick-row') && css32.includes('.comp-cost'),
    'v32: the stylesheet carries the lit Recaw, thumbnails, mention chips, picker rows and cost line');

  /* unit: the mention fragment rule (the app's) */
  ok(JSON.stringify(V.mentionFragmentAt('hello @nep', 10)) === JSON.stringify({ partial: 'nep', atIndex: 6 }),
    'v32 unit: a mention fragment at the caret is found');
  ok(V.mentionFragmentAt('a@b', 3) === null, 'v32 unit: a glued @ (email-like) is not a mention');
  ok(V.mentionFragmentAt('hi @', 4) === null, 'v32 unit: an empty fragment is not a mention');
  ok(V.mentionFragmentAt('no at sign', 5) === null, 'v32 unit: no @, no fragment');
  { const f = V.mentionFragmentAt('x @Ne', 5);
    ok(f && f.partial === 'ne' && f.atIndex === 2, 'v32 unit: the fragment is lowercased'); }

  /* unit: URL extraction + the shortening write-back */
  ok(JSON.stringify(V.extractUrls('(see https://example.com/a) and https://x.co/b, plus https://x.co/b,')) ===
     JSON.stringify(['https://example.com/a', 'https://x.co/b']),
    'v32 unit: URLs are trimmed of sentence punctuation and deduped');
  const LONG_URL = 'https://example.com/' + 'a'.repeat(40);
  const SHORT_URL = 'https://c.qql1.com/Ab3dEf';
  { const out = await V.shortenUrlsInText('look ' + LONG_URL + ' end', async () => SHORT_URL);
    ok(out === 'look ' + SHORT_URL + ' end', 'v32 unit: a long URL is replaced by its short form'); }
  { const out = await V.shortenUrlsInText('look ' + LONG_URL, async () => { throw new Error('down'); });
    ok(out === 'look ' + LONG_URL, 'v32 unit: a shortening failure keeps the original URL'); }
  { let calls = 0;
    const out = await V.shortenUrlsInText('tiny https://x.co/a', async () => { calls++; return SHORT_URL; });
    ok(calls === 0 && out === 'tiny https://x.co/a', 'v32 unit: a URL too short to gain is never sent to cawl'); }

  /* unit: protocol costs */
  ok(V.composeCostRaw('post') === 5000n * E18_32 && V.composeCostRaw('reply') === 5000n * E18_32 &&
     V.composeCostRaw('quote') === 5000n * E18_32,
    'v32 unit: post, reply and quote all cost the 5,000 post price');
  ok(V.LIKE_COST_RAW === 2000n * E18_32 && V.RECAW_COST_RAW === 4000n * E18_32 && V.FOLLOW_COST_RAW === 30000n * E18_32,
    'v32 unit: like 2,000 / recaw 4,000 / follow 30,000');

  /* unit: directory ranking */
  V.nameDirSetForTest(['', 'neptune', 'neo', 'xneptune', 'alice', 'neptune2']);
  ok(JSON.stringify(V.searchNameDirectory('neptune', 6).map(h => h.id)) === JSON.stringify([1, 5, 3]),
    'v32 unit: directory search ranks exact, then prefix, then substring');
  ok(JSON.stringify(V.searchNameDirectory('nep', 6).map(h => h.id)) === JSON.stringify([1, 5, 3]),
    'v32 unit: prefix matches come before substring matches, in id order');
  ok(V.searchNameDirectory('', 6).length === 0 && V.searchNameDirectory('zzz', 6).length === 0,
    'v32 unit: empty and unmatched queries find nothing');

  /* unit: drafts + my-actions over a stub store */
  const store32 = new Map();
  globalThis.localStorage = {
    getItem: k => (store32.has(k) ? store32.get(k) : null),
    setItem: (k, v) => store32.set(k, String(v)),
    removeItem: k => store32.delete(k),
  };
  try {
    const A32 = '0xAaAa000000000000000000000000000000000001', B32 = '0xBbBb000000000000000000000000000000000002';
    V.draftSave(A32, 'hello draft', 7n);
    const d = V.draftLoad(A32);
    ok(d && d.text === 'hello draft' && d.actingId === '7', 'v32 unit: a draft round-trips per wallet');
    ok(V.draftLoad(B32) === null, 'v32 unit: another wallet has no draft');
    V.draftClear(A32);
    ok(V.draftLoad(A32) === null && !store32.has(V.draftKeyFor(A32)), 'v32 unit: clearing removes the record for good');
    const CID32 = '0x' + 'ef'.repeat(32);
    V.myMark(A32, 7n, V.MY_KIND_LIKE, CID32, true);
    ok(V.myHas(A32, 7n, 1, CID32) === true && V.myHas(A32, 8n, 1, CID32) === false && V.myHas(A32, 7n, 2, CID32) === false,
      'v32 unit: my-actions are scoped to the acting name and the kind');
    ok((store32.get(V.MYACTIONS_KEY_PREFIX + A32.toLowerCase()) || '').includes('1:7:' + CID32),
      'v32 unit: my-actions persist to the on-device store');
    V.myMark(A32, 7n, 1, CID32, false);
    ok(V.myHas(A32, 7n, 1, CID32) === false, 'v32 unit: unmarking removes the record');
    V.myObserveItems(A32, [7n, 8n], [
      { type: 1, senderId: 8n, cawId: CID32 },
      { type: 2, senderId: 9n, cawId: CID32 },
      { type: 0, senderId: 7n, cawId: CID32 },
    ]);
    ok(V.myHas(A32, 8n, 1, CID32) === true && V.myHas(A32, 9n, 2, CID32) === false,
      'v32 unit: observation learns only my own names\u2019 likes/Recaws');
  } finally { delete globalThis.localStorage; }
  /* behavioural: the composer cluster against a stub DOM.
     The stub DOM is minimal but honest about identity: $()
     memoizes one element per id, elements track their parent
     and children, so moving the composer into the sheet and
     back is observable. (The stub textarea does not parse the
     HTML the way a real one does, so the draft-load check
     reads the card HTML, not the element's value.) */
  const compSrc = VS.slice(VS.indexOf('function setComposerRef('), VS.indexOf('/* ----- action buttons on post cards'));
  const ME32 = '0x1111111111111111111111111111111111111111';
  const fmtQ32 = raw => { const s = BigInt(raw).toString().padStart(19, '0');
    const w = s.slice(0, -18).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const f = s.slice(-18).replace(/0+$/, ''); return f ? w + '.' + f.slice(0, 6) : w; };
  const mkCompEl = () => {
    const el = { innerHTML: '', textContent: '', value: '', disabled: false, className: '',
      style: {}, dataset: {}, children: [], parentNode: null, listeners: {}, onclick: null,
      firstChild: { textContent: '' }, selectionStart: 0,
      classList: { _s: new Set(),
        toggle(c, on) { if (on === undefined) on = !this._s.has(c); on ? this._s.add(c) : this._s.delete(c); },
        add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); }, contains(c) { return this._s.has(c); } },
      addEventListener(k, f) { this.listeners[k] = f; },
      appendChild(c) { c.parentNode = el; el.children.push(c); return c; },
      insertBefore(c, ref) { c.parentNode = el; const i = ref ? el.children.indexOf(ref) : -1;
        if (i >= 0) el.children.splice(i, 0, c); else el.children.push(c); return c; },
      querySelector(sel) { if (sel === '#compFiles') return el._fi || (el._fi = mkCompEl());
        if (sel === '.comp-ref') return el._ref || (el._ref = mkCompEl()); return mkCompEl(); },
      querySelectorAll() { return []; },
      setAttribute() {}, focus() {}, scrollIntoView() {}, setSelectionRange(p) { el.selectionStart = p; },
      dispatchEvent() { return true; },
      before(r) { el._beforeRow = r; },
    };
    Object.defineProperty(el, 'nextSibling', { get() {
      if (!el.parentNode) return null;
      const sib = el.parentNode.children, i = sib.indexOf(el);
      return i >= 0 && i + 1 < sib.length ? sib[i + 1] : null; } });
    let _html = '';
    Object.defineProperty(el, 'innerHTML', {
      get() { return _html; },
      set(v) { _html = String(v);
        if (v === '') { for (const c of el.children) c.parentNode = null; el.children = []; } } });
    return el;
  };
  const LONG_URL32 = 'https://example.com/' + 'a'.repeat(40);
  const SHORT_URL32 = 'https://c.qql1.com/Ab3dEf';
  const CID32 = '0x' + 'ab'.repeat(32);
  const bootComp = ({ names, actingId, dirKick }) => {
    const els = {}, captured = { confirms: [], submits: [], noted: [], inserted: [],
      timelineCalls: 0, setActing: null, dirKicks: 0, indexItems: [] };
    const $id = id => (els[id] = els[id] || mkCompEl());
    const doc = { body: { classList: { toggle() {} } },
      createElement: () => mkCompEl(), createTextNode: t => ({ textContent: t }) };
    const acting = { current: names.find(n => n.id === actingId) || null };
    const session = { address: ME32, keyBytes: new Uint8Array([1]) };
    const loc = { href: '', search: '' };
    const holder = { api: null };
    const api = new Function('$', 'document', 'location', 'pageFile', 'esc', 'T',
      'pwUnlocked', 'pwActing', 'pwSession', 'pwNames', 'pwActingId', 'pwSetActing', 'pwTouch', 'pwLoadNames',
      'avatarFor', 'avatarHtml', 'resolveName', 'fmtQcaw', 'textBytes', 'postRefMarker', 'appendPostRef', 'parsePostText',
      'composeCostRaw', 'draftLoad', 'draftSave', 'draftClear', 'ensureNameDirectory',
      'mentionFragmentAt', 'searchNameDirectory', 'shortenUrlsInText', 'shortenViaCawl',
      'openConfirmPanel', 'submitLocalAction', 'randomCawId', 'mediaAttach', 'mirrorResolveAfterPost',
      'indexItem', 'noteOwnPost', 'insertOwnPostIntoFeed', 'hydrateAttachmentsIn',
      'loadPostPage', 'loadProfile', 'loadBookmarksView',
      'pendingComposeRef', 'composerRef', 'compDraft', 'compFiles', 'filesTx', 'filesCaw', 'mirrorNotice',
      'compDraftFor', 'compDraftRestored', 'compDraftTimer', 'compPrepping', 'compFrag', 'compDirState', 'compNoteState', 'composeHomeSlot',
      compSrc + '\nreturn { renderComposer, setComposerRef, paintMentions, openNamePicker, ' +
      'openComposeModal, closeComposeModal, state: () => ({ draft: compDraft, ref: composerRef, ' +
      'files: compFiles, restored: compDraftRestored, frag: compFrag }) };')(
      $id, doc, loc, 'en.html', s => String(s),
      { compHintLocked: 'HINT', compHintSetupBtn: 'SETUP', compHintNoName: 'NONAME',
        compZeroBalance: 'ZERO', compReplyingTo: 'Replying to {name}', compQuoting: 'Quoting {name}',
        compCancelRef: 'CANCELREF', compPh: 'PH', compPostBtn: 'POST', compBytes: '{n}',
        attachLbl: 'ATTACH', attachSelected: '{n} selected', attachBusy: 'BUSY',
        attachDone: 'DONE {n}', attachFail: 'FAIL',
        draftRestored: 'Draft restored', draftDiscard: 'Throw away',
        draftAutoSaved: 'Drafts save on this device as you type.',
        dirBuilding: 'Reading the name list… {done} / {total}', compPostAs: 'Post as',
        compCost: 'Post cost: {cost} qCAW',
        compCostFrom: "Deducted from the name's deposited balance (balance: {balance} qCAW)",
        confirmTitlePost: 'POSTTITLE', confirmAsLbl: 'AS', confirmTextLbl: 'TEXT',
        confirmCostLbl: 'Cost', compTooLong: 'TOOLONG', unknownName: 'name #' },
      () => true, () => acting.current, session, names, actingId,
      id => { captured.setActing = id; acting.current = names.find(n => n.id === id) || null; holder.api.renderComposer(); },
      () => {}, async () => {},
      async () => null, () => '', async () => 'alice', fmtQ32, V.textBytes, V.postRefMarker,
      V.appendPostRef, V.parsePostText, V.composeCostRaw, V.draftLoad, V.draftSave, V.draftClear,
      async () => { captured.dirKicks++; if (dirKick) await dirKick(); return true; },
      V.mentionFragmentAt, V.searchNameDirectory, V.shortenUrlsInText,
      async url => url.includes('example.com') ? SHORT_URL32 : null,
      opts => { captured.confirms.push(opts); },
      async (kb, action) => { captured.submits.push(action); return { hash: '0x' + 'cd'.repeat(32) }; },
      V.randomCawId, async () => {}, () => {},
      it => captured.indexItems.push(it), it => captured.noted.push(it),
      async it => { captured.inserted.push(it); }, async () => {},
      () => {}, () => {}, () => {},
      null, null, '', [], null, null, '',
      null, false, null, false, null, null, '', null);
    holder.api = api;
    /* v37 (B-C1): the composer's permanent home is the compose
       sheet's slot (as in the shells) — bootComp mirrors that. */
    const homeParent = $id('composeModalSlot');
    homeParent.appendChild($id('composerArea'));
    $id('viewHome').style.display = '';
    $id('viewPost').style.display = 'none';
    return { api, els, captured, homeParent, loc };
  };
  const tick32 = ms => new Promise(r => setTimeout(r, ms));

  /* D1 + D6: the stored draft restores with its notice, the
     cost line shows the price and the balance, discard clears
     the record, typing autosaves, and reply text never lands
     in the plain draft. */
  {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    try {
      V.draftSave(ME32, 'hello draft', 7n);
      const names = [{ id: 7n, username: 'neptune', balance: 100n * E18_32 }];
      const c = bootComp({ names, actingId: 7n });
      c.api.renderComposer();
      ok(c.els.composerArea.innerHTML.includes('hello draft') &&
         c.els.composerArea.innerHTML.includes('Post cost: 5,000 qCAW') &&
         c.els.composerArea.innerHTML.includes('(balance: 100 qCAW)'),
        'v32 behaviour: the stored draft restores into the composer with the app cost line');
      ok(c.els.compDraftNote.innerHTML.includes('Draft restored') &&
         c.els.compDraftNote.innerHTML.includes('compDraftDiscard'),
        'v32 behaviour: a restored draft shows the restored notice with its discard button');
      c.els.compDraftDiscard.onclick();
      ok(V.draftLoad(ME32) === null && c.api.state().draft === '',
        'v32 behaviour: discarding the draft clears the record and the composer');
      c.els.compText.value = 'fresh text';
      c.els.compText.listeners.input();
      await tick32(600);
      ok(V.draftLoad(ME32) && V.draftLoad(ME32).text === 'fresh text',
        'v32 behaviour: plain-post typing autosaves after the 500 ms debounce');
      c.api.setComposerRef('reply', { senderId: 9n, cawId: CID32, text: 'orig' });
      ok(c.api.state().ref && c.api.state().ref.kind === 'reply' &&
         c.els.composerArea.innerHTML.includes('Replying to'),
        'v32 behaviour: reply mode opens with the reply context');
      c.els.compText.value = 'reply text';
      c.els.compText.listeners.input();
      await tick32(600);
      ok(V.draftLoad(ME32).text === 'fresh text',
        'v32 behaviour: reply text never overwrites the plain-post draft');
      ok(c.captured.dirKicks >= 1, 'v32 behaviour: rendering the composer warms the name directory');
    } finally { delete globalThis.localStorage; }
  }

  /* D2: the name picker lists names with balances and switches. */
  {
    const names = [{ id: 7n, username: 'neptune', balance: 100n * E18_32 },
                   { id: 8n, username: 'alice', balance: 2500n * E18_32 }];
    const c = bootComp({ names, actingId: 7n });
    c.api.renderComposer();
    ok(typeof c.els.compNameChip.onclick === 'function', 'v32 behaviour: with two names the chip opens the picker');
    c.els.compNameChip.onclick();
    ok(c.els.namePickerOverlay.style.display === '' && c.els.namePickerList.children.length === 2,
      'v32 behaviour: the picker lists every name');
    c.els.namePickerList.children[1].onclick();
    ok(c.captured.setActing === 8n && c.els.namePickerOverlay.style.display === 'none',
      'v32 behaviour: picking a name switches the acting name and closes the picker');
    const solo = bootComp({ names: names.slice(0, 1), actingId: 7n });
    solo.api.renderComposer();
    ok(!solo.els.compNameChip.onclick, 'v32 behaviour: with one name the chip stays a plain label');
  }

  /* D3: thumbnails paint, remove, and picking appends to the cap. */
  {
    const c = bootComp({ names: [{ id: 7n, username: 'neptune', balance: 100n * E18_32 }], actingId: 7n });
    c.api.renderComposer();
    const fi = c.els.compStatus._beforeRow.querySelector('#compFiles');
    fi.files = [{ name: 'a.png' }, { name: 'b.png' }];
    fi.onchange();
    ok(c.api.state().files.length === 2 && c.els.compThumbs.children.length === 2 &&
       c.els.compFilesLbl.textContent.includes('2'),
      'v32 behaviour: picked images show as thumbnails with the count');
    c.els.compThumbs.children[0].children[1].onclick();
    ok(c.api.state().files.length === 1 && c.els.compThumbs.children.length === 1,
      'v32 behaviour: the thumbnail remove button drops that image');
    fi.files = [{ name: 'c.png' }, { name: 'd.png' }, { name: 'e.png' }];
    fi.onchange();
    ok(c.api.state().files.length === 4,
      'v32 behaviour: re-picking appends to the selection, capped at 4');
  }

  /* M3: mention candidates from the directory, picked at the caret. */
  {
    V.nameDirSetForTest(['', 'neptune', 'neo', 'alice']);
    const c = bootComp({ names: [{ id: 7n, username: 'neptune', balance: 100n * E18_32 }], actingId: 7n });
    c.api.renderComposer();
    c.els.compText.value = 'hi @ne';
    c.els.compText.selectionStart = 6;
    c.api.paintMentions();
    ok(c.els.compMentions.children.length === 2,
      'v32 behaviour: typing @ne offers the directory matches as chips');
    c.els.compMentions.children[0].onclick();
    ok(c.els.compText.value === 'hi @neptune ' && c.els.compText.selectionStart === 12,
      'v32 behaviour: picking a chip inserts @name at the caret');
    c.els.compText.value = 'hi a@b';
    c.els.compText.selectionStart = 7;
    c.api.paintMentions();
    ok(c.els.compMentions.style.display === 'none',
      'v32 behaviour: a glued @ offers no candidates');
  }

  /* M4 + D4 + D6: the URL is shortened and written back before
     the confirm sheet, the post's cost line rides the panel, the
     signed text is the reviewed text, and success inserts the
     post at the head without reloading the timeline. */
  {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    try {
      V.draftSave(ME32, 'old draft', 7n);
      const c = bootComp({ names: [{ id: 7n, username: 'neptune', balance: 100n * E18_32 }], actingId: 7n });
      c.api.renderComposer();
      c.els.compText.value = 'look ' + LONG_URL32;
      c.els.compText.listeners.input();
      await c.els.compPostBtn.onclick();
      ok(c.captured.confirms.length === 1, 'v32 behaviour: posting opens the confirm panel');
      const lines = c.captured.confirms[0].lines;
      const textLine = lines.find(l => l[0] === 'TEXT');
      ok(textLine && textLine[1].includes(SHORT_URL32) && !textLine[1].includes(LONG_URL32),
        'v32 behaviour: the confirm sheet shows the shortened URL, not the long one');
      ok(c.els.compText.value.includes(SHORT_URL32),
        'v32 behaviour: the shortened text is written back into the editor before the confirm');
      ok(lines.some(l => l[0] === 'Cost' && l[1] === '5,000 qCAW'),
        'v32 behaviour: the post confirm panel carries the 5,000 cost line');
      await c.captured.confirms[0].onSign();
      ok(c.captured.submits.length === 1 && c.captured.submits[0].text.includes(SHORT_URL32),
        'v32 behaviour: the signed text is the reviewed, shortened text');
      await c.captured.confirms[0].afterSuccess();
      ok(c.captured.indexItems.length === 1 && c.captured.noted.length === 1 &&
         c.captured.inserted.length === 1 && c.captured.timelineCalls === 0,
        'v32 behaviour: success indexes and inserts the post at the head instead of reloading the timeline');
      ok(V.draftLoad(ME32) === null, 'v32 behaviour: a landed plain post clears the wallet draft');
    } finally { delete globalThis.localStorage; }
  }

  /* D7: reply from a non-home view opens the sheet in place.
     v37 (B-C1): the composer lives in the sheet permanently —
     closing hides the sheet (nothing moves), and the home view
     takes the same sheet path (no inline composer remains). */
  {
    const c = bootComp({ names: [{ id: 7n, username: 'neptune', balance: 100n * E18_32 }], actingId: 7n });
    c.els.viewHome.style.display = 'none';
    c.els.viewPost.style.display = '';
    c.api.setComposerRef('reply', { senderId: 9n, cawId: CID32, text: 'orig' });
    ok(c.loc.href === '' && c.els.composeOverlay.style.display === '' &&
       c.els.composerArea.parentNode === c.els.composeModalSlot &&
       c.api.state().ref && c.api.state().ref.kind === 'reply',
      'v32 behaviour: reply off the home view opens the in-place sheet, with no navigation');
    c.api.closeComposeModal();
    ok(c.els.composeOverlay.style.display === 'none' &&
       c.els.composerArea.parentNode === c.els.composeModalSlot,
      'v37 behaviour: closing the sheet hides it; the composer stays in the sheet');
    const h = bootComp({ names: [{ id: 7n, username: 'neptune', balance: 100n * E18_32 }], actingId: 7n });
    h.api.setComposerRef('quote', { senderId: 9n, cawId: CID32, text: 'orig' });
    ok(h.loc.href === '' && h.els.composerArea.parentNode === h.els.composeModalSlot &&
       h.els.composeOverlay.style.display === '' &&
       h.api.state().ref && h.api.state().ref.kind === 'quote',
      'v37 behaviour: on the home view reply/quote opens the same sheet (no inline composer)');
  }

  /* behavioural: my-Recaw painting (the guarded optimistic bump). */
  {
    const pmSrc = VS.slice(VS.indexOf('function paintMyRecaw('), VS.indexOf('async function doSimpleAction('));
    const mkCard = count => {
      const rb = { dataset: {}, _added: null, classList: { add(c) { rb._on = c; } },
        querySelector: () => count, appendChild(el) { rb._added = el; } };
      return { querySelector: () => rb, _rb: rb };
    };
    const cnt = { dataset: { raw: '2' }, textContent: '2' };
    const card1 = mkCard(cnt), card2 = mkCard(null);
    const paint = new Function('document', 'fmtCount',
      pmSrc + '\nreturn paintMyRecaw;')(
      { querySelectorAll: () => [card1, card2],
        createElement: () => ({ className: '', dataset: {}, textContent: '' }) },
      n => String(n));
    paint(CID32);
    ok(card1._rb._on === 'on' && cnt.dataset.raw === '3' && cnt.textContent === '3' &&
       card1._rb.dataset.myrecaw === '1' && card2._rb._added && card2._rb._added.textContent === '1',
      'v32 behaviour: a Recaw lights the row and bumps the count once, even with no count span');
    paint(CID32);
    ok(cnt.dataset.raw === '3' && cnt.textContent === '3',
      'v32 behaviour: painting twice never counts the same Recaw twice');
  }

  /* behavioural: own-post pending record + insertion. */
  {
    const d4Src = VS.slice(VS.indexOf('const pendingOwn'), VS.indexOf('async function loadTimeline('));
    const tl = { children: [], _qs: null,
      querySelector() { return tl._qs; },
      insertBefore(c, ref) { const i = ref ? tl.children.indexOf(ref) : -1;
        if (i >= 0) tl.children.splice(i, 0, c); else tl.children.unshift(c); },
      get firstChild() { return tl.children[0] || null; } };
    const api = new Function('$', 'tlMode', 'rowFor', 'hydrateAttachmentsIn',
      d4Src + '\nreturn { noteOwnPost, reconcileOwnPosts, insertOwnPostIntoFeed, ' +
      'pending: () => [...pendingOwn.keys()] };')(
      id => (id === 'timeline' ? tl : null), 'latest',
      async a => ({ _for: a.cawId }), async () => {});
    const item = { hash: '0xAB', cawId: CID32, type: 0, text: 'mine' };
    api.noteOwnPost(item);
    ok(api.pending().length === 1 && api.pending()[0] === '0xab',
      'v32 behaviour: a posted tx is held pending under its lowercase hash');
    api.reconcileOwnPosts([{ hash: '0xab' }]);
    ok(api.pending().length === 0,
      'v32 behaviour: the scanned copy graduates the pending post');
    api.noteOwnPost(item);
    await api.insertOwnPostIntoFeed(item);
    ok(tl.children.length === 1 && tl.children[0]._for === CID32,
      'v32 behaviour: a just-posted item inserts at the head of the Latest feed');
    tl._qs = {};
    await api.insertOwnPostIntoFeed(item);
    ok(tl.children.length === 1, 'v32 behaviour: an already-present post is never inserted twice');
  }
}

console.log('— v33: app-parity batch 3 (customs, My names, posting-wallet mint, live name check, auto follow lists, inbox) —');
{
  const VS = viewerSrc;
  /* ---- D19: the app's mintable-username rule ---- */
  ok(V.isMintableUsername('neptune') && V.isMintableUsername('a1') && V.isMintableUsername('42'),
     'v33 D19: lowercase letters + digits are mintable');
  ok(!V.isMintableUsername('NepTune') && !V.isMintableUsername('a_b') && !V.isMintableUsername('a-b') &&
     !V.isMintableUsername('') && !V.isMintableUsername('あ') && !V.isMintableUsername(null),
     'v33 D19: capitals, symbols, empty and non-strings are not mintable');
  ok(VS.includes("mni.addEventListener('input', onMintNameInput)") &&
     VS.includes('function onMintNameInput()') &&
     VS.includes('input.value.toLowerCase()'),
     'v33 D19: typing lowercases the field, drops the stale check and paints the live verdict');
  /* ---- M5: the on-device profile customs ---- */
  ok(V.PROFILE_CUSTOMS_KEY === 'caw-profile-customs' && V.CUSTOM_NAME_MAX === 40 && V.CUSTOM_BIO_MAX === 160,
     'v33 M5: the customs store uses the app key and the app field limits (40 / 160)');
  {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    try {
      ok(V.profileCustomFor(7n) === null, 'v33 M5: no custom reads back as none');
      V.profileCustomSave(7n, { displayName: 'Nep', bio: 'hello' });
      const c1 = V.profileCustomFor(7n);
      ok(c1 && c1.displayName === 'Nep' && c1.bio === 'hello', 'v33 M5: a saved custom round-trips');
      ok(JSON.parse(store.get('caw-profile-customs'))['7'].displayName === 'Nep',
         'v33 M5: customs persist as one JSON object keyed by name id');
      V.profileCustomSave(7n, { bio: 'bio2' });
      const c2 = V.profileCustomFor(7n);
      ok(c2.displayName === 'Nep' && c2.bio === 'bio2', 'v33 M5: saving merges — untouched fields stay (the app rule)');
      V.profileCustomSave(7n, { displayName: '' });
      const c3 = V.profileCustomFor(7n);
      ok(c3 && !('displayName' in c3) && c3.bio === 'bio2', 'v33 M5: an empty string removes just that field');
      V.profileCustomSave(7n, { bio: '' });
      ok(V.profileCustomFor(7n) === null && !('7' in JSON.parse(store.get('caw-profile-customs'))),
         'v33 M5: an entry with nothing left disappears');
      ok(!/secret|phrase|key/i.test(store.get('caw-profile-customs') || ''),
         'v33 M5: nothing secret-shaped is ever in the customs store');
    } finally { delete globalThis.localStorage; }
  }
  ok(V.customDisplayLabel({ displayName: 'Nep' }, 'neptune') === 'Nep' &&
     V.customDisplayLabel(null, 'neptune') === '@neptune' &&
     V.customDisplayLabel({ bio: 'x' }, 'neptune') === '@neptune',
     'v33 M5: displayLabel prefers the custom display name, else the plain @name');
  ok(V.cleanCustomText('  hi  ', 40) === 'hi' && V.cleanCustomText('x'.repeat(50), 40).length === 40 &&
     V.cleanCustomText(null, 40) === '',
     'v33 M5: cleanCustomText trims and caps at the field limit');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="profEditOverlay"') && html.includes('id="profEditNameInput"') &&
       html.includes('id="profEditBioInput"') && html.includes('id="profEditSave"'),
       'v33 M5: ' + label + ' carries the profile-look editor sheet');
  }
  ok(VS.includes("profileCustomFor(a.senderId)") && VS.includes('class="pbio"'),
     'v33 M5: post cards and the profile head read the customs (display name + bio)');
  /* ---- M7: the My names screen ---- */
  ok(VS.includes('function renderNamesScreen()') && VS.includes("renderTradeWall(area, 'names')"),
     'v33 M7: the names screen exists and walls itself when locked');
  ok(VS.includes('function openDepWdPanel(nameObj, kind, amt, afterSuccess)') &&
     VS.includes('openDepWdPanel(acting, kind, amt,') && VS.includes('openDepWdPanel(t, kind, amt,'),
     'v33 M7: the wallet card and the name cards share the one dep/withdraw panel');
  ok(VS.includes('T.mineSummary') && VS.includes('T.mineActive') && VS.includes('T.mineUseBtn') &&
     VS.includes('mnFillFollowerCounts'),
     'v33 M7: summary line, acting badge, post-as button and follow-index follower counts are wired');
  ok(VS.includes("else if (nextQuery === 'names') location.replace(pageFile + '?names=1');") &&
     VS.includes("nextQuery === 'names' ? '<p class=\"pw-next-hint\">' + esc(T.pwNextNames)"),
     'v33 M7: the ?next=names continuation + locked-wallet hint exist');
  ok((VS.match(/pwNextNames:/g) || []).length === 2 && (VS.match(/pwNextGetname:/g) || []).length === 2 &&
     (VS.match(/mineSummary:/g) || []).length === 2 && (VS.match(/customTitle:/g) || []).length === 2,
     'v33: the new strings exist in both languages');
  /* ---- D8: minting with the posting wallet ---- */
  ok(!VS.includes('injectedProvider') && !VS.includes('function sendTx(') && !VS.includes('walletRequest'),
     'v33 D8: the injected-provider machinery is gone entirely (no dead mint helper left behind)');
  const mintSrc = VS.slice(VS.indexOf('function doApprove()'), VS.indexOf('/* ---------- v12: the built-in posting wallet'));
  ok(mintSrc.includes('sendLocalTx(pwSession.keyBytes') &&
     mintSrc.includes('buildApproveCalldata(fresh.cost)') && mintSrc.includes('buildMintCalldata(fresh.name)'),
     'v33 D8: approve + mint send through sendLocalTx with the posting wallet key');
  ok(mintSrc.includes('openConfirmPanel({') && mintSrc.includes('T.getConfirmApprove') && mintSrc.includes('T.getConfirmMint'),
     'v33 D8: both steps go through the confirm panel with the app wording');
  ok(mintSrc.includes('await mintGuard(st)') && mintSrc.includes('verifyMinted(fresh.name)') &&
     mintSrc.includes('ownerTokensCache.delete(pwSession.address)') && mintSrc.includes('await pwLoadNames();'),
     'v33 D8: the click-time guard, the landed check and the name-list reload all survive the move');
  ok(VS.includes('function renderGetnameWallet()') && VS.includes("renderTradeWall(area, 'getname')"),
     'v33 D8: the name desk wallet strip is the posting wallet, walled in place when locked');
  /* ---- M13: the Buy CAW link ---- */
  ok(VS.includes("pageFile + '?dex=1'") && VS.includes('T.getBuyCaw') &&
     (VS.match(/getBuyCaw:/g) || []).length === 2,
     'v33 M13: a short qCAW balance in the mint area links into the HuntersDEX view (both languages)');
  /* ---- D9: follow lists build automatically ---- */
  ok(VS.includes('async function followAutoBuild(kind)') && !VS.includes('continueFollowBuild') &&
     !VS.includes('kb.onclick'),
     'v33 D9: the follow lists auto-build in a loop — the manual keep-reading chunking is gone');
  ok(VS.includes("status.id = 'followListStatus'") && VS.includes('followListPages'),
     'v33 D9: the status line counts the pages walked in this opening');
  /* ---- M11 + D12: the widened inbox ---- */
  {
    const MINE = '0x' + 'aa'.repeat(32), OTHER = '0x' + 'bb'.repeat(32);
    const myPosts = new Set([MINE]);
    const myIds = new Set(['7', '8']);
    const it = over => ({ type: 0, senderId: 9n, receiverId: 0n, cawId: OTHER, text: '', ...over });
    ok(V.ntClassifyAny(it({ type: 3, receiverId: 8n }), myIds, myPosts) === 'follow',
       'v33 M11: a follow of my SECOND name counts (not just the acting one)');
    ok(V.ntClassifyAny(it({ type: 4, receiverId: 7n }), myIds, myPosts) === 'unfollow',
       'v33 M11: an unfollow of any of my names counts');
    ok(V.ntClassifyAny(it({ type: 1, cawId: MINE }), myIds, myPosts) === 'like',
       'v33 M11: a like on a post by any of my names counts');
    ok(V.ntClassifyAny(it({ type: 3, senderId: 8n, receiverId: 7n }), myIds, myPosts) === null,
       'v33 M11: an action BY one of my names never counts, even aimed at another of my names');
    ok(V.ntClassifyAny(it({ type: 4, receiverId: 9n }), myIds, myPosts) === null,
       'v33 M11: an unfollow of someone else falls away');
    ok(V.NT_SCAN_MAX_PAGES === 40, 'v33 M11: the inbox scan bound is the app 40 pages');
  }
  ok(V.ntBadgeText(0) === '0' && V.ntBadgeText(7) === '7' && V.ntBadgeText(99) === '99' &&
     V.ntBadgeText(100) === '99+' && V.ntBadgeText(12345) === '99+',
     'v33 M11: the badge label is the count, capped at 99+');
  ok(VS.includes('async function ntScanInbox()') && VS.includes('ntSetSeenMark') &&
     VS.includes('T.ntCapped') && VS.includes('function ntRefreshBadge(force)'),
     'v33 M11: the automatic since-last-open scan, the position mark, the capped note and the badge refresh are wired');
  ok(VS.includes('async function ntActorNameFor(address)') && VS.includes('ntActorNames'),
     'v33 D12: SuperLike actor rows resolve the wallet’s names (cached) before falling back to the address');
  ok((VS.match(/ntUnfollowed:/g) || []).length === 2 && (VS.match(/ntCapped:/g) || []).length === 2 &&
     (VS.match(/getConfirmApprove:/g) || []).length === 2 && (VS.match(/getConfirmMint:/g) || []).length === 2,
     'v33: the inbox + mint confirm strings exist in both languages');
  /* behavioural: the generalized wall serves the two new kinds */
  {
    const wallBody = VS.slice(VS.indexOf('function renderTradeWall(area, kind)'), VS.indexOf('const assetRowHtml'));
    const mkEl = () => ({ innerHTML: '', value: '', disabled: false, listeners: {},
      addEventListener(k, f) { this.listeners[k] = f; } });
    const els = {}, calls = [];
    const $id = id => (els[id] = els[id] || mkEl());
    const renderTradeWall = new Function('$', 'esc', 'T', 'pageFile', 'vaultLoad', 'vaultDecrypt',
      'pwStartSession', 'syncChrome', 'renderComposer', 'loadDexView', 'loadBurnView',
      'renderNamesScreen', 'renderGetnameWallet', 'renderMintArea',
      wallBody + '\nreturn renderTradeWall;')(
      $id, s => String(s),
      { tradeNeedUnlock: 'GUIDE', mirrorOpenWallet: 'WALLET', pwLockedText: 'LOCKED',
        pwPasswordPh: 'PW', pwUnlockBtn: 'UNLOCK', pwUnlockWrong: 'WRONG' },
      'en.html', () => ({ v: 1 }),
      async () => ({ kind: 'key', secret: 'S' }),
      async () => { calls.push('session'); },
      () => {}, () => { calls.push('composer'); },
      () => { calls.push('dex'); }, () => { calls.push('burn'); },
      () => { calls.push('names'); }, () => { calls.push('gn'); }, () => { calls.push('mint'); });
    const area = mkEl();
    renderTradeWall(area, 'names');
    ok(area.innerHTML.includes('id="namesUnlockPass"') && area.innerHTML.includes('id="namesUnlockBtn"'),
      'v33 behaviour: the My names wall renders its own (names-prefixed) unlock form');
    await els.namesUnlockBtn.onclick();
    ok(calls.join(',') === 'session,composer,names',
      'v33 behaviour: unlocking on the names wall starts the session and the names screen replaces the wall');
    calls.length = 0;
    const area2 = mkEl();
    renderTradeWall(area2, 'getname');
    ok(area2.innerHTML.includes('id="gnUnlockPass"'),
      'v33 behaviour: the Get-a-name wall renders its own (gn-prefixed) unlock form');
    await els.gnUnlockBtn.onclick();
    ok(calls.join(',') === 'session,composer,gn,mint',
      'v33 behaviour: unlocking on the getname wall re-renders the wallet strip and the mint area');
  }
}

console.log('— v34: multi-wallet registry, Settings, onboarding + chrome parity (batch 4a) —');
{
  const VS = viewerSrc;
  /* ---- storage shape + security invariants ---- */
  ok(VS.includes("const WALLETS_STORE_KEY = 'caw-wallets-v1'") &&
     VS.includes('wallets: reg.wallets.map(w => ({ address: w.address || null, kind: w.kind || null, vault: w.vault }))'),
     'v34 M6: the registry persists only {address, kind, vault ciphertext} per wallet — never a secret');
  ok((VS.match(/eth_sendRawTransaction/g) || []).length === 1 &&
     !VS.includes('eth_sendTransaction') && !VS.includes('eth_sign') && !VS.includes('personal_sign'),
     'v34: still exactly one raw-send site, zero eth_sendTransaction, no sign-method literals');
  ok(VS.includes('if (walletsEntryFor(stored.address) === null) { pwForgetStoredSession(); return; }'),
     'v34 M6: a stored session restores only while ITS wallet is still in the registry');
  ok(VS.includes('walletsSetActive(address)') && VS.includes('pwSetUnlockTarget(null)'),
     'v34 M6: starting a session records the active wallet and consumes the switch target');

  /* ---- migration + multi-wallet behaviour (stub storage) ---- */
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const phrase = await V.generateMnemonic();
    const addr = (await V.deriveFromPhrase(phrase)).address;
    const addrLc = addr.toLowerCase();
    const KEY2 = '0x59c6995e998f97a5a0044966f0945389dc9e86dfcedcbf17785cd0f2b24a30f5c';
    const addr2 = V.privateKeyToAddress(KEY2);
    const PW1 = 'first-password', PW2 = 'second-password';
    /* a v33-style single vault, exactly as v12–v33 stored it */
    const legacyVault = await V.vaultEncrypt(PW1, { kind: 'phrase', secret: phrase });
    store.set(V.VAULT_STORE_KEY, JSON.stringify(legacyVault));
    let reg = V.walletsLoad();
    ok(reg.wallets.length === 1 && reg.wallets[0].legacy === true && reg.wallets[0].address === null &&
       reg.wallets[0].vault.ct === legacyVault.ct,
       'v34 migration: a lone pre-v34 vault presents as the registry’s first (address-unknown) wallet');
    ok(V.vaultLoad() && V.vaultLoad().ct === legacyVault.ct,
       'v34 migration: the locked views open the legacy vault exactly as before');
    ok(V.walletsEntryFor(addr) === 'legacy',
       'v34 migration: the restore gate treats the unadopted wallet as present');
    const adopted = await V.pwAdoptLegacyWallet({ kind: 'phrase', secret: phrase }, addr);
    reg = V.walletsLoad();
    ok(adopted === true && reg.wallets.length === 1 && reg.wallets[0].address === addrLc &&
       reg.wallets[0].kind === 'phrase' && reg.wallets[0].vault.ct === legacyVault.ct &&
       store.get(V.WALLETS_STORE_KEY) !== undefined && !store.has(V.VAULT_STORE_KEY),
       'v34 migration: adoption moves the SAME ciphertext into the registry under the proved address and drops the legacy key');
    const round = await V.vaultDecrypt(PW1, reg.wallets[0].vault);
    ok(round.kind === 'phrase' && round.secret === phrase,
       'v34 migration: the adopted wallet still unlocks with its original password');
    ok(V.walletsEntryFor(addr) && V.walletsEntryFor(addr).address === addrLc &&
       V.walletsEntryFor(addr2) === null,
       'v34 M6: the restore gate finds the adopted wallet and refuses an address the registry does not hold');
    ok(V.vaultForAddress(addr) && V.vaultForAddress(addr).ct === legacyVault.ct && V.vaultLoad().ct === legacyVault.ct,
       'v34 M6: vault lookup by address and the default (active) target both reach the adopted wallet');
    /* add a second wallet: the first is untouched, each keeps
       its OWN password */
    const vault2 = await V.vaultEncrypt(PW2, { kind: 'key', secret: KEY2 });
    V.walletsAdd({ address: addr2, kind: 'key', vault: vault2 });
    reg = V.walletsLoad();
    ok(reg.wallets.length === 2 && reg.active === addr2.toLowerCase(),
       'v34 M6: adding a wallet appends it and makes it active, existing wallets untouched');
    let crossFails = false;
    try { await V.vaultDecrypt(PW1, V.vaultForAddress(addr2)); } catch (e) { crossFails = true; }
    ok(crossFails && (await V.vaultDecrypt(PW2, V.vaultForAddress(addr2))).secret === KEY2,
       'v34 M6: each wallet opens only with its OWN password');
    /* switch target: the locked views open the chosen wallet */
    V.pwSetUnlockTarget(addr);
    ok(V.vaultLoad().ct === legacyVault.ct, 'v34 M6: the switch target decides which vault the locked view opens');
    V.pwSetUnlockTarget(null);
    V.walletsSetActive(addr);
    ok(V.walletsLoad().active === addrLc && V.vaultLoad().ct === legacyVault.ct,
       'v34 M6: the recorded active wallet is the default unlock target');
    /* per-wallet delete, then the last delete = full reset */
    ok(V.walletsRemove(addr2) === 1 && V.walletsLoad().wallets.length === 1 &&
       V.vaultForAddress(addr).ct === legacyVault.ct,
       'v34 M6: deleting one wallet leaves the other fully intact');
    ok(V.walletsRemove(addr) === 0 && !store.has(V.WALLETS_STORE_KEY) && V.vaultLoad() === null,
       'v34 M6: deleting the last wallet removes the registry (the full reset)');
    /* add BEFORE ever unlocking the legacy wallet: the legacy
       entry is materialized, not orphaned */
    store.clear();
    store.set(V.VAULT_STORE_KEY, JSON.stringify(legacyVault));
    V.walletsAdd({ address: addr2, kind: 'key', vault: vault2 });
    reg = V.walletsLoad();
    ok(reg.wallets.length === 2 && reg.wallets.some(w => !w.address && w.vault.ct === legacyVault.ct),
       'v34 M6: adding a wallet while the legacy one is unadopted keeps it as an address-unknown entry');
    await V.pwAdoptLegacyWallet({ kind: 'phrase', secret: phrase }, addr);
    reg = V.walletsLoad();
    ok(reg.wallets.length === 2 && reg.wallets.every(w => !!w.address) && !store.has(V.VAULT_STORE_KEY),
       'v34 M6: the materialized legacy entry adopts on its first unlock, same as the key form');
    /* no plaintext secret anywhere in storage, ever */
    const allStored = [...store.values()].join('\n');
    ok(!allStored.includes(phrase) && !allStored.includes(KEY2),
       'v34 M6: no stored value ever contains a phrase or a private key');
  } finally {
    delete globalThis.localStorage;
  }

  /* ---- D18: import causes + the create-flow address ---- */
  ok(await V.checkMnemonicDetail('abandon '.repeat(11) + 'about') === 'ok',
     'v34 D18: the known-good BIP39 vector passes');
  ok(await V.checkMnemonicDetail('abandon '.repeat(12).trim()) === 'checksum',
     'v34 D18: a word-list phrase with a bad checksum is named as a checksum failure');
  ok(await V.checkMnemonicDetail('abandon zzzzz') === 'count',
     'v34 D18: a wrong word count is named');
  ok(await V.checkMnemonicDetail('abandon '.repeat(11) + 'zzzzz') === 'unknown',
     'v34 D18: a word outside the list is named');
  const ciKey = await V.classifyImportSecret('0x' + 'ab'.repeat(32));
  ok(ciKey.kind === 'key', 'v34 D18: a 0x key classifies as a key');
  ok((await V.classifyImportSecret('0x1234')).error === 'badkey' &&
     (await V.classifyImportSecret('ab'.repeat(32))).error === 'badkey',
     'v34 D18: malformed keys (short 0x, bare hex) are badkey, not a phrase attempt');
  ok((await V.classifyImportSecret('abandon '.repeat(12).trim())).error === 'checksum' &&
     (await V.classifyImportSecret('two words')).error === 'badwords',
     'v34 D18: phrase failures map to the specific import errors');
  ok(VS.includes('id="pwCreateAddr"') && VS.includes('deriveFromPhrase(pwDraft.secret)'),
     'v34 D18: the create flow derives + shows the address on the phrase screen, before the password step');
  ok(VS.includes('p1.length < 6') && !VS.includes('p1.length < 8'),
     'v34 D18: the password minimum is the app’s 6 (existing longer passwords unaffected)');
  for (const k of ['pwImportBadKey', 'pwImportBadWords', 'pwImportUnknownWord', 'pwImportBadChecksum', 'pwCreateAddrLbl']) {
    ok((VS.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v34 D18: ' + k + ' exists in both languages');
  }

  /* ---- D11: exact amounts ---- */
  ok(V.fmtExactAmt(1234567890123456789n, 18) === '1.234567890123456789' &&
     V.fmtAmt(1234567890123456789n, 18) === '1.234567',
     'v34 D11: the exact figure keeps full precision where the short one truncates');
  ok(V.fmtExactAmt(1000000n, 6) === '1' && V.fmtExactAmt(0n, 18) === '0' &&
     V.fmtExactAmt(1234500000n, 6) === '1,234.5',
     'v34 D11: exact formatting trims trailing zeros and groups thousands');
  const unlockedBody = VS.slice(VS.indexOf('function renderPwUnlocked(area)'), VS.indexOf('async function pwDoDepWd'));
  ok((unlockedBody.match(/class="asset-amt amt-tap"/g) || []).length === 7 && unlockedBody.includes('id="pwNameCawBal"') &&
     unlockedBody.includes("pwSetAmt('pwNameCawBal', fmtQcaw(acting.balance), fmtExactAmt(acting.balance, 18))"),
     'v34 D11: seven tappable asset rows in the app order, the in-name CAW row fed by the acting name');

  /* ---- M6 UI wiring ---- */
  ok(VS.includes('function renderPwAdd(area)') && VS.includes("pwView === 'add'") &&
     VS.includes("get('add')") && VS.includes("'?wallet=1&add=1'"),
     'v34 M6: the add-a-wallet chooser exists and Settings’ Add lands on it via ?wallet=1&add=1');
  ok(VS.includes('data-wpick') && VS.includes("pwSetUnlockTarget(w && w.address ? w.address : 'anon')"),
     'v34 M6: the locked view’s picker chooses which wallet the password opens');
  ok(VS.includes('function pwBeginSwitch(address)') && VS.includes('pwLock();') &&
     VS.includes('function pwDeleteWallet(address)') && VS.includes('walletsRemove(address)'),
     'v34 M6: switch locks first and asks the target’s password; delete is per-wallet');
  ok(VS.includes('id="pwWalletsCard"') && VS.includes('function walletRowsHtml(reg, namesMap)'),
     'v34 M6: the wallet view carries the wallets card built by the shared row builder');
  {
    const rowsSrc = VS.slice(VS.indexOf('function walletShortLabel'), VS.indexOf('function pwBeginSwitch'));
    const walletRowsHtml = new Function('T', 'esc', 'pwSession', 'tokensOf', 'walletsLoad', 'pwNames',
      rowsSrc + '\nreturn walletRowsHtml;')(
      { pwWalletLegacy: 'LEGACY', pwWalletKindPhrase: 'PHRASE', pwWalletKindKey: 'KEY', pwInUse: 'IN USE',
        pwSwitchBtn: 'SWITCH', setNoWallet: 'NONE' },
      s => String(s), { address: '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, async () => [], () => ({}), []);
    const html = walletRowsHtml({ active: null, wallets: [
      { address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', kind: 'phrase', vault: {} },
      { address: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', kind: 'key', vault: {} },
    ] }, { '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb': ['@neptune'] });
    ok(html.includes('0xaaaaaaaa…aaaaaa') && html.includes('IN USE') && !html.includes('data-wswitch="0xaaaa'),
       'v34 M6 behaviour: the session wallet is marked in use and offers no switch button');
    ok(html.includes('data-wswitch="0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"') && html.includes('@neptune'),
       'v34 M6 behaviour: other wallets offer Switch and show their names when known');
  }

  /* ---- M15: the Settings view ---- */
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="viewSettings"') && html.includes('id="settingsArea"') &&
       (html.match(/data-nav="settings"/g) || []).length === 2,
       'v34 M15: ' + label + ' carries the settings view and both chrome Settings links');
  }
  const setBody = VS.slice(VS.indexOf('function renderSettings()'), VS.indexOf('async function renderNamesScreen()'));
  ok(setBody.includes('setWalletList') && setBody.includes('setAddWallet') && setBody.includes('setLockNow') &&
     setBody.includes('setCopyAddr') && setBody.includes('data-setdel') && setBody.includes('renderPwRemove') &&
     setBody.includes('one.guppyguide.cawsocial') && setBody.includes('T.setVersionLbl') && setBody.includes('T.setViewsNote'),
     'v34 M15: Settings gathers language, address+copy, backup, wallets+add, lock, about (app text + views note + version + app id) and the per-wallet danger zone');
  ok(VS.includes("const settingsQuery = new URLSearchParams(location.search).get('settings')") &&
     VS.includes('settingsQuery) renderSettings();') &&
     VS.includes("else if (settingsQuery) {"),
     'v34 M15: ?settings=1 routes to the view and wallet changes re-render it');
  ok(!enHtml.includes('No real send from this web version') &&
     !jaHtml.includes('最初の送信が、その確認になります') &&
     enHtml.includes('Sends from this web version are live') && jaHtml.includes('Web版からの送信も使えます'),
     'v34 M15: the right-rail About card no longer claims sends are unexercised (they work since v28)');

  /* ---- D23/D24: tab bar + drawer rows ---- */
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="tabProfileRow"') && html.includes('id="ntBadgeSide"') && html.includes('id="ntBadgeDrawer"') &&
       html.includes('id="sideNamesIc"') && html.includes('id="drawerNamesIc"'),
       'v34 D23/D24: ' + label + ' carries the profile tab, both row badges and both my-names icon slots');
    const chrome = html.slice(0, html.indexOf('<nav class="bottomnav"'));
    const rIdx = chrome.indexOf('data-nav="reactions"');
    ok(rIdx > chrome.indexOf('data-nav="bookmarks"') && rIdx < chrome.indexOf('data-nav="settings"'),
       'v34 D24: ' + label + ' the Reactions row sits after Bookmarks, before Settings, in sidebar + drawer');
  }
  ok(VS.includes("'ntBadge', 'ntBadgeSide', 'ntBadgeDrawer'"),
     'v34 D24: one badge writer keeps the tab + both row badges in step');
  ok(VS.includes("tabProf.setAttribute('href', pwProfileTarget(acting, !!pwSession))") &&
     VS.includes('ic.dataset.glyph'),
     'v34 D23/D24: syncChrome rewrites the Profile tab by the three-way rule and swaps the my-names icon to the acting avatar');
  {
    const ptSrc = VS.slice(VS.indexOf('function pwProfileTarget'), VS.indexOf('async function syncChrome'));
    const pwProfileTarget = new Function('pageFile', 'profUrl', ptSrc + '\nreturn pwProfileTarget;')(
      'en.html', n => 'en.html?name=' + encodeURIComponent(n));
    ok(pwProfileTarget({ username: 'neptune' }, true) === 'en.html?name=neptune' &&
       pwProfileTarget(null, true) === 'en.html?getname=1' &&
       pwProfileTarget(null, false) === 'en.html?wallet=1&next=profile',
       'v34 D23 behaviour: the profile target rule — acting → own profile, nameless-unlocked → name desk, locked → wallet ?next=profile');
  }
  for (const k of ['pwAddTitle', 'pwWalletsTitle', 'pwSwitchBtn', 'pwInUse', 'pwRevealCopy',
                   'setTitle', 'setLockNow', 'setDangerTitle', 'pwAmtTapHint', 'pwCawInNameLbl']) {
    ok((VS.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v34: ' + k + ' exists in both languages');
  }
}

console.log('— v35: multi-chain send, address book, faucet, DEX header + impact, directory search, bookmarks wiring, feed cache (batch 4b) —');
{
  const VS = viewerSrc;
  const appChains = fs.readFileSync(new URL('../../caw-social-app/src/lib/chains.ts', import.meta.url), 'utf8');
  const appSend = fs.readFileSync(new URL('../../caw-social-app/src/lib/sendAssets.ts', import.meta.url), 'utf8');
  const appFaucet = fs.readFileSync(new URL('../../caw-social-app/src/lib/faucet.ts', import.meta.url), 'utf8');

  /* ---- M8: the multi-chain config matches the app ---- */
  ok(V.SEND_CHAINS.map(c => c.chainId).join(',') === '56,1,421018,766',
    'v35 M8: the four chains in the app order with the app chain ids');
  let cfgOk = true;
  for (const c of V.SEND_CHAINS) for (const u of c.rpcs) if (!appChains.includes(u)) cfgOk = false;
  ok(cfgOk, 'v35 M8: every RPC endpoint is the app\u2019s (chains.ts), none from memory');
  const usdt = Object.fromEntries(V.SEND_ASSETS.filter(a => a.symbol === 'USDT').map(a => [a.chain, a]));
  ok(usdt.bsc.token === '0x55d398326f99059fF775485246999027B3197955' && usdt.bsc.decimals === 18 &&
     usdt.ethereum.token === '0xdAC17F958D2ee523a2206206994597C13D831ec7' && usdt.ethereum.decimals === 6 &&
     usdt.infinite.token === '0xC2684966e5c95B2bc636FB4a1f3Da9Ad23d94753' && usdt.infinite.decimals === 18 &&
     appChains.includes(usdt.bsc.token) && appChains.includes(usdt.ethereum.token) && appChains.includes(usdt.infinite.token),
     'v35 M8: USDT addresses + decimals per chain match the app (BSC 18, ETH 6, 42 Chain 18)');
  ok(V.SEND_ASSETS.filter(a => a.chain === 'ql1').map(a => a.symbol).join(',') === 'QOM,qCAW,O,KET,HAWK,PHOENIX',
    'v35 M8: the QL1 set keeps the web\u2019s six (QOM + the five tokens)');
  ok(V.SEND_ASSETS.filter(a => a.chain !== 'ql1').map(a => a.id).join(',') === 'bsc:BNB,bsc:USDT,ethereum:ETH,ethereum:USDT,infinite:42,infinite:USDT',
    'v35 M8: the other chains carry the app\u2019s native + USDT sets');
  ok(V.SEND_GAS_UNITS.native === 21000n && V.SEND_GAS_UNITS.erc20 === 65000n && appSend.includes('21000n') && appSend.includes('65000n'),
    'v35 M8: gas units are the app\u2019s 21,000 / 65,000');
  ok(V.sendGasReserve('native', 1000000000n) === 25200000000000n && V.sendGasReserve('erc20', 1000000000n) === 78000000000000n,
    'v35 M8: the reserve is units x price x 1.2');
  const qomAsset = V.sendAssetById('ql1:QOM'), usdtEth = V.sendAssetById('ethereum:USDT');
  ok(V.sendMaxSendable(qomAsset, 1000000000000000000n, 1000000000n) === 1000000000000000000n - 25200000000000n &&
     V.sendMaxSendable(usdtEth, 5000000n, 20000000000n) === 5000000n &&
     V.sendMaxSendable(qomAsset, 100n, 1000000000n) === 0n,
     'v35 M8: MAX leaves the reserve for natives, is the full balance for tokens, never negative');
  const resEth = V.sendGasReserve('erc20', 20000000000n);
  ok(V.sendGasAffordable(usdtEth, resEth, 20000000000n) && !V.sendGasAffordable(usdtEth, resEth - 1n, 20000000000n),
    'v35 M8: gas affordability is the reserve comparison');
  const addrTo = '0x' + '11'.repeat(20);
  const reqN = V.buildSendTxReq(qomAsset, addrTo, 5n);
  ok(reqN.to === addrTo && reqN.data === '0x' && reqN.value === 5n, 'v35 M8: a native send is a plain value transfer');
  const reqE = V.buildSendTxReq(usdtEth, addrTo, 5n);
  ok(reqE.to === usdtEth.token && reqE.value === 0n && reqE.data === V.buildTransferData(addrTo, 5n),
    'v35 M8: a token send is transfer() to the contract');
  ok(V.SEND_FALLBACK_GAS_PRICE.bsc === 3000000000n && V.SEND_FALLBACK_GAS_PRICE.ethereum === 20000000000n &&
     V.SEND_FALLBACK_GAS_PRICE.infinite === 6000000000n && V.SEND_FALLBACK_GAS_PRICE.ql1 === 1000000000n,
     'v35 M8: fallback gas prices are the app\u2019s table (3 / 20 / 6 / 1 gwei)');
  ok((VS.match(/eth_sendRawTransaction/g) || []).length === 1 &&
     VS.includes('async function sendChainTx(privBytes, opts)') &&
     VS.includes('return sendChainTx(privBytes, { ...(opts || {}), chain: SEND_CHAIN_QL1 });') &&
     VS.includes('chainId: chain.chainId'),
     'v35 M8: sendLocalTx is the QL1 case of sendChainTx — still exactly one raw-send site, EIP-155 per chain');
  ok(VS.includes('id="pwSendPasteBtn"') && VS.includes('id="pwSendBookBtn"') && VS.includes('id="pwSendBookChips"') &&
     VS.includes('data-sendchip') && VS.includes('navigator.clipboard.readText()'),
     'v35 M8: the send card carries paste, the book toggle + chips and the % chips');
  const sendBody35 = VS.slice(VS.indexOf('async function pwDoSend()'), VS.indexOf('/* ----- v35 (M9): the faucet sheet'));
  ok(sendBody35.includes('[T.sendChainLbl, chain.label]') && sendBody35.includes('[T.sendTo, to]') &&
     sendBody35.includes('[T.sendGas,') && sendBody35.includes('T.sendLowGas') &&
     sendBody35.includes('T.sendSaveOffer') && sendBody35.includes('bookAddEntry'),
     'v35 M8: the confirm shows the chain, the FULL recipient and the fee; thin gas warns; a new recipient gets the save offer');

  /* ---- M8: the address book, behaviour against stub storage ---- */
  {
    const store = new Map();
    globalThis.localStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    try {
      const W = '0x' + 'AA'.repeat(20), A1 = '0x' + '11'.repeat(20), A2 = '0x' + '22'.repeat(20);
      ok(V.bookEntries(W).length === 0, 'v35 M8: an untouched book reads empty');
      let entries = V.bookAddEntry([], 'Exchange', A1, 111);
      ok(entries.length === 1 && entries[0].label === 'Exchange' && entries[0].addedAt === 111, 'v35 M8: add appends a labelled entry');
      let code = null;
      try { V.bookAddEntry(entries, 'Again', A1.toLowerCase()); } catch (e) { code = e.message; }
      ok(code === 'duplicate', 'v35 M8: a duplicate address (any case) is refused as duplicate');
      try { V.bookAddEntry(entries, '  ', A2); } catch (e) { code = e.message; }
      ok(code === 'bad-label', 'v35 M8: an empty label is bad-label');
      try { V.bookAddEntry(entries, 'X', '0x123'); } catch (e) { code = e.message; }
      ok(code === 'bad-address', 'v35 M8: a malformed address is bad-address');
      entries = V.bookAddEntry(entries, 'Second', A2, 222);
      entries = V.bookUpdateEntry(entries, A1.toLowerCase(), 'Main exchange');
      ok(V.bookFindEntry(entries, A1).label === 'Main exchange', 'v35 M8: edit renames in place (case-insensitive match)');
      try { V.bookUpdateEntry(entries, '0x' + '33'.repeat(20), 'Nope'); } catch (e) { code = e.message; }
      ok(code === 'not-found', 'v35 M8: editing an unknown address is not-found');
      V.bookPersist(W, entries);
      const back = V.bookEntries(W);
      ok(back.length === 2 && back[1].address === A2, 'v35 M8: the book persists per wallet and reads back');
      ok(V.bookEntries('0x' + 'BB'.repeat(20)).length === 0, 'v35 M8: another wallet\u2019s book is separate');
      const afterRm = V.bookRemoveEntry(back, A1);
      ok(afterRm.length === 1 && afterRm[0].address === A2, 'v35 M8: remove drops just that entry');
      ok(!/secret|phrase|private/i.test(store.get(V.bookKeyFor(W)) || ''), 'v35 M8: the stored book holds labels + public addresses only');
    } finally { delete globalThis.localStorage; }
  }

  /* ---- M9: the faucet client ---- */
  ok(V.FAUCET_BASE === 'https://42-faucet.nepicobsv.workers.dev' && appFaucet.includes(V.FAUCET_BASE),
    'v35 M9: the faucet Worker is the app\u2019s');
  ok(V.FAUCET_POOLS.map(p => p.chain + ':' + p.token + ':' + p.sym).join(',') === '42:native:42,ql1:native:QOM,42:zap:ZAP',
    'v35 M9: the three pools — [42], QOM, ZAP');
  ok(V.FAUCET_ERROR_CODES.length === 10 && V.FAUCET_ERROR_CODES.every(c => appFaucet.includes("'" + c + "'")),
    'v35 M9: the error taxonomy is the app\u2019s ten codes');
  ok(V.FAUCET_ERROR_CODES.every(c => V.faucetErrorTKey(c) !== 'fcErrFailed') && V.faucetErrorTKey('something-else') === 'fcErrFailed',
    'v35 M9: every known code maps to its own message; unknown codes fall back');
  ok(V.isCooldownCode('address_cooldown') && V.isCooldownCode('ip_cooldown') && !V.isCooldownCode('daily_limit'),
    'v35 M9: only the two cooldown codes carry a retry-after');
  ok(JSON.stringify(V.faucetRetryParts(7 * 86400)) === JSON.stringify({ unit: 'days', n: 7 }) &&
     JSON.stringify(V.faucetRetryParts(5 * 3600)) === JSON.stringify({ unit: 'hours', n: 5 }) &&
     JSON.stringify(V.faucetRetryParts(30 * 60)) === JSON.stringify({ unit: 'minutes', n: 30 }) &&
     JSON.stringify(V.faucetRetryParts(36 * 3600)) === JSON.stringify({ unit: 'days', n: 2 }) &&
     JSON.stringify(V.faucetRetryParts(90 * 60)) === JSON.stringify({ unit: 'hours', n: 2 }),
     'v35 M9: retry-after buckets — >=36h days, >=90m hours, else minutes (ceil)');
  {
    const okFetch = async (url) => {
      if (url.endsWith('/claim')) return { ok: true, json: async () => ({ ok: true, txHash: '0xabc', amount: '10000000', explorerUrl: 'https://scan.example/tx/0xabc' }) };
      return { ok: true, json: async () => ({ ready: true, claimAmount: '10,000,000', symbol: 'QOM', chain: 'ql1', token: 'native' }) };
    };
    const st = await V.fetchFaucetStatus(V.FAUCET_POOLS[1], okFetch);
    ok(st && st.claimAmount === '10,000,000', 'v35 M9: status reads through and requires the claimAmount');
    const done = await V.claimFaucet(V.FAUCET_POOLS[1], addrTo, okFetch);
    ok(done.ok === true && done.txHash === '0xabc' && done.amount === '10000000', 'v35 M9: a claim returns the hash + amount');
    const cdFetch = async () => ({ ok: false, json: async () => ({ ok: false, code: 'address_cooldown', retryAfterSec: 90000 }) });
    const cd = await V.claimFaucet(V.FAUCET_POOLS[0], addrTo, cdFetch);
    ok(cd.ok === false && cd.code === 'address_cooldown' && cd.retryAfterSec === 90000,
      'v35 M9: a cooldown rejection keeps its code + retryAfterSec');
    const net = await V.claimFaucet(V.FAUCET_POOLS[0], addrTo, async () => { throw new Error('down'); });
    ok(net.ok === false && net.code === 'network', 'v35 M9: a failed request is the network code, distinct from Worker codes');
    const badStatus = await V.fetchFaucetStatus(V.FAUCET_POOLS[0], async () => ({ ok: true, json: async () => ({ nope: 1 }) }));
    ok(badStatus === null, 'v35 M9: a status without claimAmount reads as unavailable');
  }
  const liveSt = await V.fetchFaucetStatus(V.FAUCET_POOLS[1]).catch(() => null);
  ok(liveSt === null || typeof liveSt.claimAmount === 'string',
    'v35 M9: the live faucet status has the expected shape (any pool state, preparation mode included)',
    liveSt ? String(liveSt.claimAmount) : 'unreachable');
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('id="faucetOverlay"') && html.includes('id="faucetPools"') && html.includes('id="faucetCloseBtn"') &&
       html.includes('id="lookupMatches"'),
       'v35: ' + label + ' carries the faucet sheet and the lookup matches box');
  }
  ok((VS.match(/js-faucet-open/g) || []).length >= 3 && VS.includes('fb.onclick = () => openFaucet();'),
    'v35 M9: faucet entry points — the DEX header pill + both gas-shortage guidances');

  /* ---- M10: the DEX header extras ---- */
  ok(VS.includes('dex-deposit') && VS.includes('id="dexCopyAddrBtn"') && VS.includes('?wallet=1&send=1') &&
     VS.includes('navigator.clipboard.writeText(pwSession.address)'),
     'v35 M10: the DEX header carries the deposit card (address + copy) and the Send pill jump');

  /* ---- D10: price impact ---- */
  ok(Math.abs(V.priceImpactPct(1000n, 990n, 1000n) - 1) < 1e-9 && V.priceImpactPct(1000n, 1000n, 1000n) === 0 &&
     V.priceImpactPct(1000n, 500n, null) === null && V.priceImpactPct(1000n, 500n, 0n) === null,
     'v35 D10: impact = (1 - out/spot) x 100; an unknown or empty spot reads as no impact');
  ok(V.dexSpotOutFromDust(10000n, 100n, 250n) === 25000n && V.dexSpotOutFromDust(10000n, 0n, 250n) === null &&
     V.dexSpotOutFromDust(10000n, 100n, 0n) === null,
     'v35 D10: the dust quote scales up to the spot output; a failed dust quote gives none');
  const dexBody35 = VS.slice(VS.indexOf('async function dexRefreshQuote()'), VS.indexOf('const dexPathSyms'));
  ok(dexBody35.includes('dexSpotOutFromDust(') && dexBody35.includes('priceImpactPct(') && dexBody35.includes('amountIn / 100n'),
    'v35 D10: the quote flow prices the impact from a 1% dust quote along the winning path');
  ok(VS.includes('q.impactPct >= 1') && VS.includes('T.dexImpact'), 'v35 D10: the impact line shows only at >= 1%');

  /* ---- M12: directory partial matches at the lookup desk ---- */
  ok(VS.includes("addEventListener('input', onLookupInput)") && VS.includes('function renderLookupMatches()') &&
     VS.includes('searchNameDirectory(q, 12)') && VS.includes('T.dirBuilding'),
     'v35 M12: typing in the lookup desk renders directory partial matches with the build progress');
  ok(typeof V.nameDirStatus === 'function' && V.nameDirStatus().done >= 0 && typeof V.nameDirStatus().complete === 'boolean',
    'v35 M12: the directory status reports done/total/complete');

  /* ---- D13: bookmarks render the action buttons non-wired ---- */
  const cardBody35 = VS.slice(VS.indexOf('async function postCard('), VS.indexOf('async function recawCard('));
  ok(cardBody35.includes('opts.noActions') &&
     cardBody35.includes("noAct ? ' disabled' : ' data-act=\"like\"'") &&
     cardBody35.includes("noAct ? ' disabled' : ' data-act=\"recaw\"'") &&
     cardBody35.includes("noAct ? ' disabled' : ' data-act=\"super\"'"),
     'v35 D13: with noActions the like/Recaw/SuperLike buttons render hookless + disabled (my-state still paints)');
  ok(cardBody35.includes('data-act="reply"') && cardBody35.includes('data-act="bookmark"'),
    'v35 D13: reply + the bookmark toggle stay wired on every card');

  /* ---- D20: the feed cache ---- */
  {
    const store = new Map();
    globalThis.sessionStorage = {
      getItem: k => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: k => store.delete(k),
    };
    try {
      const item = { type: 0, senderId: 190n, receiverId: 0n, ts: 1760000000, sender: '0x' + 'ab'.repeat(20), cawId: '0x' + 'cd'.repeat(32), text: 'hello', hash: '0x' + 'ef'.repeat(32), blockTs: 'x', block: 123, txIndex: 4 };
      V.feedCacheSave([item]);
      const back = V.feedCacheLoad();
      ok(back.length === 1 && back[0].senderId === 190n && back[0].cawId === item.cawId && back[0].block === 123 && back[0].text === 'hello',
        'v35 D20: a feed item round-trips through the cache (bigints revived)');
      const big = { ...item, text: 'x'.repeat(30000) };
      V.feedCacheSave([big, big, big]);
      const capped = V.feedCacheLoad();
      ok(capped.length >= 1 && capped.length < 3 && (store.get(V.FEED_CACHE_KEY) || '').length <= V.FEED_CACHE_MAX_CHARS,
        'v35 D20: an oversized page sheds tail items until the record fits the cap');
      ok(!/secret|phrase|private/i.test(store.get(V.FEED_CACHE_KEY) || ''), 'v35 D20: the cache holds public post data only');
    } finally { delete globalThis.sessionStorage; }
  }
  const tlBody35 = VS.slice(VS.indexOf('async function loadTimeline(append)'), VS.indexOf('/* ---------- new-posts pill'));
  ok(tlBody35.includes('feedCacheLoad()') && tlBody35.includes('feedCacheSave('),
    'v35 D20: the timeline paints from the cache and re-saves the fresh head');

  /* ---- every new string in both languages ---- */
  for (const k of ['sendTitle', 'sendPickAsset', 'sendTo', 'sendPaste', 'sendBadAddress', 'sendAmount', 'sendOver', 'sendBook',
                   'sendConfirmTitle', 'sendGas', 'sendSent', 'sendSaveOffer', 'sendLowGas', 'fcTitle', 'fcIntro', 'fcClaim',
                   'fcDoneAmt', 'fcLeft', 'fcNotReady', 'fcLoadFailed', 'fcErrAddrCd', 'fcErrDaily', 'fcErrFailed',
                   'dexImpact', 'dexDepositTitle', 'dexDepositSame', 'dexCopyAddr']) {
    ok((VS.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v35: ' + k + ' exists in both languages');
  }
}

console.log('— v36: twenty languages + RTL (M14) —');
{
  const B = await import('./build-i18n.mjs');
  const appI18nSrc = fs.readFileSync(new URL('../../caw-social-app/src/i18n.ts', import.meta.url), 'utf8');
  const appDicts = B.loadAppDicts(appI18nSrc);
  const webDicts = B.loadWebDicts(viewerSrc);
  const mapping = B.buildMapping(webDicts, appDicts);
  const indexHtml = read('../docs/index.html');
  const css36 = read('../docs/style.css');
  const codes = B.LANGS.map(([c]) => c);
  const enNavSeq = [...enHtml.matchAll(/data-nav="([^"]+)"/g)].map(m => m[1]).join(',');

  /* the language table matches the app's LANGS (codes + native labels) */
  const appLangs = [...appI18nSrc.matchAll(/\{ code: '([a-z]{2})', label: '([^']+)' \}/g)]
    .map(m => ({ code: m[1], label: m[2] }));
  ok(JSON.stringify(V.CAW_LANGS) === JSON.stringify(appLangs),
    'v36 M14: CAW_LANGS is the app\u2019s twenty languages with their native names');
  ok(JSON.stringify(V.CAW_RTL) === JSON.stringify(['fa', 'ar']), 'v36 M14: fa + ar are the RTL pair');
  ok(codes.every(c => V.CAW_LOCALES[c]), 'v36 M14: every language has a date locale');
  ok(V.LANG === 'en' && V.T === V.T_EMBEDDED.en, 'v36 M14: with no shell language, the viewer boots English');

  /* the root gate knows all twenty */
  ok(codes.every(c => indexHtml.includes("'" + c + "'")) && indexHtml.includes('caw-lang'),
    'v36 M14: the root gate routes by stored caw-lang / browser language across all twenty shells');

  /* per-language shells */
  for (const [code] of B.LANGS) {
    const html = read('../docs/' + code + '.html');
    const rtl = B.RTL_LANGS.includes(code);
    ok(html.includes('<html lang="' + code + '" dir="' + (rtl ? 'rtl' : 'ltr') + '">'),
      'v36 M14: ' + code + '.html declares lang=' + code + ' dir=' + (rtl ? 'rtl' : 'ltr'));
    ok(html.includes('viewer.js?v=40') && html.includes('style.css?v=40') && html.includes('__cawViewerBooted'),
      'v36 M14: ' + code + '.html loads the v40 assets + watchdog');
    ok([...html.matchAll(/data-nav="([^"]+)"/g)].map(m => m[1]).join(',') === enNavSeq,
      'v36 M14: ' + code + '.html nav rows match the en shell, row for row');
    ok((html.match(/class="lang-slot"/g) || []).length === 2,
      'v36 M14: ' + code + '.html carries both language-picker slots');
    ok(codes.every(o => o === code || !html.includes('href="' + o + '.html')),
      'v36 M14: ' + code + '.html links only at its own shell');
    if (rtl) ok(html.includes('>→<') && !html.includes('>←<'), 'v36 M14: ' + code + '.html back arrows point forward (RTL)');
    else ok(html.includes('>←<'), 'v36 M14: ' + code + '.html back arrows point back');
    if (code !== 'en' && code !== 'ja') {
      const at = html.indexOf('dict-' + code + '.js?v=40');
      ok(at >= 0 && at < html.indexOf('viewer.js?v=40'),
        'v36 M14: ' + code + '.html loads its dict before viewer.js');
      ok(!html.includes('var ja ='), 'v36 M14: ' + code + '.html theme script has its labels baked in');
    }
    ok(swSrc.includes("'" + code + ".html'"), 'v36 M14: sw.js precaches ' + code + '.html');
  }

  /* per-language dicts: complete, fresh, placeholder-safe */
  const enKeys = Object.keys(webDicts.en);
  const tokSet = s => [...String(s).matchAll(/\{[a-zA-Z]+\}/g)].map(m => m[0]);
  for (const [code] of B.LANGS) {
    if (code === 'en' || code === 'ja') continue;
    const src = read('../docs/dict-' + code + '.js');
    const w = {};
    new Function('window', src)(w);
    const d = w.__CAW_T;
    ok(d && typeof d === 'object', 'v36 M14: dict-' + code + '.js sets window.__CAW_T');
    ok(d && JSON.stringify(Object.keys(d).sort()) === JSON.stringify([...enKeys].sort()),
      'v36 M14: dict-' + code + ' covers the full key set (' + enKeys.length + ' keys, no blanks)');
    ok(d && Object.values(d).every(v => typeof v === 'string' && v.length > 0),
      'v36 M14: dict-' + code + ' values are all non-empty strings');
    const { dict: fresh, fallbacks } = B.buildDict(code, webDicts, appDicts, mapping);
    ok(JSON.stringify(d) === JSON.stringify(fresh),
      'v36 M14: dict-' + code + ' matches a fresh regeneration from the app i18n');
    /* v39: the cap moves 200 -> 203 — the three hidden-media
       list keys (modHiddenMediaLbl / modNoneHiddenMedia /
       modHiddenMeta) are web-only UI with no app counterpart,
       so each is one more English fallback per dict; the
       translated bulk (320) is unchanged. */
    ok(fallbacks.length <= 203 && enKeys.length - fallbacks.length >= 300,
      'v36 M14: dict-' + code + ' translates the bulk of the UI', (enKeys.length - fallbacks.length) + ' translated, ' + fallbacks.length + ' English fallbacks');
    ok(d && enKeys.every(k => tokSet(d[k]).every(t => tokSet(webDicts.en[k]).includes(t))),
      'v36 M14: dict-' + code + ' never demands a placeholder the web does not supply');
    ok(swSrc.includes("'dict-" + code + ".js'"), 'v36 M14: sw.js precaches dict-' + code + '.js');
  }

  /* the picker + settings list are wired to all twenty */
  ok(viewerSrc.includes("querySelectorAll('.lang-slot')") && viewerSrc.includes('location.search + location.hash'),
    'v36 M14: wireLangPickers fills the slots, links keeping the current query + fragment');
  const setBody = viewerSrc.slice(viewerSrc.indexOf('function renderSettings()'), viewerSrc.indexOf('async function renderNamesScreen()'));
  ok(setBody.includes('CAW_LANGS.map') && setBody.includes('l.code === LANG'),
    'v36 M14: the Settings language section lists all twenty, current checked');
  ok(css36.includes('.lang-list') && css36.includes('[dir="rtl"] .drawer-panel') &&
     css36.includes('[dir="rtl"] .drawer.open .drawer-panel') && css36.includes('[dir="rtl"] .pw-safety'),
    'v36 M14: the stylesheet carries the picker styles + the RTL mirror block');

  /* relTime suffixes come from the table now, in both embedded languages */
  for (const k of ['relMin', 'relHour', 'relDay']) {
    ok((viewerSrc.match(new RegExp(k + ':', 'g')) || []).length === 2, 'v36: ' + k + ' exists in both embedded languages');
  }
  /* v37 (B-P2): relTime IS the app's formatRelativeTime now —
     plain compact literals in every language; the localised
     suffix keys stay in the tables (checked above) but are no
     longer read. */
  ok(viewerSrc.includes("return diff + 's'") && viewerSrc.includes("return m + 'm'") &&
     viewerSrc.includes("return h + 'h'") && viewerSrc.includes("return d + 'd'") &&
     !viewerSrc.includes('m + T.relMin'),
    'v37: relTime uses the app\u2019s compact literals, not the localised suffixes');
  ok((viewerSrc.match(/CAW Social — web v40/g) || []).length === 2, 'v40: the version label reads web v40 in both embedded languages');

  /* stub-DOM boots: es and ar render from their dicts */
  const headSrc = viewerSrc.slice(0, viewerSrc.indexOf('/* ---------- minimal ABI helpers'));
  const bootLang = (code, dictSrc) => {
    const store = new Map();
    const win = {};
    if (dictSrc) new Function('window', dictSrc)(win);
    const api = new Function('document', 'window', 'localStorage',
      headSrc + '\nreturn { T, LANG };')(
      { documentElement: { lang: code } }, win,
      { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) });
    return { api, store };
  };
  {
    const { api, store } = bootLang('es', read('../docs/dict-es.js'));
    ok(api.LANG === 'es' && store.get('caw-lang') === 'es', 'v36 M14: an es shell boots as Spanish and stores caw-lang');
    ok(api.T.moreBtn === appDicts.es['tl.more'] && api.T.compPh === appDicts.es['compose.ph'],
      'v36 M14: the es boot renders composer/home strings from the Spanish dict');
    /* v37 (Audit A): noticeTitle is one of the 13 removed dead
       keys — the fallback witness is statsTitle now (a live
       web-only key). */
    ok(api.T.statsTitle === webDicts.en.statsTitle && api.T.relMin === 'm',
      'v36 M14: web-only keys fall back to English inside the es boot (no blanks)');
  }
  {
    const { api } = bootLang('ar', read('../docs/dict-ar.js'));
    ok(api.LANG === 'ar' && api.T.moreBtn === appDicts.ar['tl.more'] && api.T.setLanguage === appDicts.ar['settings.language'],
      'v36 M14: an ar (RTL) boot renders from the Arabic dict');
  }
  {
    const { api } = bootLang('ja', null);
    ok(api.LANG === 'ja' && api.T.moreBtn === 'もっと見る',
      'v36 M14: a ja boot still renders the embedded Japanese table');
  }
}

console.log('— v37: app-feel batch (feel-audit-v36: Audit A cleanup + Audit B) —');
{
  const B37 = await import('./build-i18n.mjs');
  const web37 = B37.loadWebDicts(viewerSrc);
  const css37 = read('../docs/style.css');
  const DEAD_KEYS = ['noWallet', 'mintNote', 'connectBtn', 'connectFail', 'connectedLbl', 'wrongChain',
    'switchBtn', 'switchFail', 'sendingWallet', 'sentUnconfirmed', 'myNamesConnect', 'noticeTitle', 'noticeText'];

  /* Audit A: the 13 dead injected-wallet keys are gone from
     every table at the source — embedded EN + JA, the build
     script's mapping, and every generated dict. */
  for (const k of DEAD_KEYS) {
    ok(!(k in web37.en) && !(k in web37.ja), 'v37 A: ' + k + ' is absent from the embedded EN + JA tables');
    ok(!new RegExp('(^|[^A-Za-z])' + k + ':', 'm').test(viewerSrc), 'v37 A: no ' + k + ' definition or reference remains in viewer.js');
  }
  const buildSrc37 = read('./build-i18n.mjs');
  ok(!buildSrc37.includes('sentUnconfirmed'), 'v37 A: the build mapping no longer names sentUnconfirmed');
  ok(!B37.buildMapping(web37, B37.loadAppDicts(fs.readFileSync(new URL('../../caw-social-app/src/i18n.ts', import.meta.url), 'utf8'))).sentUnconfirmed,
    'v37 A: a fresh mapping cannot resurrect sentUnconfirmed');
  for (const [code] of B37.LANGS) {
    if (code === 'en' || code === 'ja') continue;
    const w = {}; new Function('window', read('../docs/dict-' + code + '.js'))(w);
    ok(w.__CAW_T && DEAD_KEYS.every(k => !(k in w.__CAW_T)), 'v37 A: dict-' + code + ' carries none of the 13 dead keys');
  }
  ok(Object.keys(web37.en).length === 523 && Object.keys(web37.ja).length === 523,
    'v37 A + v38 + v39: the tables hold 523 keys (484 after the dead-key cleanup, + the 36 v38 moderation keys, + the 3 v39 hidden-media list keys)');
  ok(!css37.includes('#walletArea {') && !css37.includes('button.big-connect {'),
    'v37 A: the dead CSS rules (#walletArea, button.big-connect) are gone');
  ok(!/window\.ethereum|eth_requestAccounts/.test(viewerSrc),
    'v37 A: no injected-wallet provider code exists anywhere in viewer.js');

  /* B-G1: press feedback — :active rules cover the main
     interactive classes (the stylesheet had none before v37). */
  for (const sel of ['.xact:active', '.post.clickable:active', '.name-row:active', '.menu-row:active',
                     '.acting-row:active', '.count-cell:active', '.lookup-match:active', '.name-pick-row:active',
                     '.lang-it:active', '.nav-it:active', '.nt-row.clickable:active', '.quotebox:active',
                     '.back-link:active', '.ptab:active', '.bottomnav a:active', '.side-summary:active',
                     '.addr-chip:active', '.loadmore button:active', '.mn-use:active']) {
    ok(css37.includes(sel), 'v37 B-G1: press feedback covers ' + sel);
  }

  /* B-G2/G3: sheets slide up and stay bottom sheets at desktop
     widths (no centred-modal media rule). */
  ok(css37.includes('@keyframes sheet-up') && css37.includes('animation: sheet-up'),
    'v37 B-G2: sheets animate in with the slide-up keyframes');
  ok(!css37.includes('align-items: center; } .overlay .sheet'),
    'v37 B-G3: the >=700px centred-modal rule is deleted — sheets stay bottom sheets');

  /* B-HM1/B-C1: home composition + the composer sheet. */
  for (const [label, html] of [['en.html', enHtml], ['ja.html', jaHtml]]) {
    ok(html.includes('class="ptabs segtabs"') && html.includes('id="refreshBtn" class="seg-refresh"'),
      'v37 B-HM1: ' + label + ' home header is the segment + a quiet refresh icon');
    ok(html.includes('<div id="composeModalSlot"><div id="composerArea"></div></div>'),
      'v37 B-C1: ' + label + ' keeps the composer inside the compose sheet');
    ok(!html.includes('id="newPostsPill"') && !html.includes('id="newPostsBtn"'),
      'v37 B-HM2: ' + label + ' has no new-posts pill');
    ok(html.includes('class="search-pill"') && !html.includes('id="lookupBtn"'),
      'v37 B-S1: ' + label + ' lookup is a search pill with no separate button row');
    ok(html.includes('class="back-link text-back"') && (html.match(/class="sec-badge"/g) || []).length === 4,
      'v37 B-PR1/B-PD1: ' + label + ' profile uses the text back row; the post page has four section badges');
  }
  ok(viewerSrc.includes('function feedLoadingHtml()') && viewerSrc.includes('function emptyCardHtml('),
    'v37 B-ST2: the spinner + empty-card state builders exist');
  ok(!viewerSrc.includes('newPostsPill'), 'v37 B-HM2: viewer.js no longer references the pill');
  ok(!viewerSrc.includes('IntersectionObserver'), 'v37 B-HM4: no scroll-triggered auto-loading remains');

  /* B-HM3: the swipe decision functions behave like the app's
     feedSwipe (claim 24px + 2.2x dominance; switch at 60px;
     RTL inverts). */
  ok(V.swipeShouldClaim(25, 0) === true && V.swipeShouldClaim(24, 0) === false &&
     V.swipeShouldClaim(30, 20) === false && V.swipeShouldClaim(50, 20) === true,
    'v37 B-HM3 unit: the claim rule (24px, clearly horizontal-dominant)');
  ok(V.swipeTargetMode(-60, false) === 'following' && V.swipeTargetMode(60, false) === 'latest' &&
     V.swipeTargetMode(-59, false) === null && V.swipeTargetMode(60, true) === 'following' &&
     V.swipeTargetMode(-60, true) === 'latest',
    'v37 B-HM3 unit: the switch rule (60px; LTR left=F, right=L; RTL inverted)');
  ok(viewerSrc.includes('wireFeedSwipe'), 'v37 B-HM3: the feed swipe is wired on the home view');

  /* B-P1/P2: action-row metrics + the 12px sub-lines. */
  ok(!/\.pfoot\s*\{[^}]*max-width:\s*425px/.test(css37), 'v37 B-P1: the action row has no 425px cap');
  ok(css37.includes('.xact .icring svg { width: 16px'), 'v37 B-P1: action glyphs are 16px');
  ok(/\.subline\{[^}]*font-size:12px/.test(css37) && /\.meta \.sub-line \{[^}]*font-size: 12px/.test(css37),
    'v37 B-P2: sub-lines are 12px');

  /* B-P3: recaw avatar (also pinned in the v16 block) + the
     attribution at 12px. */
  ok(/\.recaw-attr\s*\{[^}]*font-size: 12px/.test(css37), 'v37 B-P3: the recaw attribution is 12px');

  /* B-R1: reaction rows carry the kind badge on the avatar. */
  ok(viewerSrc.includes('class="nt-badge ') && css37.includes('.nt-badge.k-like') && css37.includes('.nt-badge.k-recaw') &&
     css37.includes('.nt-badge.k-super') && !viewerSrc.includes('class="nt-ic '),
    'v37 B-R1: reaction rows badge the avatar by kind; the inline icon is gone');

  /* B-PR2: the profile audio is a pill button, not native controls. */
  ok(viewerSrc.includes('class="prof-audio" data-audio-src=') && !viewerSrc.includes('<audio controls'),
    'v37 B-PR2: the profile audio renders as the app-style pill');

  /* B-MN1/MN2 + B-W1/B-W2 + B-C2/B-C3 + B-ST1 + chrome pins. */
  ok(/\.mn-badge \{[^}]*background: var\(--accent\)/.test(css37) && css37.includes('.mn-use {'),
    'v37 B-MN: the posting-as badge is filled; the use button is the outlined accent pill');
  ok(css37.includes('.menu-row.lang-on') && viewerSrc.includes('menu-row lang-on'),
    'v37 B-W2: the current language row is highlighted in Settings');
  ok(css37.includes('#pwallet .asset-list') && /\.asset-amt\{[^}]*font-size:17px/.test(css37),
    'v37 B-W1: the wallet asset list is boxed; amounts are 17px/800');
  ok(/\.danger-btn \{[^}]*border: 1px solid #c62828/.test(css37), 'v37 B-W2: the danger button is the outlined red control');
  ok(css37.includes('.skel-line {\n  /* v37 (B-ST1)') && !css37.includes('skel-shimmer'),
    'v37 B-ST1: skeleton bars are static (no shimmer)');
  ok(!/\.topbar \{[^}]*backdrop-filter/.test(css37) && !/\.bottomnav \{[^}]*backdrop-filter/.test(css37),
    'v37 B-H1/B-H2: the top bar and tab bar are solid (no glass blur)');
  ok(css37.includes('.bottomnav a svg { width: 22px') && css37.includes('min-width: 19px'),
    'v37 B-H2: tab glyphs are 22px; the badge is 19px');
  ok(!/body:not\(\.can-compose\)/.test(css37),
    'v37 B-C1: the FAB / sidebar Post no longer hide when locked or nameless');
  ok(viewerSrc.includes('id="compHeadClose"') && viewerSrc.includes('esc(T.compPostAs)'),
    'v37 B-C1: the composer header carries the ✕ and the Post-as row');
}

console.log('— v38: moderation (admin UI + hidden-post filtering) —');
{
  const B38 = await import('./build-i18n.mjs');
  const web38 = B38.loadWebDicts(viewerSrc);
  const css38 = read('../docs/style.css');
  const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const CAW = '0x' + 'AB'.repeat(32);
  const CAW_L = CAW.toLowerCase();
  const HASH = 'CD'.repeat(32);
  const HASH_L = HASH.toLowerCase();

  /* The admin message, byte-exact against the server's
     buildAdminMessage (caw-media main.js): the media format
     plus a target: line before ts:, everything canonicalised
     to the lowercase forms clients must sign. */
  ok(V.buildAdminMessage({ action: 'hide-post', cawId: CAW, ts: 1700000000 }) ===
    ['CAW Media v1', 'action: hide-post', 'name: -', 'sha256: ' + EMPTY,
     'caw: ' + CAW_L, 'tx: -', 'target: -', 'ts: 1700000000'].join('\n'),
    'v38: hide-post message is byte-exact (empty hash, lowercase caw, dash placeholders)');
  ok(V.buildAdminMessage({ action: 'hide-icon', nameId: '190', sha256: HASH, ts: 1700000001 }) ===
    ['CAW Media v1', 'action: hide-icon', 'name: 190', 'sha256: ' + HASH_L,
     'caw: -', 'tx: -', 'target: -', 'ts: 1700000001'].join('\n'),
    'v38: a media op message pins the name id and the lowercase current hash');
  ok(V.buildAdminMessage({ action: 'appoint-admin', target: '0x90359C6913915B9824B9CE8ABF4B85B30A5CF8CC', ts: 1700000002 }) ===
    ['CAW Media v1', 'action: appoint-admin', 'name: -', 'sha256: ' + EMPTY,
     'caw: -', 'tx: -', 'target: 0x90359c6913915b9824b9ce8abf4b85b30a5cf8cc', 'ts: 1700000002'].join('\n'),
    'v38: appoint-by-address signs the lowercase target, name stays -');
  ok(V.buildAdminMessage({ action: 'revoke-admin', target: '0x' + 'EF'.repeat(20), ts: 1700000003 }).split('\n').length === 8 &&
     !V.buildAdminMessage({ action: 'hide-post', cawId: CAW, ts: 1 }).endsWith('\n'),
    'v38: the admin message is 8 lines with no trailing newline');

  /* Error mapping: 403 splits by the server's message; 409 is
     the stale-hash race with its own wording. */
  ok(V.adminOpErrorKey(403, 'not an admin') === 'modErrNotAdmin' &&
     V.adminOpErrorKey(403, 'root only') === 'modErrRootOnly' &&
     V.adminOpErrorKey(409, 'media changed since signing') === 'modErrChanged' &&
     V.adminOpErrorKey(404, 'media not found') === 'modErrNotFound' &&
     V.adminOpErrorKey(401, 'bad signature') === 'modErrSig' &&
     V.adminOpErrorKey(429, 'throttled') === 'modErrThrottle' &&
     V.adminOpErrorKey(400, 'bad name id') === 'modErrBad' &&
     V.adminOpErrorKey(500, 'boom') === 'modErrFail',
    'v38: admin-op errors map to their string keys (403 split, 409 stale-hash)');

  /* The hash an op pins is read back out of the media URL. */
  ok(V.modHashFromMediaUrl('https://x.example/media/' + HASH_L + '.jpg') === HASH_L &&
     V.modHashFromMediaUrl('https://x.example/media/nope.jpg') === null &&
     V.modHashFromMediaUrl('') === null,
    'v38: modHashFromMediaUrl extracts the content hash, null when absent');

  /* The visibility rule + the list choke point, behaviourally:
     hidden posts drop for non-admins only; follows (type 3)
     are never posts, even if a cawId collided; the item's own
     case does not matter. */
  ok(V.modItemVisible(true, false) === false && V.modItemVisible(true, true) === true &&
     V.modItemVisible(false, false) === true && V.modItemVisible(false, true) === true,
    'v38: modItemVisible truth table (hidden drops for non-admins only)');
  const feedItems = [
    { type: 0, cawId: CAW }, { type: 2, cawId: CAW }, { type: 3, cawId: CAW },
    { type: 0, cawId: '0x' + '11'.repeat(32) }, { type: 1, cawId: CAW },
  ];
  const filtered = V.modFilterItems(feedItems, new Set([CAW_L]), false);
  ok(filtered.length === 3 && filtered[0].type === 3 && filtered[1].type === 0 && filtered[2].type === 1,
    'v38: modFilterItems drops hidden posts + Recaws for non-admins, keeps follows, likes (row rule handles those) and visible posts');
  ok(V.modFilterItems(feedItems, new Set([CAW_L]), true).length === 5 &&
     V.modFilterItems(feedItems, new Set(), false).length === 5,
    'v38: modFilterItems keeps everything for admins and when nothing is hidden');

  /* Wiring pins: the three endpoints, the op body discipline,
     and the confirm error surface. */
  ok(viewerSrc.includes("MEDIA_API + '/v1/admins'") && viewerSrc.includes("MEDIA_API + '/v1/hidden-posts'") &&
     viewerSrc.includes("MEDIA_API + '/v1/admin/op'"),
    'v38: the viewer polls /v1/admins + /v1/hidden-posts and posts ops to /v1/admin/op');
  ok(viewerSrc.includes('const body = { action: fields.action, ts, sig };') &&
     viewerSrc.includes('pwSignMediaMsg(buildAdminMessage('),
    'v38: ops sign buildAdminMessage via the media signing path and send only the used fields');
  ok(viewerSrc.includes('e.adminKey') && viewerSrc.includes('adminOpErrorKey(res.status, msg)'),
    'v38: confirm panels render admin rejections through the mapped key');

  /* Filtering call sites: every post surface passes the choke
     point or the single-item rule. */
  const tlBody = viewerSrc.slice(viewerSrc.indexOf('async function loadTimeline('), viewerSrc.indexOf('function startNewPostPolling('));
  ok((tlBody.match(/modFilterItems\(/g) || []).length >= 2,
    'v38: the home timeline filters the cache paint AND the fresh walk');
  ok(viewerSrc.slice(viewerSrc.indexOf('async function loadFollowing('), viewerSrc.indexOf('function refreshHomeFeed(')).includes('modFilterItems('),
    'v38: the Following feed filters hidden posts');
  ok(viewerSrc.slice(viewerSrc.indexOf('async function loadProfilePosts('), viewerSrc.indexOf('async function renderFollowLists(')).includes('modFilterItems('),
    'v38: profile timelines filter hidden posts');
  ok(viewerSrc.includes('postMatchesQuery(a, qLower) && modVisibleItem(a)'),
    'v38: post search drops hidden hits for non-admins');
  const postPageBody = viewerSrc.slice(viewerSrc.indexOf('async function loadPostPage('), viewerSrc.indexOf('async function loadProfile()'));
  ok(postPageBody.includes('if (!modVisibleItem(post))') && postPageBody.includes('modFilterItems(ctx.replies') &&
     postPageBody.includes('modFilterItems(ctx.quotes'),
    'v38: the post page shows the hidden state for a hidden post and filters its thread/quotes');
  ok(viewerSrc.slice(viewerSrc.indexOf('async function loadBookmarksView('), viewerSrc.indexOf('async function loadReactionsView(')).includes('!modVisibleItem(post)'),
    'v38: bookmarks render the hidden state for a hidden bookmarked post');
  ok(viewerSrc.includes('if (!modVisibleItem(orig))') && viewerSrc.includes('if (!modVisibleItem(post))'),
    'v38: nested originals (Recaw frame + quote frame) hide for non-admins');

  /* Role gating: admin UI exists only behind the role checks —
     post cards, profile media, attachments, Settings sections;
     the appoint/revoke section is root-only and the root row
     carries no revoke. */
  const cardBody38 = viewerSrc.slice(viewerSrc.indexOf('async function postCard('), viewerSrc.indexOf('async function recawCard('));
  ok(cardBody38.includes('data-modact') && cardBody38.includes('modIsAdmin()'),
    'v38: post cards render the Hide/Unhide control only for admins');
  ok(viewerSrc.slice(viewerSrc.indexOf('async function applyProfileMedia('), viewerSrc.indexOf('async function shortenViaCawl(')).includes('data-modmedia'),
    'v38: profile media carries moderation rows for admins');
  ok(viewerSrc.includes('modDecorateAttach(root)') && viewerSrc.includes("action: o.verb + '-attach'"),
    'v38: attachments are decorated with per-image admin controls');
  const setBody38 = viewerSrc.slice(viewerSrc.indexOf('function renderSettings()'), viewerSrc.indexOf('async function renderNamesScreen()'));
  ok(setBody38.includes('modIsAdmin()') && setBody38.includes('T.modSectionTitle') && setBody38.includes('data-modunhide'),
    'v38: Settings shows the Moderation section (hidden posts + Unhide) to admins only');
  ok(setBody38.includes('modIsRoot()') && setBody38.includes('data-modrevoke') && setBody38.includes("a2.role !== 'root'"),
    'v38: Settings shows admin management to the root only, and the root row has no revoke');
  ok(css38.includes('.post.mod-hidden') && css38.includes('.mod-badge') && css38.includes('.mod-att-ctl'),
    'v38: the stylesheet carries the dimmed-row, badge and attachment-control styles');

  /* Strings: the whole moderation set exists in EN + JA (the
     other eighteen take the English fallback via build-i18n —
     counted by the v36 dict checks above). */
  const MOD_KEYS = ['modHiddenBadge', 'modHiddenNote', 'modHideBtn', 'modUnhideBtn', 'modHideTitle',
    'modHideNote', 'modUnhideTitle', 'modSectionTitle', 'modHiddenListLbl', 'modNoneHidden',
    'modMediaTitle', 'modHideMediaBtn', 'modHideMediaTitle', 'modUnhideMediaTitle', 'modDeleteBtn',
    'modDeleteTitle', 'modDeleteWarn', 'modAttHidden', 'modAdminsTitle', 'modRoleRoot', 'modRoleMod',
    'modAppointLbl', 'modAppointPh', 'modAppointBtn', 'modAppointNote', 'modRevokeBtn', 'modRevokeTitle',
    'modErrNotAdmin', 'modErrRootOnly', 'modErrChanged', 'modErrNotFound', 'modErrSig',
    'modErrThrottle', 'modErrBad', 'modErrFail', 'modRoleNote'];
  ok(MOD_KEYS.length === 36 && MOD_KEYS.every(k => typeof web38.en[k] === 'string' && web38.en[k].length > 0 &&
     typeof web38.ja[k] === 'string' && web38.ja[k].length > 0),
    'v38: all 36 moderation strings exist in EN + JA');
  /* The role definition (user, 2026-11-19): admins remove
     malicious images etc. from CAW, across the WHOLE front —
     the Settings sections carry it, and the hide copy names
     the whole-front scope while keeping the on-chain caveat. */
  ok(setBody38.includes('T.modRoleNote') &&
     web38.en.modRoleNote.includes('malicious images') && web38.en.modRoleNote.includes('every screen') &&
     web38.ja.modRoleNote.includes('悪意のある画像') && web38.ja.modRoleNote.includes('全体'),
    'v38: the admin role note (remove malicious content, whole-front scope) is in both Settings sections, EN + JA');
  ok(web38.en.modHideNote.includes('every screen') && web38.en.modHideNote.includes('on-chain') &&
     web38.ja.modHideNote.includes('すべての画面') && web38.ja.modHideNote.includes('オンチェーン'),
    'v38: the hide confirm names the whole-front scope and keeps the stays-on-chain caveat');

  /* No account address on profiles (user, 2026-11-19): the
     profile head renders no owner address for anyone — the
     owner read stays internal (profileOwner / follow state).
     The confirmed exception: Settings keeps the owner's own
     address + copy card, shown only with a live session. */
  const profBody38 = viewerSrc.slice(viewerSrc.indexOf('async function loadProfile()'), viewerSrc.indexOf('async function loadProfilePosts()'));
  ok(!profBody38.includes('ownerLbl') && !profBody38.includes('shortAddr(owner)') &&
     profBody38.includes('profileOwner = owner'),
    'v38: the profile head renders no account address (own or others); the owner read stays internal');
  ok(setBody38.includes('setAddressLbl') && setBody38.includes('setCopyAddr') && setBody38.includes('pwSession.address'),
    'v38: Settings keeps the owner-only own-address + copy card (confirmed exception, untouched)');
}

console.log('— v39: persistent hidden-media list (list-hidden) —');
{
  const B39 = await import('./build-i18n.mjs');
  const web39 = B39.loadWebDicts(viewerSrc);
  const EMPTY39 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const HASH39 = 'AB'.repeat(32);
  const HASH39_L = HASH39.toLowerCase();
  const CAW39 = '0x' + 'CD'.repeat(32);
  const CAW39_L = CAW39.toLowerCase();
  const ADMIN39 = '0x90359C6913915B9824B9CE8ABF4B85B30A5CF8CC';

  /* The list-hidden message: the standard admin form with
     EVERY field at its placeholder — that is the whole
     contract (the op carries no target). */
  ok(V.buildAdminMessage({ action: 'list-hidden', ts: 1700000100 }) ===
    ['CAW Media v1', 'action: list-hidden', 'name: -', 'sha256: ' + EMPTY39,
     'caw: -', 'tx: -', 'target: -', 'ts: 1700000100'].join('\n'),
    'v39: the list-hidden message is byte-exact (all placeholders, empty hash)');
  ok(viewerSrc.includes("modOp({ action: 'list-hidden' })"),
    'v39: the loader posts exactly { action, ts, sig } via the one admin op path');

  /* The row model, behaviourally, from a stubbed list-hidden
     response: profile + attach entries normalise to the
     lowercase forms the ops sign, the server's order is
     kept, and entries that cannot identify an item or pin
     its bytes are dropped, never rendered half-known. */
  const stubHidden = [
    { kind: 'icon', nameId: '190', hash: HASH39, hiddenBy: ADMIN39, ts: 1795091926000 },
    { kind: 'attach', cawId: CAW39, hash: HASH39, hiddenBy: ADMIN39, ts: 1795091900000 },
    { kind: 'audio', nameId: '7', hash: 'zz'.repeat(32), hiddenBy: ADMIN39, ts: 1 },
    { kind: 'banner', nameId: '7', hash: HASH39, hiddenBy: ADMIN39, ts: 1 },
    { kind: 'header', hash: HASH39, hiddenBy: ADMIN39, ts: 1 },
    null, 'junk',
  ];
  const model39 = V.modHiddenMediaModel(stubHidden);
  ok(model39.length === 2 && model39[0].kind === 'icon' && model39[0].nameId === '190' &&
     model39[0].hash === HASH39_L && model39[0].hiddenBy === ADMIN39.toLowerCase() &&
     model39[0].ts === 1795091926000 &&
     model39[1].kind === 'attach' && model39[1].cawId === CAW39_L && model39[1].hash === HASH39_L,
    'v39: modHiddenMediaModel normalises a stubbed response (order kept, junk dropped)');
  ok(V.modHiddenMediaModel(null).length === 0 && V.modHiddenMediaModel({}).length === 0 &&
     V.modHiddenMediaModel([]).length === 0,
    'v39: a missing/empty hidden list models as no rows');

  /* Unhide/delete wiring per entry kind: profile entries pin
     nameId + hash under verb-kind; attachments pin cawId +
     hash under verb-attach. */
  ok(JSON.stringify(V.modHiddenEntryOp(model39[0], 'unhide')) ===
     JSON.stringify({ action: 'unhide-icon', nameId: '190', sha256: HASH39_L }) &&
     JSON.stringify(V.modHiddenEntryOp(model39[0], 'delete')) ===
     JSON.stringify({ action: 'delete-icon', nameId: '190', sha256: HASH39_L }) &&
     JSON.stringify(V.modHiddenEntryOp(model39[1], 'unhide')) ===
     JSON.stringify({ action: 'unhide-attach', cawId: CAW39_L, sha256: HASH39_L }) &&
     JSON.stringify(V.modHiddenEntryOp(model39[1], 'delete')) ===
     JSON.stringify({ action: 'delete-attach', cawId: CAW39_L, sha256: HASH39_L }) &&
     V.modHiddenEntryOp(null, 'unhide') === null,
    'v39: modHiddenEntryOp wires unhide/delete per entry kind');

  /* Rendering + refresh wiring (source pins over the browser
     section, the same style as the v38 pins). */
  const setBody39 = viewerSrc.slice(viewerSrc.indexOf('function renderSettings()'), viewerSrc.indexOf('async function renderNamesScreen()'));
  ok(setBody39.includes('T.modHiddenMediaLbl') && setBody39.includes('id="modHiddenMediaBox"') &&
     setBody39.includes('modLoadHiddenMedia()'),
    'v39: Settings renders the Hidden media box inside the Moderation card and loads it for admins');
  const paint39 = viewerSrc.slice(viewerSrc.indexOf('function modPaintHiddenMedia('), viewerSrc.indexOf('function modConfirmHiddenEntry('));
  ok(paint39.includes('modHiddenMediaErrKey') && paint39.includes('T[modHiddenMediaErrKey]') &&
     paint39.includes('data-modhm-unhide') && paint39.includes('data-modhm-del') &&
     paint39.includes('T.modHiddenMeta') && paint39.includes('postUrl(m.cawId)') &&
     paint39.includes('data-modhm-prof') && paint39.includes('resolveName('),
    'v39: the list paints rows (identity, who/when meta, Unhide + Delete), resolves profile names, and shows load errors with no rows');
  ok(viewerSrc.slice(viewerSrc.indexOf('function modConfirmHiddenEntry('), viewerSrc.indexOf('function modPaintRow('))
      .includes('modHiddenEntryOp(m, verb)'),
    'v39: list Unhide/Delete confirm through modHiddenEntryOp');
  ok(viewerSrc.slice(viewerSrc.indexOf('function modConfirmMedia('), viewerSrc.indexOf('function modConfirmAttach(')).includes('modLoadHiddenMedia()') &&
     viewerSrc.slice(viewerSrc.indexOf('function modConfirmAttach('), viewerSrc.indexOf('function modFillAdminNames(')).includes('modLoadHiddenMedia()'),
    'v39: profile + attachment ops refresh the Settings list after success');

  /* Strings: the three list keys exist in EN + JA (the other
     eighteen take the English fallback — pinned below). */
  ok(['modHiddenMediaLbl', 'modNoneHiddenMedia', 'modHiddenMeta'].every(k =>
     typeof web39.en[k] === 'string' && web39.en[k].length > 0 &&
     typeof web39.ja[k] === 'string' && web39.ja[k].length > 0),
    'v39: the hidden-media list strings exist in EN + JA');
  const appDicts39 = B39.loadAppDicts(fs.readFileSync(new URL('../../caw-social-app/src/i18n.ts', import.meta.url), 'utf8'));
  const map39 = B39.buildMapping(web39, appDicts39);
  ok(B39.buildDict('es', web39, appDicts39, map39).fallbacks.length === 169,
    'v39+v40: fallback count per dict — 203 at v39; the v40 regeneration maps 34 more keys because the app i18n gained the media/moderation translations with app v0.7.6, honestly counted at 169');
}

console.log('— v40: attachment images never rendered (nested .pfoot insertBefore) —');
{
  /* Root cause, reproduced in a real browser before the fix:
     postCard nests .pfoot inside .pbody, so it is NOT a direct
     child of the card element. hydrateAttachmentsIn did
     el.insertBefore(div, foot) — a NotFoundError in any real
     DOM — and every call site's .catch(() => {}) swallowed it,
     so no attachment image ever rendered on any surface.
     This block runs the REAL hydrateAttachmentsIn against a
     stub DOM that (a) mirrors the card's nesting and (b)
     implements insertBefore with real DOM semantics (throws
     when the reference node is not a direct child). On the
     pre-fix code the hydrate call rejects and no .post-media
     exists; on the fixed code the media lands inside .pbody,
     immediately before .pfoot. */
  const slice40 = (a, b) => {
    const i = viewerSrc.indexOf(a); if (i < 0) throw new Error('v40 slice start missing: ' + a);
    const j = viewerSrc.indexOf(b, i); if (j < 0) throw new Error('v40 slice end missing: ' + b);
    return viewerSrc.slice(i, j);
  };
  class El40 {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.children = []; this.dataset = {}; this.className = '';
      this.parentNode = null; this._html = ''; this._text = null;
    }
    set textContent(v) { this._text = String(v); this.children = []; }
    get textContent() { return this._text || ''; }
    set innerHTML(v) { this._html = String(v); this._text = null; this.children = []; }
    get innerHTML() {
      if (this._text != null) return this._text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return this._html;
    }
    appendChild(n) { n.parentNode = this; this.children.push(n); return n; }
    insertBefore(n, ref) {
      const i = this.children.indexOf(ref);
      if (i < 0) {
        const e = new Error("Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.");
        e.name = 'NotFoundError'; throw e;
      }
      n.parentNode = this; this.children.splice(i, 0, n); return n;
    }
    _walk(out) { for (const c of this.children) { out.push(c); c._walk(out); } return out; }
    _hasClass(c) { return String(this.className || '').split(/\s+/).includes(c); }
    querySelector(sel) {
      if (sel.startsWith('.')) return this._walk([]).find(e => e._hasClass(sel.slice(1))) || null;
      return null;
    }
    querySelectorAll(sel) {
      if (sel === '[data-cawid]') return this._walk([]).filter(e => 'cawid' in e.dataset);
      return [];
    }
  }
  const CAW40 = '0x' + 'ab'.repeat(32);
  const URL40 = 'https://media.example/media/' + 'cd'.repeat(32) + '.jpg';
  const doc40 = { createElement: tag => new El40(tag) };
  const fetch40 = async () => ({ ok: true, json: async () => ({ media: { [CAW40]: [{ url: URL40, size: 3 }] } }) });
  const hydrate40 = new Function('document', 'fetch', 'T',
    'let modRole = null;\nconst modHiddenMedia = new Map();\n' +
    slice40('async function fetchTimeout', '\nlet rpcSeq') + '\n' +
    viewerSrc.match(/const MEDIA_API = '[^']*';/)[0] + '\n' +
    viewerSrc.match(/const esc = s => \{[^\n]*\n/)[0] + '\n' +
    slice40('function modHashFromMediaUrl', '\n/* The one visibility rule') + '\n' +
    slice40('function modIsAdmin()', 'function modIsRoot()') + '\n' +
    slice40('function modSwapAttachCtl', '\nfunction modDecorateAttach') + '\n' +
    slice40('function modDecorateAttach', '\nfunction modConfirmAttach') + '\n' +
    slice40('async function hydrateAttachmentsIn', '\nfunction mediaSettingRow') +
    '\nreturn { hydrateAttachmentsIn };')(doc40, fetch40, {});
  /* the card exactly as postCard builds it: .pfoot nested in .pbody */
  const root40 = new El40('div');
  const row40 = new El40('div'); row40.className = 'post'; row40.dataset.cawid = CAW40;
  const body40 = new El40('div'); body40.className = 'pbody';
  const text40 = new El40('div'); text40.className = 'ptext';
  const foot40 = new El40('div'); foot40.className = 'pfoot';
  body40.appendChild(text40); body40.appendChild(foot40);
  row40.appendChild(body40); root40.appendChild(row40);
  let err40 = null;
  try { await hydrate40.hydrateAttachmentsIn(root40); } catch (e) { err40 = e; }
  const pm40 = row40.querySelector('.post-media');
  ok(!err40 && !!pm40,
    'v40: hydrateAttachmentsIn inserts .post-media into a real-shaped card (nested .pfoot) without throwing');
  ok(!!pm40 && pm40.parentNode === body40 &&
     body40.children.indexOf(pm40) === body40.children.indexOf(foot40) - 1 &&
     pm40.innerHTML.includes('<img') && pm40.innerHTML.includes(URL40),
    'v40: the media sits inside .pbody immediately before .pfoot, with the image URL');
  ok(viewerSrc.includes('if (foot && foot.parentNode) foot.parentNode.insertBefore(div, foot)') &&
     viewerSrc.includes('if (foot && foot.parentNode) foot.parentNode.insertBefore(pm, foot)') &&
     !viewerSrc.includes('if (foot) el.insertBefore(div, foot)') &&
     !viewerSrc.includes('if (foot) row.insertBefore(pm, foot)'),
    'v40: both insertion sites (hydrate + admin placeholder tiles) insert within the foot parent; the throwing forms are gone');

  /* The profile media editor's enable/disable state machine
     (the second 2026-11-19 report), run with the REAL
     mediaSettingRow + wireMediaSettings: Save starts disabled
     (the markup's disabled attribute), picking a file enables
     it and shows the filename, clearing the pick disables it
     again. No state leaves it stuck. */
  const rowHtml40 = new Function('esc', 'T',
    slice40('function mediaSettingRow', '\nfunction wireMediaSettings') +
    '\nreturn { mediaSettingRow };')(s => String(s), { mediaPick: 'Pick', mediaSet: 'Save', mediaClear: 'Clear' })
    .mediaSettingRow('header', 'Header', false, 'image/jpeg');
  ok(rowHtml40.includes('id="msetFile-header"') && rowHtml40.includes('id="msetSet-header" disabled') &&
     rowHtml40.includes('id="msetName-header"'),
    'v40: the editor row markup carries the file input, a disabled-at-start Save, and the filename slot');
  const els40 = {};
  for (const kind of ['icon', 'header', 'audio']) {
    els40['msetFile-' + kind] = { files: [], onchange: null };
    els40['msetSet-' + kind] = { disabled: true, onclick: null };
    els40['msetName-' + kind] = { textContent: '' };
  }
  els40.msetStatus = { textContent: '', innerHTML: '' };
  new Function('$', 'document', 'T',
    slice40('function wireMediaSettings', '\n/* Profile header image, audio player') +
    '\nwireMediaSettings();')(id => els40[id] || null, doc40, {});
  const fi40 = els40['msetFile-header'], sb40 = els40['msetSet-header'], nm40 = els40['msetName-header'];
  ok(typeof fi40.onchange === 'function' && sb40.disabled === true,
    'v40: the editor wiring attaches onchange and Save starts disabled');
  fi40.files = [{ name: 'photo.jpg' }]; fi40.onchange();
  ok(sb40.disabled === false && nm40.textContent === 'photo.jpg',
    'v40: picking a file enables Save and shows the filename');
  fi40.files = []; fi40.onchange();
  ok(sb40.disabled === true && nm40.textContent === '',
    'v40: clearing the pick disables Save again (no stuck state)');
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
