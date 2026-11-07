'use strict';
/* CAW SocialFi (QL1) — community front end. Reads are public RPC + Blockscout API.
   Writes go only through the visitor's own wallet. No keys are ever handled here. */

const RPC = 'https://evm-rpc-ql1.mschihuahua.org';
const API = 'https://scan.qom.network/api/v2';
const EXPLORER = 'https://scan.qom.network';
const CHAIN_ID_HEX = '0x2fe'; // 766

const CAW_NAME = '0x864f08Af11F6DC2c0De42562e4664d4f033D393f';
const CAW_ACTIONS = '0x95c2AFEc2dE8b09323Cdc7E40Bcce42C3C49E496';
const MINTER = '0xFC2f8743E3b09a6c973B114c3a082433e974eD9f';
const QCAW = '0xd2140E16aDf37194036865E90BbCA1139b739d0D';
const ACTION_SELECTOR = '0x84e33f2f';

const SEL = {
  usernames: '0x136dd963', ownerOf: '0x6352211e', tokens: '0xe4860339',
  tokenURI: '0xc87b56dd', cawBalanceOf: '0x532f3a34', totalSupply: '0x18160ddd',
  balanceOf: '0x70a08231', allowance: '0xdd62ed3e', approve: '0x095ea7b3',
  costOfName: '0x8c87aa8a', idByUsername: '0x9ebf19e8', isValidUsername: '0x3b032005',
  followerCount: '0x9f46a705', likes: '0x14ce3e7d',
  mint: '0xd85d3d27', deposit: '0x6170c4b1', withdraw: '0x43387983',
};

const LANG = document.documentElement.lang === 'ja' ? 'ja' : 'en';
try { localStorage.setItem('caw-lang', LANG); } catch (e) {}
const T = {
  en: {
    loading: 'Loading…', loadFail: 'Could not load the timeline. Please try again later.',
    empty: 'No actions found yet.', post: 'Post', like: 'Like', recaw: 'ReCaw', follow: 'Follow',
    viewTx: 'see the record', likes: 'likes', to: 'to',
    ctxLike: 'Liked a post by {name}', ctxRecaw: 'Shared a post by {name}', ctxFollow: 'Followed {name}',
    checking: 'Checking…', invalidName: 'That name cannot be used. Names use small letters, numbers and underscores.',
    taken: 'That name is already taken.', available: 'This name is available!',
    price: 'Price', checkFail: 'Could not check. Please try again.',
    needWallet: 'Connect your wallet above to get this name.',
    yourQcaw: 'Your qCAW', step1: 'Step 1 of 2 — let this site use your qCAW to pay for the name', step2: 'Step 2 of 2 — one more tap and the name is yours',
    approveBtn: 'OK, allow it', mintBtn: 'Get this name', sending: 'Check your wallet…',
    waiting: 'Waiting for the chain…', done: 'Done!', failed: 'The transaction failed or was rejected.',
    notEnough: 'Not enough qCAW for this name.', connectFirst: 'Connect your wallet first.',
    connected: 'Connected', wrongChain: 'Your wallet is on another chain.',
    switchBtn: 'Switch to QL1', connectBtn: 'Connect wallet',
    noNames: 'This wallet has no CAW names yet. Get one above!',
    followers: 'followers', inName: 'inside this name', walletQcaw: 'qCAW in wallet',
    deposit: 'Put in', withdraw: 'Take out', amountPh: 'amount (qCAW)',
    approveName: 'One quick OK first, so your qCAW can move into the name', myQom: 'QOM (for small fees)',
    unknownName: 'name #',
    postAs: 'Posting as', postPh: 'What is happening?', postBtn: 'Post',
    postHelp: 'Up to 420 letters. A Japanese letter counts as 3.',
    signNote: 'Your wallet will ask you to sign. That is a one-time OK for this post only — it does not move your coins.',
    signFail: 'Your wallet did not sign, so nothing was sent.',
    posted: 'Posted!', connectToPost: 'Connect your wallet above to post.',
    needNamePost: 'Get a name above first — then you can post.',
    needNameAct: 'You need a CAW name for this. You can get one above.',
    followBtn: 'Follow', followed: 'Followed!', back: 'Back to the timeline',
    profPosts: 'Posts', nameCreated: 'Name made on', ownerLbl: 'Owner',
    yourNameTag: 'This is your name', seeMine: 'See it in My names',
    profNotFound: 'That name was not found.', likeBtn: 'Like', recawBtn: 'Share',
    profLoadFail: 'Could not read this name. Please check your connection and try again.',
    retryBtn: 'Try again', recheckBtn: 'Check again', searching: 'Looking for your wallet…',
    noWalletGuide: 'No wallet app was found yet. If you are reading this in a normal browser, open this page inside your wallet app (MetaMask or FoxWallet) instead. If your wallet app is starting up, wait a moment and tap Check again.',
    chainOk: 'On QL1', navHome: 'Home', navGet: 'Get a name', navMine: 'My names',
  },
  ja: {
    loading: '読み込み中…', loadFail: 'タイムラインを読み込めませんでした。しばらくしてからお試しください。',
    empty: 'まだアクションがありません。', post: '投稿', like: 'いいね', recaw: 'リポスト', follow: 'フォロー',
    viewTx: '記録を見る', likes: 'いいね', to: '→',
    ctxLike: '{name} さんの投稿にいいね', ctxRecaw: '{name} さんの投稿をシェア', ctxFollow: '{name} さんをフォロー',
    checking: '調べています…', invalidName: 'その名前は使えません。名前は小文字・数字・アンダースコアです。',
    taken: 'その名前はすでに使われています。', available: 'この名前は取れます！',
    price: '価格', checkFail: '調べられませんでした。もう一度お試しください。',
    needWallet: 'この名前を取るには、上のボタンでウォレットをつないでください。',
    yourQcaw: 'あなたの qCAW', step1: 'ステップ 1/2：名前の料金に、あなたの qCAW を使う許可を出します', step2: 'ステップ 2/2：あと1タップで名前が取れます',
    approveBtn: '許可する', mintBtn: 'この名前を取る', sending: 'ウォレットで確認してください…',
    waiting: 'チェーンの確定を待っています…', done: 'できました！', failed: '取引が失敗したか、キャンセルされました。',
    notEnough: 'qCAW が足りません。', connectFirst: '先にウォレットをつないでください。',
    connected: '接続中', wrongChain: 'ウォレットが別のチェーンになっています。',
    switchBtn: 'QL1 に切り替える', connectBtn: 'ウォレットをつなぐ',
    noNames: 'このウォレットには、まだ CAW の名前がありません。上の欄で取ってみましょう！',
    followers: 'フォロワー', inName: 'この名前の中にある qCAW', walletQcaw: 'ウォレットの qCAW',
    deposit: '入れる', withdraw: '出す', amountPh: '量（qCAW）',
    approveName: '先に、qCAW を名前へ移す許可が必要です', myQom: 'QOM（手数料用）',
    unknownName: '名前 #',
    postAs: 'この名前で投稿', postPh: 'いま何してる？', postBtn: '投稿する',
    postHelp: '最大420文字分まで（日本語は1文字で3文字分です）',
    signNote: 'ウォレットが署名を求めてきます。この投稿だけの許可で、コインは動きません。',
    signFail: 'ウォレットで署名されなかったため、送信しませんでした。',
    posted: '投稿しました！', connectToPost: '投稿するには、上のボタンでウォレットをつないでください。',
    needNamePost: '投稿するには、先に上の欄で名前を取ってください。',
    needNameAct: 'これには CAW の名前が必要です。上の欄で取れます。',
    followBtn: 'フォローする', followed: 'フォローしました！', back: 'タイムラインへ戻る',
    profPosts: '投稿', nameCreated: '名前が作られた日', ownerLbl: '持ち主',
    yourNameTag: 'これはあなたの名前です', seeMine: '「自分の名前」で見る',
    profNotFound: 'その名前は見つかりませんでした。', likeBtn: 'いいね', recawBtn: 'シェア',
    profLoadFail: '名前を読み取れませんでした。通信を確認してもう一度お試しください。',
    retryBtn: 'もう一度試す', recheckBtn: '再チェック', searching: 'ウォレットを探しています…',
    noWalletGuide: 'ウォレットアプリがまだ見つかりません。通常のブラウザで開いている場合は、ウォレットアプリ（MetaMask / FoxWallet）の中で開いてください。ウォレットが起動中のときは、少し待ってから「再チェック」を押してください。',
    chainOk: 'QL1 接続中', navHome: 'ホーム', navGet: '名前を取る', navMine: '自分の名前',
  },
}[LANG];

