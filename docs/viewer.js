'use strict';
/* CAW Social (QL1) — web viewer + name minting + posting (v12).
   v13 restyles the DISPLAY LAYER ONLY to the Android app's
   X-style overhaul (v0.6.x of caw-social-app): the same design
   tokens (X blue #1d9bf0, ink #0f1419, secondary #536471,
   hairline #eff3f4, gold #ffac33 reserved for Super marks),
   the same post-row anatomy, the app drawer's contents and
   order for the web sidebar / mobile drawer, the app's
   profile composition and its MetaMask-style wallet list.
   No read, signing or sending logic changed in v13.
   Reading is free and open: the timeline, post pages and profiles
   are decoded in your browser from the public explorer API and the
   chain itself. Two writes exist, kept strictly separate:
   - Getting a name: ordinary contract calls sent through the
     visitor's own wallet app (the v11 mint path — it asks that
     wallet to send, and the wallet shows its own confirmation).
   - Posting, liking, Recaws and follows: signed INSIDE this page
     by the built-in posting wallet (the Android app's model). The
     posting key is created/imported by the visitor, encrypted
     under their password, and stored only in this browser; it is
     never sent anywhere, and this page never asks an external
     wallet for any kind of signature (the refused raw-sign
     request the contract's scheme would otherwise need — see the
     README's "Posting" history). In-page signing uses the signing
     core ported from the app, so the signature is built from the
     exact action shown on screen — sign what you see.
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
const QCAW = '0xd2140E16aDf37194036865E90BbCA1139b739d0D';
const ACTION_SELECTOR = '0x84e33f2f';
const CHAIN_ID_HEX = '0x2fe'; // QL1, chain id 766

const SEL = {
  usernames: '0x136dd963', ownerOf: '0x6352211e', tokens: '0xe4860339',
  tokenURI: '0xc87b56dd', cawBalanceOf: '0x532f3a34', totalSupply: '0x18160ddd',
  idByUsername: '0x9ebf19e8', followerCount: '0x9f46a705', likes: '0x14ce3e7d',
  balanceOf: '0x70a08231', allowance: '0xdd62ed3e', approve: '0x095ea7b3',
  costOfName: '0x8c87aa8a', isValidUsername: '0x3b032005', mint: '0xd85d3d27',
  deposit: '0x6170c4b1', withdraw: '0x43387983',
};

const LANG = (typeof document !== 'undefined' && document.documentElement.lang === 'ja') ? 'ja' : 'en';
if (typeof localStorage !== 'undefined') { try { localStorage.setItem('caw-lang', LANG); } catch (e) {} }
const T = {
  en: {
    loading: 'Loading…', loadFail: 'Could not load. Please try again later.',
    empty: 'No posts found yet.', viewTx: 'see the record', moreBtn: 'See more',
    noticeTitle: 'Reading is free — and you can get a name here',
    noticeText: 'You are reading the CAW timeline on QL1. Viewing is free and needs no wallet or account. You can get a name here with your wallet app, and post here with the built-in posting wallet — or use the Android app.',
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
    getDesc: 'A name is how people find you on CAW, and once you get one it is yours for good. It costs qCAW — the price depends on the name and is shown before you pay anything — plus a tiny QOM fee for the record-keepers. You need a wallet app (such as MetaMask or FoxWallet) with qCAW in it.',
    getPh: 'the name you want', getCheckBtn: 'Check',
    getInvalid: 'That name cannot be used. Names use small letters and numbers only.',
    getTaken: 'That name is already taken.', getSeeProfile: 'See that name’s page',
    getAvailable: 'This name is available!', getPrice: 'Price',
    getCheckFail: 'Could not check that name. Please check your connection and try again.',
    getPreviewLbl: 'This is how the name will look',
    noWallet: 'No wallet app was found yet. To get a name, open this page in a wallet app’s browser (such as MetaMask or FoxWallet). Reading works anywhere.',
    recheckBtn: 'Check again',
    connectBtn: 'Connect wallet', connectFail: 'The wallet did not connect.',
    connectedLbl: 'Connected',
    wrongChain: 'Your wallet is set to a different network.', switchBtn: 'Switch to QL1',
    switchFail: 'The network could not be switched.',
    yourQcaw: 'Your qCAW', yourQom: 'QOM (for the small fees)',
    needWalletForName: 'Connect your wallet above to get this name.',
    notEnoughQcaw: 'You do not have enough qCAW for this name.',
    noGasQom: 'This wallet holds no QOM. A little QOM is needed for the small fees, so sending stays paused until some is there.',
    step1: 'Step 1 of 2 — let this site use your qCAW to pay for the name',
    approveBtn: 'OK, allow it',
    step2: 'Step 2 of 2 — one more tap and the name is yours',
    mintBtn: 'Get this name',
    sendingWallet: 'Check your wallet…', recording: 'Recording it…',
    sendFail: 'That did not go through.',
    mintDone: 'Done — this name is yours!', viewProfileBtn: 'See your new name’s page',
    mintChanged: 'Just now, that name was taken or stopped being available. Please check it again.',
    priceChanged: 'The price changed to {p} qCAW. Look it over, and try again when you are ready.',
    sentUnconfirmed: 'Your wallet sent it, but the record is slow to settle. Give it a moment, then look at your names below.',
    myNamesTitle: 'Your names', noNames: 'This wallet has no CAW names yet.',
    myNamesConnect: 'Connect your wallet to see the names you own.',
    pwTitle: 'Posting wallet',
    pwIntro: 'Posting, liking, Recaws and follows are signed inside this page by this built-in wallet — the same way the Android app works. (Getting a name, further down, uses your wallet app instead.)',
    pwSafetyCreate: 'Use a separate wallet here, made only for CAW. Never type the recovery phrase of your main wallet.',
    pwSafetyStore: 'The key is encrypted with your password and stored only in this browser. It is never sent anywhere.',
    pwSafetyLose: 'If you clear this browser’s data, the wallet here is gone — it only comes back if you saved the recovery phrase.',
    pwSafetyPhrase: 'Anyone who sees your recovery phrase owns this wallet. Keep it written down, offline, and private.',
    pwCreateBtn: 'Create a new wallet', pwImportBtn: 'Import a wallet',
    pwCreateExplain: 'We will make a fresh wallet and show its 12-word recovery phrase once. That phrase is the only way back in if this browser’s data is cleared.',
    pwShowPhraseTitle: 'Your recovery phrase — write it down now',
    pwPhraseWarn: 'Write these 12 words on paper, in order, and keep the paper somewhere safe and offline. This is shown once — after you continue, it cannot be shown again.',
    pwWroteIt: 'I wrote it down and will keep it offline',
    pwContinueBtn: 'Continue', pwBackBtn: 'Back', pwCancelBtn: 'Cancel',
    pwSetPasswordTitle: 'Set a password for this browser',
    pwPasswordPh: 'Password (8 or more characters)', pwPassword2Ph: 'Type the same password again',
    pwPasswordShort: 'Please use a password of 8 or more characters.',
    pwPasswordMismatch: 'The two passwords do not match.',
    pwSaveBtn: 'Save this wallet',
    pwImportExplain: 'Type a recovery phrase (12 or 24 words) or a private key. It will be encrypted with a password you set next, and stored only in this browser.',
    pwImportPh: 'recovery phrase, or a private key (0x…)',
    pwImportInvalid: 'That does not look right — check the words (or the key) and try again.',
    pwLockedTitle: 'This browser’s posting wallet is locked',
    pwLockedText: 'Type the password you set for it to unlock. Unlocking stays on for 15 minutes at a time.',
    pwUnlockBtn: 'Unlock', pwUnlockWrong: 'That password did not open this wallet. Please try again.',
    pwAddressLbl: 'Posting wallet', pwCopyBtn: 'Copy address',
    pwQomLbl: 'QOM (for the small fees)', pwQcawLbl: 'qCAW in this wallet',
    pwActingLbl: 'Posting as', pwNameBalanceLbl: 'qCAW inside this name',
    pwNoNamesYet: 'This wallet has no CAW name yet, so there is nothing to post as. Get a name in the section further down (it uses your wallet app), and it will appear here.',
    pwLockBtn: 'Lock', pwRemoveBtn: 'Remove this wallet from this browser',
    pwRemoveWarn: 'This deletes the encrypted wallet stored in this browser. If you did not save the recovery phrase (or private key), this wallet is gone for good. Names and coins are NOT deleted — they stay on the public record and come back if you import the same phrase or key again.',
    pwRemoveTypeLbl: 'To remove it, type this word:', pwRemoveWord: 'delete',
    pwRemoveConfirmBtn: 'Remove it for good',
    pwDepTitle: 'Put qCAW into this name / take it out',
    pwDepNote: 'Posting and other actions are paid from the qCAW inside your name, not from the wallet directly.',
    pwAmountPh: 'Amount of qCAW', pwDepositBtn: 'Put in', pwWithdrawBtn: 'Take out',
    pwAmountBad: 'Type an amount like 100 or 12.5.',
    pwApproveFirst: 'One quick allow is needed first, then the amount goes in.',
    pwBusySending: 'Sending… check the progress below.', pwBusyWaiting: 'Sent — waiting for the record to confirm it…',
    pwDoneOk: 'Done.', pwSendFailPlain: 'That did not go through.',
    pwUnconfirmed: 'It was sent, but the record is slow to confirm. Give it a moment and check again.',
    pwNeedGas: 'This posting wallet holds no QOM, so it cannot pay the small fees. Send a little QOM to the address above first.',
    compPh: 'What is happening?',
    compPostBtn: 'Post', compBytes: '{n} / 420 characters’ worth',
    compTooLong: 'That is too long — posts can be up to 420 in length, counting the marker for replies and quotes.',
    compZeroBalance: 'This name holds no qCAW, so actions will fail. Put some qCAW into it (in the posting wallet section) first.',
    compHintLocked: 'Posting needs the built-in wallet.',
    compHintSetupBtn: 'Set up the posting wallet',
    compHintNoName: 'You need a CAW name to post. Get one further down this page, then it will appear in the posting wallet.',
    compReplyingTo: 'Replying to {name}', compQuoting: 'Quoting {name}', compCancelRef: 'Cancel',
    actLike: 'Like', actRecaw: 'Recaw', actReply: 'Reply', actQuote: 'Quote',
    actFollow: 'Follow', actUnfollow: 'Unfollow', actFollowing: 'Following',
    actOwnProfile: 'This is your own name.',
    confirmTitlePost: 'Post this?', confirmTitleLike: 'Like this post?',
    confirmTitleRecaw: 'Recaw this post?', confirmTitleFollow: 'Follow this name?',
    confirmTitleUnfollow: 'Unfollow this name?', confirmTitleDeposit: 'Put qCAW in?',
    confirmTitleWithdraw: 'Take qCAW out?',
    confirmAsLbl: 'As', confirmTargetLbl: 'Target', confirmTextLbl: 'Text',
    confirmAmountLbl: 'Amount', confirmNameLbl: 'Name',
    confirmSignBtn: 'Sign and send', confirmCancelBtn: 'Cancel',
    actSending: 'Signing and sending…', actWaiting: 'Sent — waiting for the record…',
    actDone: 'Done — it is on the record.', actFail: 'That did not go through.',
    actUnconfirmed: 'Sent, but the record is slow to confirm it.',
    actNotOwner: 'This name does not belong to the posting wallet right now, so signing stopped.',
    actSelfFollow: 'That name belongs to this same wallet, so it cannot be followed from here.',
    mintNote: 'Getting a name uses your wallet app (MetaMask or FoxWallet) — that is separate from the posting wallet higher up, which is only for posting.',
    navHome: 'Home', navSearch: 'Search', navProfile: 'Profile',
    navWallet: 'Wallet', navMyNames: 'My names', navGetName: 'Get a name',
    navBookmarks: 'Bookmarks', navSettings: 'Settings',
    bmEmpty: 'No bookmarks yet. Posts you save will appear here.',
    bmNeedWallet: 'Bookmarks live with your posting wallet on this device. Unlock the posting wallet above to see the posts you saved.',
    bmRemove: 'Remove', bmAdd: 'Bookmark', bmMissing: 'This post could not be found in the part of the record we can read.',
    likedBy: 'Liked by', sharedBy: 'Recawed by',
    shareLabel: 'Share',
    depostLbl: 'Put in / take out',
    slTitle: 'Send a SuperLike?',
    slTarget: 'Post', slTotal: 'Total', slToAuthor: 'To the author',
    slBurned: 'Burned (goes to nobody)', slBalance: 'Your O balance',
    slConfirm: 'Send 25,000,000 O ⭐', slDone: 'SuperLike sent ⭐',
    slSelf: "You can't SuperLike your own post.",
    slShortfall: 'Not enough O. A SuperLike costs 25,000,000 O in total (15,000,000 to the author + 10,000,000 burned). Get O on QL1 (for example by swapping on QomSwap), then try again.',
    slPayPending: 'The burn went through ⭐ — but the 15,000,000 O payment to the author did not. Tap the ⭐ on this post to send just the payment.',
    srcTitle: 'Send a SuperRecaw?',
    srcConfirm: 'Recaw + burn O ⭐', srcDone: 'SuperRecaw sent ⭐',
    srcShortfall: 'Not enough O for a SuperRecaw (25,000,000 O in total: 5,000,000 to the author + 20,000,000 burned). You can still send a normal Recaw.',
    srcBurnTitle: 'Finish the SuperRecaw burn?',
    srcBurnConfirm: 'Burn 20,000,000 O', srcBurnDone: 'Burn done — SuperRecaw complete ⭐',
    srcBurnShortfall: 'Not enough O to finish the burn. Get O on QL1, then tap Recaw on this post again.',
    srcBurnPending: 'Your Recaw went out ⭐ — but its O burn did not. Tap Recaw on this post to finish just the burn.',
    srcPayPending: 'Your SuperRecaw went out ⭐ — but the 5,000,000 O payment to the author did not. Tap Recaw on this post to send just the payment.',
    srcSelfNote: 'This is your own post. Only the burn counts — no author payment is made, because the author is you.',
    payTitle: 'Finish the author payment?',
    payConfirm: 'Send {amount} O', payDone: 'Payment sent — all done ⭐',
    payShortfall: 'Not enough O to finish the payment. Get O on QL1, then try again from the post.',
    recawChoiceTitle: 'Recaw this post?',
  },
  ja: {
    loading: '読み込み中…', loadFail: '読み込めませんでした。しばらくしてからお試しください。',
    empty: 'まだ投稿がありません。', viewTx: '記録を見る', moreBtn: 'もっと見る',
    noticeTitle: '閲覧は無料 — 名前もここで取れます',
    noticeText: 'QL1 の CAW のタイムラインを読んでいます。閲覧は無料で、ウォレットもアカウントも要りません。名前はウォレットアプリで取れて、投稿はこのページの内蔵ウォレットでも、Android アプリでもできます。',
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
    getDesc: '名前は、CAW であなたを見つけてもらうためのものです。一度取れば、ずっとあなたのものです。料金は qCAW で、名前によって変わります（払う前に金額を表示します）。ほかに、記録のための小さな手数料として QOM が少し必要です。qCAW の入ったウォレットアプリ（MetaMask や FoxWallet など）をご用意ください。',
    getPh: 'ほしい名前', getCheckBtn: '調べる',
    getInvalid: 'その名前は使えません。名前は小文字と数字だけです。',
    getTaken: 'その名前はすでに使われています。', getSeeProfile: 'その名前のページを見る',
    getAvailable: 'この名前は取れます！', getPrice: '価格',
    getCheckFail: '調べられませんでした。通信を確認してもう一度お試しください。',
    getPreviewLbl: '名前の見た目です',
    noWallet: 'ウォレットアプリがまだ見つかりません。名前を取るには、ウォレットアプリ（MetaMask や FoxWallet など）のブラウザでこのページを開いてください。読むだけならどこでもできます。',
    recheckBtn: 'もう一度確認',
    connectBtn: 'ウォレットをつなぐ', connectFail: 'ウォレットがつながりませんでした。',
    connectedLbl: '接続中',
    wrongChain: 'ウォレットが別のネットワークになっています。', switchBtn: 'QL1 に切り替える',
    switchFail: 'ネットワークを切り替えられませんでした。',
    yourQcaw: 'あなたの qCAW', yourQom: 'QOM（手数料用）',
    needWalletForName: 'この名前を取るには、上のボタンでウォレットをつないでください。',
    notEnoughQcaw: 'この名前を取るには qCAW が足りません。',
    noGasQom: 'このウォレットに QOM がありません。手数料用に少しの QOM が必要なので、入るまで送信は止めています。',
    step1: 'ステップ 1/2：名前の料金に、あなたの qCAW を使う許可を出します',
    approveBtn: '許可する',
    step2: 'ステップ 2/2：あと1タップで名前が取れます',
    mintBtn: 'この名前を取る',
    sendingWallet: 'ウォレットで確認してください…', recording: '記録しています…',
    sendFail: '送信できませんでした。',
    mintDone: 'できました — この名前はあなたのものです！', viewProfileBtn: '新しい名前のページを見る',
    mintChanged: 'たった今、その名前が取られてしまったか、取れなくなりました。もう一度調べてください。',
    priceChanged: '価格が {p} qCAW に変わりました。確認してから、もう一度どうぞ。',
    sentUnconfirmed: 'ウォレットからは送られましたが、記録の確定が遅れています。少し待ってから、下の「あなたの名前」を見てください。',
    myNamesTitle: 'あなたの名前', noNames: 'このウォレットには、まだ CAW の名前がありません。',
    myNamesConnect: 'ウォレットをつなぐと、あなたの名前が表示されます。',
    pwTitle: '投稿用ウォレット',
    pwIntro: '投稿・いいね・Recaw・フォローは、このページ内蔵のウォレットで、このページの中で署名します。Android アプリと同じ方式です。（名前を取る手続きは、下の方でウォレットアプリを使います。）',
    pwSafetyCreate: 'ここでは CAW 専用の別のウォレットを使ってください。本命ウォレットの復元フレーズは絶対に入力しないでください。',
    pwSafetyStore: '鍵はあなたのパスワードで暗号化され、このブラウザの中にだけ保存されます。どこにも送信されません。',
    pwSafetyLose: 'このブラウザのデータを消すと、ここにあるウォレットは消えます。復元フレーズを控えておかないと、元に戻せません。',
    pwSafetyPhrase: '復元フレーズを見た人は、そのウォレットを使えてしまいます。紙に書いて、オフラインで、大切に保管してください。',
    pwCreateBtn: '新しいウォレットを作る', pwImportBtn: 'ウォレットを取り込む',
    pwCreateExplain: '新しいウォレットを作り、12語の復元フレーズを1回だけ表示します。ブラウザのデータを消したときに元に戻す手段は、そのフレーズだけです。',
    pwShowPhraseTitle: 'あなたの復元フレーズ — 今すぐ書き留めてください',
    pwPhraseWarn: 'この12語を、順番どおりに紙に書いて、安全な場所にオフラインで保管してください。表示はこの1回だけです。進んだあとは、もう表示できません。',
    pwWroteIt: '紙に書き留めました。オフラインで保管します',
    pwContinueBtn: '進む', pwBackBtn: '戻る', pwCancelBtn: 'やめる',
    pwSetPasswordTitle: 'このブラウザ用のパスワードを決めてください',
    pwPasswordPh: 'パスワード（8文字以上）', pwPassword2Ph: '同じパスワードをもう一度',
    pwPasswordShort: 'パスワードは8文字以上にしてください。',
    pwPasswordMismatch: '2つのパスワードが一致しません。',
    pwSaveBtn: 'このウォレットを保存する',
    pwImportExplain: '復元フレーズ（12語または24語）か、秘密鍵を入力してください。次に決めるパスワードで暗号化して、このブラウザの中にだけ保存します。',
    pwImportPh: '復元フレーズ、または秘密鍵（0x…）',
    pwImportInvalid: 'うまく読み取れませんでした。語句（または鍵）を確認してもう一度どうぞ。',
    pwLockedTitle: 'このブラウザの投稿用ウォレットはロック中です',
    pwLockedText: '設定したパスワードを入力すると開きます。開いた状態は15分まで続きます。',
    pwUnlockBtn: '開く', pwUnlockWrong: 'そのパスワードでは開けませんでした。もう一度どうぞ。',
    pwAddressLbl: '投稿用ウォレット', pwCopyBtn: 'アドレスをコピー',
    pwQomLbl: 'QOM（手数料用）', pwQcawLbl: 'このウォレットの qCAW',
    pwActingLbl: '投稿する名前', pwNameBalanceLbl: 'この名前の中の qCAW',
    pwNoNamesYet: 'このウォレットには、まだ CAW の名前がありません。投稿できる名前がありません。下の方の欄で名前を取ると（ウォレットアプリを使います）、ここに出てきます。',
    pwLockBtn: 'ロックする', pwRemoveBtn: 'このブラウザからウォレットを消す',
    pwRemoveWarn: 'このブラウザに保存された暗号化ウォレットを消します。復元フレーズ（または秘密鍵）を控えていない場合、このウォレットは二度と戻せません。名前やコインが消えるわけではありません — 公開の記録に残っていて、同じフレーズや鍵を取り込み直せば戻ってきます。',
    pwRemoveTypeLbl: '消すには、この言葉を入力してください：', pwRemoveWord: '削除',
    pwRemoveConfirmBtn: '完全に消す',
    pwDepTitle: 'この名前へ qCAW を入れる／出す',
    pwDepNote: '投稿などの操作の料金は、ウォレットからではなく、名前の中にある qCAW から払われます。',
    pwAmountPh: 'qCAW の量', pwDepositBtn: '入れる', pwWithdrawBtn: '出す',
    pwAmountBad: '100 や 12.5 のように量を入力してください。',
    pwApproveFirst: '先に一度だけ許可が必要で、そのあと金額が入ります。',
    pwBusySending: '送信中です… 進み具合は下に出ます。', pwBusyWaiting: '送りました — 記録に確定するのを待っています…',
    pwDoneOk: 'できました。', pwSendFailPlain: '送信できませんでした。',
    pwUnconfirmed: '送信はしましたが、記録の確定が遅れています。少し待ってから確認してください。',
    pwNeedGas: 'この投稿用ウォレットに QOM がありません。手数料が払えないので、先に上のアドレスへ少し QOM を送ってください。',
    compPh: 'いまどうしてる？',
    compPostBtn: '投稿する', compBytes: '{n} / 420 文字分',
    compTooLong: '長すぎます。投稿は、返信や引用の目印を含めて420文字分までです。',
    compZeroBalance: 'この名前の中に qCAW がありません。このままでは操作が失敗します。先に投稿用ウォレットの欄で qCAW を入れてください。',
    compHintLocked: '投稿には内蔵ウォレットが必要です。',
    compHintSetupBtn: '投稿用ウォレットを用意する',
    compHintNoName: '投稿には CAW の名前が必要です。下の方で名前を取ると、投稿用ウォレットに出てきます。',
    compReplyingTo: '{name} さんへの返信', compQuoting: '{name} さんを引用', compCancelRef: '取り消し',
    actLike: 'いいね', actRecaw: 'Recaw', actReply: '返信', actQuote: '引用',
    actFollow: 'フォロー', actUnfollow: 'フォローをやめる', actFollowing: 'フォロー中',
    actOwnProfile: 'これはあなた自身の名前です。',
    confirmTitlePost: 'この内容で投稿しますか？', confirmTitleLike: 'この投稿にいいねしますか？',
    confirmTitleRecaw: 'この投稿を Recaw しますか？', confirmTitleFollow: 'この名前をフォローしますか？',
    confirmTitleUnfollow: 'この名前のフォローをやめますか？', confirmTitleDeposit: 'qCAW を入れますか？',
    confirmTitleWithdraw: 'qCAW を出しますか？',
    confirmAsLbl: '名前', confirmTargetLbl: '相手', confirmTextLbl: '本文',
    confirmAmountLbl: '金額', confirmNameLbl: '名前',
    confirmSignBtn: '署名して送る', confirmCancelBtn: 'やめる',
    actSending: '署名して送信しています…', actWaiting: '送りました — 記録されるのを待っています…',
    actDone: 'できました — 記録されました。', actFail: 'うまくいきませんでした。',
    actUnconfirmed: '送りましたが、記録の確定が遅れています。',
    actNotOwner: 'この名前は今の投稿用ウォレットのものではないため、署名を止めました。',
    actSelfFollow: 'その名前は同じウォレットのものなので、ここからはフォローできません。',
    mintNote: '名前を取る手続きはウォレットアプリ（MetaMask や FoxWallet）を使います。上の投稿用ウォレットとは別で、あちらは投稿専用です。',
    navHome: 'ホーム', navSearch: '検索', navProfile: 'プロフィール',
    navWallet: 'ウォレット', navMyNames: '自分の名前', navGetName: '名前を取る',
    navBookmarks: 'ブックマーク', navSettings: '設定',
    bmEmpty: 'ブックマークはまだありません。保存した投稿がここに表示されます。',
    bmNeedWallet: 'ブックマークはこの端末の投稿用ウォレットに紐づいています。上の投稿用ウォレットを開くと、保存した投稿が見られます。',
    bmRemove: '削除', bmAdd: 'ブックマーク', bmMissing: 'この投稿は、読める範囲の記録では見つかりませんでした。',
    likedBy: 'いいねした人', sharedBy: 'Recaw した人',
    shareLabel: '共有',
    depostLbl: '入れる／出す',
    slTitle: '超いいねを送りますか？',
    slTarget: '投稿', slTotal: '合計', slToAuthor: '投稿者へ',
    slBurned: 'バーン（誰にも届きません）', slBalance: 'あなたの O 残高',
    slConfirm: '25,000,000 O を送る ⭐', slDone: '超いいねを送りました ⭐',
    slSelf: '自分の投稿には超いいねできません。',
    slShortfall: 'O が足りません。超いいねには合計 25,000,000 O が必要です（投稿者へ 15,000,000 + バーン 10,000,000）。QL1 で O を用意して（QomSwap で交換するなど）もう一度お試しください。',
    slPayPending: 'バーンは通りました⭐ ただし投稿者への 15,000,000 O の支払いが終わっていません。この投稿の ⭐ を押すと、支払いだけを送れます。',
    srcTitle: 'SuperRecaw を送りますか？',
    srcConfirm: 'Recaw して O をバーン ⭐', srcDone: 'SuperRecaw を送りました ⭐',
    srcShortfall: 'SuperRecaw に必要な O（合計 25,000,000 O: 投稿者へ 5,000,000 + バーン 20,000,000）が足りません。通常の Recaw なら送れます。',
    srcBurnTitle: 'SuperRecaw のバーンを仕上げますか？',
    srcBurnConfirm: '20,000,000 O をバーンする', srcBurnDone: 'バーン完了 — SuperRecaw が成立しました ⭐',
    srcBurnShortfall: 'バーンに必要な O が足りません。QL1 で O を用意して、この投稿の Recaw をもう一度押してください。',
    srcBurnPending: 'Recaw は送信されました⭐ ただし O のバーンが終わっていません。この投稿の Recaw を押すと、バーンだけを仕上げられます。',
    srcPayPending: 'Recaw は送信されました⭐ ただし投稿者への 5,000,000 O の支払いが終わっていません。この投稿の Recaw を押すと、支払いだけを送れます。',
    srcSelfNote: 'これは自分の投稿です。バーンだけが成立条件で、投稿者への支払いはありません（投稿者はあなた自身です）。',
    payTitle: '投稿者への支払いを仕上げますか？',
    payConfirm: '{amount} O を送る', payDone: '支払いを送りました — 完了です ⭐',
    payShortfall: '支払いに必要な O が足りません。QL1 で O を用意して、もう一度お試しください。',
    recawChoiceTitle: 'Recaw しますか？',
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

/* ---------- getting a name: the check + the calldata (v11) ----------
   The ONE write feature of this site. Minting a name is ordinary
   contract calls sent through the visitor's own wallet — it needs
   no signature scheme at all (that is what separates it from
   posting, which stays in the Android app). checkName mirrors the
   app's exactly: the contract's own validity gate, taken-ness
   through the same card-verified resolver the lookup uses, and
   the contract's own price. Names are normalised the way the app
   normalises its input field: trimmed and lowercased. The two
   calldata builders are the whole write vocabulary of the site —
   the wallet UI further down can only ever send these. */
