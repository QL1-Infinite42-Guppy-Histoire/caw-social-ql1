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
    refreshBtn: 'Refresh', justNow: 'now',
    postSearchTitle: 'Search posts', postSearchPh: 'Words in a post…', postSearchBtn: 'Search posts',
    searchingPosts: 'Searching… looked through {n} posts so far.',
    searchFound: '{n} posts found.', searchNone: 'No posts matched.',
    searchEnd: 'That is the whole record we could read.', searchMoreBtn: 'Search further back',
    searchTitle: 'Posts matching “{q}”',
    followingLbl: 'Following', followersLbl: 'Followers',
    followNote: 'These lists are rebuilt from the public record, so they can differ a little from the counts.',
    followBuilding: 'Reading the public record… {n} pages so far.',
    followEmpty: 'Nobody here yet.',
    newPosts: 'New posts',
    statsTitle: 'CAW right now', statsNames: '{n} names',
    statsPosts24: '{n} posts in the last 24 hours',
    statsPosts24Partial: 'At least {n} posts in the last 24 hours (counted from the newest {m} posts)',
    statsTop: 'Most active now',
    shareBtn: 'Share', copied: 'Copied',
    searchNameChip: 'Posts by @{name}',
    followKeepBtn: 'Keep reading the record', followDone: 'The whole record has been read.',
    followListsBuilding: 'Still reading the record — here is the list so far:',
    toTop: 'Back to top',
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
    refreshBtn: '更新する', justNow: '今',
    postSearchTitle: '投稿をさがす', postSearchPh: '投稿の中の言葉…', postSearchBtn: '投稿をさがす',
    searchingPosts: 'さがしています… これまでに {n} 件の投稿を見ました。',
    searchFound: '{n} 件見つかりました。', searchNone: '合う投稿は見つかりませんでした。',
    searchEnd: '読める記録はここまでです。', searchMoreBtn: 'もっと昔までさがす',
    searchTitle: '「{q}」を含む投稿',
    followingLbl: 'フォロー中', followersLbl: 'フォロワー',
    followNote: 'この一覧は公開の記録から作り直しているため、数と少し違うことがあります。',
    followBuilding: '公開の記録を読んでいます… {n} ページ目まで読みました。',
    followEmpty: 'まだ誰もいません。',
    newPosts: '新しい投稿があります',
    statsTitle: 'CAWのいま', statsNames: '名前は {n} 個',
    statsPosts24: 'この24時間の投稿は {n} 件',
    statsPosts24Partial: 'この24時間の投稿は {n} 件以上（新しい順に {m} 件から数えました）',
    statsTop: 'よく投稿している名前',
    shareBtn: '共有', copied: 'コピーしました',
    searchNameChip: '@{name} のプロフィール',
    followKeepBtn: '続きを読み込む', followDone: '記録を全部読みました。',
    followListsBuilding: '記録を読み途中です — ここまでの一覧：',
    toTop: '上へ戻る',
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

/* ---------- text helpers: safe linkify + relative time (v9) ---------- */
const PAGE_FILE = LANG === 'ja' ? 'ja.html' : 'en.html';
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
/* Escape FIRST, then link: http(s) URLs become external links and
   @name mentions become profile links. Runs on the parsed body
   only — reply/quote marker lines are already stripped by
   parsePostText, so a marker can never be linkified. */
function linkify(body) {
  const escaped = escapeHtml(body);
  return escaped.replace(/(https?:\/\/[^\s<]+)|@([A-Za-z0-9_]{1,30})/g, (m, url, mention) => {
    if (url) {
      const clean = url.replace(/[.,!?;:)”’]+$/, '');
      const tail = url.slice(clean.length);
      return '<a href="' + clean + '" target="_blank" rel="noopener">' + clean + '</a>' + tail;
    }
    return '<a class="plink mention" href="' + PAGE_FILE + '?name=' + encodeURIComponent(mention) + '">@' + mention + '</a>';
  });
}
/* Compact relative time ("5m" / "3h" / "2d"; JA「5分」「3時間」
   「2日」); from ~30 days on, the plain date. Deterministic when
   nowSec is passed (the harness uses that). */