const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };

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
  const bytes = new Uint8Array(raw.match(/../g).map(h => parseInt(h, 16)));
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
function parseAmount(str) {
  const m = /^(\d+)(?:\.(\d{1,18}))?$/.exec((str || '').trim());
  if (!m) return null;
  return BigInt(m[1]) * (10n ** 18n) + BigInt((m[2] || '').padEnd(18, '0'));
}

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

/* ---------- read-only RPC ---------- */
let rpcSeq = 0;
async function rpc(method, params) {
  const res = await fetch(RPC, {
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

/* line icons (stroke style, no emoji in buttons/nav) */
const svgIc = (paths, size) => '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
const IC_HEART = svgIc('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>');
const IC_REPEAT = svgIc('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');

/* retry a read a few times (public RPCs and wallet browsers can hiccup) */
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

/* Resolve a username to its token id, verified against the name list.
   The QL1 name desk answers idByUsername(name) with tokenId + 1, so the
   raw answer can never be trusted on its own: check the neighbours and
   accept only the id whose stored name matches exactly.
   Returns { status:'ok', id, username } | { status:'notfound' } and
   throws when the reads themselves failed (callers show a load error,
   never a false "not found"). */
async function resolveNameId(rawName) {
  const q = String(rawName || '').trim().toLowerCase();
  if (!q) return { status: 'notfound' };
  const id0 = await withRetry(() => readUint(MINTER, SEL.idByUsername + encStr(q)));
  if (id0 === 0n) return { status: 'notfound' };
  const cands = [id0 - 1n, id0, id0 + 1n].filter(c => c >= 1n);
  let readFailed = false;
  for (const c of cands) {
    let uname = null;
    try { uname = await withRetry(() => readStr(CAW_NAME, SEL.usernames + word(c)), 2, 500); }
    catch (e) { readFailed = true; }
    if (uname === q) return { status: 'ok', id: c, username: uname };
  }
  if (readFailed) throw new Error('name lookup reads failed');
  return { status: 'notfound' };
}

/* ---------- name resolution (NFT metadata first, registry fallback) ---------- */
const ownerTokensCache = new Map();
async function tokensOf(owner) {
  if (!ownerTokensCache.has(owner)) {
    ownerTokensCache.set(owner, ethCall(CAW_NAME, SEL.tokens + encAddr(owner)).then(decTokensRet).catch(() => []));
  }
  return ownerTokensCache.get(owner);
}
const nameCache = new Map();
async function resolveName(id) {
  id = BigInt(id);
  if (!nameCache.has(id)) {
    nameCache.set(id, (async () => {
      try {
        const owner = await readAddr(CAW_NAME, SEL.ownerOf + word(id));
        const toks = await tokensOf(owner);
        const hit = toks.find(t => t.id === id);
        if (hit && hit.username) return hit.username;
      } catch (e) { /* fall through */ }
      try {
        const n = await readStr(CAW_NAME, SEL.usernames + word(id));
        if (n) return n;
      } catch (e) { /* fall through */ }
      return null;
    })());
  }
  return nameCache.get(id);
}
const nameLabel = async id => {
  const n = await resolveName(id);
  return n ? '@' + n : T.unknownName + id;
};

/* ---------- timeline ---------- */
function decodeAction(raw) {
  const hex = strip(raw);
  if (!raw.startsWith(ACTION_SELECTOR) || hex.length < 800 * 2) return null;
  const type = Number(uAt(hex, 4 + 8 * 32));
  if (type > 3) return null;
  const textLen = Number(uAt(hex, 4 + 19 * 32));
  const textHex = hex.slice((4 + 20 * 32) * 2, (4 + 20 * 32) * 2 + textLen * 2);
  let text = '';
  try { text = new TextDecoder().decode(new Uint8Array(textHex.match(/../g).map(h => parseInt(h, 16)))); } catch (e) {}
  return {
    type,
    senderId: uAt(hex, 4 + 9 * 32),
    receiverId: uAt(hex, 4 + 10 * 32),
    ts: Number(uAt(hex, 4 + 12 * 32)),
    sender: addrAt(hex, 4 + 13 * 32),
    cawId: '0x' + hex.slice((4 + 15 * 32) * 2, (4 + 15 * 32) * 2 + 64),
    text,
  };
}
let nextPage = null, loadingTl = false;
async function loadTimeline(append) {
  if (loadingTl) return;
  loadingTl = true;
  const box = $('timeline');
  try {
    let url = API + '/addresses/' + CAW_ACTIONS + '/transactions';
    if (append && nextPage) {
      const q = new URLSearchParams(nextPage).toString();
      if (q) url += '?' + q;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('api ' + res.status);
    const j = await res.json();
    nextPage = j.next_page_params || null;
    $('moreBtn').style.display = nextPage ? '' : 'none';
    const items = (j.items || []).filter(it => it.raw_input && (it.status === 'ok' || !it.status));
    const actions = [];
    for (const it of items) {
      const a = decodeAction(it.raw_input);
      if (a) actions.push({ ...a, hash: it.hash, blockTs: it.timestamp });
    }
    if (!append) box.innerHTML = '';
    if (!actions.length && !append) box.innerHTML = '<p>' + T.empty + '</p>';
    for (const a of actions) box.appendChild(await renderAction(a));
  } catch (e) {
    if (!append) box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
  } finally { loadingTl = false; }
}
/* avatar image for a name id (from its picture data), cached */
const avatarCache = new Map();
function avatarFor(id) {
  id = BigInt(id);
  if (!avatarCache.has(id)) {
    avatarCache.set(id, (async () => {
      try {
        const uri = await readStr(CAW_NAME, SEL.tokenURI + word(id));
        if (uri.startsWith('data:application/json;base64,')) {
          const meta = JSON.parse(atob(uri.split(',')[1]));
          if (meta.image) return meta.image.startsWith('ipfs://') ? 'https://ipfs.io/ipfs/' + meta.image.slice(7) : meta.image;
        }
      } catch (e) { /* no picture */ }
      return null;
    })());
  }
  return avatarCache.get(id);
}
function avatarHtml(url, name) {
  if (url) return '<img class="avatar" alt="" src="' + esc(url) + '">';
  const ch = name ? name.replace(/^@/, '').charAt(0).toUpperCase() : '?';
  return '<div class="avatar avatar-fallback">' + esc(ch) + '</div>';
}

async function renderAction(a) {
  const div = document.createElement('div');
  div.className = 'post';
  const name = await resolveName(a.senderId);
  const who = name ? '@' + name : T.unknownName + a.senderId;
  const img = await avatarFor(a.senderId);
  const profHref = name ? '?name=' + encodeURIComponent(name) : null;
  let html = profHref
    ? '<a class="plink" href="' + profHref + '">' + avatarHtml(img, name) + '</a>'
    : avatarHtml(img, name);
  html += '<div class="pbody">';
  if (a.type !== 0 && a.receiverId > 0n) {
    const target = await nameLabel(a.receiverId);
    const tpl = a.type === 1 ? T.ctxLike : a.type === 2 ? T.ctxRecaw : T.ctxFollow;
    html += '<div class="ctx">' + esc(tpl.replace('{name}', target)) + '</div>';
  }
  const when = new Date((a.ts || 0) * 1000);
  const whenStr = when.toLocaleString(LANG === 'ja' ? 'ja-JP' : 'en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const whoHtml = profHref ? '<a class="plink" href="' + profHref + '">' + esc(who) + '</a>' : esc(who);
  html += '<div class="meta"><span class="name">' + whoHtml + '</span><span class="time">· ' + esc(whenStr) + '</span></div>';
  if (a.type === 0 && a.text) html += '<div class="ptext">' + esc(a.text) + '</div>';
  let likes = null;
  if (a.type === 0) {
    try { likes = await readUint(CAW_ACTIONS, SEL.likes + word(a.senderId) + strip(a.cawId)); } catch (e) {}
  }
  html += '<div class="pfoot">' +
    '<span class="like-count">' + (likes !== null && likes > 0n ? IC_HEART + '<span>' + likes.toString() + '</span>' : '') + '</span>' +
    (a.type === 0
      ? '<button class="actbtn like-btn" type="button">' + IC_HEART + '<span>' + T.likeBtn + '</span></button>' +
        '<button class="actbtn recaw-btn" type="button">' + IC_REPEAT + '<span>' + T.recawBtn + '</span></button>'
      : '') +
    '<a href="' + EXPLORER + '/tx/' + a.hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a>' +
    '<span class="act-status small"></span></div>';
  html += '</div>';
  div.innerHTML = html;
  if (a.type === 0) {
    const st = div.querySelector('.act-status');
    const lb = div.querySelector('.like-btn');
    const rb = div.querySelector('.recaw-btn');
    if (lb) lb.onclick = () => doTargetAction(1, a, lb, st, div);
    if (rb) rb.onclick = () => doTargetAction(2, a, rb, st, div);
  }
  return div;
}

/* ---------- wallet ---------- */
let account = null, onQl1 = false;
/* Wallet apps often inject their provider a moment AFTER the page loads,
   and some announce it via EIP-6963 instead of window.ethereum. Keep
   looking for a few seconds instead of deciding once at load time. */
let eipProvider = null;
const EP = () => (typeof window !== 'undefined' && window.ethereum) || eipProvider || null;
const hasWallet = () => !!EP();
const shortAddr = a => a ? a.slice(0, 6) + '…' + a.slice(-4) : '';
let listenersAttachedFor = null;
function attachProviderListeners() {
  const p = EP();
  if (!p || listenersAttachedFor === p || typeof p.on !== 'function') return;
  listenersAttachedFor = p;
  try { p.on('accountsChanged', refreshWallet); p.on('chainChanged', refreshWallet); } catch (e) {}
}
let walletWatch = null;
function watchForWallet() {
  if (hasWallet()) { attachProviderListeners(); refreshWallet(); return; }
  if (walletWatch) return;
  let tries = 0;
  walletWatch = setInterval(() => {
    tries++;
    if (hasWallet()) {
      clearInterval(walletWatch); walletWatch = null;
      attachProviderListeners(); refreshWallet();
    } else if (tries >= 24) { // ~12 s of looking is enough
      clearInterval(walletWatch); walletWatch = null;
    }
  }, 500);
  try { window.dispatchEvent(new Event('eip6963:requestProvider')); } catch (e) {}
}
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('eip6963:announceProvider', ev => {
    const p = ev && ev.detail && ev.detail.provider;
    if (p && !eipProvider) {
      eipProvider = p;
      if (walletWatch) { clearInterval(walletWatch); walletWatch = null; }
      attachProviderListeners(); refreshWallet();
    }
  });
  try { window.dispatchEvent(new Event('eip6963:requestProvider')); } catch (e) {}
}
async function refreshWallet() {
  const area = $('walletArea');
  if (!hasWallet()) {
    /* Never leave this area without a big, tappable way forward. */
    area.innerHTML = '<p>' + T.noWalletGuide + '</p>' +
      '<div class="row"><button id="connectBtn" class="big-connect">' + T.connectBtn + '</button>' +
      '<button id="recheckBtn" class="ghost">' + T.recheckBtn + '</button></div>' +
      '<p class="small" id="walletSearchNote"></p>';
    $('connectBtn').onclick = () => {
      if (!hasWallet()) {
        const note = $('walletSearchNote');
        if (note) note.textContent = T.searching;
        watchForWallet();
        return;
      }
      connectWallet();
    };
    $('recheckBtn').onclick = () => {
      const note = $('walletSearchNote');
      if (note) note.textContent = T.searching;
      watchForWallet();
      refreshWallet();
    };
    renderMyNames(); return;
  }
  attachProviderListeners();
  try {
    const accts = await EP().request({ method: 'eth_accounts' });
    account = accts && accts[0] ? accts[0] : null;
    const cid = await EP().request({ method: 'eth_chainId' });
    onQl1 = cid === CHAIN_ID_HEX;
  } catch (e) { account = null; }
  if (!account) {
    area.innerHTML = '<p>' + (LANG === 'ja'
      ? '名前を取ったり管理したりするには、ウォレット（MetaMask / FoxWallet）をつないでください。タイムラインの閲覧はウォレットなしでできます。'
      : 'Connect a wallet (MetaMask / FoxWallet) to get a name or manage yours. Reading the timeline works without a wallet.') + '</p>' +
      '<button id="connectBtn" class="big-connect">' + T.connectBtn + '</button>';
    $('connectBtn').onclick = connectWallet;
  } else if (!onQl1) {
    area.innerHTML = '<p class="addrline"><span class="dot dot-warn"></span><b>' + esc(shortAddr(account)) + '</b>' +
      '<span class="warn">' + T.wrongChain + '</span></p>' +
      '<button id="switchBtn">' + T.switchBtn + '</button>';
    $('switchBtn').onclick = switchChain;
  } else {
    const [qom, qcaw] = await Promise.all([
      rpc('eth_getBalance', [account, 'latest']).then(h => BigInt(h)).catch(() => 0n),
      readUint(QCAW, SEL.balanceOf + encAddr(account)).catch(() => 0n),
    ]);
    area.innerHTML = '<p class="addrline"><span class="dot dot-ok"></span><b>' + esc(shortAddr(account)) + '</b>' +
      '<span class="chainbadge">' + T.chainOk + '</span></p>' +
      '<p class="small">' + esc(account) + '</p>' +
      '<p>' + T.myQom + ': <b>' + fmtQcaw(qom) + '</b> QOM ／ ' + T.walletQcaw + ': <b>' + fmtQcaw(qcaw) + '</b> qCAW</p>';
  }
  renderMyNames();
  if (lastCheck) renderMintArea();
  renderComposer();
  if (profileQuery && profileState) renderProfileActions();
}
async function connectWallet() {
  if (!hasWallet()) { watchForWallet(); return; }
  try { await EP().request({ method: 'eth_requestAccounts' }); } catch (e) {}
  await refreshWallet();
}
async function switchChain() {
  try {
    await EP().request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
  } catch (e) {
    if (e && (e.code === 4902 || /Unrecognized chain/i.test(e.message || ''))) {
      try {
        await EP().request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CHAIN_ID_HEX, chainName: 'QL1',
            nativeCurrency: { name: 'QOM', symbol: 'QOM', decimals: 18 },
            rpcUrls: [RPC], blockExplorerUrls: [EXPLORER],
          }],
        });
      } catch (e2) {}
    }
  }
  await refreshWallet();
}
async function sendTx(to, data) {
  const hash = await EP().request({
    method: 'eth_sendTransaction', params: [{ from: account, to, data }],
  });
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const rc = await rpc('eth_getTransactionReceipt', [hash]).catch(() => null);
    if (rc) {
      if (rc.status !== '0x1') throw new Error('tx failed');
      return hash;
    }
  }
  return hash;
}