function normalizeNameInput(s) {
  return String(s || '').trim().toLowerCase().replace(/^@/, '');
}
async function checkName(rawName) {
  const name = normalizeNameInput(rawName);
  const enc = encStr(name);
  const [valid, res, cost] = await Promise.all([
    readUint(MINTER, SEL.isValidUsername + enc).then(v => v !== 0n),
    resolveNameId(name).catch(() => ({ status: 'error' })),
    readUint(MINTER, SEL.costOfName + enc),
  ]);
  if (valid && res.status === 'error') throw new Error('name lookup reads failed');
  return { name, valid, taken: res.status === 'ok', cost };
}
/* SEL selectors carry their own 0x prefix (the file's convention),
   so the builders concatenate directly — the result is the full
   0x-prefixed calldata, exactly what the wallet is handed. */
const buildApproveCalldata = cost => SEL.approve + encAddr(MINTER) + word(cost);
const buildMintCalldata = name => SEL.mint + encStr(name);

/* ---------- name NFT preview (v11) ----------
   The REAL name-card design, reproduced locally for any name
   before it is minted — ported from the Android app's
   nameNftPreview.ts, which was verified against the chain: the
   card image a token carries is built from this template with
   one text element holding the name itself, at a font size set
   by the name's length (3->99, 4->77, 5->64, 6->55, 7->49,
   8->44, 9->40, 10->36, 11->33, 12->31, 13->29, 14->27, 15->25,
   16->23, 17 and longer -> 22). The harness checks this port
   against token 190's real on-chain card. */
const NFT_FONT_SIZE = {"3":99,"4":77,"5":64,"6":55,"7":49,"8":44,"9":40,"10":36,"11":33,"12":31,"13":29,"14":27,"15":25,"16":23};
function nameNftFontSize(name) {
  const len = [...String(name)].length;
  if (len >= 17) return 22;
  return NFT_FONT_SIZE[len] || 99;
}
const NFT_SVG_PRE = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"270\" height=\"270\" viewBox=\"0 0 270 270\" fill=\"none\" data-ember-extension=\"1\"> <rect width=\"270\" height=\"270\" fill=\"url(#paint0_linear)\"/> <defs> <filter id=\"dropShadow\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\" height=\"270\" width=\"270\"> <feDropShadow dx=\"0\" dy=\"1\" stdDeviation=\"2\" flood-opacity=\"0.225\" width=\"200%\" height=\"200%\"/> </filter> </defs><path d=\"M30.36,35.15l15.28,1.29a7.47,7.47,0,0,0,5.29-3l-1.84-7.27a33,33,0,0,1,8.77,0L56,33.42s1.69,3.13,6.6,2.94c.75,0,14-1.25,14-1.25L69.15,45.52l-5.73.54a9.57,9.57,0,0,1-4.11-.29,10.59,10.59,0,0,1-3-1.63L53.47,50.6l-2.73-6.45a10.13,10.13,0,0,0-1.52.88c-2,1.36-5.49,1.08-5.49,1.08l-5.82-.48Z\" style=\"fill:#000000\" filter=\"url(#dropShadow)\"/><path d=\"M48.32,84.39,41.8,70.51a7.45,7.45,0,0,0-5.25-3.07l-5.39,5.22a33.26,33.26,0,0,1-4.4-7.58L34,63s1.86-3-.75-7.18c-.4-.63-8.06-11.48-8.06-11.48l12.72,1.23,3.33,4.69A9.54,9.54,0,0,1,43.05,54a10.71,10.71,0,0,1,.09,3.41l7-.76-4.22,5.59a10.44,10.44,0,0,0,1.52.86c2.19,1.08,3.67,4.22,3.67,4.22l2.5,5.28Z\" style=\"fill:#000000\" filter=\"url(#dropShadow)\"/><path d=\"M82,44.21,73.25,56.8a7.46,7.46,0,0,0,0,6.09l7.22,2a32.65,32.65,0,0,1-4.36,7.6l-5.39-5.26s-3.55-.1-5.85,4.25c-.35.66-5.9,12.72-5.9,12.72l-5.3-11.64L56,67.39A9.69,9.69,0,0,1,58.34,64a10.82,10.82,0,0,1,2.9-1.78L57.07,56.5l6.95.86a11.11,11.11,0,0,0,0-1.76c-.17-2.43,1.81-5.29,1.81-5.29l3.32-4.8Z\" style=\"fill:#000000\" filter=\"url(#dropShadow)\"/>";
const NFT_SVG_POST = " <defs> <style> text { font-family: monospace; font-style: normal; font-weight: bold; line-height: 34px; } </style> <linearGradient id=\"paint0_linear\" x1=\"110.5\" y1=\"140\" x2=\"-30\" gradientUnits=\"userSpaceOnUse\" y42=\"37.5\"> <stop stop-color=\"#000000\"/> <stop offset=\"0.25\" stop-color=\"#ECc052\"/> <stop offset=\"1\" stop-color=\"#ECc052\"/> </linearGradient> <linearGradient id=\"paint1_linear\" x1=\"0\" y1=\"0\" x2=\"269.553\" y2=\"285.527\" gradientUnits=\"userSpaceOnUse\"> <stop stop-color=\"#000000\"/> <stop offset=\"1\" stop-color=\"#22222\"/> </linearGradient> </defs> </svg>";
const nftXmlEscape = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function nameNftSvg(name) {
  return NFT_SVG_PRE +
    '<text y="231" font-size="' + nameNftFontSize(name) + 'px" fill="white" filter="url(#dropShadow)" style="text-anchor: end;" x="90%">' +
    nftXmlEscape(name) + '</text>' + NFT_SVG_POST;
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

/* ---------- bookmarks (v13; the app's lib/bookmarks.ts rule) ----------
   CAW has no on-chain bookmark action, so — exactly like the
   Android app — the list lives only on this device: a
   localStorage list of post cawIds, newest first, scoped per
   WALLET ADDRESS (the posting wallet's address here; the app's
   storage key prefix is kept: caw-bookmarks-v1-<address>). The
   store keeps cawIds, never post content: the bookmarks view
   resolves each id against the live readers, and an id that no
   longer resolves renders an honest placeholder, never a cached
   copy. Nothing is signed or sent for a bookmark. Pure logic +
   the localStorage guards used elsewhere in this file, so the
   harness can verify it in Node. */
const BOOKMARKS_KEY_PREFIX = 'caw-bookmarks-v1-';
const bmKeyFor = address => BOOKMARKS_KEY_PREFIX + String(address || '').toLowerCase();
const normBookmarkId = cawId => String(cawId || '').trim().toLowerCase();
function bmReadIds(address) {
  if (!address || typeof localStorage === 'undefined') return [];
  try {
    const arr = JSON.parse(localStorage.getItem(bmKeyFor(address)) || 'null');
    if (!Array.isArray(arr)) return [];
    const seen = new Set(), out = [];
    for (const v of arr) {
      if (typeof v !== 'string') continue;
      const id = normBookmarkId(v);
      if (!id || seen.has(id)) continue;
      seen.add(id); out.push(id);
    }
    return out;
  } catch (e) { return []; }
}
function bmWriteIds(address, ids) {
  if (!address || typeof localStorage === 'undefined') return;
  try { localStorage.setItem(bmKeyFor(address), JSON.stringify(ids)); } catch (e) {}
}
function bmList(address) { return bmReadIds(address); }
function bmHas(address, cawId) {
  const id = normBookmarkId(cawId);
  return !!id && bmReadIds(address).includes(id);
}
/* Toggle one post; returns the NEW state (true = now saved).
   Adding puts the id at the head (newest first). */
function bmToggle(address, cawId) {
  const id = normBookmarkId(cawId);
  if (!address || !id) return false;
  const ids = bmReadIds(address);
  const at = ids.indexOf(id);
  let now;
  if (at >= 0) { ids.splice(at, 1); now = false; }
  else { ids.unshift(id); now = true; }
  bmWriteIds(address, ids);
  return now;
}

/* ---------- SuperLike / SuperRecaw (v14) ----------
   A straight port of the Android app's v0.6.3 design
   (caw-social-app src/lib/markedBurns.ts, authorPay.ts,
   superRecaw.ts, superlike.ts, actionFlow.ts) — the amounts,
   the marker codec, the detection sets, the debt records and
   the leg order are the app's, copied, not reinvented.

   Both actions cost 25,000,000 O IN TOTAL (O = "Childhoods
   End" on QL1, 18 decimals), split into a marked BURN leg —
   an ordinary O transfer to the burn address with a 4-byte
   magic ("SLK1" / "SRC1") + the post's 32-byte cawId appended
   as trailing calldata — and a plain, unmarked author-payment
   leg:
     SuperLike:  15,000,000 to the author + 10,000,000 burned
     SuperRecaw:  5,000,000 to the author + 20,000,000 burned
                 (after the normal Recaw action itself)
   Burns of exactly 1,000,000 O (the v0.5.0–v0.6.2 spec) still
   COUNT for both markers, forever — the detection sets accept
   the current amount and the legacy one.

   Counts come from ONE chain-wide scan of O Transfer events
   TO the burn address, indexed by cawId (SuperRecaw also by
   cawId + sender). A transfer counts only when its tx input
   parses as a marked burn, its amount is in the marker's
   accepted set, and the Transfer log's own value agrees.
   Scan progress persists in localStorage; a failed chunk
   never advances the cursor, so a count is only ever the sum
   of completed scans. */
const O_TOKEN = '0x6c39b68a28bA90F4EB80032ec0eB32ad81cbbEd4';
const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const oWhole = n => BigInt(n) * 10n ** 18n;
const SUPERLIKE_TOTAL_O = 25000000;
const SUPERLIKE_AUTHOR_O = 15000000;
const SUPERLIKE_BURN_O = 10000000;
const SUPERRECAW_TOTAL_O = 25000000;
const SUPERRECAW_AUTHOR_O = 5000000;
const SUPERRECAW_BURN_O = 20000000;
const LEGACY_MARKED_BURN_O = 1000000;
const SUPERLIKE_TOTAL_RAW = oWhole(SUPERLIKE_TOTAL_O);
const SUPERLIKE_AUTHOR_RAW = oWhole(SUPERLIKE_AUTHOR_O);
const SUPERLIKE_BURN_RAW = oWhole(SUPERLIKE_BURN_O);
const SUPERRECAW_TOTAL_RAW = oWhole(SUPERRECAW_TOTAL_O);
const SUPERRECAW_AUTHOR_RAW = oWhole(SUPERRECAW_AUTHOR_O);
const SUPERRECAW_BURN_RAW = oWhole(SUPERRECAW_BURN_O);
const LEGACY_MARKED_BURN_RAW = oWhole(LEGACY_MARKED_BURN_O);
const SUPERLIKE_BURN_AMOUNTS = [SUPERLIKE_BURN_RAW, LEGACY_MARKED_BURN_RAW];
const SUPERRECAW_BURN_AMOUNTS = [SUPERRECAW_BURN_RAW, LEGACY_MARKED_BURN_RAW];
const SUPERLIKE_MAGIC = '534c4b31'; // "SLK1"
const SUPERRECAW_MAGIC = '53524331'; // "SRC1"
const MARKED_BURN_START_BLOCK = 13400000;
const MB_CHUNK = 9000;
const MB_KV_KEY = 'caw-marked-burns-v1';
const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const TRANSFER_SELECTOR = 'a9059cbb';
function burnAmountsForMagic(magic) {
  return magic === SUPERLIKE_MAGIC ? SUPERLIKE_BURN_AMOUNTS : SUPERRECAW_BURN_AMOUNTS;
}
function normCawIdHex(cawId) {
  const h = String(cawId || '').replace(/^0x/, '').toLowerCase();
  return /^[0-9a-f]{64}$/.test(h) ? h : null;
}
/* Plain ERC20 transfer calldata (no 0x on the selector const —
   word()/encAddr() here return bare hex, like the rest of the
   pure section). */
const buildTransferData = (to, amountRaw) => '0x' + TRANSFER_SELECTOR + encAddr(to) + word(amountRaw);
/* The marked-burn calldata: the ordinary transfer encoding
   with magic + cawId appended. Null on a malformed id. */
function buildMarkedBurnData(magic, cawId, amountRaw) {
  const id = normCawIdHex(cawId);
  if (!id) return null;
  return buildTransferData(BURN_ADDRESS, amountRaw) + magic + id;
}
const buildSuperlikeData = cawId => buildMarkedBurnData(SUPERLIKE_MAGIC, cawId, SUPERLIKE_BURN_RAW);
const buildSuperRecawData = cawId => buildMarkedBurnData(SUPERRECAW_MAGIC, cawId, SUPERRECAW_BURN_RAW);
/* The author leg's calldata: a PLAIN transfer, no marker —
   deliberately indistinguishable from any other O transfer. */
const buildAuthorPayData = (to, amountRaw) => buildTransferData(to, amountRaw);
/* Strict parse of a tx input as a marked burn (the app's
   shape: exactly the transfer encoding + 36 trailing bytes,
   a known magic, the recipient the burn address). */
function parseMarkedBurnInput(data) {
  const h = String(data || '').replace(/^0x/, '').toLowerCase();
  if (h.length !== 208) return null;
  if (!h.startsWith(TRANSFER_SELECTOR)) return null;
  const magic = h.slice(136, 144);
  if (magic !== SUPERLIKE_MAGIC && magic !== SUPERRECAW_MAGIC) return null;
  const to = '0x' + h.slice(32, 72);
  if (to !== BURN_ADDRESS.toLowerCase()) return null;
  let amount;
  try { amount = BigInt('0x' + h.slice(72, 136)); } catch (e) { return null; }
  return { magic, to, amount, cawId: '0x' + h.slice(144, 208) };
}
/* The SuperLike self-block (the app's superlikeBlockReason):
   'self' when the post's name is one of mine, or the author's
   owner IS my address; null when the SuperLike may proceed. */
function superlikeBlockReason(args) {
  if ((args.myTokenIds || []).some(id => id === args.senderId)) return 'self';
  if (args.authorOwner && args.myAddress &&
      args.authorOwner.toLowerCase() === args.myAddress.toLowerCase()) return 'self';
  return null;
}
const superlikeShortfall = balance => balance < SUPERLIKE_TOTAL_RAW;

/* ----- the marked-burn index (store + scanner) ----- */
let mbRecord = { to: MARKED_BURN_START_BLOCK - 1, sl: {}, src: {} };
let mbLoaded = false;
let mbScanning = null;
const mbListeners = new Set();
function mbNotify() { for (const fn of [...mbListeners]) { try { fn(); } catch (e) {} } }
function mbEnsureLoaded() {
  if (mbLoaded) return;
  mbLoaded = true;
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(MB_KV_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.to === 'number' && parsed.sl && parsed.src &&
        parsed.to >= MARKED_BURN_START_BLOCK - 1) {
      mbRecord = { to: parsed.to, sl: { ...parsed.sl }, src: { ...parsed.src } };
    }
  } catch (e) { /* a corrupt cache just means a rescan */ }
}
function mbPersist() {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(MB_KV_KEY, JSON.stringify(mbRecord)); } catch (e) {}
}
const mbTopicAddress = addr => '0x' + '0'.repeat(24) + String(addr).replace(/^0x/, '').toLowerCase();
const mbHexBlock = n => '0x' + n.toString(16);
async function mbAbsorb(logs) {
  const hashes = [...new Set(logs.map(l => l.transactionHash))];
  const inputs = new Map();
  for (let i = 0; i < hashes.length; i += 30) {
    const group = hashes.slice(i, i + 30);
    const txs = await Promise.all(group.map(h => rpc('eth_getTransactionByHash', [h]).catch(() => null)));
    group.forEach((hash, j) => {
      const tx = txs[j];
      if (tx && typeof tx.input === 'string') inputs.set(hash, tx.input);
    });
  }
  for (const log of logs) {
    const input = inputs.get(log.transactionHash);
    if (!input) throw new Error('missing input'); // rescan chunk later
    const mark = parseMarkedBurnInput(input);
    if (!mark) continue;
    if (!burnAmountsForMagic(mark.magic).includes(mark.amount)) continue;
    try { if (BigInt(log.data) !== mark.amount) continue; } catch (e) { continue; }
    const from = ('0x' + (log.topics[1] || '').slice(26)).toLowerCase();
    if (mark.magic === SUPERLIKE_MAGIC) {
      mbRecord.sl[mark.cawId] = (mbRecord.sl[mark.cawId] || 0) + 1;
    } else {
      const key = mark.cawId + ':' + from;
      mbRecord.src[key] = (mbRecord.src[key] || 0) + 1;
    }
  }
}
async function mbScanOnce() {
  mbEnsureLoaded();
  let head;
  try { head = Number(BigInt(await rpc('eth_blockNumber', []))); }
  catch (e) { return; } // cannot even read the head — try again later
  let from = Math.max(MARKED_BURN_START_BLOCK, mbRecord.to + 1);
  while (from <= head) {
    const toB = Math.min(from + MB_CHUNK - 1, head);
    let logs;
    try {
      logs = await rpc('eth_getLogs', [{
        address: O_TOKEN,
        topics: [TRANSFER_TOPIC, null, mbTopicAddress(BURN_ADDRESS)],
        fromBlock: mbHexBlock(from),
        toBlock: mbHexBlock(toB),
      }]);
    } catch (e) { return; } // cursor NOT advanced past the failed chunk
    if (logs && logs.length) {
      try { await mbAbsorb(logs); }
      catch (e) { return; } // input fetch failed — rescan this chunk later
    }
    mbRecord.to = toB;
    mbPersist();
    mbNotify();
    from = toB + 1;
  }
}
/* Scan to the current head (deduped while a scan is running). */
function scanMarkedBurns() {
  if (!mbScanning) {
    mbScanning = mbScanOnce().catch(() => {}).then(() => { mbScanning = null; });
  }
  return mbScanning;
}
function superlikeCountCached(cawId) {
  mbEnsureLoaded();
  const id = normCawIdHex(cawId);
  if (!id) return 0;
  return mbRecord.sl['0x' + id] || 0;
}
/* The last fully scanned block (harness visibility). */
const mbCursor = () => { mbEnsureLoaded(); return mbRecord.to; };
async function superlikeCount(cawId) {
  await scanMarkedBurns();
  return superlikeCountCached(cawId);
}
function superRecawCached(cawId, sender) {
  mbEnsureLoaded();
  const id = normCawIdHex(cawId);
  if (!id || !sender) return false;
  return (mbRecord.src['0x' + id + ':' + String(sender).toLowerCase()] || 0) > 0;
}
async function hasSuperRecaw(cawId, sender) {
  await scanMarkedBurns();
  return superRecawCached(cawId, sender);
}
/* After my own marked burn lands, nudge a rescan. */
function refreshMarkedBurns() { scanMarkedBurns().then(() => mbNotify()).catch(() => {}); }
function subscribeMarkedBurns(fn) { mbListeners.add(fn); return () => mbListeners.delete(fn); }

