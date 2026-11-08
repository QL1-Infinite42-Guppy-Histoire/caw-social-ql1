'use strict';
/* CAW Social (QL1) — READ-ONLY web viewer.
   This page only ever READS: the timeline, post pages and profiles are
   decoded in your browser from the public explorer API and the chain
   itself. There is no wallet connection and nothing here can sign or
   send — posting, liking and following live in the Android app, where
   signing happens inside the app itself.
   Names come from each name token's CARD (its tokenURI metadata) —
   the mint-proven source. The usernames() getter is shifted by one
   (it returns the NEXT token's name) and is never used directly. */

/* Loaded as viewer.js, never app.js: the retired service workers
   sabotage the old name (see sw.js). The inline watchdog in the HTML
   shells checks this flag — it is set the moment the real script
   runs, so a stubbed or stale script shows a reload hint instead of
   a silently blank timeline. */
if (typeof window !== 'undefined') window.__cawViewerBooted = true;

const RPC = 'https://evm-rpc-ql1.mschihuahua.org';
const API = 'https://scan.qom.network/api/v2';
const EXPLORER = 'https://scan.qom.network';
const APP_PAGE = 'https://ql1-infinite42-guppy-histoire.github.io/caw-social-app/';

const CAW_NAME = '0x864f08Af11F6DC2c0De42562e4664d4f033D393f';
const CAW_ACTIONS = '0x95c2AFEc2dE8b09323Cdc7E40Bcce42C3C49E496';
const MINTER = '0xFC2f8743E3b09a6c973B114c3a082433e974eD9f';
const ACTION_SELECTOR = '0x84e33f2f';

const SEL = {
  usernames: '0x136dd963', ownerOf: '0x6352211e', tokens: '0xe4860339',
  tokenURI: '0xc87b56dd', cawBalanceOf: '0x532f3a34', totalSupply: '0x18160ddd',
  idByUsername: '0x9ebf19e8', followerCount: '0x9f46a705', likes: '0x14ce3e7d',
};

const LANG = (typeof document !== 'undefined' && document.documentElement.lang === 'ja') ? 'ja' : 'en';
if (typeof localStorage !== 'undefined') { try { localStorage.setItem('caw-lang', LANG); } catch (e) {} }
const T = {
  en: {
    loading: 'Loading…', loadFail: 'Could not load. Please try again later.',
    empty: 'No posts found yet.', viewTx: 'see the record', moreBtn: 'See more',
    noticeTitle: 'Read-only web version',
    noticeText: 'You are reading the CAW timeline on QL1. Viewing is free and needs no wallet or account. Posting, likes and follows are in the Android app.',
    appBtn: 'Get the Android app',
    lookupTitle: 'Look up a name', lookupPh: 'e.g. neptune', lookupBtn: 'Look up',
    checking: 'Looking…', notFound: 'That name was not found.',
    lookupFail: 'Could not look that up. Please check your connection and try again.',
    timeline: 'Timeline', timelineSub: 'The newest posts on CAW, in order. Anyone can read — no wallet needed.',
    recawedBy: '{name} Recawed', replyingTo: 'Replying to {name}',
    ctxFollow: 'Followed {name}', ctxUnfollow: 'Unfollowed {name}',
    originalMissing: 'The original post was not found in the part of the feed loaded so far.',
    looking: 'Looking for the original post…',
    replies: 'Replies', quotes: 'Quotes', likes: 'likes', recaws: 'Recaws',
    threadNote: 'Replies are shown oldest first.',
    stillLooking: 'Still looking through the feed…',
    searchStopped: 'The search stopped early, so a few older replies may be missing.',
    back: '← Back to the timeline', postNotFound: 'That post could not be found.',
    followers: 'followers', inName: 'qCAW inside this name', nameCreated: 'Name made on',
    ownerLbl: 'Owner', profPosts: 'Posts', unknownName: 'name #',
    profNotFound: 'That name was not found.',
    profLoadFail: 'Could not read this name. Please check your connection and try again.',
    retryBtn: 'Try again', openPost: 'Open this post',
  },
  ja: {
    loading: '読み込み中…', loadFail: '読み込めませんでした。しばらくしてからお試しください。',
    empty: 'まだ投稿がありません。', viewTx: '記録を見る', moreBtn: 'もっと見る',
    noticeTitle: 'ウェブ版は閲覧専用です',
    noticeText: 'QL1 の CAW のタイムラインを読んでいます。閲覧は無料で、ウォレットもアカウントも要りません。投稿・いいね・フォローは Android アプリからできます。',
    appBtn: 'Android アプリを入れる',
    lookupTitle: '名前をさがす', lookupPh: '例：neptune', lookupBtn: 'さがす',
    checking: '調べています…', notFound: 'その名前は見つかりませんでした。',
    lookupFail: '調べられませんでした。通信を確認してもう一度お試しください。',
    timeline: 'タイムライン', timelineSub: 'CAW の新しい投稿を順番に表示します。誰でも読めます（ウォレット不要）。',
    recawedBy: '{name} さんが Recaw', replyingTo: '{name} さんへの返信',
    ctxFollow: '{name} さんをフォロー', ctxUnfollow: '{name} さんのフォローを解除',
    originalMissing: '元の投稿は、読み込んだ範囲では見つかりませんでした。',
    looking: '元の投稿を探しています…',
    replies: '返信', quotes: '引用', likes: 'いいね', recaws: 'Recaw',
    threadNote: '返信は古い順に表示します。',
    stillLooking: 'フィードを探しています…',
    searchStopped: '探索が途中で止まったため、古い返信が一部欠けているかもしれません。',
    back: '← タイムラインへ戻る', postNotFound: 'その投稿は見つかりませんでした。',
    followers: 'フォロワー', inName: 'この名前の中にある qCAW', nameCreated: '名前が作られた日',
    ownerLbl: '持ち主', profPosts: '投稿', unknownName: '名前 #',
    profNotFound: 'その名前は見つかりませんでした。',
    profLoadFail: '名前を読み取れませんでした。通信を確認してもう一度お試しください。',
    retryBtn: 'もう一度試す', openPost: 'この投稿を開く',
  },
}[LANG];