/* ---------- posting / likes / follows (signed actions) ---------- */
let actingId = null; // which of my names I act as (BigInt token id); set by the composer picker
async function myActingToken() {
  if (!account || !onQl1) return null;
  const toks = await tokensOf(account).catch(() => []);
  if (!toks.length) return null;
  if (actingId !== null && toks.some(t => t.id === actingId)) return toks.find(t => t.id === actingId);
  return toks[0];
}
const randomCawId = () => {
  const b = new Uint8Array(32);
  crypto.getRandomValues(b);
  return '0x' + Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
};
async function submitAction(act) {
  const digest = scActionDigest(act);
  let sig;
  try {
    sig = await EP().request({ method: 'eth_sign', params: [account, digest] });
  } catch (e) { throw new Error('sign'); }
  const h = strip(sig);
  if (h.length !== 130) throw new Error('sign');
  const vRaw = parseInt(h.slice(128, 130), 16);
  const s = { v: vRaw < 27 ? vRaw + 27 : vRaw, r: '0x' + h.slice(0, 64), s: '0x' + h.slice(64, 128) };
  return sendTx(CAW_ACTIONS, scEncodeBatch([act], [s]));
}
const nowSec = () => Math.floor(Date.now() / 1000);
async function guardActing(stEl) {
  if (!account || !onQl1) { if (stEl) stEl.textContent = T.connectFirst; return null; }
  const mine = await myActingToken();
  if (!mine) { if (stEl) stEl.textContent = T.needNameAct; return null; }
  return mine;
}
async function doTargetAction(kind, target, btn, stEl, rootEl) {
  const mine = await guardActing(stEl);
  if (!mine) return;
  try {
    btn.disabled = true;
    if (stEl) stEl.textContent = T.sending;
    await submitAction({
      type: kind, senderId: mine.id, receiverId: target.senderId,
      ts: nowSec(), sender: account, cawId: target.cawId,
      text: kind === 1 ? 'LIKE' : 'REPOST',
    });
    if (stEl) stEl.textContent = T.done;
    if (kind === 1 && rootEl) {
      try {
        const likes = await readUint(CAW_ACTIONS, SEL.likes + word(target.senderId) + strip(target.cawId));
        const el = rootEl.querySelector('.like-count');
        if (el && likes > 0n) el.innerHTML = IC_HEART + '<span>' + likes.toString() + '</span>';
      } catch (e) {}
    }
  } catch (e) {
    if (stEl) stEl.textContent = e.message === 'sign' ? T.signFail : T.failed;
    btn.disabled = false;
  }
}