/* ----- pending SuperRecaw burns (the app's superRecaw.ts) -----
   When the Recaw landed but its O burn did not, the burn is
   owed. The record's existence is the proof the Recaw already
   happened; the retry sends ONLY the burn and can never
   rebuild or resend the Recaw. Key: sender + ':' + cawId. */
const SRC_BURN_KV_KEY = 'caw-superrecaw-burn-v1';
const srcBurnKey = (sender, cawId) => {
  const id = normCawIdHex(cawId);
  if (!id || !sender) return null;
  return String(sender).toLowerCase() + ':' + '0x' + id;
};
function srcBurnLoadAll() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(SRC_BURN_KV_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) { return {}; }
}
function srcBurnSaveAll(obj) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(SRC_BURN_KV_KEY, JSON.stringify(obj)); } catch (e) {}
}
function pendingSrcBurnFor(sender, cawId) {
  const k = srcBurnKey(sender, cawId);
  if (!k) return null;
  const v = srcBurnLoadAll()[k];
  return v && typeof v.cawId === 'string' ? v : null;
}
function recordSrcBurn(sender, rec) {
  const k = srcBurnKey(sender, rec.cawId);
  if (!k) return;
  const all = srcBurnLoadAll();
  all[k] = rec;
  srcBurnSaveAll(all);
}
function clearSrcBurn(sender, cawId) {
  const k = srcBurnKey(sender, cawId);
  if (!k) return;
  const all = srcBurnLoadAll();
  if (delete all[k]) srcBurnSaveAll(all);
}

/* ----- pending author payments (the app's authorPay.ts) -----
   The plain-transfer leg of a SuperLike / SuperRecaw, owed
   when it fails after the defining legs landed. The record
   pins the recipient AS RESOLVED WHEN THE ACTION WAS TAKEN
   ('' = resolve fresh at retry), the amount (decimal string)
   and the post. Key: sender + ':' + kind + ':' + cawId. */
const AUTHOR_PAY_KV_KEY = 'caw-author-pay-v1';
const authorPayKey = (sender, kind, cawId) => {
  const id = normCawIdHex(cawId);
  if (!id || !sender) return null;
  return String(sender).toLowerCase() + ':' + kind + ':' + '0x' + id;
};
const authorPayAmountFor = kind => kind === 'sl' ? SUPERLIKE_AUTHOR_RAW : SUPERRECAW_AUTHOR_RAW;
function authorPayLoadAll() {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(AUTHOR_PAY_KV_KEY) || 'null');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) { return {}; }
}
function authorPaySaveAll(obj) {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(AUTHOR_PAY_KV_KEY, JSON.stringify(obj)); } catch (e) {}
}
/* -> {cawId, author, amountRaw (bigint), ts} or null */
function pendingAuthorPayFor(sender, kind, cawId) {
  const k = authorPayKey(sender, kind, cawId);
  if (!k) return null;
  const v = authorPayLoadAll()[k];
  if (!v || typeof v.cawId !== 'string') return null;
  try {
    return { cawId: v.cawId, author: typeof v.author === 'string' ? v.author : '', amountRaw: BigInt(v.amount), ts: typeof v.ts === 'number' ? v.ts : 0 };
  } catch (e) { return null; } // an unreadable amount drops the record
}
function recordAuthorPay(sender, kind, rec) {
  const k = authorPayKey(sender, kind, rec.cawId);
  if (!k) return;
  const all = authorPayLoadAll();
  all[k] = { cawId: rec.cawId, author: rec.author || '', amount: rec.amountRaw.toString(), ts: rec.ts };
  authorPaySaveAll(all);
}
function clearAuthorPay(sender, kind, cawId) {
  const k = authorPayKey(sender, kind, cawId);
  if (!k) return;
  const all = authorPayLoadAll();
  if (delete all[k]) authorPaySaveAll(all);
}

/* Timeline row rule (app v0.4.x semantics): LIKE actions never
   render as rows — they only feed the counts on their target post.
   Posts, Recaws, follows and unfollows do render. */
function isVisibleRow(a) { return a.type !== 1; }

/* ---------- v12: byte helpers + WebCrypto plumbing ----------
   All key work uses the platform WebCrypto (crypto.subtle) for
   the standard hashes, key stretching and AES — available on
   every modern browser over https and under Node for the
   harness. The curve arithmetic below is plain BigInt. */
const webCryptoObj = (typeof globalThis !== 'undefined' && globalThis.crypto) || null;
function subtleCrypto() {
  if (!webCryptoObj || !webCryptoObj.subtle) throw new Error('WebCrypto is not available here');
  return webCryptoObj.subtle;
}
const utf8ToBytes = s => new TextEncoder().encode(s);
function bytesToHexU(bytes) {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}
function hexToBytesU(hex) {
  const h = String(hex || '').replace(/^0x/, '');
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function concatBytes(parts) {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const p of parts) { out.set(p, off); off += p.length; }
  return out;
}
const bytesToBig = bytes => bytes.length ? BigInt('0x' + bytesToHexU(bytes)) : 0n;
const bigToBytes32 = v => hexToBytesU(BigInt(v).toString(16).padStart(64, '0'));
async function hmacBytes(hash, keyBytes, dataBytes) {
  const key = await subtleCrypto().importKey('raw', keyBytes, { name: 'HMAC', hash }, false, ['sign']);
  return new Uint8Array(await subtleCrypto().sign('HMAC', key, dataBytes));
}
const sha256Bytes = async bytes => new Uint8Array(await subtleCrypto().digest('SHA-256', bytes));
async function pbkdf2Bytes(passwordBytes, saltBytes, iterations, hash, bitLen) {
  const base = await subtleCrypto().importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveBits']);
  return new Uint8Array(await subtleCrypto().deriveBits(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash }, base, bitLen));
}

/* ---------- v12: secp256k1 (BigInt, Jacobian coordinates) ----------
   The curve every Ethereum key lives on. Points travel in
   Jacobian form (x, y, z) so scalar multiplication needs no
   per-step inversion; one inversion converts back to affine.
   Correctness is pinned by the harness vectors: the well-known
   Hardhat key and phrase must derive their well-known address,
   and a fixed transaction signed here must match ethers byte
   for byte (RFC 6979 makes the signature deterministic). */
const SEC_P = 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn;
const SEC_N = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
const SEC_G = {
  x: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
  y: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n,
};
const secMod = (a, m) => { const r = a % m; return r >= 0n ? r : r + m; };
function secPow(base, exp, m) {
  let result = 1n, b = secMod(base, m), e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m;
    b = (b * b) % m;
    e >>= 1n;
  }
  return result;
}
const secInv = (a, m) => secPow(a, m - 2n, m); // both moduli here are prime
const JAC_INF = { x: 0n, y: 1n, z: 0n };
function jacDouble(Pt) {
  if (Pt.z === 0n || Pt.y === 0n) return JAC_INF;
  const yy = secMod(Pt.y * Pt.y, SEC_P);
  const s = secMod(4n * Pt.x * yy, SEC_P);
  const m = secMod(3n * Pt.x * Pt.x, SEC_P);
  const nx = secMod(m * m - 2n * s, SEC_P);
  const ny = secMod(m * (s - nx) - 8n * yy * yy, SEC_P);
  const nz = secMod(2n * Pt.y * Pt.z, SEC_P);
  return { x: nx, y: ny, z: nz };
}
function jacAdd(Pt, Qt) {
  if (Pt.z === 0n) return Qt;
  if (Qt.z === 0n) return Pt;
  const z1z1 = secMod(Pt.z * Pt.z, SEC_P), z2z2 = secMod(Qt.z * Qt.z, SEC_P);
  const u1 = secMod(Pt.x * z2z2, SEC_P), u2 = secMod(Qt.x * z1z1, SEC_P);
  const s1 = secMod(Pt.y * Qt.z * z2z2, SEC_P), s2 = secMod(Qt.y * Pt.z * z1z1, SEC_P);
  if (u1 === u2) {
    if (s1 !== s2) return JAC_INF;
    return jacDouble(Pt);
  }
  const h = secMod(u2 - u1, SEC_P);
  const r = secMod(s2 - s1, SEC_P);
  const hh = secMod(h * h, SEC_P), hhh = secMod(h * hh, SEC_P);
  const v = secMod(u1 * hh, SEC_P);
  const nx = secMod(r * r - hhh - 2n * v, SEC_P);
  const ny = secMod(r * (v - nx) - s1 * hhh, SEC_P);
  const nz = secMod(h * Pt.z * Qt.z, SEC_P);
  return { x: nx, y: ny, z: nz };
}
function jacToAffine(Pt) {
  if (Pt.z === 0n) return null;
  const zi = secInv(Pt.z, SEC_P);
  const zi2 = secMod(zi * zi, SEC_P), zi3 = secMod(zi2 * zi, SEC_P);
  return { x: secMod(Pt.x * zi2, SEC_P), y: secMod(Pt.y * zi3, SEC_P) };
}
/* Scalar multiplication of an affine point; returns affine. */
function secMul(k, affinePt) {
  let kMod = secMod(k, SEC_N);
  if (kMod === 0n || !affinePt) return null;
  let acc = JAC_INF;
  let addend = { x: affinePt.x, y: affinePt.y, z: 1n };
  while (kMod > 0n) {
    if (kMod & 1n) acc = jacAdd(acc, addend);
    addend = jacDouble(addend);
    kMod >>= 1n;
  }
  return jacToAffine(acc);
}
function secNeg(pt) { return pt ? { x: pt.x, y: secMod(-pt.y, SEC_P) } : null; }
function pubPointOf(privBytes) { return secMul(bytesToBig(privBytes), SEC_G); }
function compressedPubOf(privBytes) {
  const pt = pubPointOf(privBytes);
  const out = new Uint8Array(33);
  out[0] = (pt.y & 1n) ? 0x03 : 0x02;
  out.set(bigToBytes32(pt.x), 1);
  return out;
}
/* EIP-55 checksummed address for a public point. */
function addressOfPoint(pt) {
  const raw = concatBytes([bigToBytes32(pt.x), bigToBytes32(pt.y)]);
  const hash = keccakHex(raw);
  const lower = hash.slice(-40);
  const hashHex = keccakHex(utf8ToBytes(lower));
  let out = '0x';
  for (let i = 0; i < 40; i++) {
    const ch = lower[i];
    out += (ch >= 'a' && parseInt(hashHex[i], 16) >= 8) ? ch.toUpperCase() : ch;
  }
  return out;
}
function addressOfPriv(privBytes) { return addressOfPoint(pubPointOf(privBytes)); }

/* Sign a 32-byte digest with plain ECDSA — the CAW way: no
   prefix, no message wrapping. The nonce is RFC 6979
   deterministic (HMAC-SHA-256), s is normalised low, and the
   recovery id rides in v as 27/28, matching what ethers'
   SigningKey produces for the same key and digest (the harness
   cross-checks the whole transaction built on this). */
async function signDigestRaw(privBytes, digestHex) {
  const digest = hexToBytesU(digestHex);
  const z = bytesToBig(digest);
  const bh = bigToBytes32(secMod(z, SEC_N)); // RFC 6979 bits2octets
  let V = new Uint8Array(32).fill(0x01);
  let K = new Uint8Array(32).fill(0x00);
  K = await hmacBytes('SHA-256', K, concatBytes([V, new Uint8Array([0]), privBytes, bh]));
  V = await hmacBytes('SHA-256', K, V);
  K = await hmacBytes('SHA-256', K, concatBytes([V, new Uint8Array([1]), privBytes, bh]));
  V = await hmacBytes('SHA-256', K, V);
  const priv = bytesToBig(privBytes);
  for (;;) {
    V = await hmacBytes('SHA-256', K, V);
    const k = bytesToBig(V);
    if (k >= 1n && k < SEC_N) {
      const R = secMul(k, SEC_G);
      const r = secMod(R.x, SEC_N);
      if (r !== 0n) {
        let s = secMod(secInv(k, SEC_N) * secMod(z + r * priv, SEC_N), SEC_N);
        if (s !== 0n) {
          let recid = Number(R.y & 1n) | (R.x >= SEC_N ? 2 : 0);
          if (s > SEC_N / 2n) { s = SEC_N - s; recid ^= 1; }
          return { v: 27 + recid, r: '0x' + bytesToHexU(bigToBytes32(r)), s: '0x' + bytesToHexU(bigToBytes32(s)) };
        }
      }
    }
    K = await hmacBytes('SHA-256', K, concatBytes([V, new Uint8Array([0])]));
    V = await hmacBytes('SHA-256', K, V);
  }
}
/* Recover the signer address of a digest signature — the same
   ecrecover the CawActions contract performs on-chain, done
   locally so the harness (and the page) can prove a signature
   belongs to a key without sending anything. */
function ecrecoverAddress(digestHex, sig) {
  const vIn = Number(sig.v);
  const recid = vIn >= 27 ? vIn - 27 : vIn;
  const r = BigInt(sig.r), s = BigInt(sig.s);
  if (r <= 0n || r >= SEC_N || s <= 0n || s >= SEC_N) return null;
  const x = r + BigInt(recid >> 1) * SEC_N;
  if (x >= SEC_P) return null;
  const alpha = secMod(x * x * x + 7n, SEC_P);
  let y = secPow(alpha, (SEC_P + 1n) / 4n, SEC_P);
  if (secMod(y * y, SEC_P) !== alpha) return null;
  if (Number(y & 1n) !== (recid & 1)) y = SEC_P - y;
  const R = { x, y };
  const z = secMod(BigInt(digestHex), SEC_N);
  const rInv = secInv(r, SEC_N);
  const sR = secMul(s, R);
  const zG = secMul(z, SEC_G);
  const diffJac = jacAdd({ x: sR.x, y: sR.y, z: 1n }, { x: zG.x, y: secMod(-zG.y, SEC_P), z: 1n });
  const diff = jacToAffine(diffJac);
  if (!diff) return null;
  const Q = secMul(rInv, diff);
  return Q ? addressOfPoint(Q) : null;
}

/* ---------- v12: BIP39 phrases + BIP32 derivation ----------
   The wordlist itself lives in docs/bip39-words.js (loaded
   before this file in the shells; the harness requires it the
   same way). A phrase must open the SAME wallet here as in the
   Android app, so the derivation is the standard one the app's
   ethers HDNodeWallet uses: PBKDF2-HMAC-SHA512 seed (no
   passphrase), BIP32 along m/44'/60'/0'/0/0. */
let BIP39_WORDS = (typeof globalThis !== 'undefined' && globalThis.__CAW_BIP39_WORDS) || null;
if (!BIP39_WORDS && typeof require === 'function') {
  try { BIP39_WORDS = require('./bip39-words.js'); } catch (e) { /* shells pre-load it */ }
}
const bip39WordSet = () => new Map(BIP39_WORDS.map((w, i) => [w, i]));
function normalizePhrase(input) {
  return String(input || '').normalize('NFKD').trim().toLowerCase().replace(/\s+/g, ' ');
}
async function validateMnemonic(phrase) {
  if (!BIP39_WORDS) return false;
  const words = normalizePhrase(phrase).split(' ').filter(Boolean);
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;
  const set = bip39WordSet();
  let bits = '';
  for (const w of words) {
    const idx = set.get(w);
    if (idx === undefined) return false;
    bits += idx.toString(2).padStart(11, '0');
  }
  const csLen = bits.length / 33;
  const entBits = bits.slice(0, bits.length - csLen);
  const csBits = bits.slice(bits.length - csLen);
  const ent = new Uint8Array(entBits.length / 8);
  for (let i = 0; i < ent.length; i++) ent[i] = parseInt(entBits.slice(i * 8, i * 8 + 8), 2);
  const hash = await sha256Bytes(ent);
  const expect = hash[0].toString(2).padStart(8, '0').slice(0, csLen);
  return expect === csBits;
}
async function generateMnemonic() {
  if (!webCryptoObj) throw new Error('no secure random source');
  const ent = new Uint8Array(16); // 128 bits -> 12 words
  webCryptoObj.getRandomValues(ent);
  const hash = await sha256Bytes(ent);
  let bits = '';
  for (const b of ent) bits += b.toString(2).padStart(8, '0');
  bits += hash[0].toString(2).padStart(8, '0').slice(0, 4);
  const words = [];
  for (let i = 0; i < 12; i++) words.push(BIP39_WORDS[parseInt(bits.slice(i * 11, i * 11 + 11), 2)]);
  return words.join(' ');
}
async function mnemonicToSeed(phrase) {
  const norm = normalizePhrase(phrase);
  return pbkdf2Bytes(utf8ToBytes(norm), utf8ToBytes('mnemonic'), 2048, 'SHA-512', 512);
}
async function bip32Master(seedBytes) {
  const I = await hmacBytes('SHA-512', utf8ToBytes('Bitcoin seed'), seedBytes);
  return { key: I.slice(0, 32), chain: I.slice(32) };
}
async function bip32Child(node, index) {
  const data = index >= 0x80000000
    ? concatBytes([new Uint8Array([0]), node.key, new Uint8Array([(index >>> 24) & 0xff, (index >>> 16) & 0xff, (index >>> 8) & 0xff, index & 0xff])])
    : concatBytes([compressedPubOf(node.key), new Uint8Array([(index >>> 24) & 0xff, (index >>> 16) & 0xff, (index >>> 8) & 0xff, index & 0xff])]);
  const I = await hmacBytes('SHA-512', node.chain, data);
  const il = bytesToBig(I.slice(0, 32));
  if (il >= SEC_N) throw new Error('invalid child key (astronomically unlikely)');
  const child = secMod(il + bytesToBig(node.key), SEC_N);
  if (child === 0n) throw new Error('invalid child key (astronomically unlikely)');
  return { key: bigToBytes32(child), chain: I.slice(32) };
}
const WALLET_PATH = "m/44'/60'/0'/0/0";
async function deriveFromPhrase(phrase, path) {
  const seed = await mnemonicToSeed(phrase);
  let node = await bip32Master(seed);
  const parts = String(path || WALLET_PATH).replace(/^m\/?/, '').split('/').filter(Boolean);
  for (const part of parts) {
    const hard = part.endsWith("'");
    const num = parseInt(hard ? part.slice(0, -1) : part, 10);
    node = await bip32Child(node, hard ? num + 0x80000000 : num);
  }
  return { privateKey: '0x' + bytesToHexU(node.key), address: addressOfPriv(node.key), keyBytes: node.key };
}
function privateKeyToAddress(keyHex) {
  const kb = hexToBytesU(keyHex);
  if (kb.length !== 32) return null;
  const v = bytesToBig(kb);
  if (v === 0n || v >= SEC_N) return null;
  return addressOfPriv(kb);
}