/* ---------- minimal ABI helpers ---------- */
const strip = h => (h || '').replace(/^0x/, '');
const word = v => BigInt(v).toString(16).padStart(64, '0');
const encAddr = a => strip(a).toLowerCase().padStart(64, '0');
const encStr = s => {
  const bytes = new TextEncoder().encode(s);
  const data = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return word(32) + word(bytes.length) + data.padEnd(Math.ceil(bytes.length / 32) * 64 || 64, '0');
};
const uAt = (hex, byteOff) => BigInt('0x' + hex.slice(byteOff * 2, byteOff * 2 + 64));
const addrAt = (hex, byteOff) => '0x' + hex.slice(byteOff * 2 + 24, byteOff * 2 + 64);
const strAt = (hex, byteOff) => {
  const len = Number(uAt(hex, byteOff));
  const raw = hex.slice((byteOff + 32) * 2, (byteOff + 32) * 2 + len * 2);
  const bytes = new Uint8Array((raw.match(/../g) || []).map(h => parseInt(h, 16)));
  return new TextDecoder().decode(bytes);
};
const decStringRet = hex => { hex = strip(hex); return strAt(hex, Number(uAt(hex, 0))); };
const decUintRet = hex => uAt(strip(hex), 0);
const decAddrRet = hex => addrAt(strip(hex), 0);
function decTokensRet(hex) {
  hex = strip(hex);
  const arrOff = Number(uAt(hex, 0));
  const n = Number(uAt(hex, arrOff));
  const out = [];
  for (let i = 0; i < n; i++) {
    const elemOff = arrOff + 32 + Number(uAt(hex, arrOff + 32 + i * 32));
    out.push({
      id: uAt(hex, elemOff),
      balance: uAt(hex, elemOff + 32),
      username: strAt(hex, elemOff + Number(uAt(hex, elemOff + 64))),
    });
  }
  return out;
}
function fmtQcaw(wei) {
  const s = BigInt(wei).toString().padStart(19, '0');
  const whole = s.slice(0, -18).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = s.slice(-18).replace(/0+$/, '');
  return frac ? whole + '.' + frac.slice(0, 6) : whole;
}

/* ---------- read-only RPC ---------- */
/* Every fetch carries a hard timeout: one hung request must never
   freeze the viewer. Callers already degrade on a thrown error
   (names fall back to a label, counts are skipped, pages report a
   load failure) — a hang was the only failure with no way out. */
async function fetchTimeout(url, opts, ms) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms || 12000);
  try { return await fetch(url, { ...(opts || {}), signal: ctl.signal }); }
  finally { clearTimeout(t); }
}
let rpcSeq = 0;
async function rpc(method, params) {
  const res = await fetchTimeout(RPC, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: ++rpcSeq, method, params }),
  });
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || 'rpc error');
  return j.result;
}
const ethCall = (to, data) => rpc('eth_call', [{ to, data }, 'latest']);
const readUint = async (to, data) => decUintRet(await ethCall(to, data));
const readAddr = async (to, data) => decAddrRet(await ethCall(to, data));
const readStr = async (to, data) => decStringRet(await ethCall(to, data));

async function withRetry(fn, tries, delayMs) {
  let lastErr = null;
  for (let i = 0; i < (tries || 3); i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < (tries || 3) - 1) await new Promise(r => setTimeout(r, delayMs || 700));
    }
  }
  throw lastErr;
}

/* ---------- action decoding (batch-aware; ported from the app) ----------
   A processAction call carries a BATCH of actions. Walk the batch
   structure (array offsets first, then each action's own field
   offsets — the text is found through the action's text-offset field,
   so actions with non-empty tip lists decode correctly too). Types:
   0 post, 1 like, 2 share (Recaw), 3 follow, 4 unfollow. */