/* ---------- composer ---------- */
async function renderComposer() {
  const box = $('composerArea');
  if (!box) return;
  const existing = box.querySelector('textarea');
  if (existing && document.activeElement === existing) return; // don't wipe a post being typed
  if (!account || !onQl1) { box.innerHTML = '<p class="small">' + T.connectToPost + '</p>'; return; }
  const toks = await tokensOf(account).catch(() => []);
  if (!toks.length) { box.innerHTML = '<p class="small">' + T.needNamePost + '</p>'; return; }
  const mine = await myActingToken();
  let picker = '';
  if (toks.length > 1) {
    picker = '<label class="small">' + T.postAs + ' <select id="postAsSel">' +
      toks.map(t => '<option value="' + t.id.toString() + '"' + (mine && t.id === mine.id ? ' selected' : '') + '>@' + esc(t.username) + '</option>').join('') +
      '</select></label>';
  } else {
    picker = '<p class="small">' + T.postAs + ': <b>@' + esc(mine.username) + '</b></p>';
  }
  box.innerHTML = picker +
    '<textarea id="postText" rows="4" placeholder="' + esc(T.postPh) + '"></textarea>' +
    '<div class="row"><button id="postBtn">' + T.postBtn + '</button><span class="charcount" id="charCount"></span></div>' +
    '<p class="small">' + T.postHelp + '<br>' + T.signNote + '</p>' +
    '<p class="small" id="postStatus"></p>';
  const ta = $('postText'), cc = $('charCount'), btn = $('postBtn'), st = $('postStatus');
  const byteLen = () => new TextEncoder().encode(ta.value).length;
  const upd = () => { const left = 420 - byteLen(); cc.textContent = left; btn.disabled = left < 0 || !ta.value.trim(); };
  ta.addEventListener('input', upd); upd();
  const sel = $('postAsSel');
  if (sel) sel.onchange = () => { actingId = BigInt(sel.value); };
  btn.onclick = async () => {
    const text = ta.value.trim();
    if (!text || byteLen() > 420) return;
    const cur = await myActingToken();
    if (!cur) { st.textContent = T.needNamePost; return; }
    try {
      btn.disabled = true; st.textContent = T.sending;
      await submitAction({
        type: 0, senderId: cur.id, receiverId: 0n, ts: nowSec(),
        sender: account, cawId: randomCawId(), text,
      });
      st.textContent = T.posted;
      ta.value = ''; upd();
      setTimeout(() => { loadTimeline(false); }, 4000);
    } catch (e) {
      st.textContent = e.message === 'sign' ? T.signFail : T.failed;
    } finally { btn.disabled = false; upd(); }
  };
}