/* ---------- v12: the vault (encrypted at rest) ----------
   The password stretches (PBKDF2-HMAC-SHA256, 210,000 rounds)
   into an AES-GCM-256 key that encrypts the secret JSON. Only
   {salt, iv, ciphertext} — all base64 — ever touches storage,
   under the key caw-vault-v1. A wrong password fails the GCM
   check, which is exactly the "wrong password" signal. The
   decrypted secret lives in page memory only (see the wallet
   UI further down); nothing here logs or transmits it. */
const VAULT_STORE_KEY = 'caw-vault-v1';
const VAULT_ITERATIONS = 210000;
const b64enc = bytes => {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 4096) bin += String.fromCharCode(...bytes.slice(i, i + 4096));
  return btoa(bin);
};
const b64dec = s => {
  const bin = atob(String(s));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
async function vaultEncrypt(password, secretObj) {
  const salt = new Uint8Array(16); webCryptoObj.getRandomValues(salt);
  const iv = new Uint8Array(12); webCryptoObj.getRandomValues(iv);
  const keyBits = await pbkdf2Bytes(utf8ToBytes(String(password)), salt, VAULT_ITERATIONS, 'SHA-256', 256);
  const key = await subtleCrypto().importKey('raw', keyBits, { name: 'AES-GCM' }, false, ['encrypt']);
  const ct = new Uint8Array(await subtleCrypto().encrypt({ name: 'AES-GCM', iv }, key, utf8ToBytes(JSON.stringify(secretObj))));
  return { v: 1, iters: VAULT_ITERATIONS, salt: b64enc(salt), iv: b64enc(iv), ct: b64enc(ct) };
}
async function vaultDecrypt(password, stored) {
  const salt = b64dec(stored.salt), iv = b64dec(stored.iv), ct = b64dec(stored.ct);
  const keyBits = await pbkdf2Bytes(utf8ToBytes(String(password)), salt, VAULT_ITERATIONS, 'SHA-256', 256);
  const key = await subtleCrypto().importKey('raw', keyBits, { name: 'AES-GCM' }, false, ['decrypt']);
  const pt = await subtleCrypto().decrypt({ name: 'AES-GCM', iv }, key, ct); // throws on a wrong password
  return JSON.parse(new TextDecoder().decode(pt));
}
function vaultLoad() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const j = JSON.parse(localStorage.getItem(VAULT_STORE_KEY) || 'null');
    return (j && j.v === 1 && j.salt && j.iv && j.ct) ? j : null;
  } catch (e) { return null; }
}
function vaultSave(stored) {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(VAULT_STORE_KEY, JSON.stringify(stored)); } catch (e) {}
}
function vaultWipe() {
  try { if (typeof localStorage !== 'undefined') localStorage.removeItem(VAULT_STORE_KEY); } catch (e) {}
}

/* ---------- v12: RLP + legacy (EIP-155) transactions ----------
   The built-in wallet broadcasts the old-style signed
   transaction — the only kind QL1 needs. Fields are RLP-encoded,
   the sighash is keccak of the EIP-155 preimage (chain id 766
   with two empty signature slots), and the signature comes from
   signDigestRaw above, so v becomes chainId*2 + 35 + recid. */
function rlpEncode(item) {
  if (Array.isArray(item)) {
    const payload = concatBytes(item.map(rlpEncode));
    return concatBytes([rlpLenPrefix(payload.length, 0xc0), payload]);
  }
  const bytes = item;
  if (bytes.length === 1 && bytes[0] < 0x80) return bytes;
  return concatBytes([rlpLenPrefix(bytes.length, 0x80), bytes]);
}
function rlpLenPrefix(len, offset) {
  if (len < 56) return new Uint8Array([offset + len]);
  const lenBytes = [];
  let n = len;
  while (n > 0) { lenBytes.unshift(n & 0xff); n >>= 8; }
  return new Uint8Array([offset + 55 + lenBytes.length, ...lenBytes]);
}
const bigToMinBytes = v => {
  v = BigInt(v);
  if (v === 0n) return new Uint8Array(0);
  const h = v.toString(16);
  return hexToBytesU(h.length % 2 ? '0' + h : h);
};
async function signLegacyTx(privBytes, tx) {
  const chainId = BigInt(tx.chainId);
  const fields = [
    bigToMinBytes(tx.nonce), bigToMinBytes(tx.gasPrice), bigToMinBytes(tx.gasLimit),
    hexToBytesU(tx.to), bigToMinBytes(tx.value || 0n), hexToBytesU(tx.data || '0x'),
  ];
  const preimage = rlpEncode([...fields, bigToMinBytes(chainId), new Uint8Array(0), new Uint8Array(0)]);
  const sighash = '0x' + keccakHex(preimage);
  const sig = await signDigestRaw(privBytes, sighash);
  const v = chainId * 2n + 35n + BigInt(sig.v - 27);
  const signed = rlpEncode([...fields, bigToMinBytes(v), hexToBytesU(sig.r), hexToBytesU(sig.s)]);
  return '0x' + bytesToHexU(signed);
}
/* The local wallet's ONLY broadcast path: builds, signs and
   sends one raw transaction from the in-page key, then waits
   for the record like the mint path does. Gas comes from the
   network estimate with a margin, falling back to the caller's
   sane cap when the estimate is unavailable. Throws with
   .unconfirmed + .txHash when the record is slow to settle. */
async function sendLocalTx(privBytes, opts) {
  const from = addressOfPriv(privBytes);
  const nonce = BigInt(await rpc('eth_getTransactionCount', [from, 'pending']));
  const gasPrice = BigInt(await rpc('eth_gasPrice', []));
  let gasLimit = BigInt(opts.gasFallback || 200000);
  try {
    const est = BigInt(await rpc('eth_estimateGas', [{ from, to: opts.to, data: opts.data, value: '0x' + BigInt(opts.value || 0n).toString(16) }]));
    if (est > 0n) gasLimit = (est * 12n) / 10n + 1000n;
  } catch (e) { /* keep the fallback */ }
  const raw = await signLegacyTx(privBytes, {
    nonce, gasPrice, gasLimit, to: opts.to, data: opts.data,
    value: BigInt(opts.value || 0n), chainId: 766,
  });
  const hash = await rpc('eth_sendRawTransaction', [raw]);
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2500));
    const rc = await rpc('eth_getTransactionReceipt', [hash]).catch(() => null);
    if (rc) {
      if (rc.status !== '0x1') { const e = new Error('the record says this one failed'); e.txHash = hash; throw e; }
      return { hash, receipt: rc };
    }
  }
  const e = new Error('no confirmation yet');
  e.txHash = hash; e.unconfirmed = true;
  throw e;
}

/* Sign + submit one CAW action from the built-in wallet — the
   app's submitAction rule, fail-closed: a FRESH ownerOf read for
   the acting name must equal this wallet's address before
   anything is signed, so an action can never be signed under a
   name this wallet does not own. The signature is produced in
   page (signDigestRaw over the ported actionDigest); the batch
   goes out through the local wallet's one broadcast path. */
async function submitLocalAction(privBytes, action) {
  let owner = null;
  try { owner = await readAddr(CAW_NAME, SEL.ownerOf + word(action.senderId)); }
  catch (e) { owner = null; /* unreadable = unproven = refuse below */ }
  const from = addressOfPriv(privBytes);
  if (!owner || owner.toLowerCase() !== from.toLowerCase()) {
    throw new Error('not-owner');
  }
  const sig = await signDigestRaw(privBytes, actionDigest(action));
  const data = encodeBatch([action], [sig]);
  return sendLocalTx(privBytes, { to: CAW_ACTIONS, data, gasFallback: 200000 });
}

/* ---------- v12: action + money calldata for the local wallet ---------- */
const buildDepositCalldata = (tokenId, amount) => SEL.deposit + word(tokenId) + word(amount);
const buildWithdrawCalldata = (tokenId, amount) => SEL.withdraw + word(tokenId) + word(amount);
const buildApproveToCalldata = (spender, amount) => SEL.approve + encAddr(spender) + word(amount);
/* Plain decimal amount -> wei (the app's parse rule). */
function parseAmount(str) {
  const m = /^(\d+)(?:\.(\d{1,18}))?$/.exec(String(str || '').trim());
  if (!m) return null;
  return BigInt(m[1]) * 10n ** 18n + BigInt((m[2] || '').padEnd(18, '0'));
}
/* hex cawId -> the 43-char base64url used in reply/quote
   markers (byte-for-byte the app's codec). */
function hexToB64Url(cawIdHex) {
  const bytes = hexToBytesU(cawIdHex);
  if (bytes.length !== 32) return null;
  let s = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = i + 1 < bytes.length ? bytes[i + 1] : 0, b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    s += B64CH[b0 >> 2] + B64CH[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) s += B64CH[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) s += B64CH[b2 & 63];
  }
  return s;
}
function postRefMarker(kind, cawIdHex) {
  const b = hexToB64Url(cawIdHex);
  return b ? '[caw:' + kind + ':' + b + ']' : null;
}
function appendPostRef(text, kind, cawIdHex) {
  const m = postRefMarker(kind, cawIdHex);
  if (!m) return text;
  return String(text || '').replace(/\s+$/, '') + '\n' + m;
}
const textBytes = s => utf8ToBytes(String(s || '')).length;
function randomCawId() {
  const b = new Uint8Array(32);
  webCryptoObj.getRandomValues(b);
  return '0x' + bytesToHexU(b);
}

/* ================= browser UI (skipped under Node) ================= */
if (typeof document !== 'undefined' && typeof window !== 'undefined') {

const $ = id => document.getElementById(id);
const esc = s => { const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; };
const svgIc = (paths, size) => '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
const IC_HEART = svgIc('<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>');
const IC_REPEAT = svgIc('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>');
const IC_REPLY = svgIc('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>');
const svgIcFill = (paths, size) => '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
/* v13: the app's SuperLike star and the X action-row bookmark /
   share icons (feather paths, as in the app's ui.tsx). */
const IC_STAR = svgIc('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>');
const IC_STAR_FILL = svgIcFill('<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>');
const IC_BOOKMARK = svgIc('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>');
const IC_BOOKMARK_FILL = svgIcFill('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>');
const IC_SHARE = svgIc('<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>');
/* Tip coin (the app's TipGlyph): a gold disc with a white "C"
   arc. Drawn as one SVG so it survives the icon sizing here. */
const IC_COIN = '<svg class="ic" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#FFAC33"/><path d="M15.6 8.7A5.2 5.2 0 1 0 15.6 15.3" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></svg>';
/* Compact counter, the app's formatViewCount shape: 285 stays
   "285", 1,234 → "1.2K", 12,345 → "12K", 1.2M etc. Applied to the
   real on-chain counts only; nothing is rounded into existence. */
function fmtCount(n) {
  n = Number(n) || 0;
  if (n < 1000) return String(n);
  if (n < 10000) return (Math.round(n / 100) / 10).toString().replace(/\.0$/, '') + 'K';
  if (n < 1000000) return String(Math.floor(n / 1000)) + 'K';
  return (Math.round(n / 100000) / 10).toString().replace(/\.0$/, '') + 'M';
}
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

/* Share one post's text with the OS share sheet / clipboard —
   the app's share: the post text plus "— @handle · CAW Social",
   never a URL (posts have no canonical public URL to share). */
async function sharePostText(post, btn) {
  const nm = await resolveName(post.senderId).catch(() => null);
  const who = nm ? '@' + nm : T.unknownName + post.senderId;
  const text = parsePostText(post.text).body + '\n— ' + who + ' · CAW Social';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try { await navigator.share({ text }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }
  }
  let okCopy = false;
  try { await navigator.clipboard.writeText(text); okCopy = true; }
  catch (e) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      okCopy = document.execCommand('copy');
      ta.remove();
    } catch (e2) { /* nothing more to try */ }
  }
  if (okCopy && btn) {
    const old = btn.innerHTML;
    btn.innerHTML = '<span class="xcount">' + esc(T.copied) + '</span>';
    setTimeout(() => { btn.innerHTML = old; }, 1600);
  }
}

/* The ONE record link a post row may carry (the app's rule:
   exactly one per top-level row, alone under the action row;
   nested rows render none — the outer row's link is the one).
   Both row builders take the markup from this single source,
   so a row can never grow a second copy. */
const recordLineHtml = hash => '<div class="recordline"><a href="' + EXPLORER + '/tx/' + hash + '" target="_blank" rel="noopener">' + T.viewTx + ' ↗</a></div>';

/* One post card (also used nested inside a Recaw, and on post pages).
   v13 anatomy, copied from the app's timeline row: avatar on the
   left; a bold name line; a "@handle · time" line under it; the
   body; then ONE action row (never wraps): reply count, Recaw
   count, like (heart + count), the gold SuperLike star + count,
   bookmark, share — with the record link alone under the row.
   The row is a VIEW for everyone; the write actions (like /
   Recaw / SuperLike) check the posting wallet when tapped, and
   bookmarking is a local-only toggle. No view counter exists —
   impressions cannot be counted from the chain, so no element
   is rendered for them. */
async function postCard(a, opts) {
  opts = opts || {};
  const div = document.createElement('div');
  div.className = 'post' + (opts.nested ? ' post-nested' : '') + (opts.detail ? ' post-detail' : '');
  div.dataset.cawid = (a.cawId || '').toLowerCase();
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
  /* X-style header (the app's, v16): line 1 is the card's
     display name as-is — no "@" on it; the "@" lives only on
     line 2, with the handle and the time. (v13/v15 put the
     "@handle" on BOTH lines.) */
  const display = name ? name : who;
  const nameHtml = profHref ? '<a class="plink" href="' + profHref + '">' + esc(display) + '</a>' : esc(display);
  html += '<div class="meta"><span class="name">' + nameHtml + '</span></div>';
  html += '<div class="subline">' + (name ? '<span class="handle">' + esc('@' + name) + '</span>' : '') +
    '<span class="time" title="' + esc(fullTimeStr(a.ts)) + '">' + (name ? '· ' : '') + esc(whenStr(a.ts)) + '</span></div>';
  if (parsed.body) html += '<div class="ptext">' + (opts.highlight ? highlightKeyword(linkify(parsed.body), opts.highlight) : linkify(parsed.body)) + '</div>';
  html += '<div class="frameslot"></div>';
  if (opts.detail) {
    html += '<div class="detail-date">' + esc(fullTimeStr(a.ts)) + '</div>';
  }
  const replyCount = refChildren(a.cawId, 'reply').length;
  const recawCount = refChildren(a.cawId, 'share').length;
  const saved = pwSession ? bmHas(pwSession.address, a.cawId) : false;
  html += '<div class="pfoot">' +
    '<button type="button" class="xact x-reply" data-act="reply" aria-label="' + esc(T.actReply) + '"><span class="icring">' + IC_REPLY + '</span>' +
    (replyCount > 0 ? '<span class="xcount">' + fmtCount(replyCount) + '</span>' : '') + '</button>' +
    '<button type="button" class="xact x-recaw" data-act="recaw" aria-label="' + esc(T.actRecaw) + '"><span class="icring">' + IC_REPEAT + '</span>' +
    (recawCount > 0 ? '<span class="xcount">' + fmtCount(recawCount) + '</span>' : '') + '</button>' +
    '<button type="button" class="xact x-like" data-act="like" aria-label="' + esc(T.actLike) + '"><span class="icring">' + IC_HEART + '</span><span class="like-count xcount"></span></button>' +
    '<button type="button" class="xact x-super" data-act="super" aria-label="SuperLike"><span class="icring sl-ic">' + IC_STAR + '</span><span class="sl-count xcount"></span></button>' +
    '<span class="xspacer"></span>' +
    '<button type="button" class="xact x-bm' + (saved ? ' on' : '') + '" data-act="bookmark" aria-label="' + esc(T.bmAdd) + '"><span class="icring">' + (saved ? IC_BOOKMARK_FILL : IC_BOOKMARK) + '</span></button>' +
    '<button type="button" class="xact x-share" data-act="share" aria-label="' + esc(T.shareLabel) + '"><span class="icring">' + IC_SHARE + '</span></button>' +
    '</div>';
  /* Nested rows (the original inside a Recaw) render NO
     record link — the outer row's one link is the row's
     only one (v16; before, a Recaw showed two). */
  if (!opts.nested) html += recordLineHtml(a.hash);
  html += '</div>';
  div.innerHTML = html;
  /* Like count fills in after the card is on screen — it must
     never hold up rendering (v9 speed rule). */
  const likeEl = div.querySelector('.like-count');
  if (likeEl) {
    likesOf(a).then(n => {
      const v = Number(n);
      likeEl.dataset.raw = String(v);
      likeEl.textContent = v > 0 ? fmtCount(v) : '';
    }).catch(() => {});
  }
  /* Whole-card click opens the post page, except on links/buttons. */
  if (!opts.nested && !opts.detail) {
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
  wireRowActions(div, a);
  if (typeof paintSuperRow === 'function') paintSuperRow(div, a);
  return div;
}

/* A Recaw (type 2), the app's shape: a small attribution line
   naming the Recawer, then the ORIGINAL post as a nested row,
   and exactly one record link. When the marked-burn scan proves
   this Recaw was a SuperRecaw, the attribution turns gold with
   a star and the WHOLE row takes the app's flat gold wash
   (paintRecawRow, v14) — no frame, no gradient, no card. */
async function recawCard(a) {
  const div = document.createElement('div');
  div.className = 'post recaw-row';
  div.dataset.cawid = (a.cawId || '').toLowerCase();
  const [name, img] = await Promise.all([resolveName(a.senderId), avatarFor(a.senderId)]);
  const who = name ? '@' + name : T.unknownName + a.senderId;
  let html = '<div class="recaw-attr"><span class="ra-ic">' + IC_REPEAT + '</span><span class="ra-txt">' +
    esc(T.recawedBy.replace('{name}', who)) + '</span>' +
    '<span class="time" title="' + esc(fullTimeStr(a.ts)) + '">· ' + esc(whenStr(a.ts)) + '</span></div>' +
    '<div class="frameslot"></div>' +
    recordLineHtml(a.hash);
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
  if (typeof paintRecawRow === 'function') paintRecawRow(div, a);
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
    $('likedByBlock').style.display = 'none';
    $('sharedByBlock').style.display = 'none';
    return;
  }
  main.innerHTML = '';
  main.appendChild(await postCard(post, { detail: true }));
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
    /* Liked by / Recawed by (v13, the app's detail sections):
       the sender name ids the context scan already collected,
       rendered as name rows; ids whose name cannot be resolved
       show as #id, never invented. Empty sections hide. */
    const fillPeople = async (innerId, blockId, senderIds) => {
      const inner = $(innerId), block = $(blockId);
      if (!inner || !block) return;
      if (!senderIds.length) { block.style.display = 'none'; return; }
      block.style.display = '';
      inner.innerHTML = '';
      const rows = await Promise.all(senderIds.map(async sid => {
        const id = BigInt(sid);
        const [nm, im] = await Promise.all([resolveName(id).catch(() => null), avatarFor(id).catch(() => null)]);
        const d = document.createElement('div');
        d.className = 'namecard';
        const label = nm ? '@' + nm : T.unknownName + sid;
        d.innerHTML = (nm ? '<a class="plink" href="' + profUrl(nm) + '">' + avatarHtml(im, nm) + '</a>' : avatarHtml(im, nm)) +
          '<div class="grow"><div class="n">' + (nm ? '<a class="plink" href="' + profUrl(nm) + '">' + esc(label) + '</a>' : esc(label)) + '</div>' +
          '<div class="small">#' + sid + '</div></div>';
        return d;
      }));
      for (const r of rows) inner.appendChild(r);
    };
    fillPeople('postLikedBy', 'likedByBlock', ctx.likeSenders);
    fillPeople('postSharedBy', 'sharedByBlock', ctx.shareSenders);
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
  if (mintTs) {
    const d = new Date(mintTs);
    chips.push(T.nameCreated + ': ' + d.toLocaleDateString(LANG === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'numeric', day: 'numeric' }));
  }
  if (owner) chips.push(T.ownerLbl + ': ' + shortAddr(owner));
  /* v13: the app's profile composition — banner, the avatar
     overlapping it, the follow pill on the same row (rendered by
     renderProfFollow into #profFollowArea), the big name, the
     handle line, then the counts band: Following / Followers
     cells (tappable — they open the reconstructed lists inline,
     v9 behaviour kept; the Followers number is the chain's own
     followerCount) and the name's own qCAW balance as a plain
     display cell. */
  head.innerHTML = '<div class="pband"></div>' +
    '<div class="prow"><div class="pava">' + avatarHtml(img, username) + '</div>' +
    '<div class="pactions" id="profFollowArea"></div></div>' +
    '<div class="pname">@' + esc(username) + '</div>' +
    '<div class="phandle">@' + esc(username) + ' · #' + id.toString() + '</div>' +
    '<div class="counts-row">' +
    '<button type="button" class="count-cell" id="followingBtn"><span class="cc-num" id="followingCount">—</span><span class="cc-lbl">' + esc(T.followingLbl) + '</span></button>' +
    '<button type="button" class="count-cell" id="followersBtn"><span class="cc-num">' + (followers !== null ? esc(followers.toString()) : '—') + '</span><span class="cc-lbl">' + esc(T.followersLbl) + '</span></button>' +
    (balance !== null ? '<div class="count-cell"><span class="cc-num">' + esc(fmtQcaw(balance)) + '</span><span class="cc-lbl">qCAW</span></div>' : '') +
    '</div>' +
    '<div class="chips">' + chips.map(c => '<span class="chip">' + esc(c) + '</span>').join('') + '</div>' +
    '<div id="followLists"></div>';
  profileState = { id, username };
  profileOwner = owner;
  const fcNow = $('followingCount');
  if (fcNow && followBuildState().complete) {
    try { fcNow.textContent = String(followListsOf(id).following.length); } catch (e) {}
  }
  const fb = $('followingBtn'), rb2 = $('followersBtn');
  if (fb) fb.onclick = () => openFollowList('following');
  if (rb2) rb2.onclick = () => openFollowList('followers');
  renderProfFollow();
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
  const fcEl = $('followingCount');
  if (fcEl && kind === 'following') fcEl.textContent = String(ids.length);
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