function relTime(ts, nowSec) {
  const t = Number(ts) || 0;
  const now = nowSec || Math.floor(Date.now() / 1000);
  const diff = Math.max(0, now - t);
  if (diff < 60) return T.justNow;
  if (diff < 3600) { const m = Math.floor(diff / 60); return LANG === 'ja' ? m + '分' : m + 'm'; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return LANG === 'ja' ? h + '時間' : h + 'h'; }
  if (diff < 30 * 86400) { const d = Math.floor(diff / 86400); return LANG === 'ja' ? d + '日' : d + 'd'; }
  return new Date(t * 1000).toLocaleDateString(LANG === 'ja' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'numeric', day: 'numeric' });
}
function fullTimeStr(ts) {
  return new Date((ts || 0) * 1000).toLocaleString(LANG === 'ja' ? 'ja-JP' : 'en-US',
    { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
/* Wrap keyword matches in <mark> WITHOUT touching tags: the input
   is already-escaped, already-linkified HTML, and the string is
   split on tags so a match inside an href (a link URL) is never
   wrapped or corrupted — only visible text is highlighted. */
function highlightKeyword(html, q) {
  const needle = String(q || '').trim();
  if (!needle) return html;
  const escNeedle = escapeHtml(needle).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (!escNeedle) return html;
  const re = new RegExp(escNeedle, 'gi');
  return String(html).split(/(<[^>]+>)/g)
    .map(part => (part.startsWith('<') ? part : part.replace(re, m => '<mark>' + m + '</mark>')))
    .join('');
}
/* Feed-order comparison for the new-posts pill (v10): is item `a`
   strictly newer than item `b` in the feed? Ordered by block, then
   transaction index in the block, then the action timestamp. When
   every order key ties (two actions from one batched transaction
   share them all) a different action id still counts as newer —
   the fresh head is then a different action at the head position. */
function itemSeq(it) {
  return [Number(it && it.block) || 0, Number(it && it.txIndex) || 0, Number(it && it.ts) || 0];
}
function isNewerItem(a, b) {
  if (!a) return false;
  if (!b) return true;
  const x = itemSeq(a), y = itemSeq(b);
  for (let i = 0; i < x.length; i++) {
    if (x[i] !== y[i]) return x[i] > y[i];
  }
  return String(a.cawId || '').toLowerCase() !== String(b.cawId || '').toLowerCase();
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
/* ---------- one card read per name (v9) ----------
   A name's CARD (its tokenURI metadata) carries BOTH the name and
   the picture, so they are read together, once, and cached: the
   older viewer fetched tokenURI twice per author (once for the
   name, once for the picture). cardStats.tokenUriReads counts the
   actual tokenURI eth_calls so the verification harness can prove
   the single-read rule. The name fallback chain is unchanged:
   card name → usernames(id − 1) → the owner's token list.
   usernames(id) itself is NEVER used (shifted getter). */
const cardStats = { tokenUriReads: 0 };
const cardCache = new Map(); // id (bigint) -> Promise<{name, image}>
const nameById = new Map();  // id (bigint) -> resolved name (sync view, for search)
async function readCard(id) {
  let name = '', image = null;
  try {
    const uri = await withRetry(() => { cardStats.tokenUriReads++; return readStr(CAW_NAME, SEL.tokenURI + word(id)); }, 2, 400);
    const meta = metaFromUri(uri);
    if (meta && typeof meta.name === 'string' && meta.name) name = meta.name;
    if (meta && typeof meta.image === 'string' && meta.image) {
      image = meta.image.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/' + meta.image.slice(7) : meta.image;
    } else if (uri.startsWith('http')) image = uri;
  } catch (e) { /* fall through to the name fallbacks */ }
  if (!name && id >= 1n) {
    try {
      const n = await withRetry(() => readStr(CAW_NAME, SEL.usernames + word(id - 1n)), 2, 400);
      if (n) name = n;
    } catch (e) { /* fall through */ }
  }
  if (!name) {
    try {
      const owner = await readAddr(CAW_NAME, SEL.ownerOf + word(id));
      const toks = await tokensOf(owner);
      const hit = toks.find(t => t.id === id);
      if (hit && hit.username) name = hit.username;
    } catch (e) { /* no name found */ }
  }
  return { name, image };
}
/* ---------- persistent card cache (v10) ----------
   A name card never changes: the username is written once at mint
   and the picture is generated from the name. So a resolved card
   is also kept in localStorage (key caw-cards-v1, at most ~600
   entries, oldest evicted first) and a repeat visit serves it
   with ZERO RPC calls. Only cards with a real name are persisted;
   transient misses stay uncached, exactly like the in-memory
   layer. Oversized picture strings (long data URIs) are not
   stored — the name still is. The layer no-ops gracefully when
   localStorage is unavailable (private mode, Node harness):
   nothing is retained in that case, so behaviour matches v9. */
const CARD_STORE_KEY = 'caw-cards-v1';
const CARD_STORE_MAX = 600;
let storedCards = null, storedLoaded = false;
function storedCardMap() {
  if (storedLoaded) return storedCards;
  storedCards = new Map();
  if (typeof localStorage === 'undefined') return storedCards;
  try {
    const j = JSON.parse(localStorage.getItem(CARD_STORE_KEY) || 'null');
    if (j && Array.isArray(j.entries)) {
      for (const e of j.entries) {
        if (Array.isArray(e) && e[1]) storedCards.set(String(e[0]), { name: e[1], image: e[2] || null });
      }
    }
    storedLoaded = true;
  } catch (e) { /* a broken store just means a fresh read */ }
  return storedCards;
}
function persistCard(id, card) {
  if (!card || !card.name) return;
  if (typeof localStorage === 'undefined') return;
  const m = storedCardMap();
  const key = id.toString();
  m.delete(key); // re-insert at the end: eviction drops the oldest
  const img = (typeof card.image === 'string' && card.image.length <= 8192) ? card.image : null;
  m.set(key, { name: card.name, image: img });
  while (m.size > CARD_STORE_MAX) m.delete(m.keys().next().value);
  try {
    localStorage.setItem(CARD_STORE_KEY, JSON.stringify({
      v: 1, entries: [...m].map(([k, v]) => [k, v.name, v.image]),
    }));
  } catch (e) { /* quota / private mode: the in-memory cache still works */ }
}
function cardFor(idIn) {
  const id = BigInt(idIn);
  if (!cardCache.has(id)) {
    const stored = storedCardMap().get(id.toString());
    if (stored) {
      nameById.set(id, stored.name);
      cardCache.set(id, Promise.resolve(stored));
      return cardCache.get(id);
    }
    const p = readCard(id).then(card => {
      if (!card.name) cardCache.delete(id); // a transient miss must not stick
      else { nameById.set(id, card.name); persistCard(id, card); }
      return card;
    }).catch(() => { cardCache.delete(id); return { name: '', image: null }; });
    cardCache.set(id, p);
  }
  return cardCache.get(id);
}
async function readCardName(idIn) { return (await cardFor(idIn)).name; }
function resolveName(idIn) {
  return cardFor(idIn).then(c => c.name || null);
}
/* Clears ONLY the in-memory layer (+ the read counter): the
   harness uses it to simulate a fresh session, where the
   persistent store must survive untouched. */
function resetCardCacheForTest() { cardCache.clear(); nameById.clear(); cardStats.tokenUriReads = 0; }
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

/* avatar image for a name id — the picture half of the same single
   card read that resolveName uses (see cardFor above). */
function avatarFor(idIn) {
  return cardFor(idIn).then(c => c.image);
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

/* ---------- signing core — GROUNDWORK ONLY (v9) ----------
   Ported verbatim from the verified implementation that shipped in
   this repo's pre-pause web app (docs/app.js, commits 9901dc3 /
   e3be564) and that the Android app still uses (src/lib/cawCore.ts
   there is a port of the same code; the hand-rolled keccak below
   was re-checked against ethers' keccak256 for the empty string
   and "hello"). It is present so the next phase can wire CAW
   actions (post / like / Recaw / follow) onto it — THIS release
   has no wallet UI, nothing calls these functions, and nothing in
   this file signs or sends. */
/* ==== signing core (verified) ====
   The CAW write path on QL1, pinned down from the live CawActions contract:
   - digest = keccak256(0x1901 || DOMAIN_SEPARATOR || structHash), where
     DOMAIN_SEPARATOR is the value the contract itself keeps in storage
     slot 2, and structHash = keccak256(TYPEHASH || fields) with the fields
     in the contract's own order (the two tip lists are empty in every real
     action seen on QL1, so they contribute keccak256('')).
   - This exact code was tested off-chain against all 264 actions found in
     recent real transactions: every signature recovered its sender, and
     the batch encoder below rebuilt every real calldata byte for byte. */
const SC_DS = '1131b7219bb3aaedaa16d8f6e50191b447828129c4c2c5b3fa55263a6f37c96d';
const SC_TYPEHASH = 'd2f7d9453bd20ea9069ffefabd584b9d0b624994852fb9b9568a2a8ecc3517ac';
const SC_RC = [
  0x0000000000000001n, 0x0000000000008082n, 0x800000000000808an, 0x8000000080008000n,
  0x000000000000808bn, 0x0000000080000001n, 0x8000000080008081n, 0x8000000000008009n,
  0x000000000000008an, 0x0000000000000088n, 0x0000000080008009n, 0x000000008000000an,
  0x000000008000808bn, 0x800000000000008bn, 0x8000000000008089n, 0x8000000000008003n,
  0x8000000000008002n, 0x8000000000000080n, 0x000000000000800an, 0x800000008000000an,
  0x8000000080008081n, 0x8000000000008080n, 0x0000000080000001n, 0x8000000080008008n,
];
const SC_R = [[0, 36, 3, 41, 18], [1, 44, 10, 45, 2], [62, 6, 43, 15, 61], [28, 55, 25, 21, 56], [27, 20, 39, 8, 14]];
const SC_MASK = 0xffffffffffffffffn;
function scRotl(v, n) { return n === 0 ? v : (((v << BigInt(n)) | (v >> BigInt(64 - n))) & SC_MASK); }
function scKeccakF(st) {
  for (let round = 0; round < 24; round++) {
    const C = [], D = [];
    for (let x = 0; x < 5; x++) C[x] = st[x] ^ st[x + 5] ^ st[x + 10] ^ st[x + 15] ^ st[x + 20];
    for (let x = 0; x < 5; x++) D[x] = C[(x + 4) % 5] ^ scRotl(C[(x + 1) % 5], 1);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) st[x + 5 * y] ^= D[x];
    const B = new Array(25);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) B[y + 5 * ((2 * x + 3 * y) % 5)] = scRotl(st[x + 5 * y], SC_R[x][y]);
    for (let x = 0; x < 5; x++) for (let y = 0; y < 5; y++) st[x + 5 * y] = B[x + 5 * y] ^ ((~B[(x + 1) % 5 + 5 * y]) & B[(x + 2) % 5 + 5 * y]);
    st[0] ^= SC_RC[round];
  }
}
function scKeccak(bytes) { // Uint8Array -> hex string (no 0x)
  const rate = 136;
  const st = new Array(25).fill(0n);
  const padded = Array.from(bytes);
  padded.push(0x01);
  while (padded.length % rate !== rate - 1) padded.push(0);
  padded.push(0x80);
  for (let off = 0; off < padded.length; off += rate) {
    for (let i = 0; i < rate / 8; i++) {
      let lane = 0n;
      for (let j = 7; j >= 0; j--) lane = (lane << 8n) | BigInt(padded[off + i * 8 + j]);
      st[i] ^= lane;
    }
    scKeccakF(st);
  }
  let out = '';
  for (let i = 0; i < 4; i++) {
    let lane = st[i];
    for (let j = 0; j < 8; j++) { out += Number(lane & 0xffn).toString(16).padStart(2, '0'); lane >>= 8n; }
  }
  return out;
}
const scHexBytes = h => { h = h.replace(/^0x/, ''); const b = new Uint8Array(h.length / 2); for (let i = 0; i < b.length; i++) b[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16); return b; };
const scUtf8 = s => new TextEncoder().encode(s);
const scWord = v => BigInt(v).toString(16).padStart(64, '0');
const scAddrWord = a => a.replace(/^0x/, '').toLowerCase().padStart(64, '0');
const SC_EMPTY_HASH = scKeccak(new Uint8Array(0));
function scActionDigest(a) { // a: {type,senderId,receiverId,ts,sender,cawId,text} -> '0x…' digest to sign
  const structHash = scKeccak(scHexBytes(
    SC_TYPEHASH + scWord(a.type) + scWord(a.senderId) + scWord(a.receiverId) +
    SC_EMPTY_HASH + scWord(a.ts) + SC_EMPTY_HASH + scAddrWord(a.sender) +
    a.cawId.replace(/^0x/, '') + scKeccak(scUtf8(a.text))
  ));
  return '0x' + scKeccak(scHexBytes('1901' + SC_DS + structHash));
}
function scEncodeAction(a) {
  const tb = scUtf8(a.text);
  const textTail = scWord(tb.length) + Array.from(tb).map(b => b.toString(16).padStart(2, '0')).join('').padEnd(Math.ceil(tb.length / 32) * 64 || 64, '0');
  return scWord(a.type) + scWord(a.senderId) + scWord(a.receiverId) + scWord(0x120) + scWord(a.ts) +
    scAddrWord(a.sender) + scWord(0x140) + a.cawId.replace(/^0x/, '') + scWord(0x160) +
    scWord(0) + scWord(0) + textTail; // the two tip lists are always empty here
}
function scEncodeBatch(actions, sigs) { // -> full calldata for the processAction batch call
  const n = actions.length;
  const tails = actions.map(scEncodeAction);
  let acts = scWord(n), off = n * 32;
  const offs = tails.map(t => { const o = off; off += t.length / 2; return o; });
  acts += offs.map(o => scWord(o)).join('') + tails.join('');
  const vs = scWord(n) + sigs.map(s => scWord(s.v)).join('');
  const rs = scWord(n) + sigs.map(s => s.r.replace(/^0x/, '')).join('');
  const ss = scWord(n) + sigs.map(s => s.s.replace(/^0x/, '')).join('');
  const head = scWord(0x80) + scWord(0x80 + acts.length / 2) + scWord(0x80 + acts.length / 2 + vs.length / 2) + scWord(0x80 + acts.length / 2 + vs.length / 2 + rs.length / 2);
  return '0x84e33f2f' + scWord(1) + scWord(0x40) + head + acts + vs + rs + ss;
}
/* ==== end signing core ==== */
/* Public names for the next phase + the verification harness. */
const actionDigest = scActionDigest;
const encodeBatch = scEncodeBatch;
const keccakHex = bytes => scKeccak(bytes);

/* ---------- follow index (rebuilt from the public record) ----------
   CawActions keeps only a follower COUNT per name, so the lists
   are reconstructed from the follow / unfollow actions themselves
   (the app's followIndex rule): for each (sender, receiver) pair
   the LATEST action wins and a type-4 unfollow closes the pair.
   The pair map persists in localStorage with a block watermark,
   so repeat visits only walk pages newer than the watermark; an
   interrupted build resumes from its stored cursor. Lists are
   refined the app's way: followers whose sender name currently
   holds no qCAW in its name balance are dropped (those follows
   never registered), and a failed balance read keeps the pair
   (fail-open). The profile header number stays the chain's own
   followerCount — only the lists are reconstructions. */
const FI_KEY = 'caw-follow-index-v1';
/* One activation of the follow build walks at most this many feed
   pages (v10 chunking — v9 walked the whole record in one go,
   ~40 s cold). The resume cursor + watermark make the next
   activation continue where the last one stopped. */
const FOLLOW_CHUNK_PAGES = 25;
let fiPairs = new Map(), fiWatermark = 0, fiCursor = null, fiHead = 0, fiHydrated = false, fiBuilding = null, fiPages = 0, fiComplete = false;
const fiZeroVerdicts = new Map();
const fiStore = {
  get() { try { return typeof localStorage !== 'undefined' ? localStorage.getItem(FI_KEY) : null; } catch (e) { return null; } },
  set(v) { try { if (typeof localStorage !== 'undefined') localStorage.setItem(FI_KEY, v); } catch (e) {} },
};
const fiKey = (s, r) => s.toString() + '->' + r.toString();
function fiNewer(a, b) { return a.b > b.b || (a.b === b.b && (a.x > b.x || (a.x === b.x && a.k > b.k))); }
function fiHydrate() {
  if (fiHydrated) return;
  fiHydrated = true;
  try {
    const j = JSON.parse(fiStore.get() || 'null');
    if (j && typeof j.watermark === 'number' && j.pairs) {
      fiWatermark = j.watermark;
      fiPairs = new Map(Object.entries(j.pairs));
      if (j.buildCursor && typeof j.buildCursor === 'object') { fiCursor = j.buildCursor; fiHead = j.buildHead || 0; }
      /* v9 stores have no explicit flag: a stored walk with no
         resume cursor and a watermark had finished; anything with
         a cursor still has pages to read. */
      fiComplete = j.complete !== undefined ? !!j.complete : (!j.buildCursor && j.watermark > 0);
    }
  } catch (e) { /* a broken cache just means a fresh build */ }
}
function fiPersist() {
  const obj = {};
  for (const [k, v] of fiPairs) obj[k] = v;
  fiStore.set(JSON.stringify({ watermark: fiWatermark, pairs: obj, buildCursor: fiCursor, buildHead: fiHead, complete: fiComplete }));
}
function fiMerge(it) {
  if ((it.type !== 3 && it.type !== 4) || it.block === undefined) return;
  const rec = { t: it.type, b: it.block, x: it.txIndex ?? 0, k: 0 };
  const cur = fiPairs.get(fiKey(it.senderId, it.receiverId));
  if (!cur || !fiNewer(cur, rec)) fiPairs.set(fiKey(it.senderId, it.receiverId), rec);
}
/* Walk the feed and merge every follow/unfollow. Stops early once
   a whole page is at or below the stored watermark. One activation
   walks at most FOLLOW_CHUNK_PAGES pages (maxPages may lower that,
   never raise it); the cursor is persisted so the next activation
   resumes. Resolves with the build state (see followBuildState). */
function followBuildState() {
  fiHydrate();
  return { complete: fiComplete, pages: fiPages, walking: !!fiBuilding, pairs: fiPairs.size };
}
function buildFollowIndex(onProgress, maxPages) {
  if (fiBuilding) return fiBuilding;
  const cap = Math.max(1, Math.min(maxPages || FOLLOW_CHUNK_PAGES, FOLLOW_CHUNK_PAGES));
  fiBuilding = (async () => {
    try {
      fiHydrate();
      let cursor = fiCursor, pages = 0, headBlock = fiHead;
      fiPages = 0;
      while (true) {
        const page = await fetchPage(cursor);
        pages++; fiPages = pages;
        if (onProgress) onProgress(pages);
        let pageMax = 0;
        for (const it of page.items) { if (it.block !== undefined && it.block > pageMax) pageMax = it.block; fiMerge(it); }
        if (pages === 1 && headBlock === 0) headBlock = pageMax;
        cursor = page.next;
        if (!cursor) break;
        if (pageMax > 0 && pageMax <= fiWatermark) break;
        if (pages >= cap) { fiCursor = cursor; fiHead = headBlock; fiComplete = false; fiPersist(); return followBuildState(); }
        if (pages % 10 === 0) { fiCursor = cursor; fiHead = headBlock; fiPersist(); }
      }
      if (headBlock > fiWatermark) fiWatermark = headBlock;
      fiCursor = null; fiHead = 0; fiComplete = true;
      fiPersist();
      return followBuildState();
    } finally { fiBuilding = null; }
  })();
  return fiBuilding;
}
function followListsOf(idIn) {
  fiHydrate();
  const id = BigInt(idIn).toString();
  const following = [], followers = [];
  for (const [key, rec] of fiPairs) {
    if (rec.t !== 3) continue;
    const [s, r] = key.split('->');
    if (s === id) following.push({ id: BigInt(r), rec });
    if (r === id) followers.push({ id: BigInt(s), rec });
  }
  const byRecency = (a, b) => b.rec.b - a.rec.b || b.rec.x - a.rec.x;
  following.sort(byRecency); followers.sort(byRecency);
  return { following: following.map(f => f.id), followers: followers.map(f => f.id) };
}
async function fiRegistered(s, r) {
  const key = fiKey(s, r);
  const rec = fiPairs.get(key);
  if (!rec || rec.t !== 3) return false;
  if (fiZeroVerdicts.has(key)) return !fiZeroVerdicts.get(key);
  let registered = true;
  try { registered = (await readUint(CAW_NAME, SEL.cawBalanceOf + word(s))) > 0n; }
  catch (e) { registered = true; } // fail-open
  fiZeroVerdicts.set(key, !registered);
  return registered;
}
async function refinedFollowListsOf(idIn) {
  const base = followListsOf(idIn);
  const refine = async (ids, asSender) => {
    const out = [];
    for (let i = 0; i < ids.length; i += 8) {
      const chunk = ids.slice(i, i + 8);
      const verdicts = await Promise.all(chunk.map(o => asSender ? fiRegistered(idIn, o) : fiRegistered(o, idIn)));
      chunk.forEach((o, j) => { if (verdicts[j]) out.push(o); });
    }
    return out;
  };
  const [following, followers] = await Promise.all([refine(base.following, true), refine(base.followers, false)]);
  return { following, followers };
}

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
function whenStr(ts) { return relTime(ts); }
const timeHtml = ts => '<span class="time" title="' + esc(fullTimeStr(ts)) + '">· ' + esc(whenStr(ts)) + '</span>';
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
      '<span class="qname">' + esc(who) + '</span>' + timeHtml(post.ts) + '</div>' +
      '<div class="qtext">' + linkify(parsePostText(post.text).body) + '</div>';
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
  html += '<div class="meta"><span class="name">' + whoHtml + '</span>' + timeHtml(a.ts) + '</div>';
  if (parsed.body) html += '<div class="ptext">' + (opts.highlight ? highlightKeyword(linkify(parsed.body), opts.highlight) : linkify(parsed.body)) + '</div>';
  html += '<div class="frameslot"></div>';
  const replyCount = refChildren(a.cawId, 'reply').length;
  html += '<div class="pfoot">' +
    '<span class="like-count"></span>' +
    (replyCount > 0 ? '<span class="reply-count">' + IC_REPLY + '<span>' + replyCount + '</span></span>' : '') +
    (opts.nested ? '' : '<a href="' + postUrl(a.cawId) + '">' + T.openPost + '</a>') +
    '<a href="' + EXPLORER + '/tx/' + a.hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a>' +
    '</div>';
  html += '</div>';
  div.innerHTML = html;
  /* Like count fills in after the card is on screen — it must
     never hold up rendering (v9 speed rule). */
  const likeEl = div.querySelector('.like-count');
  if (likeEl) {
    likesOf(a).then(n => { if (n > 0n) likeEl.innerHTML = IC_HEART + '<span>' + n.toString() + '</span>'; }).catch(() => {});
  }
  /* Whole-card click opens the post page, except on links/buttons. */
  if (!opts.nested) {
    div.classList.add('clickable');
    div.addEventListener('click', e => {
      if (e.target.closest('a,button')) return;
      location.href = postUrl(a.cawId);
    });
  }
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
    timeHtml(a.ts) + '</div>' +
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
function skeletonHtml(n) {
  let s = '';
  for (let i = 0; i < (n || 5); i++) {
    s += '<div class="post skel" aria-hidden="true"><div class="avatar skel-block"></div>' +
      '<div class="pbody"><div class="skel-line w40"></div><div class="skel-line w90"></div><div class="skel-line w70"></div></div></div>';
  }
  return s;
}
let tlCursor = null, tlDone = false, tlLoading = false, tlTopItem = null;
async function loadTimeline(append) {
  if (tlLoading || (append && tlDone)) return;
  tlLoading = true;
  const box = $('timeline');
  try {
    if (!append) { box.innerHTML = skeletonHtml(5); tlCursor = null; tlDone = false; tlTopItem = null; }
    let rendered = 0, pages = 0, cleared = append;
    while (rendered === 0 && pages < 4 && !tlDone) {
      const page = await fetchPage(tlCursor);
      tlCursor = page.next;
      if (!tlCursor) tlDone = true;
      pages++;
      if (!append && tlTopItem === null && page.items.length) tlTopItem = page.items[0];
      /* Build the whole page's rows in parallel, append in order —
         never await one row at a time (v9 speed rule). */
      const rows = await Promise.all(page.items.map(a => rowFor(a).catch(() => null)));
      if (!cleared) { box.innerHTML = ''; cleared = true; }
      for (const row of rows) if (row) { box.appendChild(row); rendered++; }
      if (!page.items.length) tlDone = true;
    }
    if (!box.children.length && tlDone) box.innerHTML = '<p>' + T.empty + '</p>';
    $('moreBtn').style.display = tlDone ? 'none' : '';
  } catch (e) {
    if (!box.querySelector('.post:not(.skel)')) {
      box.innerHTML = '<p class="err">' + T.loadFail + '</p>' +
        '<p><button id="tlRetry" type="button">' + T.retryBtn + '</button></p>';
      const tb = $('tlRetry');
      if (tb) tb.onclick = () => loadTimeline(false);
    }
    else $('moreBtn').style.display = '';
  } finally { tlLoading = false; }
}

/* ---------- new-posts pill (v10) ----------
   While the home timeline is on screen and the tab is visible,
   re-check the feed head about once a minute. The head page is
   never served stale (its cache entry only lives while a fetch is
   in flight), so this is one light request. Anything newer than
   the newest item on screen shows a pill — the timeline is NEVER
   reloaded under the reader; tapping the pill reloads it. */
let tlPollTimer = null;
function startNewPostPolling() {
  if (tlPollTimer) return;
  tlPollTimer = setInterval(async () => {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
    if (tlLoading || !tlTopItem) return;
    try {
      const page = await fetchPage(null);
      if (page.items.length && isNewerItem(page.items[0], tlTopItem)) {
        const pill = $('newPostsPill');
        if (pill) pill.style.display = '';
      }
    } catch (e) { /* a failed check just waits for the next tick */ }
  }, 60000);
}

/* ---------- share button (v10) ----------
   The system share sheet when the browser offers one; otherwise
   the page URL is copied and the button says so briefly. No
   external share intents are used. */
async function shareCurrentPage(btn) {
  const url = location.href;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ title: document.title, url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  let okCopy = false;
  try { await navigator.clipboard.writeText(url); okCopy = true; }
  catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      okCopy = document.execCommand('copy');
      ta.remove();
    } catch (e2) { /* nothing more to try */ }
  }
  if (okCopy && btn) {
    const old = btn.textContent;
    btn.textContent = T.copied;
    setTimeout(() => { btn.textContent = old; }, 1600);
  }
}

/* ---------- "CAW right now" stats card (v10) ----------
   Filled from reads the viewer makes anyway: the name count from
   totalSupply, and a bounded head walk (at most 12 pages, pages
   the timeline will reuse from the page cache) for the last-24h
   post count and the most active names in that window. When the
   walk hits its cap before covering a full 24 hours, the count is
   labelled as counted from the newest N posts. Any failure hides
   the card silently. */
async function loadStats() {
  const cards = document.querySelectorAll('.stats-card');
  if (!cards.length) return;
  try {
    const totalP = readUint(CAW_NAME, SEL.totalSupply).catch(() => null);
    const cutoff = Math.floor(Date.now() / 1000) - 86400;
    let cursor = null, posts24 = 0, seen = 0, covered = false;
    const act = new Map();
    for (let p = 0; p < 12; p++) {
      const page = await fetchPage(cursor);
      cursor = page.next;
      for (const it of page.items) {
        if (it.type !== 0) continue;
        seen++;
        if (it.ts >= cutoff) {
          posts24++;
          const k = it.senderId.toString();
          act.set(k, (act.get(k) || 0) + 1);
        }
      }
      if (!page.items.length) { covered = true; break; }
      const last = page.items[page.items.length - 1];
      if (last && last.ts < cutoff) { covered = true; break; }
      if (!cursor) { covered = true; break; }
    }
    const total = await totalP;
    const top = [...act.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const rows = await Promise.all(top.map(async ([sid, count]) => {
      const [nm, im] = await Promise.all([resolveName(BigInt(sid)), avatarFor(BigInt(sid))]);
      const label = nm ? '@' + nm : T.unknownName + sid;
      const inner = avatarHtml(im, nm) + '<span class="n">' + esc(label) + '</span><span class="cnt">' + count + '</span>';
      return '<div class="stats-row">' + (nm
        ? '<a class="plink stats-row-link" href="' + profUrl(nm) + '">' + inner + '</a>'
        : inner) + '</div>';
    }));
    const fmt = n => Number(n).toLocaleString(LANG === 'ja' ? 'ja-JP' : 'en-US');
    let body = '';
    if (total !== null) body += '<p>' + esc(T.statsNames.replace('{n}', fmt(total))) + '</p>';
    body += '<p>' + esc((covered ? T.statsPosts24 : T.statsPosts24Partial)
      .replace('{n}', fmt(posts24)).replace('{m}', fmt(seen))) + '</p>';
    if (rows.length) body += '<p class="small">' + esc(T.statsTop) + '</p>' + rows.join('');
    if (!body) return;
    document.querySelectorAll('.statsBody').forEach(el => { el.innerHTML = body; });
    cards.forEach(c => c.classList.remove('hidden'));
  } catch (e) { /* the card stays hidden */ }
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
    for (const row of await Promise.all(ctx.replies.map(r => postCard(r)))) threadBox.appendChild(row);
    quotesBox.innerHTML = '';
    if (!ctx.quotes.length) quotesBox.innerHTML = '<p class="small">' + T.empty + '</p>';
    for (const row of await Promise.all(ctx.quotes.map(q => postCard(q)))) quotesBox.appendChild(row);
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
    '<div class="chips">' + chips.map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>' +
    /* Follow lists (v9): the counts are tappable and open the
       reconstructed lists inline. The Followers number shown here
       is the chain's own followerCount; the list itself is the
       reconstruction (see the small print under it). */
    '<div class="followbar">' +
    '<button type="button" class="ghost follow-open" id="followingBtn">' + T.followingLbl + '</button>' +
    '<button type="button" class="ghost follow-open" id="followersBtn">' + T.followersLbl + (followers !== null ? ': ' + followers.toString() : '') + '</button>' +
    '</div><div id="followLists"></div>';
  profileState = { id, username };
  const fb = $('followingBtn'), rb2 = $('followersBtn');
  if (fb) fb.onclick = () => openFollowList('following');
  if (rb2) rb2.onclick = () => openFollowList('followers');
  profCursor = undefined; profDone = false;
  profBuckets = { posts: [], recaws: [] };
  profTab = 'posts';
  paintProfTabs();
  $('profilePosts').innerHTML = '';
  loadProfilePosts();
}
/* Profile rows live in two tabs (v10): "Posts" holds the name's
   own posts (type 0); "Recaws & follows" holds its Recaws and
   follow/unfollow rows (types 2/3/4). Both buckets are filled by
   the SAME feed scan, so switching tabs never rescans, and "See
   more" simply continues the one underlying scan. */
let profBuckets = { posts: [], recaws: [] }, profTab = 'posts';
function paintProfTabs() {
  const a = $('profTabPosts'), b = $('profTabRecaws');
  if (a) a.classList.toggle('on', profTab === 'posts');
  if (b) b.classList.toggle('on', profTab === 'recaws');
}
function renderProfBucket() {
  const box = $('profilePosts');
  if (!box) return;
  box.innerHTML = '';
  const rows = profBuckets[profTab];
  if (!rows.length) {
    if (profDone) box.innerHTML = '<p>' + T.empty + '</p>';
    return;
  }
  for (const r of rows) box.appendChild(r);
}
function switchProfTab(tab) {
  if (tab !== 'posts' && tab !== 'recaws') return;
  profTab = tab;
  paintProfTabs();
  renderProfBucket();
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
      const mine = page.items.filter(a => a.senderId === profileState.id && a.type !== 1);
      const built = await Promise.all(mine.map(async a => {
        const row = await rowFor(a).catch(() => null);
        return row ? { bucket: a.type === 0 ? 'posts' : 'recaws', row } : null;
      }));
      let addedActive = false;
      for (const b of built) {
        if (!b) continue;
        profBuckets[b.bucket].push(b.row);
        if (b.bucket === profTab) addedActive = true;
        found++;
      }
      if (addedActive) renderProfBucket();
      if (!page.items.length) profDone = true;
    }
    renderProfBucket();
    $('profileMore').style.display = profDone ? 'none' : '';
  } catch (e) {
    if (!profBuckets.posts.length && !profBuckets.recaws.length) box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
  } finally { profLoading = false; }
}