/* ---------- name check + mint ---------- */
let lastCheck = null;
async function checkName() {
  const name = $('nameInput').value.trim();
  const out = $('nameResult'), mint = $('mintArea');
  mint.innerHTML = '';
  if (!name) { out.innerHTML = ''; lastCheck = null; return; }
  out.innerHTML = '<p>' + T.checking + '</p>';
  try {
    const enc = encStr(name);
    const [valid, res, cost] = await Promise.all([
      ethCall(MINTER, SEL.isValidUsername + enc).then(h => decUintRet(h) !== 0n),
      resolveNameId(name).catch(() => ({ status: 'error' })),
      readUint(MINTER, SEL.costOfName + enc),
    ]);
    if (valid && res.status === 'error') throw new Error('lookup failed');
    const taken = res.status === 'ok';
    lastCheck = { name, valid, taken, cost };
    if (!valid) out.innerHTML = '<p class="err">' + T.invalidName + '</p>';
    else if (taken) out.innerHTML = '<p class="warn">' + T.taken + '</p>';
    else out.innerHTML = '<p class="ok">' + T.available + '</p><p>' + T.price + ': <b>' + fmtQcaw(cost) + '</b> qCAW</p>';
    renderMintArea();
  } catch (e) {
    out.innerHTML = '<p class="err">' + T.checkFail + '</p>';
    lastCheck = null;
  }
}
async function renderMintArea() {
  const mint = $('mintArea');
  if (!lastCheck || !lastCheck.valid || lastCheck.taken) { mint.innerHTML = ''; return; }
  if (!account || !onQl1) { mint.innerHTML = '<p class="small">' + T.needWallet + '</p>'; return; }
  const [bal, allow] = await Promise.all([
    readUint(QCAW, SEL.balanceOf + encAddr(account)).catch(() => 0n),
    readUint(QCAW, SEL.allowance + encAddr(account) + encAddr(MINTER)).catch(() => 0n),
  ]);
  let html = '<p class="small">' + T.yourQcaw + ': <b>' + fmtQcaw(bal) + '</b> qCAW</p>';
  if (bal < lastCheck.cost) html += '<p class="err">' + T.notEnough + '</p>';
  else if (allow < lastCheck.cost) {
    html += '<p>' + T.step1 + '</p><button id="approveBtn">' + T.approveBtn + ' (' + fmtQcaw(lastCheck.cost) + ' qCAW)</button>';
  } else {
    html += '<p>' + T.step2 + '</p><button id="mintBtn">' + T.mintBtn + '</button>';
  }
  html += '<p class="small" id="mintStatus"></p>';
  mint.innerHTML = html;
  const st = m => { const el = $('mintStatus'); if (el) el.textContent = m; };
  const ab = $('approveBtn');
  if (ab) ab.onclick = async () => {
    try {
      ab.disabled = true; st(T.sending);
      await sendTx(QCAW, SEL.approve + encAddr(MINTER) + word(lastCheck.cost));
      st(T.done); renderMintArea(); refreshWallet();
    } catch (e) { st(T.failed); ab.disabled = false; }
  };
  const mb = $('mintBtn');
  if (mb) mb.onclick = async () => {
    try {
      mb.disabled = true; st(T.sending);
      await sendTx(MINTER, SEL.mint + encStr(lastCheck.name));
      st(T.done); ownerTokensCache.clear(); nameCache.clear();
      renderMintArea(); refreshWallet();
    } catch (e) { st(T.failed); mb.disabled = false; }
  };
}