function decodeActions(raw) {
  if (!raw || !raw.startsWith(ACTION_SELECTOR)) return [];
  const hex = strip(raw);
  const body = hex.slice(8); // after the 4-byte selector
  const wAt = i => body.slice(i * 64, i * 64 + 64);
  const wi = i => {
    const w = wAt(i);
    if (w.length < 64) throw new Error('short calldata');
    return Number(BigInt('0x' + w));
  };
  try {
    const headAt = wi(1) / 32;
    const actsAt = headAt + wi(headAt) / 32;
    const n = wi(actsAt);
    if (n < 0 || n > 64) return [];
    const out = [];
    for (let k = 0; k < n; k++) {
      const tOff = actsAt + 1 + wi(actsAt + 1 + k) / 32;
      const f = i => wAt(tOff + i);
      const fi = i => BigInt('0x' + f(i));
      const type = Number(fi(0));
      if (type > 4) continue;
      const textWord = tOff + Number(fi(8)) / 32;
      const textLen = wi(textWord);
      if (textLen < 0 || textLen > 4096) continue;
      const textHex = body.slice((textWord + 1) * 64, (textWord + 1) * 64 + textLen * 2);
      let text = '';
      try {
        text = new TextDecoder().decode(new Uint8Array((textHex.match(/../g) || []).map(h => parseInt(h, 16))));
      } catch (e) { text = ''; }
      out.push({
        type,
        senderId: fi(1),
        receiverId: fi(2),
        ts: Number(fi(4)),
        sender: '0x' + f(5).slice(24),
        cawId: '0x' + f(7),
        text,
      });
    }
    return out;
  } catch (e) { return []; }
}

/* ---------- reply / quote markers (the app's convention) ----------
   CAW itself has no reply convention. The Android app marks a reply
   or a quote Recaw as an ordinary post whose text ENDS with one
   marker line: [caw:reply:<base64url(parent cawId)>] or
   [caw:quote:<…>]. Only a marker on the FINAL line counts, and only
   when it decodes to exactly 32 bytes. The marker line is never
   shown as post text. */
const B64CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function b64UrlToHex(s) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(s)) return null;
  const bytes = [];
  let acc = 0, bits = 0;
  for (const ch of s) {
    const v = B64CH.indexOf(ch);
    if (v < 0) return null;
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) { bits -= 8; bytes.push((acc >> bits) & 0xff); }
  }
  if (bytes.length !== 32) return null;
  return '0x' + bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}
const MARKER_RE = /\[caw:(reply|quote):([A-Za-z0-9_-]{43})\]/;
function parsePostText(text) {
  const raw = text || '';
  const nl = raw.lastIndexOf('\n');
  const lastLine = (nl >= 0 ? raw.slice(nl + 1) : raw).trim();
  const m = MARKER_RE.exec(lastLine);
  if (m && m[0] === lastLine) {
    const parentCawId = b64UrlToHex(m[2]);
    if (parentCawId) {
      return {
        body: (nl >= 0 ? raw.slice(0, nl) : '').replace(/\s+$/, ''),
        ref: { kind: m[1], parentCawId },
      };
    }
  }
  return { body: raw, ref: null };
}

/* ---------- names: the token's CARD is the truth ----------
   Mint records settled which source is right: Minter.mint("neptune")
   created token 190 and its card says "neptune", while usernames(190)
   says "loveforqom" — the getter reads a 0-based list against 1-based
   token ids, so usernames(n) returns token n+1's name. Resolution:
   1) tokenURI metadata's name field (the card),
   2) the corrected slot usernames(id − 1) as a fallback,
   3) the owner's token list (tokens()), which agrees with the cards.
   usernames(id) itself is NEVER used. */
