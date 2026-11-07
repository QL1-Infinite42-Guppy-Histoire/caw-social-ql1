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
    ctxLike: '❤️ Liked a post by {name}', ctxRecaw: '🔁 Shared a post by {name}', ctxFollow: '👥 Followed {name}',
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
  },
  ja: {
    loading: '読み込み中…', loadFail: 'タイムラインを読み込めませんでした。しばらくしてからお試しください。',
    empty: 'まだアクションがありません。', post: '投稿', like: 'いいね', recaw: 'リポスト', follow: 'フォロー',
    viewTx: '記録を見る', likes: 'いいね', to: '→',
    ctxLike: '❤️ {name} さんの投稿にいいね', ctxRecaw: '🔁 {name} さんの投稿をシェア', ctxFollow: '👥 {name} さんをフォロー',
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
  let html = avatarHtml(img, name);
  html += '<div class="pbody">';
  if (a.type !== 0 && a.receiverId > 0n) {
    const target = await nameLabel(a.receiverId);
    const tpl = a.type === 1 ? T.ctxLike : a.type === 2 ? T.ctxRecaw : T.ctxFollow;
    html += '<div class="ctx">' + esc(tpl.replace('{name}', target)) + '</div>';
  }
  const when = new Date((a.ts || 0) * 1000);
  const whenStr = when.toLocaleString(LANG === 'ja' ? 'ja-JP' : 'en-US', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  html += '<div class="meta"><span class="name">' + esc(who) + '</span><span class="time">· ' + esc(whenStr) + '</span></div>';
  if (a.type === 0 && a.text) html += '<div class="ptext">' + esc(a.text) + '</div>';
  let likes = null;
  if (a.type === 0) {
    try { likes = await readUint(CAW_ACTIONS, SEL.likes + word(a.senderId) + strip(a.cawId)); } catch (e) {}
  }
  html += '<div class="pfoot">' +
    (likes !== null && likes > 0n ? '<span>❤️ ' + likes.toString() + '</span>' : '<span></span>') +
    '<a href="' + EXPLORER + '/tx/' + a.hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a></div>';
  html += '</div>';
  div.innerHTML = html;
  return div;
}

/* ---------- wallet ---------- */
let account = null, onQl1 = false;
const hasWallet = () => typeof window.ethereum !== 'undefined';
async function refreshWallet() {
  const area = $('walletArea');
  if (!hasWallet()) {
    area.innerHTML = '<p>' + (LANG === 'ja'
      ? 'ウォレットアプリが見つかりません。MetaMask などのブラウザで開いてください。'
      : 'No wallet found. Open this page in a wallet browser such as MetaMask.') + '</p>';
    renderMyNames(); return;
  }
  try {
    const accts = await window.ethereum.request({ method: 'eth_accounts' });
    account = accts && accts[0] ? accts[0] : null;
    const cid = await window.ethereum.request({ method: 'eth_chainId' });
    onQl1 = cid === CHAIN_ID_HEX;
  } catch (e) { account = null; }
  if (!account) {
    area.innerHTML = '<p>' + (LANG === 'ja'
      ? '名前の発行や管理にはウォレット（MetaMask / FoxWallet）をつないでください。タイムラインの閲覧はウォレットなしでできます。'
      : 'Connect a wallet (MetaMask / FoxWallet) to get a name or manage yours. Reading the timeline works without a wallet.') + '</p>' +
      '<button id="connectBtn">' + T.connectBtn + '</button>';
    $('connectBtn').onclick = connectWallet;
  } else if (!onQl1) {
    area.innerHTML = '<p><span class="warn">' + T.wrongChain + '</span></p>' +
      '<p class="small">' + T.connected + ': ' + esc(account) + '</p>' +
      '<button id="switchBtn">' + T.switchBtn + '</button>';
    $('switchBtn').onclick = switchChain;
  } else {
    const [qom, qcaw] = await Promise.all([
      rpc('eth_getBalance', [account, 'latest']).then(h => BigInt(h)).catch(() => 0n),
      readUint(QCAW, SEL.balanceOf + encAddr(account)).catch(() => 0n),
    ]);
    area.innerHTML = '<p class="small">' + T.connected + ': ' + esc(account) + '</p>' +
      '<p>' + T.myQom + ': <b>' + fmtQcaw(qom) + '</b> QOM ／ ' + T.walletQcaw + ': <b>' + fmtQcaw(qcaw) + '</b> qCAW</p>';
  }
  renderMyNames();
  if (lastCheck) renderMintArea();
}
async function connectWallet() {
  if (!hasWallet()) return;
  try { await window.ethereum.request({ method: 'eth_requestAccounts' }); } catch (e) {}
  await refreshWallet();
}
async function switchChain() {
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN_ID_HEX }] });
  } catch (e) {
    if (e && (e.code === 4902 || /Unrecognized chain/i.test(e.message || ''))) {
      try {
        await window.ethereum.request({
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
  const hash = await window.ethereum.request({
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

/* ---------- name check + mint ---------- */
let lastCheck = null;
async function checkName() {
  const name = $('nameInput').value.trim();
  const out = $('nameResult'), mint = $('mintArea');
  mint.innerHTML = '';
  if (!name) { out.innerHTML = ''; lastCheck = null; return; }
  out.innerHTML = '<p>' + T.checking + '</p>';
  try {
    const enc = '0x' + encStr(name);
    const [valid, idRaw, cost] = await Promise.all([
      ethCall(MINTER, SEL.isValidUsername + enc.slice(2)).then(h => decUintRet(h) !== 0n),
      ethCall(MINTER, SEL.idByUsername + enc.slice(2)).then(decUintRet),
      readUint(MINTER, SEL.costOfName + enc.slice(2)),
    ]);
    const taken = idRaw !== 0n;
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
    avatarHtml(img, t.username) +
    '<div class="grow"><div class="n">@' + esc(t.username) + '</div>' +
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

/* ---------- init ---------- */
$('moreBtn').onclick = () => loadTimeline(true);
$('checkBtn').onclick = checkName;
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') checkName(); });
const cb = $('connectBtn');
if (cb) cb.onclick = connectWallet;
if (hasWallet()) {
  window.ethereum.on && window.ethereum.on('accountsChanged', refreshWallet);
  window.ethereum.on && window.ethereum.on('chainChanged', refreshWallet);
}
loadTimeline(false);
refreshWallet();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