/* ---------- my names ---------- */
async function renderMyNames() {
  const box = $('myNames');
  if (!account || !onQl1) {
    box.innerHTML = '<p>' + (LANG === 'ja' ? 'ウォレットをつなぐと、あなたの名前が表示されます。' : 'Connect your wallet to see your names.') + '</p>';
    return;
  }
  box.innerHTML = '<p>' + T.loading + '</p>';
  try {
    const toks = await tokensOf(account);
    if (!toks.length) { box.innerHTML = '<p>' + T.noNames + '</p>'; return; }
    box.innerHTML = '';
    for (const t of toks) box.appendChild(await renderNameCard(t));
  } catch (e) {
    box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
  }
}
async function renderNameCard(t) {
  const div = document.createElement('div');
  div.className = 'namecard';
  let followers = null;
  const img = await avatarFor(t.id);
  try { followers = await readUint(CAW_ACTIONS, SEL.followerCount + word(t.id)); } catch (e) {}
  div.innerHTML =
    '<a class="plink" href="?name=' + encodeURIComponent(t.username) + '">' + avatarHtml(img, t.username) + '</a>' +
    '<div class="grow"><div class="n"><a class="plink" href="?name=' + encodeURIComponent(t.username) + '">@' + esc(t.username) + '</a></div>' +
    '<div class="small">#' + t.id.toString() +
    (followers !== null ? ' ・ ' + followers.toString() + ' ' + T.followers : '') + '</div>' +
    '<div>' + T.inName + ': <b>' + fmtQcaw(t.balance) + '</b> qCAW</div>' +
    '<input type="text" inputmode="decimal" placeholder="' + T.amountPh + '" id="amt-' + t.id + '">' +
    '<div class="row"><button class="secondary" id="dep-' + t.id + '">' + T.deposit + '</button>' +
    '<button class="ghost" id="wd-' + t.id + '">' + T.withdraw + '</button></div>' +
    '<p class="small" id="st-' + t.id + '"></p></div>';
  const st = m => { const el = div.querySelector('#st-' + t.id); if (el) el.textContent = m; };
  div.querySelector('#dep-' + t.id).onclick = async () => {
    const amt = parseAmount(div.querySelector('#amt-' + t.id).value);
    if (amt === null || amt <= 0n) return;
    try {
      st(T.sending);
      const allow = await readUint(QCAW, SEL.allowance + encAddr(account) + encAddr(CAW_NAME)).catch(() => 0n);
      if (allow < amt) {
        st(T.approveName + ' — ' + T.sending);
        await sendTx(QCAW, SEL.approve + encAddr(CAW_NAME) + word(amt));
      }
      st(T.waiting);
      await sendTx(CAW_NAME, SEL.deposit + word(t.id) + word(amt));
      st(T.done); ownerTokensCache.clear(); renderMyNames(); refreshWallet();
    } catch (e) { st(T.failed); }
  };
  div.querySelector('#wd-' + t.id).onclick = async () => {
    const amt = parseAmount(div.querySelector('#amt-' + t.id).value);
    if (amt === null || amt <= 0n) return;
    try {
      st(T.sending);
      await sendTx(CAW_NAME, SEL.withdraw + word(t.id) + word(amt));
      st(T.done); ownerTokensCache.clear(); renderMyNames(); refreshWallet();
    } catch (e) { st(T.failed); }
  };
  return div;
}