function metaFromUri(uri) {
  try {
    if (uri.startsWith('data:application/json;base64,')) {
      const bin = atob(uri.split(',')[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return JSON.parse(new TextDecoder().decode(bytes));
    }
    if (uri.startsWith('data:application/json')) {
      return JSON.parse(decodeURIComponent(uri.split(',').slice(1).join(',')));
    }
  } catch (e) { /* not parseable metadata */ }
  return null;
}
async function readCardName(idIn) {
  const id = BigInt(idIn);
  try {
    const uri = await withRetry(() => readStr(CAW_NAME, SEL.tokenURI + word(id)), 2, 400);
    const meta = metaFromUri(uri);
    if (meta && typeof meta.name === 'string' && meta.name) return meta.name;
  } catch (e) { /* fall through */ }
  if (id >= 1n) {
    try {
      const n = await withRetry(() => readStr(CAW_NAME, SEL.usernames + word(id - 1n)), 2, 400);
      if (n) return n;
    } catch (e) { /* fall through */ }
  }
  try {
    const owner = await readAddr(CAW_NAME, SEL.ownerOf + word(id));
    const toks = await tokensOf(owner);
    const hit = toks.find(t => t.id === id);
    if (hit && hit.username) return hit.username;
  } catch (e) { /* no name found */ }
  return '';
}
const nameCache = new Map();
function resolveName(idIn) {
  const id = BigInt(idIn);
  if (!nameCache.has(id)) {
    const p = readCardName(id).then(n => {
      if (!n) nameCache.delete(id); // a transient miss must not stick
      return n || null;
    }).catch(() => { nameCache.delete(id); return null; });
    nameCache.set(id, p);
  }
  return nameCache.get(id);
}
const ownerTokensCache = new Map();
function tokensOf(owner) {
  if (!ownerTokensCache.has(owner)) {
    ownerTokensCache.set(owner, ethCall(CAW_NAME, SEL.tokens + encAddr(owner)).then(decTokensRet).catch(() => []));
  }
  return ownerTokensCache.get(owner);
}
/* Resolve a typed username to its token id. idByUsername returns the
   TRUE id (it agrees with the mint records and the cards); the answer
   is still verified: the id — or a neighbour, belt and braces — must
   carry exactly this name on its CARD. Throws when reads failed, so
   the UI shows a load error rather than a false "not found". */
async function resolveNameId(rawName) {
  const q = String(rawName || '').trim().toLowerCase().replace(/^@/, '');
  if (!q) return { status: 'notfound' };
  const id0 = await withRetry(() => readUint(MINTER, SEL.idByUsername + encStr(q)));
  if (id0 === 0n) return { status: 'notfound' };
  const cands = [id0, id0 - 1n, id0 + 1n].filter(c => c >= 1n);
  let readFailed = false;
  for (const c of cands) {
    let uname = '';
    try { uname = await readCardName(c); } catch (e) { readFailed = true; }
    if (uname === q) return { status: 'ok', id: c, username: uname };
  }
  if (readFailed) throw new Error('name lookup reads failed');
  return { status: 'notfound' };
}

/* avatar image for a name id (from its card), cached */
const avatarCache = new Map();
function avatarFor(idIn) {
  const id = BigInt(idIn);
  if (!avatarCache.has(id)) {
    avatarCache.set(id, (async () => {
      try {
        const uri = await withRetry(() => readStr(CAW_NAME, SEL.tokenURI + word(id)), 2, 400);
        const meta = metaFromUri(uri);
        if (meta && typeof meta.image === 'string' && meta.image) {
          return meta.image.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/' + meta.image.slice(7) : meta.image;
        }
        if (uri.startsWith('http')) return uri;
      } catch (e) { /* no picture */ }
      return null;
    })());
  }
  return avatarCache.get(id);
}

/* ---------- the feed: pages, indexes, walks ----------
   One session page cache serves the timeline, the profile scans and
   the thread walks, exactly like the app: deep pages are cached by
   cursor, but the HEAD page is only shared while its fetch is in
   flight — once settled it is never served again, so a refresh
   always sees the chain's real head. */
const postIndex = new Map(); // cawId (lowercase) -> post item (type 0)
const refIndex = new Map();  // parent cawId -> Map(child cawId -> child item + refKind)
function indexItem(item) {
  if (item.type !== 0) return;
  postIndex.set(item.cawId.toLowerCase(), item);
  const { ref } = parsePostText(item.text);
  if (!ref) return;
  const pk = ref.parentCawId.toLowerCase();
  let kids = refIndex.get(pk);
  if (!kids) { kids = new Map(); refIndex.set(pk, kids); }
  kids.set(item.cawId.toLowerCase(), { ...item, refKind: ref.kind });
}
function refChildren(cawId, kind) {
  const kids = refIndex.get((cawId || '').toLowerCase());
  if (!kids) return [];
  return [...kids.values()].filter(k => k.refKind === kind);
}

const pageCache = new Map();
const HEAD_KEY = '__first__';
async function fetchPageUncached(next) {
  let url = API + '/addresses/' + CAW_ACTIONS + '/transactions';
  if (next) url += '?' + new URLSearchParams(next).toString();
  const res = await fetchTimeout(url);
  if (!res.ok) throw new Error('api ' + res.status);
  const j = await res.json();
  const items = [];
  for (const it of (j.items || [])) {
    if (!it.raw_input || (it.status && it.status !== 'ok')) continue;
    for (const a of decodeActions(it.raw_input)) {
      const item = {
        ...a,
        hash: it.hash,
        blockTs: it.timestamp,
        block: typeof it.block_number === 'number' ? it.block_number : undefined,
        txIndex: typeof it.index === 'number' ? it.index : undefined,
      };
      items.push(item);
      indexItem(item);
    }
  }
  return { items, next: j.next_page_params || null };
}
function fetchPage(next) {
  const key = next ? JSON.stringify(next) : HEAD_KEY;
  const hit = pageCache.get(key);
  if (hit) return hit;
  const p = fetchPageUncached(next).catch(e => { pageCache.delete(key); throw e; });
  pageCache.set(key, p);
  if (!next) { // head: share only while in flight (see note above)
    const evict = () => { if (pageCache.get(key) === p) pageCache.delete(key); };
    p.then(evict, evict);
  }
  return p;
}

/* Find a post by cawId: the index first, then a bounded scan of
   fresh pages (the app's rule: 12 pages for inline frames). */
async function findPostByCawId(cawId, maxPages) {
  const key = (cawId || '').toLowerCase();
  const hit = postIndex.get(key);
  if (hit) return hit;
  let cursor = null;
  const cap = maxPages || 12;
  for (let p = 0; p < cap; p++) {
    const page = await fetchPage(cursor);
    const h2 = postIndex.get(key);
    if (h2) return h2;
    cursor = page.next;
    if (!cursor) break;
  }
  return null;
}
/* Deep variant for direct post links: scan until found or the feed
   is exhausted (history is finite), with a hard cap. */
async function findPostDeep(cawId) {
  const key = (cawId || '').toLowerCase();
  const hit = postIndex.get(key);
  if (hit) return hit;
  let cursor = null;
  for (let p = 0; p < 200; p++) {
    const page = await fetchPage(cursor);
    const h2 = postIndex.get(key);
    if (h2) return h2;
    cursor = page.next;
    if (!cursor) break;
  }
  return null;
}

/* One walk collecting everything a post page needs — its replies
   (marker children, oldest first), its quote posts, and who liked /
   Recawed it. Reactions and children can only exist AFTER the post,
   so the walk starts at the newest item and stops once a whole page
   is older than the post. Mirrors the app's fetchPostThread /
   fetchPostReactions; `complete` is false when the cap stopped it. */
async function collectPostContext(post, maxPages) {
  const key = post.cawId.toLowerCase();
  const replies = new Map(), quotes = new Map();
  const likes = new Set(), shares = new Set();
  const consider = it => {
    if (it.cawId.toLowerCase() === key) {
      if (it.type === 1) likes.add(it.senderId.toString());
      else if (it.type === 2) shares.add(it.senderId.toString());
    }
    if (it.type === 0 && it.cawId.toLowerCase() !== key) {
      const { ref } = parsePostText(it.text);
      if (ref && ref.parentCawId.toLowerCase() === key) {
        (ref.kind === 'reply' ? replies : quotes).set(it.cawId.toLowerCase(), { ...it, refKind: ref.kind });
      }
    }
  };
  let cursor = null, complete = false;
  const cap = maxPages || 80;
  for (let page = 0; page < cap; page++) {
    const { items, next } = await fetchPage(cursor);
    if (!items.length) { complete = true; break; }
    for (const it of items) consider(it);
    const lastBlock = items[items.length - 1].block ?? 0;
    if ((post.block ?? 0) > 0 && lastBlock < (post.block ?? 0)) { complete = true; break; }
    if (!next) { complete = true; break; }
    cursor = next;
  }
  for (const kid of refChildren(post.cawId, 'reply')) {
    if (!replies.has(kid.cawId.toLowerCase())) replies.set(kid.cawId.toLowerCase(), kid);
  }
  for (const kid of refChildren(post.cawId, 'quote')) {
    if (!quotes.has(kid.cawId.toLowerCase())) quotes.set(kid.cawId.toLowerCase(), kid);
  }
  const byTime = (a, b) => (a.block ?? 0) - (b.block ?? 0) || (a.txIndex ?? 0) - (b.txIndex ?? 0) || a.ts - b.ts;
  return {
    replies: [...replies.values()].sort(byTime),
    quotes: [...quotes.values()].sort(byTime),
    likeSenders: [...likes], shareSenders: [...shares],
    complete,
  };
}

/* like count for one post, from the contract (authoritative) */
const likesOf = a => readUint(CAW_ACTIONS, SEL.likes + word(a.senderId) + strip(a.cawId));

/* Timeline row rule (app v0.4.x semantics): LIKE actions never
   render as rows — they only feed the counts on their target post.
   Posts, Recaws, follows and unfollows do render. */
function isVisibleRow(a) { return a.type !== 1; }

/* ================= browser UI (skipped under Node) ================= */
if (typeof document !== 'undefined' && typeof window !== 'undefined') {

const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
const svgIc = (paths, size) => '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
const IC_HEART = svgIc('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>');
const IC_REPEAT = svgIc('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const IC_REPLY = svgIc('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>');
const pageFile = LANG === 'ja' ? 'ja.html' : 'en.html';
const postUrl = cawId => pageFile + '?post=' + cawId;
const profUrl = name => pageFile + '?name=' + encodeURIComponent(name);
const shortAddr = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';

function avatarHtml(url, name) {
  if (url) return '<img class="avatar" alt="" src="' + esc(url) + '">';
  const ch = name ? name.replace(/^@/, '').charAt(0).toUpperCase() : '?';
  return '<div class="avatar avatar-fallback">' + esc(ch) + '</div>';
}
function whenStr(ts) {
  return new Date((ts || 0) * 1000).toLocaleString(LANG === 'ja' ? 'ja-JP' : 'en-US',
    { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
const nameLabel = async id => {
  const n = await resolveName(id);
  return n ? '@' + n : T.unknownName + id;
};

/* The embedded original inside a quote frame / under a Recaw header.
   Resolved from the feed index (with a bounded extra scan); when it
   cannot be found, the frame says so honestly — content is never
   invented. */
async function fillOriginalFrame(el, cawId) {
  try {
    const post = await findPostByCawId(cawId, 12);
    if (!post) { el.innerHTML = '<span class="small">' + T.originalMissing + '</span>'; return; }
    const [name, img] = await Promise.all([resolveName(post.senderId), avatarFor(post.senderId)]);
    const who = name ? '@' + name : T.unknownName + post.senderId;
    el.innerHTML =
      '<div class="qhead">' + avatarHtml(img, name) +
      '<span class="qname">' + esc(who) + '</span><span class="time">· ' + esc(whenStr(post.ts)) + '</span></div>' +
      '<div class="qtext">' + esc(parsePostText(post.text).body) + '</div>';
    el.onclick = () => { location.href = postUrl(post.cawId); };
  } catch (e) {
    el.innerHTML = '<span class="small">' + T.originalMissing + '</span>';
  }
}
function originalFrame(cawId) {
  const d = document.createElement('div');
  d.className = 'quotebox';
  d.innerHTML = '<span class="small">' + T.looking + '</span>';
  fillOriginalFrame(d, cawId);
  return d;
}

/* One post card (also used nested inside a Recaw, and on post pages). */
async function postCard(a, opts) {
  opts = opts || {};
  const div = document.createElement('div');
  div.className = 'post' + (opts.nested ? ' post-nested' : '');
  const [name, img] = await Promise.all([resolveName(a.senderId), avatarFor(a.senderId)]);
  const who = name ? '@' + name : T.unknownName + a.senderId;
  const profHref = name ? profUrl(name) : null;
  const parsed = parsePostText(a.text);
  let html = profHref
    ? '<a class="plink" href="' + profHref + '">' + avatarHtml(img, name) + '</a>'
    : avatarHtml(img, name);
  html += '<div class="pbody">';
  if (parsed.ref && parsed.ref.kind === 'reply') {
    html += '<div class="ctx reply-ctx" data-parent="' + parsed.ref.parentCawId + '">' + esc(T.replyingTo.replace('{name}', '…')) + '</div>';
  }
  const whoHtml = profHref ? '<a class="plink" href="' + profHref + '">' + esc(who) + '</a>' : esc(who);
  html += '<div class="meta"><span class="name">' + whoHtml + '</span><span class="time">· ' + esc(whenStr(a.ts)) + '</span></div>';
  if (parsed.body) html += '<div class="ptext">' + esc(parsed.body) + '</div>';
  html += '<div class="frameslot"></div>';
  let likes = null;
  try { likes = await likesOf(a); } catch (e) {}
  const replyCount = refChildren(a.cawId, 'reply').length;
  html += '<div class="pfoot">' +
    '<span class="like-count">' + (likes !== null && likes > 0n ? IC_HEART + '<span>' + likes.toString() + '</span>' : '') + '</span>' +
    (replyCount > 0 ? '<span class="reply-count">' + IC_REPLY + '<span>' + replyCount + '</span></span>' : '') +
    (opts.nested ? '' : '<a href="' + postUrl(a.cawId) + '">' + T.openPost + '</a>') +
    '<a href="' + EXPLORER + '/tx/' + a.hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a>' +
    '</div>';
  html += '</div>';
  div.innerHTML = html;
  const slot = div.querySelector('.frameslot');
  if (parsed.ref && parsed.ref.kind === 'quote') slot.appendChild(originalFrame(parsed.ref.parentCawId));
  const rctx = div.querySelector('.reply-ctx');
  if (rctx) {
    (async () => {
      const parent = await findPostByCawId(parsed.ref.parentCawId, 12).catch(() => null);
      if (!parent) { rctx.remove(); return; }
      const pn = await nameLabel(parent.senderId);
      rctx.innerHTML = '<a class="plink" href="' + postUrl(parent.cawId) + '">' + esc(T.replyingTo.replace('{name}', pn)) + '</a>';
    })();
  }
  return div;
}

/* A plain Recaw (type 2), X-style: a small header naming the
   Recawer, and the body is the ORIGINAL post as a nested card. */
async function recawCard(a) {
  const div = document.createElement('div');
  div.className = 'post';
  const [name, img] = await Promise.all([resolveName(a.senderId), avatarFor(a.senderId)]);
  const who = name ? '@' + name : T.unknownName + a.senderId;
  let html = avatarHtml(img, name) + '<div class="pbody">' +
    '<div class="ctx recaw-ctx">' + IC_REPEAT + '<span>' + esc(T.recawedBy.replace('{name}', who)) + '</span>' +
    '<span class="time">· ' + esc(whenStr(a.ts)) + '</span></div>' +
    '<div class="frameslot"></div>' +
    '<div class="pfoot"><a href="' + EXPLORER + '/tx/' + a.hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a></div>' +
    '</div>';
  div.innerHTML = html;
  const slot = div.querySelector('.frameslot');
  (async () => {
    const orig = await findPostByCawId(a.cawId, 12).catch(() => null);
    if (!orig) {
      slot.innerHTML = '<div class="quotebox"><span class="small">' + T.originalMissing + '</span></div>';
      return;
    }
    slot.appendChild(await postCard(orig, { nested: true }));
  })();
  return div;
}

/* Follow / unfollow: a slim context row (likes never get a row). */
async function ctxRow(a) {
  const div = document.createElement('div');
  div.className = 'post ctxrow';
  const [name, target] = await Promise.all([nameLabel(a.senderId), a.receiverId > 0n ? nameLabel(a.receiverId) : Promise.resolve('')]);
  const tpl = a.type === 3 ? T.ctxFollow : T.ctxUnfollow;
  div.innerHTML = '<div class="pbody"><div class="ctx"><b>' + esc(name) + '</b> ' +
    esc(tpl.replace('{name}', target)) + ' <span class="time">· ' + esc(whenStr(a.ts)) + '</span> · ' +
    '<a href="' + EXPLORER + '/tx/' + a.hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a></div></div>';
  return div;
}

async function rowFor(a) {
  if (!isVisibleRow(a)) return null; // likes are counts, never rows
  if (a.type === 0) return postCard(a);
  if (a.type === 2) return recawCard(a);
  return ctxRow(a);
}

/* ---------- home timeline ---------- */
let tlCursor = null, tlDone = false, tlLoading = false;
async function loadTimeline(append) {
  if (tlLoading || (append && tlDone)) return;
  tlLoading = true;
  const box = $('timeline');
  try {
    if (!append) { box.innerHTML = ''; tlCursor = null; tlDone = false; }
    let rendered = 0, pages = 0;
    while (rendered === 0 && pages < 4 && !tlDone) {
      const page = await fetchPage(tlCursor);
      tlCursor = page.next;
      if (!tlCursor) tlDone = true;
      pages++;
      for (const a of page.items) {
        const row = await rowFor(a);
        if (row) { box.appendChild(row); rendered++; }
      }
      if (!page.items.length) tlDone = true;
    }
    if (!box.children.length && tlDone) box.innerHTML = '<p>' + T.empty + '</p>';
    $('moreBtn').style.display = tlDone ? 'none' : '';
  } catch (e) {
    if (!box.children.length) box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
    else $('moreBtn').style.display = '';
  } finally { tlLoading = false; }
}

/* ---------- post page (?post=<cawId>) ---------- */
async function loadPostPage(cawId) {
  const main = $('postMain'), threadBox = $('postThread'), quotesBox = $('postQuotes');
  const counts = $('postCounts'), note = $('postNote');
  main.innerHTML = '<p>' + T.loading + '</p>';
  let post = null;
  try { post = await findPostDeep(cawId); } catch (e) {}
  if (!post) {
    main.innerHTML = '<p class="err">' + T.postNotFound + '</p>';
    $('threadBlock').style.display = 'none';
    $('quotesBlock').style.display = 'none';
    return;
  }
  main.innerHTML = '';
  main.appendChild(await postCard(post));
  note.textContent = T.stillLooking;
  let ctx = null;
  try { ctx = await collectPostContext(post, 80); } catch (e) {}
  let likes = null;
  try { likes = await likesOf(post); } catch (e) {}
  if (ctx) {
    const parts = [];
    if (likes !== null) parts.push(IC_HEART + ' ' + likes.toString() + ' ' + T.likes);
    parts.push(IC_REPEAT + ' ' + ctx.shareSenders.length + ' ' + T.recaws);
    parts.push(IC_REPLY + ' ' + ctx.replies.length + ' ' + T.replies);
    counts.innerHTML = parts.join('<span class="dot-sep">·</span>');
    note.textContent = ctx.complete ? '' : T.searchStopped;
    threadBox.innerHTML = '';
    if (!ctx.replies.length) threadBox.innerHTML = '<p class="small">' + T.empty + '</p>';
    for (const r of ctx.replies) threadBox.appendChild(await postCard(r));
    quotesBox.innerHTML = '';
    if (!ctx.quotes.length) quotesBox.innerHTML = '<p class="small">' + T.empty + '</p>';
    for (const q of ctx.quotes) quotesBox.appendChild(await postCard(q));
  } else {
    note.textContent = T.loadFail;
  }
}

/* ---------- profile page (?name=<username>) ---------- */
const profileQuery = new URLSearchParams(location.search).get('name');
let profileState = null, profCursor = undefined, profDone = false, profLoading = false;
async function mintDateOf(id) {
  let url = API + '/tokens/' + CAW_NAME + '/instances/' + id + '/transfers';
  for (let page = 0; page < 8; page++) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const j = await res.json();
      for (const it of (j.items || [])) {
        const from = (it.from && it.from.hash) || '';
        if (from.toLowerCase() === '0x0000000000000000000000000000000000000000') return it.timestamp;
      }
      if (!j.next_page_params) return null;
      url = API + '/tokens/' + CAW_NAME + '/instances/' + id + '/transfers?' + new URLSearchParams(j.next_page_params).toString();
    } catch (e) { return null; }
  }
  return null;
}
async function loadProfile() {
  const head = $('profileHead');
  head.innerHTML = '<p>' + T.loading + '</p>';
  let res;
  try {
    res = await resolveNameId(profileQuery);
  } catch (e) {
    head.innerHTML = '<p class="err">' + T.profLoadFail + '</p>' +
      '<p><button id="profRetry" type="button">' + T.retryBtn + '</button></p>';
    $('profilePostsTitle').style.display = 'none';
    const rb = $('profRetry');
    if (rb) rb.onclick = () => { $('profilePostsTitle').style.display = ''; loadProfile(); };
    return;
  }
  if (res.status !== 'ok') {
    head.innerHTML = '<p class="err">' + T.profNotFound + '</p>';
    $('profilePostsTitle').style.display = 'none';
    return;
  }
  const id = res.id;
  const username = res.username;
  const [owner, img, followers, balance, mintTs] = await Promise.all([
    readAddr(CAW_NAME, SEL.ownerOf + word(id)).catch(() => null),
    avatarFor(id),
    readUint(CAW_ACTIONS, SEL.followerCount + word(id)).catch(() => null),
    readUint(CAW_NAME, SEL.cawBalanceOf + word(id)).catch(() => null),
    mintDateOf(id),
  ]);
  const chips = ['#' + id.toString()];
  if (followers !== null) chips.push(followers.toString() + ' ' + T.followers);
  if (balance !== null) chips.push(T.inName + ': ' + fmtQcaw(balance) + ' qCAW');
  if (mintTs) {
    const d = new Date(mintTs);
    chips.push(T.nameCreated + ': ' + d.toLocaleDateString(LANG === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }));
  }
  head.innerHTML = '<div class="pband"></div>' +
    '<div class="prow"><div class="pava">' + avatarHtml(img, username) + '</div></div>' +
    '<div class="pname">@' + esc(username) + '</div>' +
    (owner ? '<div class="small">' + T.ownerLbl + ': <a class="plink" href="' + EXPLORER + '/address/' + owner + '" target="_blank" rel="noopener">' + esc(shortAddr(owner)) + '</a></div>' : '') +
    '<div class="chips">' + chips.map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>';
  profileState = { id, username };
  profCursor = undefined; profDone = false;
  $('profilePosts').innerHTML = '';
  loadProfilePosts();
}
/* A profile's posts are found by scanning the contract feed itself
   (most actions arrive through a relay address, so the owner's own
   transaction list does not show them). One load scans up to 30
   pages; "see more" continues from the cursor. */
async function loadProfilePosts() {
  if (!profileState || profLoading || profDone) return;
  profLoading = true;
  const box = $('profilePosts');
  try {
    let found = 0, pages = 0;
    while (found < 10 && pages < 30 && !profDone) {
      const page = await fetchPage(profCursor === undefined ? null : profCursor);
      profCursor = page.next;
      if (!profCursor) profDone = true;
      pages++;
      for (const a of page.items) {
        if (a.senderId === profileState.id) {
          const row = await rowFor(a);
          if (row) { box.appendChild(row); found++; }
        }
      }
      if (!page.items.length) profDone = true;
    }
    if (!box.children.length && profDone) box.innerHTML = '<p>' + T.empty + '</p>';
    $('profileMore').style.display = profDone ? 'none' : '';
  } catch (e) {
    if (!box.children.length) box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
  } finally { profLoading = false; }
}

/* ---------- name lookup (read-only) ---------- */
async function doLookup() {
  const input = $('lookupInput'), out = $('lookupResult');
  const q = input.value.trim();
  if (!q) { out.innerHTML = ''; return; }
  out.innerHTML = '<p class="small">' + T.checking + '</p>';
  try {
    const res = await resolveNameId(q);
    if (res.status === 'ok') { location.href = profUrl(res.username); return; }
    out.innerHTML = '<p class="warn">' + T.notFound + '</p>';
  } catch (e) {
    out.innerHTML = '<p class="err">' + T.lookupFail + '</p>';
  }
}

/* ---------- init ---------- */
const postQuery = new URLSearchParams(location.search).get('post');
document.querySelectorAll('.langs a').forEach(a => {
  const base = a.getAttribute('href').split('?')[0];
  a.href = base + location.search;
});
if (postQuery && /^0x[0-9a-fA-F]{64}$/.test(postQuery)) {
  document.body.classList.add('post-mode');
  $('viewPost').style.display = '';
  loadPostPage(postQuery);
} else if (profileQuery) {
  document.body.classList.add('profile-mode');
  $('viewProfile').style.display = '';
  loadProfile();
  $('profileMore').onclick = loadProfilePosts;
} else {
  $('viewHome').style.display = '';
  loadTimeline(false);
  $('moreBtn').onclick = () => loadTimeline(true);
}
$('lookupBtn').onclick = doLookup;
$('lookupInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLookup(); });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

} /* end browser UI */

/* Node export for the verification harness (ignored in browsers). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    decodeActions, parsePostText, b64UrlToHex, metaFromUri,
    readCardName, resolveName, resolveNameId, avatarFor,
    fetchPage, findPostByCawId, findPostDeep, collectPostContext,
    postIndex, refIndex, refChildren, indexItem, likesOf, isVisibleRow,
    rpc, readUint, readStr, SEL, CAW_NAME, CAW_ACTIONS, MINTER, word,
  };
}