/* ---------- profile follow lists (reconstructed, v9; chunked v10) ----------
   The build runs in chunks of FOLLOW_CHUNK_PAGES feed pages per
   activation. After each chunk the lists render from whatever
   pairs are known so far (labelled as still being built); while
   pages remain, a "Keep reading the record" button runs the next
   chunk. When the walk completes, the area says so plainly. */
let followOpenKind = null;
async function renderFollowLists(kind) {
  const box = $('followLists');
  if (!box || !profileState) return;
  let lists;
  try { lists = await refinedFollowListsOf(profileState.id); }
  catch (e) { lists = followListsOf(profileState.id); }
  if (followOpenKind !== kind || !profileState) return;
  const st = followBuildState();
  const ids = kind === 'following' ? lists.following : lists.followers;
  const btn = $(kind === 'following' ? 'followingBtn' : 'followersBtn');
  if (btn && kind === 'following') btn.textContent = T.followingLbl + ': ' + ids.length;
  box.innerHTML = '';
  const status = document.createElement('p');
  status.className = 'small';
  status.textContent = st.complete ? T.followDone : T.followListsBuilding;
  box.appendChild(status);
  if (!ids.length && st.complete) {
    const e = document.createElement('p');
    e.className = 'small';
    e.textContent = T.followEmpty;
    box.appendChild(e);
  }
  if (ids.length) {
    const rows = await Promise.all(ids.map(async id => {
      const [nm, im] = await Promise.all([resolveName(id), avatarFor(id)]);
      const d = document.createElement('div');
      d.className = 'namecard';
      const label = nm ? '@' + nm : T.unknownName + id;
      d.innerHTML = (nm ? '<a class="plink" href="' + profUrl(nm) + '">' + avatarHtml(im, nm) + '</a>' : avatarHtml(im, nm)) +
        '<div class="grow"><div class="n">' + (nm ? '<a class="plink" href="' + profUrl(nm) + '">' + esc(label) + '</a>' : esc(label)) + '</div>' +
        '<div class="small">#' + id.toString() + '</div></div>';
      return d;
    }));
    if (followOpenKind !== kind) return;
    for (const r of rows) box.appendChild(r);
  }
  if (!st.complete) {
    const kb = document.createElement('button');
    kb.type = 'button';
    kb.className = 'ghost';
    kb.textContent = T.followKeepBtn;
    kb.onclick = () => continueFollowBuild(kind);
    box.appendChild(kb);
  }
  const note = document.createElement('p');
  note.className = 'small';
  note.textContent = T.followNote;
  box.appendChild(note);
}
async function continueFollowBuild(kind) {
  const box = $('followLists');
  if (!box) return;
  box.innerHTML = '<p class="small">' + esc(T.followBuilding.replace('{n}', '0')) + '</p>';
  try {
    await buildFollowIndex(pages => {
      if (followOpenKind === kind) {
        box.innerHTML = '<p class="small">' + esc(T.followBuilding.replace('{n}', String(pages))) + '</p>';
      }
    });
  } catch (e) { /* render whatever was merged */ }
  if (followOpenKind !== kind || !profileState) return;
  renderFollowLists(kind);
}
async function openFollowList(kind) {
  if (!profileState) return;
  const box = $('followLists');
  if (!box) return;
  if (followOpenKind === kind) { box.innerHTML = ''; followOpenKind = null; return; }
  followOpenKind = kind;
  if (followBuildState().complete) renderFollowLists(kind);
  else continueFollowBuild(kind);
}