/* ---------- wallet + getting a name (v11) ----------
   The ONLY write path on this site. Every send goes through the
   sendTx helper below — the single place in this file that asks
   the visitor's wallet to send a transaction — and the only two
   payloads it can ever carry are the approve and mint calldata
   built above. This page never asks the wallet for any kind of
   signature and never sees a key or a phrase: the wallet app
   holds those and shows its own confirmation for each step.
   Amounts are never trusted from an earlier render: the price is
   re-read at click time before either send, and sending stops
   with the new price shown if it moved. */
let injectedProvider = (typeof window !== 'undefined' && window.ethereum) || null;
const boundProviders = new WeakSet();
let walletAccount = null, walletChainId = null;
const onQl1 = () => walletChainId === CHAIN_ID_HEX;
function bindProvider(p) {
  if (!p || boundProviders.has(p)) return;
  boundProviders.add(p);
  if (typeof p.on === 'function') {
    p.on('accountsChanged', () => refreshWallet());
    p.on('chainChanged', () => refreshWallet());
  }
}
function noteProvider(p) {
  if (!p) return;
  if (!injectedProvider) { injectedProvider = p; bindProvider(p); refreshWallet(); }
  else bindProvider(injectedProvider);
}
if (injectedProvider) bindProvider(injectedProvider);
window.addEventListener('eip6963:announceProvider', e => {
  try { noteProvider(e.detail && e.detail.provider); } catch (err) {}
});
try { window.dispatchEvent(new Event('eip6963:requestProvider')); } catch (err) {}
{ /* Wallets can inject after the page loads: keep looking for
     about 12 seconds, like the earlier site learned to. */
  let tries = 0;
  const iv = setInterval(() => {
    if (window.ethereum) noteProvider(window.ethereum);
    if (injectedProvider || ++tries >= 24) clearInterval(iv);
  }, 500);
}
async function walletRequest(method, params) {
  if (!injectedProvider) throw new Error('no wallet app');
  return injectedProvider.request({ method, params });
}
/* The wallet's own words, in small print under the plain words. */
const errDetailHtml = e => {
  const m = (e && e.message) ? String(e.message) : (e ? String(e) : '');
  return m ? '<div class="errdetail">' + esc(m) + '</div>' : '';
};
function showWalletStatus(plain, e) {
  const el = $('walletStatus');
  if (el) el.innerHTML = '<span class="err">' + esc(plain) + '</span>' + errDetailHtml(e);
}

async function refreshWallet() {
  const area = $('walletArea');
  if (!area) return;
  if (!injectedProvider) {
    walletAccount = null; walletChainId = null;
    area.innerHTML = '<p class="small">' + esc(T.noWallet) + '</p>' +
      '<p><button id="walletRecheck" class="ghost" type="button">' + esc(T.recheckBtn) + '</button></p>';
    const rb = $('walletRecheck');
    if (rb) rb.onclick = () => { if (window.ethereum) noteProvider(window.ethereum); refreshWallet(); };
    renderMintArea(); renderMyNames();
    return;
  }
  try {
    const accts = await walletRequest('eth_accounts');
    walletAccount = accts && accts[0] ? accts[0] : null;
    walletChainId = await walletRequest('eth_chainId');
  } catch (e) { walletAccount = null; }
  if (!walletAccount) {
    area.innerHTML = '<button id="connectBtn" class="big-connect" type="button">' + esc(T.connectBtn) + '</button>' +
      '<p id="walletStatus"></p>';
    $('connectBtn').onclick = connectWallet;
  } else if (!onQl1()) {
    area.innerHTML = '<div class="addrline"><span class="dot dot-warn"></span><span>' + esc(shortAddr(walletAccount)) + '</span></div>' +
      '<p class="warn">' + esc(T.wrongChain) + '</p>' +
      '<p><button id="switchBtn" type="button">' + esc(T.switchBtn) + '</button></p>' +
      '<p id="walletStatus"></p>';
    $('switchBtn').onclick = switchChain;
  } else {
    area.innerHTML = '<div class="addrline"><span class="dot dot-ok"></span><span>' + esc(shortAddr(walletAccount)) + '</span>' +
      '<span class="chainbadge">QL1</span></div>' +
      '<p id="walletStatus"></p>';
  }
  renderMintArea();
  renderMyNames();
}
async function connectWallet() {
  let err = null;
  try { await walletRequest('eth_requestAccounts'); } catch (e) { err = e; }
  await refreshWallet();
  if (err) showWalletStatus(T.connectFail, err);
}
async function switchChain() {
  let err = null;
  try {
    await walletRequest('wallet_switchEthereumChain', [{ chainId: CHAIN_ID_HEX }]);
  } catch (e) {
    if (e && (e.code === 4902 || /unrecognized chain/i.test(e.message || ''))) {
      try {
        await walletRequest('wallet_addEthereumChain', [{
          chainId: CHAIN_ID_HEX, chainName: 'QL1',
          nativeCurrency: { name: 'QOM', symbol: 'QOM', decimals: 18 },
          rpcUrls: [RPC], blockExplorerUrls: [EXPLORER],
        }]);
      } catch (e2) { err = e2; }
    } else err = e;
  }
  await refreshWallet();
  if (err) showWalletStatus(T.switchFail, err);
}
/* Send ONE ordinary contract call through the visitor's wallet
   and wait until the public record confirms it. A mined failure
   throws; a record that stays unconfirmed for minutes throws
   with `unconfirmed` set and the hash attached, so the caller can
   say honestly that it was sent but is slow to settle. */
async function sendTx(to, data, onHash) {
  const hash = await walletRequest('eth_sendTransaction', [{ from: walletAccount, to, data }]);
  if (onHash) onHash(hash);
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2500));
    const rc = await rpc('eth_getTransactionReceipt', [hash]).catch(() => null);
    if (rc) {
      if (rc.status !== '0x1') { const e = new Error('the record says this one failed'); e.txHash = hash; throw e; }
      return hash;
    }
  }
  const e = new Error('no confirmation yet');
  e.txHash = hash; e.unconfirmed = true;
  throw e;
}
const txLinkHtml = hash => hash
  ? ' <a href="' + EXPLORER + '/tx/' + hash + '" target="_blank" rel="noopener">' + esc(T.viewTx) + ' ↗</a>' : '';

/* ----- the name check (mint section) ----- */
let mintCheckState = null; // {name, valid, taken, cost}
function mintPreviewHtml(name) {
  return '<div class="mint-preview"><img class="nft-preview" alt="" src="data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(nameNftSvg(name)) + '">' +
    '<div class="small">' + esc(T.getPreviewLbl) + '</div></div>';
}
function paintMintCheck() {
  const out = $('mintCheckResult');
  if (!out) return;
  const r = mintCheckState;
  if (!r) { out.innerHTML = ''; return; }
  if (!r.valid) out.innerHTML = '<p class="err">' + esc(T.getInvalid) + '</p>';
  else if (r.taken) out.innerHTML = '<p class="warn">' + esc(T.getTaken) + '</p>' + mintPreviewHtml(r.name) +
    '<p><a class="chip name-chip" href="' + profUrl(r.name) + '">' + esc(T.getSeeProfile) + '</a></p>';
  else out.innerHTML = '<p class="ok">' + esc(T.getAvailable) + '</p>' +
    '<p>' + esc(T.getPrice) + ': <b>' + esc(fmtQcaw(r.cost)) + '</b> qCAW</p>' + mintPreviewHtml(r.name);
}
async function doMintCheck() {
  const input = $('mintNameInput'), out = $('mintCheckResult');
  if (!input || !out) return;
  if (!input.value.trim()) { mintCheckState = null; paintMintCheck(); renderMintArea(); return; }
  out.innerHTML = '<p class="small">' + esc(T.checking) + '</p>';
  try {
    mintCheckState = await checkName(input.value);
    input.value = mintCheckState.name;
    paintMintCheck();
  } catch (e) {
    mintCheckState = null;
    out.innerHTML = '<p class="err">' + esc(T.getCheckFail) + '</p>' + errDetailHtml(e);
  }
  renderMintArea();
}

/* ----- the two steps (approve, then mint) ----- */
let mintBusy = false, mintRenderSeq = 0;
function setMintStatus(html) { const el = $('mintStatus'); if (el) el.innerHTML = html; }
async function renderMintArea() {
  const area = $('mintArea');
  if (!area) return;
  const seq = ++mintRenderSeq;
  const st = mintCheckState;
  if (!st || !st.valid || st.taken) { area.innerHTML = ''; return; }
  if (!injectedProvider || !walletAccount || !onQl1()) {
    area.innerHTML = '<p class="small">' + esc(T.needWalletForName) + '</p>';
    return;
  }
  let bal, allow, qom;
  try {
    [bal, allow, qom] = await Promise.all([
      readUint(QCAW, SEL.balanceOf + encAddr(walletAccount)),
      readUint(QCAW, SEL.allowance + encAddr(walletAccount) + encAddr(MINTER)),
      rpc('eth_getBalance', [walletAccount, 'latest']).then(h => BigInt(h)),
    ]);
  } catch (e) {
    if (seq !== mintRenderSeq) return;
    area.innerHTML = '<p class="err">' + esc(T.getCheckFail) + '</p>' + errDetailHtml(e);
    return;
  }
  if (seq !== mintRenderSeq) return;
  let html = '<p class="small">' + esc(T.yourQcaw) + ': <b>' + esc(fmtQcaw(bal)) + '</b> qCAW · ' +
    esc(T.yourQom) + ': <b>' + esc(fmtQcaw(qom)) + '</b> QOM</p>';
  if (qom === 0n) html += '<p class="warn">' + esc(T.noGasQom) + '</p>';
  else if (bal < st.cost) html += '<p class="err">' + esc(T.notEnoughQcaw) + '</p>';
  else if (allow < st.cost) {
    html += '<p>' + esc(T.step1) + '</p>' +
      '<p><button id="approveBtn" type="button">' + esc(T.approveBtn) + ' (' + esc(fmtQcaw(st.cost)) + ' qCAW)</button></p>';
  } else {
    html += '<p>' + esc(T.step2) + '</p>' +
      '<p><button id="mintBtn" type="button">' + esc(T.mintBtn) + '</button></p>';
  }
  html += '<p id="mintStatus"></p>';
  area.innerHTML = html;
  const ab = $('approveBtn'); if (ab) ab.onclick = doApprove;
  const mb = $('mintBtn'); if (mb) mb.onclick = doMint;
}
/* Re-check a name at click time. Returns the fresh check when the
   send may proceed, or null after updating the page to show what
   changed (taken meanwhile, or a moved price). */
async function mintGuard(st) {
  const fresh = await checkName(st.name);
  if (!fresh.valid || fresh.taken) {
    mintCheckState = fresh; paintMintCheck(); await renderMintArea();
    setMintStatus('<span class="warn">' + esc(T.mintChanged) + '</span>');
    return null;
  }
  if (fresh.cost !== st.cost) {
    mintCheckState = fresh; paintMintCheck(); await renderMintArea();
    setMintStatus('<span class="warn">' + esc(T.priceChanged.replace('{p}', fmtQcaw(fresh.cost))) + '</span>');
    return null;
  }
  return fresh;
}
async function doApprove() {
  if (mintBusy || !mintCheckState) return;
  mintBusy = true;
  const btn = $('approveBtn'); if (btn) btn.disabled = true;
  setMintStatus('<span class="small">' + esc(T.sendingWallet) + '</span>');
  try {
    const fresh = await mintGuard(mintCheckState);
    if (!fresh) return;
    setMintStatus('<span class="small">' + esc(T.sendingWallet) + '</span>');
    await sendTx(QCAW, buildApproveCalldata(fresh.cost),
      h => setMintStatus('<span class="small">' + esc(T.recording) + '</span>' + txLinkHtml(h)));
    /* The record confirmed: re-read everything (the allowance
       included) and let the area advance to step 2 on its own. */
    await renderMintArea();
  } catch (e) {
    if (e && e.unconfirmed) {
      setMintStatus('<span class="warn">' + esc(T.sentUnconfirmed) + '</span>' + txLinkHtml(e.txHash));
      renderMintArea();
    } else {
      setMintStatus('<span class="err">' + esc(T.sendFail) + '</span>' + txLinkHtml(e && e.txHash) + errDetailHtml(e));
      const b = $('approveBtn'); if (b) b.disabled = false;
    }
  } finally { mintBusy = false; }
}
/* Did the name land under this account? The card-verified
   resolver first, then the desk's own id record as a fallback. */
async function verifyMinted(name) {
  try {
    const res = await resolveNameId(name);
    if (res.status === 'ok') {
      const owner = await readAddr(CAW_NAME, SEL.ownerOf + word(res.id));
      if (owner.toLowerCase() === String(walletAccount).toLowerCase()) return true;
    }
  } catch (e) { /* fall through to the direct read */ }
  try {
    const id0 = await readUint(MINTER, SEL.idByUsername + encStr(name));
    if (id0 === 0n) return false;
    const owner = await readAddr(CAW_NAME, SEL.ownerOf + word(id0));
    return owner.toLowerCase() === String(walletAccount).toLowerCase();
  } catch (e) { return false; }
}
async function doMint() {
  if (mintBusy || !mintCheckState) return;
  mintBusy = true;
  const btn = $('mintBtn'); if (btn) btn.disabled = true;
  setMintStatus('<span class="small">' + esc(T.sendingWallet) + '</span>');
  try {
    const fresh = await mintGuard(mintCheckState);
    if (!fresh) return;
    /* Fresh money reads, one last time: enough qCAW, the OK from
       step 1 still covering the price, and some QOM for fees. */
    const [bal, allow, qom] = await Promise.all([
      readUint(QCAW, SEL.balanceOf + encAddr(walletAccount)),
      readUint(QCAW, SEL.allowance + encAddr(walletAccount) + encAddr(MINTER)),
      rpc('eth_getBalance', [walletAccount, 'latest']).then(h => BigInt(h)),
    ]);
    if (qom === 0n || bal < fresh.cost || allow < fresh.cost) { await renderMintArea(); return; }
    setMintStatus('<span class="small">' + esc(T.sendingWallet) + '</span>');
    const hash = await sendTx(MINTER, buildMintCalldata(fresh.name),
      h => setMintStatus('<span class="small">' + esc(T.recording) + '</span>' + txLinkHtml(h)));
    ownerTokensCache.delete(walletAccount);
    const landed = await verifyMinted(fresh.name);
    mintCheckState = { ...fresh, taken: true };
    if (landed) {
      const out = $('mintCheckResult');
      if (out) out.innerHTML = '<p class="ok">' + esc(T.mintDone) + '</p>' + mintPreviewHtml(fresh.name) +
        '<p><a class="chip name-chip" href="' + profUrl(fresh.name) + '">' + esc(T.viewProfileBtn) + '</a></p>' +
        '<p class="small">' + txLinkHtml(hash) + '</p>';
      $('mintArea').innerHTML = '';
    } else {
      paintMintCheck();
      await renderMintArea();
      const out = $('mintCheckResult');
      if (out) out.innerHTML = '<p class="warn">' + esc(T.sentUnconfirmed) + '</p>' +
        '<p class="small">' + txLinkHtml(hash) + '</p>';
    }
    refreshWallet();
  } catch (e) {
    if (e && e.unconfirmed) {
      setMintStatus('<span class="warn">' + esc(T.sentUnconfirmed) + '</span>' + txLinkHtml(e.txHash));
    } else {
      setMintStatus('<span class="err">' + esc(T.sendFail) + '</span>' + txLinkHtml(e && e.txHash) + errDetailHtml(e));
      const b = $('mintBtn'); if (b) b.disabled = false;
    }
  } finally { mintBusy = false; }
}

/* ----- my names (compact) ----- */
async function renderMyNames() {
  const box = $('myNames'), title = $('myNamesTitle');
  if (!box) return;
  if (!injectedProvider || !walletAccount || !onQl1()) {
    if (title) title.style.display = 'none';
    box.innerHTML = '<p class="small">' + esc(T.myNamesConnect) + '</p>';
    return;
  }
  if (title) title.style.display = '';
  box.innerHTML = '<p class="small">' + esc(T.loading) + '</p>';
  try {
    const toks = await tokensOf(walletAccount);
    if (!toks.length) { box.innerHTML = '<p class="small">' + esc(T.noNames) + '</p>'; return; }
    const rows = await Promise.all(toks.map(async t => {
      const img = await avatarFor(t.id);
      const div = document.createElement('div');
      div.className = 'namecard';
      div.innerHTML = '<a class="plink" href="' + profUrl(t.username) + '">' + avatarHtml(img, t.username) + '</a>' +
        '<div class="grow"><div class="n"><a class="plink" href="' + profUrl(t.username) + '">@' + esc(t.username) + '</a></div>' +
        '<div class="small">#' + t.id.toString() + '</div>' +
        '<div class="small">' + esc(T.inName) + ': <b>' + esc(fmtQcaw(t.balance)) + '</b> qCAW</div></div>';
      return div;
    }));
    box.innerHTML = '';
    for (const r of rows) box.appendChild(r);
  } catch (e) {
    box.innerHTML = '<p class="err">' + esc(T.loadFail) + '</p>';
  }
}

/* ---------- v12: the built-in posting wallet (browser side) ----------
   The decrypted secret and the derived private key live in this
   module state ONLY — never in any storage. Locking (manual, or
   after 15 idle minutes) overwrites and drops them. The vault in
   localStorage holds only the AES-GCM ciphertext (see the vault
   section above). Nothing in this section logs or transmits the
   phrase or the key; the only network calls are public chain
   reads and the wallet's own signed broadcasts. */
let pwSession = null;      // {kind, secret, keyBytes, address}
let pwNames = [];          // [{id, balance, username}] for the session address
let pwActingId = null;     // bigint
let pwLastTouch = 0;
let pwView = 'auto';       // auto | create-show | create-password | import | import-password
let pwDraft = null;        // {kind, secret} while a create/import flow is mid-way
let pwLoadSeq = 0;
const PW_ACTING_KEY = addr => 'caw-acting-' + String(addr).toLowerCase();
const pwUnlocked = () => !!pwSession;
const pwTouch = () => { pwLastTouch = Date.now(); };
function pwActing() {
  if (!pwNames.length) return null;
  return pwNames.find(t => t.id === pwActingId) || pwNames[0];
}
function pwWipeSession() {
  if (pwSession && pwSession.keyBytes) pwSession.keyBytes.fill(0);
  pwSession = null; pwNames = []; pwActingId = null;
}
function pwLock() {
  pwWipeSession();
  pwView = 'auto'; pwDraft = null;
  renderPw(); renderComposer(); refreshViewsForWallet();
}
setInterval(() => {
  if (pwSession && Date.now() - pwLastTouch > 15 * 60 * 1000) pwLock();
}, 30000);
/* After the wallet state changes, the visible view re-renders so
   action buttons appear/disappear with the lock state. */