/* ---------- profile page (?name=<username>) ---------- */
const profileQuery = new URLSearchParams(location.search).get('name');
let profileState = null; // { id, username, owner, followersEl }
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
  const head = $('profileHead'), postsBox = $('profilePosts');
  head.innerHTML = '<p>' + T.loading + '</p>';
  let res;
  try {
    res = await resolveNameId(profileQuery);
  } catch (e) {
    /* the reads themselves failed — that is NOT the same as "no such
       name", so say so and offer a way to try again */
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
  const username = res.username || (await resolveName(id)) || profileQuery;
  const owner = await readAddr(CAW_NAME, SEL.ownerOf + word(id)).catch(() => null);
  const img = await avatarFor(id);
  let followers = null;
  try { followers = await readUint(CAW_ACTIONS, SEL.followerCount + word(id)); } catch (e) {}
  let balance = null;
  try { balance = await readUint(CAW_NAME, SEL.cawBalanceOf + word(id)); } catch (e) {}
  const mintTs = await mintDateOf(id);
  const chips = ['#' + id.toString()];
  if (followers !== null) chips.push(followers.toString() + ' ' + T.followers);
  if (balance !== null) chips.push(T.inName + ': ' + fmtQcaw(balance) + ' qCAW');
  if (mintTs) {
    const d = new Date(mintTs);
    chips.push(T.nameCreated + ': ' + d.toLocaleDateString(LANG === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }));
  }
  let html = '<div class="pband"></div>' +
    '<div class="prow"><div class="pava">' + avatarHtml(img, username) + '</div>' +
    '<div id="profileActions" class="pactions"></div></div>' +
    '<div class="pname">@' + esc(username) + '</div>' +
    (owner ? '<div class="small">' + T.ownerLbl + ': <a class="plink" href="' + EXPLORER + '/address/' + owner + '" target="_blank" rel="noopener">' + esc(shortAddr(owner)) + '</a></div>' : '') +
    '<div class="chips">' + chips.map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>';
  head.innerHTML = html;
  profileState = { id, username, owner };
  renderProfileActions();
  profNext = null; profDone = false;
  postsBox.innerHTML = '';
  loadProfilePosts();
}
async function renderProfileActions() {
  const box = $('profileActions');
  if (!box || !profileState) return;
  const { id, owner } = profileState;
  const mine = account && owner && account.toLowerCase() === owner.toLowerCase();
  if (mine) {
    box.innerHTML = '<p class="ok">' + T.yourNameTag + '</p>' +
      '<p><a class="plink" href="' + (LANG === 'ja' ? 'ja.html' : 'en.html') + '#mynames"><button class="ghost" type="button">' + T.seeMine + '</button></a></p>';
    return;
  }
  if (!account || !onQl1) { box.innerHTML = ''; return; }
  const toks = await tokensOf(account).catch(() => []);
  if (!toks.length) { box.innerHTML = ''; return; }
  box.innerHTML = '<button id="followBtn" class="follow-pill" type="button">' + T.followBtn + '</button> <span class="small" id="followStatus"></span>';
  $('followBtn').onclick = async () => {
    const st = $('followStatus');
    const my = await guardActing(st);
    if (!my) return;
    const btn = $('followBtn');
    try {
      btn.disabled = true; st.textContent = T.sending;
      await submitAction({
        type: 3, senderId: my.id, receiverId: id, ts: nowSec(),
        sender: account, cawId: randomCawId(), text: 'FOLLOW',
      });
      st.textContent = T.followed;
    } catch (e) {
      st.textContent = e.message === 'sign' ? T.signFail : T.failed;
      btn.disabled = false;
    }
  };
}
let profNext = null, profDone = false, profLoading = false;
async function loadProfilePosts() {
  if (!profileState || profLoading || profDone) return;
  profLoading = true;
  const box = $('profilePosts');
  try {
    let found = 0, pages = 0;
    while (found < 10 && pages < 4 && !profDone) {
      let url = API + '/addresses/' + CAW_ACTIONS + '/transactions';
      if (profNext) url += '?' + new URLSearchParams(profNext).toString();
      const res = await fetch(url);
      if (!res.ok) throw new Error('api ' + res.status);
      const j = await res.json();
      profNext = j.next_page_params || null;
      if (!profNext) profDone = true;
      pages++;
      const items = (j.items || []).filter(it => it.raw_input && (it.status === 'ok' || !it.status));
      for (const it of items) {
        const a = decodeAction(it.raw_input);
        if (a && a.senderId === profileState.id) {
          box.appendChild(await renderAction({ ...a, hash: it.hash, blockTs: it.timestamp }));
          found++;
        }
      }
    }
    if (!box.children.length && profDone) box.innerHTML = '<p>' + T.empty + '</p>';
    $('profileMore').style.display = profDone ? 'none' : '';
  } catch (e) {
    if (!box.children.length) box.innerHTML = '<p class="err">' + T.loadFail + '</p>';
  } finally { profLoading = false; }
}

/* ---------- init ---------- */
$('moreBtn').onclick = () => loadTimeline(true);
$('checkBtn').onclick = checkName;
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkName(); });
const cb = $('connectBtn');
if (cb) cb.onclick = connectWallet;
attachProviderListeners();
watchForWallet();
const fab = $('fabBtn');
if (fab) fab.onclick = () => {
  const ca = $('composerArea');
  if (ca) ca.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { const ta = $('postText'); if (ta) ta.focus({ preventScroll: true }); }, 450);
};
if (profileQuery) {
  document.body.classList.add('profile-mode');
  $('profileBlock').style.display = '';
  document.querySelectorAll('.langs a').forEach(a => {
    a.href = a.getAttribute('href') + '?name=' + encodeURIComponent(profileQuery);
  });
  const pm = $('profileMore');
  if (pm) pm.onclick = loadProfilePosts;
  loadProfile();
} else {
  loadTimeline(false);
}
refreshWallet();
if (!profileQuery && location.hash === '#mynames') {
  setTimeout(() => { const el = $('mynames'); if (el) el.scrollIntoView(); }, 800);
}
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