/* ---------- post text search (?q=keyword, v9) ---------- */
let searchState = null;
function postMatchesQuery(a, qLower) {
  if (a.type !== 0) return false;
  const { body } = parsePostText(a.text);
  if (body.toLowerCase().includes(qLower)) return true;
  const nm = nameById.get(BigInt(a.senderId));
  return !!nm && nm.toLowerCase().includes(qLower);
}
async function runSearch(append) {
  if (!searchState || searchState.running || (append && searchState.done)) return;
  searchState.running = true;
  const box = $('searchResults'), prog = $('searchProgress');
  const qLower = searchState.q.toLowerCase();
  try {
    if (!append) { box.innerHTML = skeletonHtml(3); searchState.cursor = null; searchState.done = false; searchState.scanned = 0; searchState.found = 0; }
    let pages = 0, renderedThisRun = 0;
    /* One run scans at most ~60 feed pages (or stops at 20 new
       matches); "search further back" resumes from the cursor. */
    while (pages < 60 && renderedThisRun < 20 && !searchState.done) {
      const page = await fetchPage(searchState.cursor);
      searchState.cursor = page.next;
      if (!searchState.cursor) searchState.done = true;
      pages++;
      const hits = [];
      for (const a of page.items) {
        if (a.type === 0) searchState.scanned++;
        if (postMatchesQuery(a, qLower)) hits.push(a);
      }
      if (hits.length) {
        const rows = await Promise.all(hits.map(a => postCard(a, { highlight: searchState.q }).catch(() => null)));
        if (!append && renderedThisRun === 0) box.innerHTML = '';
        for (const row of rows) if (row) { box.appendChild(row); searchState.found++; renderedThisRun++; }
      } else if (!append && renderedThisRun === 0 && pages === 1) {
        box.innerHTML = '';
      }
      prog.textContent = T.searchingPosts.replace('{n}', String(searchState.scanned));
      if (!page.items.length) searchState.done = true;
    }
    if (!box.querySelector('.post:not(.skel)')) box.innerHTML = '<p>' + T.searchNone + '</p>';
    prog.textContent = T.searchFound.replace('{n}', String(searchState.found)) +
      (searchState.done ? ' ' + T.searchEnd : '');
    $('searchMoreBtn').style.display = searchState.done ? 'none' : '';
  } catch (e) {
    if (!box.querySelector('.post:not(.skel)')) box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
  } finally { searchState.running = false; }
}
function doPostSearch() {
  const v = $('searchInput').value.trim();
  if (v) location.href = pageFile + '?q=' + encodeURIComponent(v);
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
const searchQuery = new URLSearchParams(location.search).get('q');
document.querySelectorAll('.langs a').forEach(a => {
  const base = a.getAttribute('href').split('?')[0];
  a.href = base + location.search;
});
loadStats();
const toTopBtn = $('toTopBtn');
if (toTopBtn) {
  const reduced = typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  toTopBtn.textContent = '↑';
  toTopBtn.setAttribute('aria-label', T.toTop);
  toTopBtn.title = T.toTop;
  window.addEventListener('scroll', () => {
    toTopBtn.style.display = window.scrollY > 600 ? '' : 'none';
  }, { passive: true });
  toTopBtn.onclick = () => window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
}
if (postQuery && /^0x[0-9a-fA-F]{64}$/.test(postQuery)) {
  document.body.classList.add('post-mode');
  $('viewPost').style.display = '';
  loadPostPage(postQuery);
  const spb = $('sharePostBtn');
  if (spb) spb.onclick = () => shareCurrentPage(spb);
} else if (profileQuery) {
  document.body.classList.add('profile-mode');
  $('viewProfile').style.display = '';
  loadProfile();
  $('profileMore').onclick = loadProfilePosts;
  const ptp = $('profTabPosts'), ptr = $('profTabRecaws');
  if (ptp) ptp.onclick = () => switchProfTab('posts');
  if (ptr) ptr.onclick = () => switchProfTab('recaws');
  const sprb = $('shareProfileBtn');
  if (sprb) sprb.onclick = () => shareCurrentPage(sprb);
} else if (searchQuery) {
  $('viewSearch').style.display = '';
  $('searchTitle').textContent = T.searchTitle.replace('{q}', searchQuery);
  searchState = { q: searchQuery, cursor: null, done: false, running: false, scanned: 0, found: 0 };
  runSearch(false);
  $('searchMoreBtn').onclick = () => runSearch(true);
  /* If the words are exactly a name that exists, link its profile
     at the top of the results. */
  resolveNameId(searchQuery).then(res => {
    if (res.status !== 'ok') return;
    const chip = $('searchNameChip');
    if (chip) {
      chip.innerHTML = '<a class="chip name-chip" href="' + profUrl(res.username) + '">' +
        esc(T.searchNameChip.replace('{name}', res.username)) + '</a>';
    }
  }).catch(() => {});
} else {
  $('viewHome').style.display = '';
  loadTimeline(false);
  $('moreBtn').onclick = () => loadTimeline(true);
  const rb = $('refreshBtn');
  if (rb) rb.onclick = () => loadTimeline(false);
  const npb = $('newPostsBtn');
  if (npb) npb.onclick = () => {
    const pill = $('newPostsPill');
    if (pill) pill.style.display = 'none';
    loadTimeline(false);
    const vh = $('viewHome');
    if (vh) vh.scrollIntoView();
  };
  startNewPostPolling();
  /* Auto-load more when the "See more" area scrolls into view;
     the button stays as the manual fallback. */
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) loadTimeline(true);
    }, { rootMargin: '600px' });
    io.observe($('moreBtn'));
  }
}
$('lookupBtn').onclick = doLookup;
$('lookupInput').addEventListener('keydown', e => { if (e.key === 'Enter') doLookup(); });
const sb = $('searchBtn');
if (sb) sb.onclick = doPostSearch;
const si = $('searchInput');
if (si) si.addEventListener('keydown', e => { if (e.key === 'Enter') doPostSearch(); });
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

} /* end browser UI */

/* Node export for the verification harness (ignored in browsers). */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    decodeActions, parsePostText, b64UrlToHex, metaFromUri,
    readCardName, resolveName, resolveNameId, avatarFor,
    cardFor, cardStats, resetCardCacheForTest, linkify, escapeHtml, relTime, fullTimeStr,
    highlightKeyword, isNewerItem,
    actionDigest, encodeBatch, keccakHex,
    buildFollowIndex, followListsOf, refinedFollowListsOf,
    FOLLOW_CHUNK_PAGES, followBuildState,
    fetchPage, findPostByCawId, findPostDeep, collectPostContext,
    postIndex, refIndex, refChildren, indexItem, likesOf, isVisibleRow,
    rpc, readUint, readStr, SEL, CAW_NAME, CAW_ACTIONS, MINTER, word,
  };
}