function refreshViewsForWallet() {
  if (typeof postQuery !== 'undefined' && postQuery) loadPostPage(postQuery);
  else if (typeof profileQuery !== 'undefined' && profileQuery) loadProfile();
  else if (typeof bmQuery !== 'undefined' && bmQuery) loadBookmarksView();
  else if (typeof searchQuery !== 'undefined' && searchQuery) { /* search rows keep their buttons state; a fresh search re-adds them */ }
  else loadTimeline(false);
}
async function pwLoadNames() {
  if (!pwSession) return;
  const seq = ++pwLoadSeq;
  const addr = pwSession.address;
  ownerTokensCache.delete(addr);
  let toks = [];
  try { toks = await tokensOf(addr); } catch (e) { toks = []; }
  if (seq !== pwLoadSeq || !pwSession) return;
  pwNames = toks;
  let pref = null;
  try { pref = localStorage.getItem(PW_ACTING_KEY(addr)); } catch (e) {}
  const hit = pref && toks.find(t => t.id.toString() === pref);
  pwActingId = hit ? hit.id : (toks.length ? toks[0].id : null);
}
function pwSetActing(id) {
  pwActingId = id;
  if (pwSession) {
    try { localStorage.setItem(PW_ACTING_KEY(pwSession.address), id.toString()); } catch (e) {}
  }
  renderPw(); renderComposer();
}

/* ----- wallet section rendering ----- */
function renderPw() {
  const area = $('pwArea');
  if (!area) return;
  if (pwSession) { renderPwUnlocked(area); return; }
  if (vaultLoad()) { renderPwLocked(area); return; }
  if (pwView === 'create-show' && pwDraft) { renderPwCreateShow(area); return; }
  if (pwView === 'create-password' && pwDraft) { renderPwPassword(area, 'create'); return; }
  if (pwView === 'import') { renderPwImport(area); return; }
  if (pwView === 'import-password' && pwDraft) { renderPwPassword(area, 'import'); return; }
  pwView = 'auto';
  /* The intro + safety copy lives statically in the page shells
     above this area (it must be readable before any script runs
     and the harness checks it there); states only render their
     own controls. */
  area.innerHTML =
    '<div class="row"><button id="pwCreateBtn" type="button">' + esc(T.pwCreateBtn) + '</button>' +
    '<button id="pwImportBtn" class="ghost" type="button">' + esc(T.pwImportBtn) + '</button></div>' +
    '<p id="pwStatus"></p>';
  $('pwCreateBtn').onclick = async () => {
    const st = $('pwStatus');
    if (st) st.innerHTML = '<span class="small">' + esc(T.loading) + '</span>';
    try {
      const phrase = await generateMnemonic();
      pwDraft = { kind: 'phrase', secret: phrase };
      pwView = 'create-show';
      renderPw();
    } catch (e) {
      if (st) st.innerHTML = '<span class="err">' + esc(T.loadFail) + '</span>' + errDetailHtml(e);
    }
  };
  $('pwImportBtn').onclick = () => { pwView = 'import'; renderPw(); };
  syncChrome();
}
function renderPwCreateShow(area) {
  const words = pwDraft.secret.split(' ');
  area.innerHTML = '<h3>' + esc(T.pwShowPhraseTitle) + '</h3>' +
    '<p class="warn">' + esc(T.pwPhraseWarn) + '</p>' +
    '<div class="phrase-grid">' + words.map((w, i) =>
      '<span class="phrase-word"><span class="pw-num">' + (i + 1) + '</span>' + esc(w) + '</span>').join('') + '</div>' +
    '<label class="checkrow"><input type="checkbox" id="pwWrote"> ' + esc(T.pwWroteIt) + '</label>' +
    '<div class="row"><button id="pwToPassword" type="button" disabled>' + esc(T.pwContinueBtn) + '</button>' +
    '<button id="pwCreateCancel" class="ghost" type="button">' + esc(T.pwCancelBtn) + '</button></div>';
  $('pwWrote').onchange = e => { $('pwToPassword').disabled = !e.target.checked; };
  $('pwToPassword').onclick = () => { pwView = 'create-password'; renderPw(); };
  $('pwCreateCancel').onclick = () => { pwDraft = null; pwView = 'auto'; renderPw(); };
}
function renderPwImport(area) {
  area.innerHTML = '<p>' + esc(T.pwImportExplain) + '</p>' +
    '<textarea id="pwImportText" rows="3" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="' + esc(T.pwImportPh) + '"></textarea>' +
    '<p id="pwImportErr"></p>' +
    '<div class="row"><button id="pwImportNext" type="button">' + esc(T.pwContinueBtn) + '</button>' +
    '<button id="pwImportCancel" class="ghost" type="button">' + esc(T.pwCancelBtn) + '</button></div>';
  $('pwImportNext').onclick = async () => {
    const raw = $('pwImportText').value.trim();
    const err = $('pwImportErr');
    const fail = () => { err.innerHTML = '<span class="err">' + esc(T.pwImportInvalid) + '</span>'; };
    if (/^0x[0-9a-fA-F]{64}$/.test(raw)) {
      if (!privateKeyToAddress(raw)) return fail();
      pwDraft = { kind: 'key', secret: raw.toLowerCase() };
    } else {
      const phrase = normalizePhrase(raw);
      if (!(await validateMnemonic(phrase))) return fail();
      pwDraft = { kind: 'phrase', secret: phrase };
    }
    $('pwImportText').value = '';
    pwView = 'import-password';
    renderPw();
  };
  $('pwImportCancel').onclick = () => { pwDraft = null; pwView = 'auto'; renderPw(); };
}
function renderPwPassword(area, mode) {
  area.innerHTML = '<h3>' + esc(T.pwSetPasswordTitle) + '</h3>' +
    (mode === 'create' ? '<p>' + esc(T.pwCreateExplain) + '</p>' : '') +
    '<input type="password" id="pwPass1" autocomplete="new-password" placeholder="' + esc(T.pwPasswordPh) + '">' +
    '<input type="password" id="pwPass2" autocomplete="new-password" placeholder="' + esc(T.pwPassword2Ph) + '">' +
    '<p id="pwPassErr"></p>' +
    '<div class="row"><button id="pwSaveBtn" type="button">' + esc(T.pwSaveBtn) + '</button>' +
    '<button id="pwPassCancel" class="ghost" type="button">' + esc(T.pwCancelBtn) + '</button></div>';
  $('pwSaveBtn').onclick = async () => {
    const p1 = $('pwPass1').value, p2 = $('pwPass2').value;
    const err = $('pwPassErr');
    if (p1.length < 8) { err.innerHTML = '<span class="err">' + esc(T.pwPasswordShort) + '</span>'; return; }
    if (p1 !== p2) { err.innerHTML = '<span class="err">' + esc(T.pwPasswordMismatch) + '</span>'; return; }
    const btn = $('pwSaveBtn'); btn.disabled = true;
    try {
      const stored = await vaultEncrypt(p1, { kind: pwDraft.kind, secret: pwDraft.secret });
      vaultSave(stored);
      await pwStartSession(pwDraft);
      pwDraft = null; pwView = 'auto';
      renderPw(); renderComposer(); refreshViewsForWallet();
    } catch (e) {
      err.innerHTML = '<span class="err">' + esc(T.loadFail) + '</span>' + errDetailHtml(e);
      btn.disabled = false;
    }
  };
  $('pwPassCancel').onclick = () => { pwDraft = null; pwView = 'auto'; renderPw(); };
}
function renderPwLocked(area) {
  area.innerHTML = '<h3>' + esc(T.pwLockedTitle) + '</h3>' +
    '<p>' + esc(T.pwLockedText) + '</p>' +
    '<input type="password" id="pwUnlockPass" autocomplete="current-password" placeholder="' + esc(T.pwPasswordPh) + '">' +
    '<p id="pwUnlockErr"></p>' +
    '<div class="row"><button id="pwUnlockBtn" type="button">' + esc(T.pwUnlockBtn) + '</button>' +
    '<button id="pwRemoveBtn1" class="ghost" type="button">' + esc(T.pwRemoveBtn) + '</button></div>' +
    '<div id="pwRemoveArea"></div>';
  const tryUnlock = async () => {
    const pw = $('pwUnlockPass').value;
    const err = $('pwUnlockErr');
    const btn = $('pwUnlockBtn'); btn.disabled = true;
    try {
      const secret = await vaultDecrypt(pw, vaultLoad());
      $('pwUnlockPass').value = '';
      await pwStartSession(secret);
      renderPw(); renderComposer(); refreshViewsForWallet();
    } catch (e) {
      err.innerHTML = '<span class="err">' + esc(T.pwUnlockWrong) + '</span>';
      btn.disabled = false;
    }
  };
  $('pwUnlockBtn').onclick = tryUnlock;
  $('pwUnlockPass').addEventListener('keydown', e => { if (e.key === 'Enter') tryUnlock(); });
  $('pwRemoveBtn1').onclick = () => renderPwRemove($('pwRemoveArea'));
  syncChrome();
}
async function pwStartSession(secretObj) {
  let keyBytes, address;
  if (secretObj.kind === 'key') {
    keyBytes = hexToBytesU(secretObj.secret);
    address = addressOfPriv(keyBytes);
  } else {
    const d = await deriveFromPhrase(secretObj.secret);
    keyBytes = d.keyBytes;
    address = d.address;
  }
  pwSession = { kind: secretObj.kind, secret: secretObj.secret, keyBytes, address };
  pwTouch();
  await pwLoadNames();
}
function renderPwRemove(box) {
  if (!box) return;
  box.innerHTML = '<div class="pw-remove">' +
    '<p class="warn">' + esc(T.pwRemoveWarn) + '</p>' +
    '<p class="small">' + esc(T.pwRemoveTypeLbl) + ' <b>' + esc(T.pwRemoveWord) + '</b></p>' +
    '<input type="text" id="pwRemoveType" autocomplete="off" autocapitalize="none" spellcheck="false">' +
    '<div class="row"><button id="pwRemoveConfirm" class="secondary" type="button" disabled>' + esc(T.pwRemoveConfirmBtn) + '</button>' +
    '<button id="pwRemoveCancel" class="ghost" type="button">' + esc(T.pwCancelBtn) + '</button></div></div>';
  $('pwRemoveType').addEventListener('input', e => {
    $('pwRemoveConfirm').disabled = e.target.value.trim() !== T.pwRemoveWord;
  });
  $('pwRemoveCancel').onclick = () => { box.innerHTML = ''; };
  $('pwRemoveConfirm').onclick = () => {
    vaultWipe();
    pwWipeSession();
    pwDraft = null; pwView = 'auto';
    renderPw(); renderComposer(); refreshViewsForWallet();
  };
}
function renderPwUnlocked(area) {
  const s = pwSession;
  const acting = pwActing();
  /* v13: the app's wallet screen shape (v0.6.2, MetaMask-style):
     a profile summary row, one action button to the deposit /
     withdraw card, the balances as an asset list, the acting
     names as tappable rows, then the deposit card and the menu
     rows. Every control keeps its v12 id and wiring; only the
     acting-name picker changed shape (rows instead of a select,
     the app's own way) — pwSetActing still does the switching. */
  let html = '<div class="pw-summary">' +
    (acting
      ? '<span class="pw-ava-slot" id="pwSummaryAva"></span><span class="pw-sum-name">@' + esc(acting.username) + '</span>'
      : '<span class="pw-sum-name">' + esc(T.pwAddressLbl) + '</span>') +
    '<button id="pwCopyAddr" class="addr-chip" type="button" title="' + esc(s.address) + '">' + esc(shortAddr(s.address)) + ' ⧉</button>' +
    '<span class="chainbadge">QL1</span></div>' +
    '<div class="pw-actions"><button id="pwDepJump" class="pw-action-btn" type="button">' + esc(T.depostLbl) + '</button></div>' +
    '<div class="asset-list">' +
    '<div class="asset-row"><span class="asset-sym">QOM</span><span class="asset-amt" id="pwQomBal">…</span></div>' +
    '<div class="asset-row"><span class="asset-sym">qCAW</span><span class="asset-amt" id="pwQcawBal">…</span></div>' +
    '<div class="asset-row"><span class="asset-sym">O</span><span class="asset-amt" id="pwOBal">…</span></div>' +
    '</div>' +
    '<p id="pwGasWarn"></p>';
  if (!pwNames.length) {
    html += '<p class="warn">' + esc(T.pwNoNamesYet) + '</p>';
  } else {
    html += '<h3 class="detail-h">' + esc(T.pwActingLbl) + '</h3><div class="acting-list">' +
      pwNames.map(t =>
        '<button type="button" class="acting-row' + (acting && t.id === acting.id ? ' on' : '') + '" data-acting="' + t.id.toString() + '">' +
        '<span class="ar-ava" data-ava="' + t.id.toString() + '"></span>' +
        '<span class="ar-name">@' + esc(t.username) + '</span>' +
        '<span class="ar-bal">' + esc(fmtQcaw(t.balance)) + ' qCAW</span></button>').join('') + '</div>';
    if (acting) {
      html += '<div class="pw-card" id="pwDepCard"><h3 class="detail-h">' + esc(T.pwDepTitle) + '</h3>' +
        '<p class="small">' + esc(T.pwDepNote) + '</p>' +
        '<input type="text" id="pwAmount" inputmode="decimal" autocomplete="off" placeholder="' + esc(T.pwAmountPh) + '">' +
        '<div class="row"><button id="pwDepBtn" type="button">' + esc(T.pwDepositBtn) + '</button>' +
        '<button id="pwWdBtn" class="ghost" type="button">' + esc(T.pwWithdrawBtn) + '</button></div>' +
        '<p id="pwDepStatus"></p></div>';
    }
  }
  html += '<div class="menu-list">' +
    '<button id="pwLockBtn" class="menu-row" type="button">' + esc(T.pwLockBtn) + '</button>' +
    '<button id="pwRemoveBtn2" class="menu-row" type="button">' + esc(T.pwRemoveBtn) + '</button></div>' +
    '<div id="pwRemoveArea"></div><p id="pwStatus"></p>';
  area.innerHTML = html;
  $('pwCopyAddr').onclick = async ev => {
    try { await navigator.clipboard.writeText(s.address); ev.target.textContent = T.copied; setTimeout(() => { const b = $('pwCopyAddr'); if (b) b.textContent = shortAddr(s.address) + ' ⧉'; }, 1600); } catch (e) {}
  };
  area.querySelectorAll('[data-acting]').forEach(row => {
    row.onclick = () => pwSetActing(BigInt(row.dataset.acting));
  });
  area.querySelectorAll('[data-ava]').forEach(async slot => {
    const id = BigInt(slot.dataset.ava);
    const [nm, im] = await Promise.all([resolveName(id).catch(() => null), avatarFor(id).catch(() => null)]);
    slot.innerHTML = avatarHtml(im, nm);
  });
  if (acting) {
    (async () => {
      const slot = $('pwSummaryAva');
      if (!slot) return;
      const im = await avatarFor(acting.id).catch(() => null);
      slot.innerHTML = avatarHtml(im, acting.username);
    })();
  }
  const jump = $('pwDepJump');
  if (jump) jump.onclick = () => { const c = $('pwDepCard'); if (c) c.scrollIntoView({ block: 'center' }); };
  const dep = $('pwDepBtn'); if (dep) dep.onclick = () => pwDoDepWd('deposit');
  const wd = $('pwWdBtn'); if (wd) wd.onclick = () => pwDoDepWd('withdraw');
  $('pwLockBtn').onclick = () => pwLock();
  $('pwRemoveBtn2').onclick = () => renderPwRemove($('pwRemoveArea'));
  /* balances fill in async */
  (async () => {
    try {
      const [qom, qc, ob] = await Promise.all([
        rpc('eth_getBalance', [s.address, 'latest']).then(h => BigInt(h)),
        readUint(QCAW, SEL.balanceOf + encAddr(s.address)),
        (typeof O_TOKEN !== 'undefined' ? readUint(O_TOKEN, SEL.balanceOf + encAddr(s.address)) : Promise.resolve(null)).catch(() => null),
      ]);
      const a = $('pwQomBal'), b = $('pwQcawBal'), o = $('pwOBal'), w = $('pwGasWarn');
      if (a) a.textContent = fmtQcaw(qom);
      if (b) b.textContent = fmtQcaw(qc);
      if (o) o.textContent = ob === null ? '—' : fmtQcaw(ob);
      if (w && qom === 0n) w.innerHTML = '<span class="warn">' + esc(T.pwNeedGas) + '</span>';
    } catch (e) { /* balances are a nicety; the sends re-read anyway */ }
  })();
  syncChrome();
}
async function pwDoDepWd(kind) {
  const acting = pwActing();
  if (!pwSession || !acting) return;
  const amt = parseAmount($('pwAmount').value);
  const st = $('pwDepStatus');
  if (amt === null || amt <= 0n) { if (st) st.innerHTML = '<span class="err">' + esc(T.pwAmountBad) + '</span>'; return; }
  if (kind === 'withdraw' && amt > acting.balance) { if (st) st.innerHTML = '<span class="err">' + esc(T.pwAmountBad) + '</span>'; return; }
  openConfirmPanel({
    title: kind === 'deposit' ? T.confirmTitleDeposit : T.confirmTitleWithdraw,
    lines: [
      [T.confirmNameLbl, '@' + acting.username],
      [T.confirmAmountLbl, fmtQcaw(amt) + ' qCAW'],
    ],
    onSign: async setStatus => {
      pwTouch();
      if (kind === 'deposit') {
        const allow = await readUint(QCAW, SEL.allowance + encAddr(pwSession.address) + encAddr(CAW_NAME));
        if (allow < amt) {
          setStatus('<span class="small">' + esc(T.pwApproveFirst) + '</span>');
          await sendLocalTx(pwSession.keyBytes, { to: QCAW, data: buildApproveToCalldata(CAW_NAME, amt), gasFallback: 60000 });
        }
        setStatus('<span class="small">' + esc(T.actWaiting) + '</span>');
        await sendLocalTx(pwSession.keyBytes, { to: CAW_NAME, data: buildDepositCalldata(acting.id, amt), gasFallback: 100000 });
      } else {
        await sendLocalTx(pwSession.keyBytes, { to: CAW_NAME, data: buildWithdrawCalldata(acting.id, amt), gasFallback: 100000 });
      }
    },
    afterSuccess: async () => {
      await pwLoadNames();
      renderPw(); renderComposer();
    },
  });
}

/* ----- confirm panel: sign what you see ----- */
function confirmErrHtml(e) {
  if (e && e.message === 'not-owner') return '<span class="err">' + esc(T.actNotOwner) + '</span>';
  if (e && e.message === 'self-follow') return '<span class="err">' + esc(T.actSelfFollow) + '</span>';
  /* v14: the Super flows' named outcomes (the app's wording). */
  if (e && e.message === 'self-superlike') return '<span class="err">' + esc(T.slSelf) + '</span>';
  if (e && e.message === 'sl-pay-pending') return '<span class="warn">' + esc(T.slPayPending) + '</span>';
  if (e && e.message === 'src-burn-pending') return '<span class="warn">' + esc(T.srcBurnPending) + '</span>';
  if (e && e.message === 'src-pay-pending') return '<span class="warn">' + esc(T.srcPayPending) + '</span>';
  if (e && e.message === 'shortfall-sl') return '<span class="err">' + esc(T.slShortfall) + '</span>';
  if (e && e.message === 'shortfall-src') return '<span class="err">' + esc(T.srcShortfall) + '</span>';
  if (e && e.message === 'shortfall-burn') return '<span class="err">' + esc(T.srcBurnShortfall) + '</span>';
  if (e && e.message === 'shortfall-pay') return '<span class="err">' + esc(T.payShortfall) + '</span>';
  if (e && e.unconfirmed) return '<span class="warn">' + esc(T.actUnconfirmed) + '</span>' + txLinkHtml(e.txHash);
  return '<span class="err">' + esc(T.actFail) + '</span>' + txLinkHtml(e && e.txHash) + errDetailHtml(e);
}
function openConfirmPanel(opts) {
  const ov = $('confirmOverlay');
  if (!ov) return;
  $('confirmTitle').textContent = opts.title;
  $('confirmLines').innerHTML = (opts.lines || []).map(([k, v]) =>
    '<div class="confirm-line"><span class="ck">' + esc(k) + '</span><span class="cv">' + esc(v) + '</span></div>').join('');
  const status = $('confirmStatus');
  status.innerHTML = opts.statusHtml || '';
  const sign = $('confirmSignBtn'), cancel = $('confirmCancelBtn');
  sign.textContent = opts.signLabel || T.confirmSignBtn; sign.disabled = false;
  sign.style.display = opts.noSign ? 'none' : '';
  cancel.textContent = opts.noSign ? (LANG === 'ja' ? '閉じる' : 'Close') : T.confirmCancelBtn; cancel.disabled = false;
  ov.style.display = '';
  const close = () => { ov.style.display = 'none'; sign.onclick = null; cancel.onclick = null; };
  cancel.onclick = close;
  sign.onclick = async () => {
    sign.disabled = true; cancel.disabled = true;
    status.innerHTML = '<span class="small">' + esc(T.actSending) + '</span>';
    try {
      await opts.onSign(html => { status.innerHTML = html; });
      status.innerHTML = '<span class="ok">' + esc(opts.doneText || T.actDone) + '</span>';
      if (opts.afterSuccess) { try { await opts.afterSuccess(); } catch (e) {} }
    } catch (e) {
      status.innerHTML = confirmErrHtml(e);
    }
    sign.style.display = 'none';
    cancel.disabled = false;
    cancel.textContent = LANG === 'ja' ? '閉じる' : 'Close';
    cancel.onclick = close;
  };
}

/* ----- composer (home view) ----- */
let composerRef = null;        // {kind, post} for reply/quote mode
let pendingComposeRef = null;  // resolved from the ?compose= link
let compDraft = '';
function setComposerRef(kind, post) {
  const homeVisible = $('viewHome') && $('viewHome').style.display !== 'none';
  if (!homeVisible) {
    location.href = pageFile + '?compose=' + kind + ':' + post.cawId;
    return;
  }
  composerRef = { kind, post };
  renderComposer();
  const ta = $('compText');
  if (ta) { ta.focus(); ta.scrollIntoView({ block: 'center' }); }
}
function renderComposer() {
  const area = $('composerArea');
  if (!area) return;
  /* The floating compose button (and the sidebar's Post button)
     only exist when there is a name to post as — the app's rule
     that chrome follows what the user can actually do. */
  document.body.classList.toggle('can-compose', pwUnlocked() && !!pwActing());
  if (!pwUnlocked()) {
    area.innerHTML = '<div class="composer-hint"><span>' + esc(T.compHintLocked) + '</span>' +
      '<button type="button" class="ghost" id="compSetupBtn">' + esc(T.compHintSetupBtn) + '</button></div>';
    const b = $('compSetupBtn');
    if (b) b.onclick = () => { location.href = pageFile + '?wallet=1'; };
    return;
  }
  if (pendingComposeRef && !composerRef) {
    composerRef = pendingComposeRef; pendingComposeRef = null;
    setTimeout(() => { const ta = $('compText'); if (ta) ta.scrollIntoView({ block: 'center' }); }, 60);
  }
  const acting = pwActing();
  if (!acting) {
    area.innerHTML = '<div class="composer-hint"><span>' + esc(T.compHintNoName) + '</span></div>';
    return;
  }
  const ref = composerRef;
  /* v13: the app's compose row — the acting name's avatar, its
     name as a chip that jumps to the wallet (where names are
     switched), then the input. The cost line, the reply/quote
     context and every control keep their v12 ids and wiring. */
  let html = '<div class="composer-card"><div class="composer-row">' +
    '<span class="comp-ava" id="compAva"></span>' +
    '<div class="composer-main">' +
    '<div class="composer-top"><button type="button" class="name-chip-btn" id="compNameChip">@' + esc(acting.username) + ' ▾</button>' +
    '<span class="small">' + esc(T.pwNameBalanceLbl) + ': ' + esc(fmtQcaw(acting.balance)) + ' qCAW</span></div>';
  if (acting.balance === 0n) html += '<p class="warn">' + esc(T.compZeroBalance) + '</p>';
  if (ref) {
    const lbl = ref.kind === 'reply' ? T.compReplyingTo : T.compQuoting;
    html += '<div class="ctx comp-ref">' + esc(lbl.replace('{name}', '@…')) +
      ' <button type="button" class="actbtn" id="compRefCancel">' + esc(T.compCancelRef) + '</button></div>';
  }
  html += '<textarea id="compText" rows="3" placeholder="' + esc(T.compPh) + '">' + esc(compDraft) + '</textarea>' +
    '<div class="composer-foot"><span class="charcount" id="compCount"></span>' +
    '<button type="button" class="comp-post" id="compPostBtn">' + esc(T.compPostBtn) + '</button></div>' +
    '<p id="compStatus"></p></div></div></div>';
  area.innerHTML = html;
  (async () => {
    const slot = $('compAva');
    if (!slot) return;
    const im = await avatarFor(acting.id).catch(() => null);
    if ($('compAva') === slot) slot.innerHTML = avatarHtml(im, acting.username);
  })();
  const chipBtn = $('compNameChip');
  if (chipBtn) chipBtn.onclick = () => { location.href = pageFile + '?wallet=1'; };
  if (ref) {
    (async () => {
      const nm = await resolveName(ref.post.senderId).catch(() => null);
      const el = area.querySelector('.comp-ref');
      if (el && composerRef === ref) {
        el.firstChild.textContent = (ref.kind === 'reply' ? T.compReplyingTo : T.compQuoting)
          .replace('{name}', nm ? '@' + nm : T.unknownName + ref.post.senderId) + ' ';
      }
    })();
    $('compRefCancel').onclick = () => { composerRef = null; renderComposer(); };
  }
  const ta = $('compText'), count = $('compCount'), postBtn = $('compPostBtn');
  const overhead = ref ? 1 + postRefMarker(ref.kind, ref.post.cawId).length : 0;
  const update = () => {
    compDraft = ta.value;
    const bytes = textBytes(ta.value.trim()) + overhead;
    count.textContent = T.compBytes.replace('{n}', String(bytes));
    count.classList.toggle('err', bytes > 420);
    postBtn.disabled = !ta.value.trim() || bytes > 420;
  };
  ta.addEventListener('input', update);
  update();
  postBtn.onclick = () => {
    const body = ta.value.trim();
    const finalText = ref ? appendPostRef(body, ref.kind, ref.post.cawId) : body;
    if (textBytes(finalText) > 420) {
      $('compStatus').innerHTML = '<span class="err">' + esc(T.compTooLong) + '</span>';
      return;
    }
    const actingNow = pwActing();
    openConfirmPanel({
      title: T.confirmTitlePost,
      lines: [
        [T.confirmAsLbl, '@' + actingNow.username],
        [T.confirmTextLbl, parsePostText(finalText).body],
      ],
      onSign: async () => {
        pwTouch();
        const action = {
          type: 0, senderId: actingNow.id, receiverId: 0n,
          ts: Math.floor(Date.now() / 1000), sender: pwSession.address,
          cawId: randomCawId(), text: finalText,
        };
        await submitLocalAction(pwSession.keyBytes, action);
      },
      afterSuccess: async () => {
        compDraft = ''; composerRef = null;
        await pwLoadNames(); /* the action spent a little of the name's qCAW */
        renderComposer();
        loadTimeline(false);
      },
    });
  };
}

/* ----- action buttons on post cards + profile follow ----- */
async function doSimpleAction(kind, target) {
  const acting = pwActing();
  if (!pwSession || !acting) return;
  const authorName = await resolveName(target.senderId).catch(() => null);
  const targetLabel = (authorName ? '@' + authorName : T.unknownName + target.senderId) +
    ' — ' + parsePostText(target.text).body.slice(0, 80);
  openConfirmPanel({
    title: kind === 1 ? T.confirmTitleLike : T.confirmTitleRecaw,
    lines: [
      [T.confirmAsLbl, '@' + acting.username],
      [T.confirmTargetLbl, targetLabel],
    ],
    onSign: async () => {
      pwTouch();
      const action = {
        type: kind, senderId: acting.id, receiverId: target.senderId,
        ts: Math.floor(Date.now() / 1000), sender: pwSession.address,
        cawId: target.cawId, text: kind === 1 ? 'LIKE' : 'REPOST',
      };
      const res = await submitLocalAction(pwSession.keyBytes, action);
      return res;
    },
    afterSuccess: kind === 1 ? (() => {
      const el = document.querySelector('[data-cawid="' + target.cawId.toLowerCase() + '"] .like-count');
      if (el) {
        const cur = parseInt(el.dataset.raw || '0', 10) || 0;
        el.dataset.raw = String(cur + 1);
        el.textContent = fmtCount(cur + 1);
        const row = el.closest('.x-like');
        if (row) row.classList.add('on');
      }
      pwLoadNames().then(() => renderComposer()).catch(() => {});
    }) : undefined,
  });
}
/* ----- the X action row's taps (v13) -----
   Reply opens the composer in reply mode (existing flow).
   Like goes straight to its confirm panel (existing flow).
   Recaw opens the app's choice sheet: Recaw / SuperRecaw /
   Quote Recaw — with any unfinished SuperRecaw leg routed
   first (v14). Bookmark is a local-only toggle; Share uses the
   app's text share. Write actions tapped while the posting
   wallet is locked go to the wallet VIEW instead of failing
   (v15: the wallet lives behind the drawer/sidebar row, not
   stacked on the home view). */
function scrollToWallet() {
  location.href = pageFile + '?wallet=1';
}
function wireRowActions(div, a) {
  /* A card can contain a nested original (quote/Recaw frame)
     with its own row — only wire the row that belongs to THIS
     card, never the nested one. */
  const foot = [...div.querySelectorAll('.pfoot')].find(w => w.closest('.post') === div);
  if (!foot) return;
  foot.addEventListener('click', e => e.stopPropagation());
  const btn = name => foot.querySelector('[data-act="' + name + '"]');
  const rep = btn('reply');
  if (rep) rep.onclick = () => setComposerRef('reply', a);
  const like = btn('like');
  if (like) like.onclick = () => {
    if (!pwUnlocked() || !pwActing()) { scrollToWallet(); return; }
    doSimpleAction(1, a);
  };
  const rec = btn('recaw');
  if (rec) rec.onclick = () => onRecawTap(a);
  const sup = btn('super');
  if (sup) sup.onclick = () => { if (typeof onSuperTap === 'function') onSuperTap(a, div); };
  const bm = btn('bookmark');
  if (bm) bm.onclick = () => {
    if (!pwSession) { scrollToWallet(); return; }
    const now = bmToggle(pwSession.address, a.cawId);
    bm.classList.toggle('on', now);
    bm.innerHTML = '<span class="icring">' + (now ? IC_BOOKMARK_FILL : IC_BOOKMARK) + '</span>';
    if (typeof bmViewActive !== 'undefined' && bmViewActive && !now) {
      const row = div.closest('.bm-row');
      if (row) row.remove();
    }
  };
  const sh = btn('share');
  if (sh) sh.onclick = () => sharePostText(a, sh);
}
/* The Recaw choice sheet (the app's RecawChoiceSheet): plain
   Recaw, SuperRecaw (v14), Quote Recaw. Any unfinished
   SuperRecaw leg for this post routes to its own finish sheet
   first — the plain Recaw is never re-sent for a pending burn
   or payment. */
let recawChoiceTarget = null;
function openRecawChoice(a) {
  const ov = $('choiceOverlay');
  if (!ov) { doSimpleAction(2, a); return; }
  recawChoiceTarget = a;
  ov.style.display = '';
  const close = () => { ov.style.display = 'none'; recawChoiceTarget = null; };
  $('choiceCancelBtn').onclick = close;
  $('choiceRecawBtn').onclick = () => { close(); doSimpleAction(2, a); };
  $('choiceQuoteBtn').onclick = () => { close(); setComposerRef('quote', a); };
  $('choiceSuperBtn').onclick = () => {
    close();
    if (typeof openSuperRecawFlow === 'function') openSuperRecawFlow(a);
  };
}
function onRecawTap(a) {
  if (!pwUnlocked() || !pwActing()) { scrollToWallet(); return; }
  if (typeof routeRecawPending === 'function' && routeRecawPending(a)) return;
  openRecawChoice(a);
}

/* ================= SuperLike / SuperRecaw (v14) =================
   The app's flows (actionFlow.ts), re-shaped only where the
   web's wallet differs: every O leg is an ordinary legacy tx
   through sendLocalTx — the ONE existing broadcast site —
   which waits for the receipt, so a resolved leg is a
   confirmed leg, exactly the app's leg semantics. The CAW
   Recaw leg goes through submitLocalAction, so the acting
   name's fresh ownerOf fail-closed check applies to it like
   every other action. One deviation, by necessity: the app
   throws a single Error('shortfall') and lets each screen
   word it; the web's one shared confirm panel cannot, so the
   performs throw context-named shortfalls (shortfall-sl /
   -src / -burn / -pay) that confirmErrHtml maps to the app's
   per-action wording. Amounts and order are unchanged. */
const nameOwnerOf = async id => readAddr(CAW_NAME, SEL.ownerOf + word(id));
const oBalanceOf = async addr => readUint(O_TOKEN, SEL.balanceOf + encAddr(addr));
const fmtO = raw => fmtQcaw(raw);
const postTargetLabel = async a => {
  const nm = await resolveName(a.senderId).catch(() => null);
  return (nm ? '@' + nm : T.unknownName + a.senderId) + ' — ' + parsePostText(a.text).body.slice(0, 80);
};

async function performSuperlike(a) {
  if (!pwSession) throw new Error('locked');
  const authorOwner = await nameOwnerOf(a.senderId);
  const blocked = superlikeBlockReason({
    senderId: a.senderId,
    myTokenIds: pwNames.map(t => t.id),
    authorOwner,
    myAddress: pwSession.address,
  });
  if (blocked) throw new Error('self-superlike');
  const balance = await oBalanceOf(pwSession.address);
  if (superlikeShortfall(balance)) throw Object.assign(new Error('shortfall-sl'), { balance });
  const data = buildSuperlikeData(a.cawId);
  if (!data) throw new Error('bad-post');
  /* Leg 1 — the burn (defines the action). A throw here is an
     ordinary failure: nothing else ran, nothing is owed. */
  await sendLocalTx(pwSession.keyBytes, { to: O_TOKEN, data, gasFallback: 80000 });
  /* Leg 2 — the author payment (plain transfer, no marker). */
  try {
    await sendLocalTx(pwSession.keyBytes, { to: O_TOKEN, data: buildAuthorPayData(authorOwner, SUPERLIKE_AUTHOR_RAW), gasFallback: 80000 });
  } catch (e) {
    recordAuthorPay(pwSession.address, 'sl', {
      cawId: a.cawId, author: authorOwner,
      amountRaw: SUPERLIKE_AUTHOR_RAW, ts: Math.floor(Date.now() / 1000),
    });
    refreshMarkedBurns();
    throw new Error('sl-pay-pending');
  }
  refreshMarkedBurns();
}

async function performSuperRecaw(a) {
  const acting = pwActing();
  if (!pwSession || !acting) throw new Error('locked');
  /* The author's owner decides the payment leg (and whether
     there is one). A read failure does NOT block the path:
     the payment is then recorded as owed with the recipient
     resolved at retry time. */
  let authorOwner = '';
  try { authorOwner = await nameOwnerOf(a.senderId); } catch (e) {}
  const selfPay = authorOwner !== '' &&
    authorOwner.toLowerCase() === pwSession.address.toLowerCase();
  const balance = await oBalanceOf(pwSession.address);
  const needed = SUPERRECAW_BURN_RAW + (selfPay ? 0n : SUPERRECAW_AUTHOR_RAW);
  if (balance < needed) throw Object.assign(new Error('shortfall-src'), { balance });
  const burnData = buildSuperRecawData(a.cawId);
  if (!burnData) throw new Error('bad-post');
  /* Step 1 — the normal Recaw action (submitLocalAction
     re-proves name ownership before signing). If this throws,
     nothing else ran. */
  const action = {
    type: 2, senderId: acting.id, receiverId: a.senderId,
    ts: Math.floor(Date.now() / 1000), sender: pwSession.address,
    cawId: a.cawId, text: 'REPOST',
  };
  await submitLocalAction(pwSession.keyBytes, action);
  /* Step 2 — the marked O burn. Its failure leaves an honest
     debt, never a second Recaw. */
  try {
    await sendLocalTx(pwSession.keyBytes, { to: O_TOKEN, data: burnData, gasFallback: 80000 });
  } catch (e) {
    recordSrcBurn(pwSession.address, {
      cawId: a.cawId, ts: Math.floor(Date.now() / 1000), author: authorOwner,
    });
    throw new Error('src-burn-pending');
  }
  /* Step 3 — the author payment. Skipped when the author is
     the sender (self-SuperRecaw). */
  if (!selfPay) {
    try {
      if (!authorOwner) authorOwner = await nameOwnerOf(a.senderId);
      await sendLocalTx(pwSession.keyBytes, { to: O_TOKEN, data: buildAuthorPayData(authorOwner, SUPERRECAW_AUTHOR_RAW), gasFallback: 80000 });
    } catch (e) {
      recordAuthorPay(pwSession.address, 'src', {
        cawId: a.cawId, author: authorOwner,
        amountRaw: SUPERRECAW_AUTHOR_RAW, ts: Math.floor(Date.now() / 1000),
      });
      refreshMarkedBurns();
      throw new Error('src-pay-pending');
    }
  }
  refreshMarkedBurns();
}

async function performSuperRecawBurn(a) {
  if (!pwSession) throw new Error('locked');
  const pending = pendingSrcBurnFor(pwSession.address, a.cawId);
  if (!pending) throw new Error('no-pending-src-burn');
  const balance = await oBalanceOf(pwSession.address);
  if (balance < SUPERRECAW_BURN_RAW) throw Object.assign(new Error('shortfall-burn'), { balance });
  await sendLocalTx(pwSession.keyBytes, { to: O_TOKEN, data: buildSuperRecawData(a.cawId), gasFallback: 80000 });
  clearSrcBurn(pwSession.address, a.cawId);
  /* The author payment (never attempted while the burn was
     outstanding) becomes the owed leg — unless the author is
     the sender, who is owed nothing. */
  let author = pending.author || '';
  if (!author) { try { author = await nameOwnerOf(a.senderId); } catch (e) {} }
  if (author.toLowerCase() !== pwSession.address.toLowerCase()) {
    recordAuthorPay(pwSession.address, 'src', {
      cawId: a.cawId, author,
      amountRaw: SUPERRECAW_AUTHOR_RAW, ts: Math.floor(Date.now() / 1000),
    });
  }
  refreshMarkedBurns();
}

async function performAuthorPay(a, kind) {
  if (!pwSession) throw new Error('locked');
  const pending = pendingAuthorPayFor(pwSession.address, kind, a.cawId);
  if (!pending) throw new Error('no-pending-author-pay');
  const balance = await oBalanceOf(pwSession.address);
  if (balance < pending.amountRaw) throw Object.assign(new Error('shortfall-pay'), { balance });
  let author = pending.author;
  if (!author) author = await nameOwnerOf(a.senderId);
  await sendLocalTx(pwSession.keyBytes, { to: O_TOKEN, data: buildAuthorPayData(author, pending.amountRaw), gasFallback: 80000 });
  clearAuthorPay(pwSession.address, kind, a.cawId);
}

/* ----- the confirm sheets ----- */
function openMessagePanel(title, lines, errText) {
  openConfirmPanel({
    title, lines, noSign: true,
    statusHtml: '<span class="err">' + esc(errText) + '</span>',
    onSign: async () => {},
  });
}
async function openSuperlikeFlow(a) {
  const acting = pwActing();
  if (!acting || !pwSession) return;
  const targetLabel = await postTargetLabel(a);
  const lines = [
    [T.confirmAsLbl, '@' + acting.username],
    [T.slTarget, targetLabel],
    [T.slTotal, fmtO(SUPERLIKE_TOTAL_RAW) + ' O'],
    [T.slToAuthor, fmtO(SUPERLIKE_AUTHOR_RAW) + ' O'],
    [T.slBurned, fmtO(SUPERLIKE_BURN_RAW) + ' O'],
  ];
  /* Fast local self-check first (the app's instant feedback);
     the fresh-owner check inside performSuperlike is the
     authoritative one and still runs before any signing. */
  if (pwNames.some(t => t.id === a.senderId)) { openMessagePanel(T.slTitle, lines, T.slSelf); return; }
  let balance = null;
  try { balance = await oBalanceOf(pwSession.address); } catch (e) {}
  if (balance !== null && superlikeShortfall(balance)) {
    openMessagePanel(T.slTitle, lines, T.slShortfall);
    return;
  }
  lines.push([T.slBalance, (balance === null ? '—' : fmtO(balance)) + ' O']);
  openConfirmPanel({
    title: T.slTitle, lines,
    signLabel: T.slConfirm, doneText: T.slDone,
    onSign: async () => { pwTouch(); await performSuperlike(a); },
    afterSuccess: () => { repaintSuperCounts(); pwLoadNames().then(() => renderComposer()).catch(() => {}); },
  });
}
async function openSuperRecawFlow(a) {
  const acting = pwActing();
  if (!acting || !pwSession) return;
  const targetLabel = await postTargetLabel(a);
  let authorOwner = '';
  try { authorOwner = await nameOwnerOf(a.senderId); } catch (e) {}
  const selfPay = authorOwner !== '' &&
    authorOwner.toLowerCase() === pwSession.address.toLowerCase();
  const needed = selfPay ? SUPERRECAW_BURN_RAW : SUPERRECAW_TOTAL_RAW;
  let balance = null;
  try { balance = await oBalanceOf(pwSession.address); } catch (e) {}
  if (balance !== null && balance < needed) {
    openMessagePanel(T.srcTitle, [
      [T.confirmAsLbl, '@' + acting.username],
      [T.slTarget, targetLabel],
    ], T.srcShortfall);
    return;
  }
  const lines = [
    [T.confirmAsLbl, '@' + acting.username],
    [T.slTarget, targetLabel],
    [T.slTotal, fmtO(SUPERRECAW_TOTAL_RAW) + ' O'],
  ];
  if (selfPay) lines.push([T.slBurned, fmtO(SUPERRECAW_BURN_RAW) + ' O']);
  else {
    lines.push([T.slToAuthor, fmtO(SUPERRECAW_AUTHOR_RAW) + ' O']);
    lines.push([T.slBurned, fmtO(SUPERRECAW_BURN_RAW) + ' O']);
  }
  lines.push([T.slBalance, (balance === null ? '—' : fmtO(balance)) + ' O']);
  openConfirmPanel({
    title: T.srcTitle, lines,
    statusHtml: selfPay ? '<span class="small">' + esc(T.srcSelfNote) + '</span>' : '',
    signLabel: T.srcConfirm, doneText: T.srcDone,
    onSign: async () => { pwTouch(); await performSuperRecaw(a); },
    afterSuccess: () => { repaintSuperCounts(); },
  });
}
async function openSrcBurnFlow(a, pending) {
  const acting = pwActing();
  if (!acting || !pwSession) return;
  const targetLabel = await postTargetLabel(a);
  let balance = null;
  try { balance = await oBalanceOf(pwSession.address); } catch (e) {}
  openConfirmPanel({
    title: T.srcBurnTitle,
    lines: [
      [T.confirmAsLbl, '@' + acting.username],
      [T.slTarget, targetLabel],
      [T.slBurned, fmtO(SUPERRECAW_BURN_RAW) + ' O'],
      [T.slBalance, (balance === null ? '—' : fmtO(balance)) + ' O'],
    ],
    signLabel: T.srcBurnConfirm, doneText: T.srcBurnDone,
    onSign: async () => { pwTouch(); await performSuperRecawBurn(a); },
    afterSuccess: () => { repaintSuperCounts(); },
  });
}
async function openAuthorPayFlow(a, kind, pending) {
  const acting = pwActing();
  if (!acting || !pwSession) return;
  const targetLabel = await postTargetLabel(a);
  let balance = null;
  try { balance = await oBalanceOf(pwSession.address); } catch (e) {}
  openConfirmPanel({
    title: T.payTitle,
    lines: [
      [T.confirmAsLbl, '@' + acting.username],
      [T.slTarget, targetLabel],
      [T.slToAuthor, fmtO(pending.amountRaw) + ' O'],
      [T.slBalance, (balance === null ? '—' : fmtO(balance)) + ' O'],
    ],
    signLabel: T.payConfirm.replace('{amount}', fmtO(pending.amountRaw)),
    doneText: T.payDone,
    onSign: async () => { pwTouch(); await performAuthorPay(a, kind); },
    afterSuccess: () => { repaintSuperCounts(); },
  });
}
/* Pending-leg routing for the Recaw tap: an owed burn first,
   then an owed author payment — the plain Recaw is never
   re-sent for either. Returns true when a sheet was opened. */
function routeRecawPending(a) {
  if (!pwSession) return false;
  const burn = pendingSrcBurnFor(pwSession.address, a.cawId);
  if (burn) { openSrcBurnFlow(a, burn); return true; }
  const pay = pendingAuthorPayFor(pwSession.address, 'src', a.cawId);
  if (pay) { openAuthorPayFlow(a, 'src', pay); return true; }
  return false;
}
function onSuperTap(a, div) {
  if (!pwUnlocked() || !pwActing()) { scrollToWallet(); return; }
  const pending = pendingAuthorPayFor(pwSession.address, 'sl', a.cawId);
  if (pending) { openAuthorPayFlow(a, 'sl', pending); return; }
  openSuperlikeFlow(a);
}

/* ----- painting the marks on rows ----- */
function paintSuperInto(div, cawId) {
  const c = superlikeCountCached(cawId);
  const el = div.querySelector('.sl-count');
  if (el) el.textContent = c > 0 ? fmtCount(c) : '';
  const ic = div.querySelector('.sl-ic');
  if (ic) ic.innerHTML = c > 0 ? IC_STAR_FILL : IC_STAR;
  const btn = div.querySelector('.x-super');
  if (btn) btn.classList.toggle('has', c > 0);
}
function repaintSuperCounts() {
  document.querySelectorAll('.post[data-cawid]').forEach(d => paintSuperInto(d, d.dataset.cawid));
}
let mbSubscribed = false;
function paintSuperRow(div, a) {
  paintSuperInto(div, a.cawId);
  if (!mbSubscribed) {
    mbSubscribed = true;
    subscribeMarkedBurns(() => repaintSuperCounts());
  }
  scanMarkedBurns().then(() => paintSuperInto(div, a.cawId)).catch(() => {});
}
/* A Recaw row is Super when the scan holds a mark for
   (original cawId, the Recawer's owner address) — the app's
   key. The owner is resolved fresh from the name contract. */
async function paintRecawRow(div, a) {
  let owner = null;
  try { owner = await nameOwnerOf(a.senderId); } catch (e) {}
  if (!owner) return;
  const paint = () => {
    if (div.dataset.superPainted) return;
    if (!superRecawCached(a.cawId, owner)) return;
    div.dataset.superPainted = '1';
    div.classList.add('super-recaw');
    const attr = div.querySelector('.recaw-attr');
    if (attr) {
      attr.classList.add('super');
      const ic = attr.querySelector('.ra-ic');
      if (ic) ic.innerHTML = IC_STAR_FILL;
      const txt = attr.querySelector('.ra-txt');
      if (txt) txt.textContent = txt.textContent + ' · SuperRecaw';
    }
  };
  paint();
  scanMarkedBurns().then(paint).catch(() => {});
}
let profileOwner = null;
async function renderProfFollow() {
  const box = $('profFollowArea');
  if (!box || !profileState) return;
  if (!pwUnlocked()) { box.innerHTML = ''; return; }
  const acting = pwActing();
  if (!acting) { box.innerHTML = ''; return; }
  if ((profileOwner && profileOwner.toLowerCase() === pwSession.address.toLowerCase()) ||
      pwNames.some(t => t.id === profileState.id)) {
    box.innerHTML = '<p class="small">' + esc(T.actOwnProfile) + '</p>';
    return;
  }
  box.innerHTML = '<p class="small">' + esc(T.loading) + '</p>';
  let isFollowing = false;
  try {
    if (!followBuildState().complete) { try { await buildFollowIndex(null); } catch (e) {} }
    const lists = await refinedFollowListsOf(acting.id);
    isFollowing = lists.following.includes(profileState.id);
  } catch (e) { isFollowing = followListsOf(acting.id).following.includes(profileState.id); }
  if (!profileState) return;
  const targetId = profileState.id, targetName = profileState.username;
  box.innerHTML = '<button type="button" class="' + (isFollowing ? 'ghost' : '') + '" id="profFollowBtn">' +
    esc(isFollowing ? T.actUnfollow : T.actFollow) + '</button>' +
    (isFollowing ? ' <span class="small">' + esc(T.actFollowing) + '</span>' : '');
  $('profFollowBtn').onclick = () => {
    const actingNow = pwActing();
    openConfirmPanel({
      title: isFollowing ? T.confirmTitleUnfollow : T.confirmTitleFollow,
      lines: [
        [T.confirmAsLbl, '@' + actingNow.username],
        [T.confirmTargetLbl, '@' + targetName],
      ],
      onSign: async () => {
        pwTouch();
        if (!isFollowing) {
          /* Self-follow guard (app rule): the local name list
             first; then the ownerOf pair — a failed read leaves
             the local verdict standing. */
          if (pwNames.some(t => t.id === targetId)) throw new Error('self-follow');
          try {
            const [so, ro] = await Promise.all([
              readAddr(CAW_NAME, SEL.ownerOf + word(actingNow.id)),
              readAddr(CAW_NAME, SEL.ownerOf + word(targetId)),
            ]);
            if (so && ro && so.toLowerCase() === ro.toLowerCase()) throw new Error('self-follow');
          } catch (e) { if (e && e.message === 'self-follow') throw e; }
        }
        const action = {
          type: isFollowing ? 4 : 3, senderId: actingNow.id, receiverId: targetId,
          ts: Math.floor(Date.now() / 1000), sender: pwSession.address,
          cawId: randomCawId(), text: isFollowing ? 'UNFOLLOW' : 'FOLLOW',
        };
        await submitLocalAction(pwSession.keyBytes, action);
        /* Optimistically record the pair so the button, the
           counts and the lists agree right away. */
        try {
          const head = BigInt(await rpc('eth_blockNumber', []));
          fiPairs.set(fiKey(actingNow.id, targetId), { t: isFollowing ? 4 : 3, b: Number(head), x: 0, k: 0 });
          fiPersist();
        } catch (e) { /* the next build will find it on the record */ }
      },
      afterSuccess: () => renderProfFollow(),
    });
  };
}

/* ---------- bookmarks view (?bookmarks=1, v13) ----------
   The saved ids resolve against the live readers one by one,
   newest-saved first. An id that no longer resolves renders an
   honest placeholder with a remove button — never a cached
   copy of the post. Locked / no wallet: the view says the list
   lives with the posting wallet and waits for the unlock (the
   wallet section above re-renders this view on unlock). */
let bmViewActive = false;
async function loadBookmarksView() {
  bmViewActive = true;
  const box = $('bmList');
  if (!box) return;
  box.innerHTML = '';
  if (!pwSession) {
    box.innerHTML = '<p class="bm-note">' + esc(T.bmNeedWallet) + '</p>';
    return;
  }
  const ids = bmList(pwSession.address);
  if (!ids.length) {
    box.innerHTML = '<p class="bm-note">' + esc(T.bmEmpty) + '</p>';
    return;
  }
  for (const id of ids) {
    const wrap = document.createElement('div');
    wrap.className = 'bm-row';
    wrap.innerHTML = '<p class="bm-note">' + esc(T.looking) + '</p>';
    box.appendChild(wrap);
    (async () => {
      let post = null;
      try { post = await findPostByCawId(id, 12); } catch (e) {}
      if (!post) { try { post = await findPostDeep(id); } catch (e) {} }
      if (post) {
        const card = await postCard(post);
        wrap.innerHTML = '';
        wrap.appendChild(card);
      } else {
        wrap.innerHTML = '<div class="bm-missing"><span class="small">' + esc(T.bmMissing) + '</span>' +
          '<button type="button" class="ghost bm-del">' + esc(T.bmRemove) + '</button></div>';
        wrap.querySelector('.bm-del').onclick = () => {
          if (pwSession) bmToggle(pwSession.address, id);
          wrap.remove();
          if (!box.querySelector('.bm-row')) box.innerHTML = '<p class="bm-note">' + esc(T.bmEmpty) + '</p>';
        };
      }
    })();
  }
}

/* ---------- chrome sync: sidebar + drawer summaries (v13) ----------
   Both summaries mirror the posting-wallet state the way the
   app's drawer does: unlocked → the acting name's avatar, name,
   "@handle · #id" and its follow counts (shown only when the
   follow index is already built — otherwise an honest dash,
   never a guessed number); locked → the CAW mark and the plain
   "on QL1 · web" line. Called from renderPw, so every wallet
   state change repaints the chrome. */
function openDrawer() {
  const d = $('drawer');
  if (!d) return;
  d.classList.add('open');
  d.setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  const d = $('drawer');
  if (!d) return;
  d.classList.remove('open');
  d.setAttribute('aria-hidden', 'true');
}
async function syncChrome() {
  const acting = pwSession ? pwActing() : null;
  const setSummary = async (avaId, nameId, subId, followId, profileRowId) => {
    const ava = $(avaId), nm = $(nameId), sub = $(subId), fol = $(followId), prow = $(profileRowId);
    /* v16: the Profile row is ALWAYS in the drawer / sidebar
       (the app's drawer keeps every row in every state — v15
       hid it with no acting name and the shape broke). Its
       target is what changes: acting → the own profile;
       locked / nameless → the wallet view, where a wallet can
       be made, imported or unlocked and a name chosen. */
    if (prow) prow.setAttribute('href', acting ? profUrl(acting.username) : pageFile + '?wallet=1');
    if (acting) {
      if (nm) nm.textContent = acting.username || '';
      if (sub) sub.textContent = '@' + acting.username + ' · #' + acting.id.toString();
      if (ava) {
        const im = await avatarFor(acting.id).catch(() => null);
        ava.innerHTML = avatarHtml(im, acting.username);
      }
      const sum = document.querySelector('.mt-avatar-btn');
      if (avaId === 'drawerAvatar') {
        const mt = $('mtAvatar');
        if (mt) {
          const im2 = await avatarFor(acting.id).catch(() => null);
          mt.innerHTML = avatarHtml(im2, acting.username);
        }
      }
      if (fol) {
        fol.style.display = '';
        let followingTxt = '—', followersTxt = '—';
        if (followBuildState().complete) {
          try {
            const l = followListsOf(acting.id);
            followingTxt = String(l.following.length);
            const fc = await readUint(CAW_ACTIONS, SEL.followerCount + word(acting.id)).catch(() => null);
            if (fc !== null) followersTxt = fc.toString();
            else followersTxt = String(l.followers.length);
          } catch (e) {}
        }
        fol.innerHTML = '<b>' + esc(followingTxt) + '</b> ' + esc(T.followingLbl) + ' · <b>' + esc(followersTxt) + '</b> ' + esc(T.followersLbl);
      }
    } else {
      if (nm) nm.textContent = 'CAW Social';
      if (sub) sub.textContent = LANG === 'ja' ? 'QL1 版・ウェブ' : 'on QL1 · web';
      if (ava) ava.innerHTML = '<img class="avatar" src="icon-192.png?v=16" alt="">';
      const mt = $('mtAvatar');
      if (mt && avaId === 'drawerAvatar') mt.innerHTML = '<img class="avatar" src="icon-192.png?v=16" alt="">';
      if (fol) fol.style.display = 'none';
    }
  };
  /* The "My names" rows follow the same always-shown rule
     (v16): acting → the names side of the name desk;
     locked / nameless → the wallet view, like the Profile
     rows — never a hidden or dead row. */
  document.querySelectorAll('[data-nav="mynames"]').forEach(el => {
    el.setAttribute('href', acting ? pageFile + '?getname=1#myNames' : pageFile + '?wallet=1');
  });
  await Promise.all([
    setSummary('sideAvatar', 'sideName', 'sideSub', 'sideFollow', 'sideProfileRow'),
    setSummary('drawerAvatar', 'drawerName', 'drawerSub', 'drawerFollow', 'drawerProfileRow'),
  ]);
  /* current-place highlight */
  const mode = (typeof postQuery !== 'undefined' && postQuery) ? 'post'
    : (typeof profileQuery !== 'undefined' && profileQuery) ? 'profile'
    : (typeof searchQuery !== 'undefined' && searchQuery) ? 'search'
    : (typeof bmQuery !== 'undefined' && bmQuery) ? 'bookmarks'
    : (typeof walletQuery !== 'undefined' && walletQuery) ? 'wallet'
    : (typeof getnameQuery !== 'undefined' && getnameQuery) ? (location.hash === '#myNames' ? 'mynames' : 'getname')
    : (typeof lookupQuery !== 'undefined' && lookupQuery) ? 'search' : 'home';
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('on', el.dataset.nav === mode);
  });
}

/* ---------- init ---------- */
const postQuery = new URLSearchParams(location.search).get('post');
const searchQuery = new URLSearchParams(location.search).get('q');
const bmQuery = new URLSearchParams(location.search).get('bookmarks');
/* v15: the posting wallet, the lookup desk and the name desk
   are views of their own, opened from the drawer / sidebar
   rows (and the phone tab bar) — the home view is the timeline
   alone. Links saved before v15 point at the old stacked
   blocks (#pwallet / #lookup / #getname); treat those hashes
   as the matching view so old bookmarks still land right. */
const hashView = (!postQuery && !profileQuery && !bmQuery && !searchQuery)
  ? { '#pwallet': 'wallet', '#lookup': 'lookup', '#getname': 'getname' }[location.hash] : null;
const walletQuery = new URLSearchParams(location.search).get('wallet') || (hashView === 'wallet' ? '1' : null);
const getnameQuery = new URLSearchParams(location.search).get('getname') || (hashView === 'getname' ? '1' : null);
const lookupQuery = new URLSearchParams(location.search).get('lookup') || (hashView === 'lookup' ? '1' : null);
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
} else if (bmQuery) {
  document.body.classList.add('bookmarks-mode');
  $('viewBookmarks').style.display = '';
  loadBookmarksView();
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
} else if (walletQuery) {
  document.body.classList.add('wallet-mode');
  $('viewWallet').style.display = '';
} else if (getnameQuery) {
  document.body.classList.add('getname-mode');
  $('viewGetname').style.display = '';
  /* "My names" lands on the names list, "Get a name" on the
     mint form at the top — the saved fragment picks the spot
     inside the view. */
  if (location.hash) {
    try {
      const t = document.querySelector(location.hash);
      if (t) setTimeout(() => t.scrollIntoView(), 60);
    } catch (e) {}
  }
} else if (lookupQuery) {
  document.body.classList.add('lookup-mode');
  $('viewLookup').style.display = '';
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
const mcb = $('mintCheckBtn');
if (mcb) mcb.onclick = doMintCheck;
const mni = $('mintNameInput');
if (mni) mni.addEventListener('keydown', e => { if (e.key === 'Enter') doMintCheck(); });
refreshWallet();
renderPw();
renderComposer();
/* v13 chrome wiring: the mobile drawer (avatar button, scrim,
   close, Escape), the floating compose button and the sidebar
   Post button (both jump to the home composer — on other views
   they land on the home view, whose composer keeps the draft),
   and the right rail's search pill (a plain GET to ?q=, the
   existing post search). */
const drBtn = $('drawerBtn');
if (drBtn) drBtn.onclick = () => { syncChrome(); openDrawer(); };
const drScrim = $('drawerScrim');
if (drScrim) drScrim.onclick = closeDrawer;
const drClose = $('drawerClose');
if (drClose) drClose.onclick = closeDrawer;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
document.querySelectorAll('#drawer a').forEach(a => a.addEventListener('click', closeDrawer));
const goCompose = () => {
  closeDrawer();
  if ($('viewHome') && $('viewHome').style.display !== 'none') {
    const ca = $('composerArea');
    if (ca) ca.scrollIntoView({ block: 'start' });
    const ta = $('compText');
    if (ta) ta.focus();
  } else {
    location.href = pageFile;
  }
};
const fab = $('fabBtn');
if (fab) fab.onclick = goCompose;
const spb2 = $('sidePostBtn');
if (spb2) spb2.onclick = goCompose;
const rsf = $('railSearchForm');
if (rsf) rsf.addEventListener('submit', e => {
  const v = $('railSearchInput').value.trim();
  if (!v) e.preventDefault();
});
/* Reply/Quote links from other views land here as
   ?compose=reply:<cawId> / ?compose=quote:<cawId>; resolve the
   target post now so the composer can open in that mode as soon
   as the posting wallet is unlocked. */
const composeParam = new URLSearchParams(location.search).get('compose');
if (composeParam) {
  const cm = /^(reply|quote):(0x[0-9a-fA-F]{64})$/.exec(composeParam);
  if (cm) {
    findPostDeep(cm[2]).then(post => {
      if (post) { pendingComposeRef = { kind: cm[1], post }; renderComposer(); }
    }).catch(() => {});
  }
}
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
    rpc, readUint, readStr, readAddr, encStr, encAddr,
    checkName, normalizeNameInput, buildApproveCalldata, buildMintCalldata,
    nameNftSvg, nameNftFontSize,
    signDigestRaw, ecrecoverAddress, addressOfPriv, privateKeyToAddress,
    validateMnemonic, generateMnemonic, deriveFromPhrase, WALLET_PATH,
    vaultEncrypt, vaultDecrypt, vaultLoad, vaultSave, vaultWipe,
    VAULT_STORE_KEY, VAULT_ITERATIONS, BIP39_WORDS,
    signLegacyTx, rlpEncode, sendLocalTx,
    buildDepositCalldata, buildWithdrawCalldata, buildApproveToCalldata,
    parseAmount, hexToB64Url, postRefMarker, appendPostRef, textBytes,
    randomCawId, submitLocalAction,
    bmList, bmHas, bmToggle, BOOKMARKS_KEY_PREFIX,
    O_TOKEN, BURN_ADDRESS,
    SUPERLIKE_TOTAL_O, SUPERLIKE_AUTHOR_O, SUPERLIKE_BURN_O,
    SUPERRECAW_TOTAL_O, SUPERRECAW_AUTHOR_O, SUPERRECAW_BURN_O,
    LEGACY_MARKED_BURN_O,
    SUPERLIKE_TOTAL_RAW, SUPERLIKE_AUTHOR_RAW, SUPERLIKE_BURN_RAW,
    SUPERRECAW_TOTAL_RAW, SUPERRECAW_AUTHOR_RAW, SUPERRECAW_BURN_RAW,
    LEGACY_MARKED_BURN_RAW, SUPERLIKE_MAGIC, SUPERRECAW_MAGIC,
    MARKED_BURN_START_BLOCK, MB_KV_KEY, SRC_BURN_KV_KEY, AUTHOR_PAY_KV_KEY,
    buildMarkedBurnData, buildSuperlikeData, buildSuperRecawData,
    buildAuthorPayData, buildTransferData, parseMarkedBurnInput,
    burnAmountsForMagic, normCawIdHex, superlikeBlockReason, superlikeShortfall,
    scanMarkedBurns, superlikeCount, superlikeCountCached, superRecawCached,
    hasSuperRecaw, mbCursor, pendingSrcBurnFor, recordSrcBurn, clearSrcBurn,
    pendingAuthorPayFor, recordAuthorPay, clearAuthorPay, authorPayAmountFor,
    SEL, CAW_NAME, CAW_ACTIONS, MINTER, QCAW, CHAIN_ID_HEX, word,
  };
}
