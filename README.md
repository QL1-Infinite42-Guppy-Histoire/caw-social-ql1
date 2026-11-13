# CAW SocialFi (QL1)

A simple front end for the **community port of CAW (A Hunters Dream) on QL1**.

- Site: https://ql1-infinite42-guppy-histoire.github.io/caw-social-ql1/
- Status: **live — reading, name minting, and posting** (viewer
  revived 2026-11-08; minting added in v11, 2026-11-08; posting
  added in v12, 2026-11-09). The timeline, post pages and
  profiles are decoded in your browser from the public explorer
  API and the chain itself, and reading needs no wallet.
  Getting a name connects your own wallet app and sends two
  ordinary transactions (a qCAW allowance, then the mint).
  Posting, likes, re-caws and follows are signed **inside this
  page** by a small built-in posting wallet — the same model as
  the **Android app**
  ([download page](https://ql1-infinite42-guppy-histoire.github.io/caw-social-app/)):
  the key lives only in your browser, encrypted with a password
  you set, and is never sent anywhere. The site never asks an
  external wallet for any kind of signature: the posting scheme
  needs a raw-digest signature that wallet apps refuse, so the
  built-in wallet produces it in-page instead. See "What's new
  in v12" for the safety model, and "Posting" below for the
  verified scheme itself.
- Design: the Android app's X-style design, copied token for
  token in v13 (X blue `#1d9bf0`, ink `#0f1419`, hairlines,
  gold reserved for Super marks), plain everyday wording.
  Three columns on desktop (sidebar + timeline + rail), a
  drawer on phones. Also a **PWA**: add it to the home screen
  and it opens standalone.

## What's new in v13 (2026-11-13)

- **The display layer was rebuilt to match the Android app's
  X-style overhaul (app v0.6.x) exactly** — same design tokens,
  same post-row anatomy, same drawer contents and order.
  Display only: no read, signing, minting or sending logic
  changed, every element id and both send sites are untouched,
  and the verification harness grew to 130 checks.
- **Layout.** Desktop gets the app's three columns: a left
  sidebar (logo, your acting name's summary, large nav rows),
  the timeline column, and a right rail holding only real
  things — a search pill wired to the existing post search,
  the "CAW right now" stats, About, the app card and the
  contract addresses. On phones the sidebar becomes the app's
  drawer: tap your avatar (top-left) and it slides in over a
  scrim with your profile summary, the nav rows in the app's
  order, and the theme/language rows at the bottom. A bottom
  tab bar (Home / Search / Wallet / Bookmarks) and a compose
  FAB complete the phone chrome; the FAB and the sidebar Post
  button only appear when a name can post.
- **Post rows.** Avatar left; the bold name on its own line
  with "@handle · time" under it (the app's two-line head);
  15px body; then ONE action row that never wraps — reply,
  Recaw, like (counts fill in after render, as before), the
  gold SuperLike star, bookmark, share — with circular hover
  washes in X's colours (blue / green / pink / gold). The
  record link sits alone under the row, exactly one per post.
  Share sends the post's text plus "— @handle · CAW Social"
  (the app's share; no URL is invented). There is **no view
  counter**: impressions cannot be counted from the chain, so
  no element exists for them.
- **Bookmarks (new, local only).** The bookmark toggle in the
  action row saves the post's id in this browser, scoped per
  posting-wallet address under `caw-bookmarks-v1-<address>`
  (the Android app's own rule and key shape). The Bookmarks
  view resolves each saved id against the live readers; an id
  that no longer resolves shows an honest placeholder with a
  remove button — content is never cached or faked. Nothing
  is signed or sent for a bookmark.
- **Recaw choice sheet.** Tapping Recaw now opens the app's
  choice sheet (Recaw / SuperRecaw / Quote Recaw) instead of
  sending immediately; plain Recaw and Quote keep their exact
  v12 flows from there. (SuperRecaw itself arrives in v14.)
- **Profiles** follow the app: banner, overlapping avatar,
  follow pill, big name, and a counts band (Following /
  Followers — tappable, opening the same reconstructed lists
  as before — plus the name's own qCAW balance). Post pages
  show the target post large, with **Liked by** and **Recawed
  by** name lists under the quotes. The wallet section is the
  app's wallet screen: profile summary with a copyable address
  chip, the balances (QOM / qCAW / O) as an asset list, the
  acting names as tappable rows, then the unchanged
  deposit / withdraw card.
- The theme stays **guppy-theme** (white by default, white /
  black toggle, `localStorage` key `guppy-theme`); the dark
  side is X's true black `#000`.

## What's new in v12 (2026-11-09)

- **Posting is back — through a built-in wallet, not a wallet
  app.** The posting scheme needs a raw-digest signature
  (`eth_sign`), which wallet apps refuse or have removed; that
  is why web posting was retired. v12 takes the Android app's
  route instead: a small **posting wallet lives inside this
  page**. You create one (a fresh 12-word recovery phrase, shown
  once) or import one (a phrase or a private key). It is
  encrypted with a password you set (PBKDF2, 210,000 rounds,
  AES-GCM) and stored **only in this browser**; the decrypted
  key exists only in page memory, locks itself after 15 idle
  minutes, and is wiped by the Lock and Remove controls. Nothing
  about the key ever leaves the browser — the only network
  traffic is public chain reads and the wallet's own signed
  broadcasts. The safety rules are printed on the wallet section
  itself: use a separate CAW-only wallet, never type your main
  wallet's recovery phrase, save the phrase offline, and know
  that clearing the browser's data deletes the wallet.
- **Everything the app does, in the page.** A composer on the
  home view (420-byte limit, counting the reply/quote marker,
  exactly like the app), Like / Recaw / Reply / Quote buttons on
  posts, and Follow / Unfollow on profiles. Every action first
  shows a **confirm panel** — the acting name, the target, the
  text — so you sign what you see. Before signing, the page
  re-reads the name's owner on the record and refuses if the
  name is not this wallet's (the app's fail-closed rule), and a
  follow of your own other name is refused. Actions are paid
  from the acting name's internal qCAW balance, shown next to
  the composer; the wallet section carries the deposit /
  withdraw controls for it (an allowance send first when
  needed, then the deposit — each a local signed transaction),
  plus the wallet's own QOM (fee) and qCAW balances.
- **The crypto is written from scratch, in the page, and pinned
  by vectors.** secp256k1 over BigInt with RFC6979 deterministic
  signing, BIP39 + BIP32 (the 2048-word list ships as its own
  file, `bip39-words.js`, extracted from the same ethers wordlist
  the app uses) deriving the app's path `m/44'/60'/0'/0/0`, and
  an RLP legacy-transaction sender (EIP-155, chain 766). The
  harness proves it all offline: the public Hardhat phrase
  derives the Hardhat address; a sample action signature
  recovers its signer over the real digest (the contract's own
  check); the vault round-trips and rejects a wrong password; a
  fixed transaction is **byte-identical** to the same
  transaction signed by ethers. A phrase imported here derives
  the same address as in the app.
- **Two writes, kept apart, both guarded.** Minting still goes
  through your wallet app (exactly one send site in the code);
  everything else is signed in-page and broadcast raw (exactly
  one raw-send site). The harness counts both and also checks
  that no raw-sign request is ever named, the safety copy is
  present in both languages, and the wordlist holds exactly
  2048 words. **No real post has been sent from this site yet**
  (the harness holds no funded named key): **the first real
  post from a visitor's own built-in wallet is the end-to-end
  check.**

## What's new in v11 (2026-11-08)

- **You can get a name here now.** The site stays a viewer for
  everything else, but the one write that never needed the
  posting signature scheme — minting a CAW name — is back, done
  the way the app does it: check the name (the contract's own
  rules, whether it is taken, and its price in qCAW), see the
  real NFT card design before paying anything, connect your own
  wallet, then send two ordinary transactions — first allow the
  qCAW to be used, then mint — each confirmed on the record
  before the next step appears. Amounts are always re-read at
  click time: if the name was taken, or the price moved, in
  between, sending stops and the page says so. A wallet holding
  no QOM (the small-fee coin) is warned and cannot send. The
  names the connected wallet owns are listed under the form,
  which is also how a fresh mint shows up.
- **One send site, no signatures, no keys.** The whole viewer
  contains a single place that asks a wallet to send, and the
  only payloads it can carry are the two mint-step calls. The
  page never asks for any kind of signature and never handles a
  key or a phrase — that is exactly why posting (which needs the
  raw-digest signature) remains app-only while minting works
  here. When a wallet refuses or a send fails, the page shows a
  plain explanation plus the wallet's own error message in small
  print. Wallets are found even when they inject late (a ~12 s
  watch plus EIP-6963 announcements); a wallet on the wrong
  network gets a Switch-to-QL1 button (adding QL1 when the
  wallet does not know it yet).
- **Verified without sending.** The harness checks the name
  check against live data (taken / invalid / available, the
  price cross-read directly from the contract), the mint
  calldata against hand-computed bytes, and the NFT preview
  byte-for-byte against token 190's real on-chain card — plus
  the send-site count. No real mint has been sent from this
  site (no keys are handled here): **the first real mint from a
  visitor's own wallet is the end-to-end check**, mirroring how
  the original web version was verified.

## What's new in v10 (2026-11-08)

- **Repeat visits are much faster.** A name's card never changes
  (the name is fixed at mint and the picture is made from it), so
  resolved cards are now kept in your browser (at most ~600,
  oldest dropped first) and later visits show names and pictures
  with **no chain reads at all** for them. The page also opens
  connections to the chain and the explorer early (preconnect).
- **New posts pill.** While you are reading the timeline, the
  newest posts are re-checked about once a minute; when something
  new has arrived a "New posts" pill appears — nothing ever
  reloads under you, tapping the pill does.
- **Follow lists read in pieces.** Building the Following /
  Followers lists now walks the public record at most 25 feed
  pages at a time, shows the lists from what is known so far, and
  offers a "Keep reading the record" button for the next piece —
  no more single ~40-second wait. When the whole record has been
  read, it says so.
- **"CAW right now" card.** Total names, how many posts the last
  24 hours saw, and the five most active names in that window
  (counted from a bounded look at the newest posts; if that look
  cannot cover a full 24 hours, the count says what it was
  counted from).
- **Profile tabs.** A profile's rows are split into "Posts" and
  "Recaws & follows" tabs over the same scan — switching never
  rescans.
- **Search polish.** Matched words are highlighted in search
  results, and when the words are exactly a name that exists, a
  link to that profile sits at the top of the results.
- **Small things.** Share buttons on post and profile pages
  (system share sheet, or copy the link), a retry button when the
  timeline cannot load, a back-to-top button, keyboard focus
  outlines, reduced-motion support, and OGP tags for link
  previews. The signing core from v9 is still present and still
  **not wired to any UI — nothing in v10 signs or sends.**

## What's new in v9 (2026-11-08)

- **Faster.** A name's card (`tokenURI`) is now read **once** per
  author and serves both the name and the picture (it used to be
  read twice). A page of posts is built in parallel and appears in
  order; like counts fill in after the post is already on screen
  instead of holding it up. Skeleton rows show while the first page
  loads, and more posts load on their own as you scroll (the button
  still works too). A Refresh button at the top reloads the newest
  posts.
- **Easier to read.** Times are relative ("5m", "3h", "2d"; the
  full time is in the tooltip), web links and @names in post text
  are tappable, and tapping anywhere on a post opens its page.
  Dark colours follow your device setting automatically.
- **Search posts.** A second search box looks through the words
  *inside* posts (the name lookup stays as it was). It reads the
  public record in chunks and can keep going further back.
- **Following / Followers lists on profiles.** The counts open
  lists rebuilt from the public record — the same reconstruction
  the app uses (latest follow/unfollow per pair wins; follows from
  a name holding no qCAW in its name balance never registered and
  are left out). Repeat visits only re-read what is new. The
  follower number in the header is still the chain's own count, so
  a list can differ a little from it.
- **Groundwork only:** the verified CAW signing core
  (`actionDigest` + `encodeBatch`, with the hand-rolled keccak from
  this repo's own pre-pause web app) is back in `viewer.js` as a
  clearly separated section, and the harness proves it rebuilds a
  real on-chain batch byte-for-byte. **It is not wired to any UI —
  nothing in v9 signs or sends.**

## What works

- **Getting a name (through your wallet app)** — check a name
  against the contract's rules, taken-ness and price; preview
  the real NFT card; then mint it through your own wallet in two
  confirmed steps (qCAW allowance, then the mint), with your
  owned names listed below. See "What's new in v11".
- **Posting (through the built-in wallet)** — create or import
  the posting wallet in the page, pick which of its names to act
  as, put qCAW into that name, then post / like / Recaw / reply /
  quote / follow from the composer, the post buttons and the
  profile pages, each behind a see-what-you-sign confirm panel.
  See "What's new in v12".
- **Timeline** — posts, re-caws and follows recorded by the QL1
  `CawActions` contract, decoded in your browser (batch-aware
  decoder). Like actions never render as rows — they only feed the
  like counts on their target posts, matching the app.
- **Names from the card** — an author's name is read from the name
  token's own metadata (`tokenURI`), the mint-proven source. The
  `usernames()` getter is shifted by one (it returns the NEXT
  token's name) and is never used directly; see the note under
  "Fixes" for the corrected history.
- **Recaws show the original** — X-style: a "Recawed" header and the
  original post itself as the card body, with an honest "not found"
  frame when the original is outside the loaded feed.
- **Replies and quote Recaws** — the app marks them as ordinary
  posts whose text ends with `[caw:reply:<base64url(parent cawId)>]`
  or `[caw:quote:<…>]`. The viewer parses the same convention: the
  marker line is never shown, quotes render with the original in an
  embedded frame, and a post's own page (?post=<cawId>) assembles
  its reply thread (oldest first) and its quotes. As of the revival,
  the chain holds quote posts but no replies yet — the reply path
  shares the quote-proven code and is covered by the verification
  harness at the codec level.
- **Profile pages** — `?name=<username>`: the name's picture, id,
  owner, follower count, internal qCAW balance, mint day, and that
  name's posts (found by scanning the contract feed). Name lookup
  on the home page resolves through the same card-verified lookup.
- **Verification** — `node scripts/verify-viewer.mjs` checks the
  viewer against live chain data: decoding, the like-row rule,
  card-name resolution (including the token-190 incident case),
  Recaw→original resolution, and marker parsing. v9 adds: the
  signing core rebuilding a real batch byte-for-byte, the
  single-card-read rule (counted), linkify escaping, and the
  relative-time formatter. v10 adds: the persistent card cache
  (a stored card costs zero card reads in a fresh session), the
  new-head comparison helper, keyword highlighting, and the
  follow-build chunk cap. v11 adds: the live name check, the
  hand-computed mint calldata, the NFT preview byte-compared
  with a real minted card, and the single-send-site guards.
  v12 adds: the Hardhat derivation + key vectors, the action
  signature recovery check, the vault roundtrip + wrong-password
  rejection, the fixed-transaction byte comparison against
  ethers, the deposit/withdraw calldata, and the two-write
  guards (one injected send site, one raw send site, no raw-sign
  request named, safety copy in both shells, 2048-word list).

## Posting (the scheme — now live in the app and, since v12, here)

> This is the research record behind the posting scheme. The
> Android app signs it in-app; since v12 the web version signs
> it in-page with the built-in posting wallet, because external
> wallet apps refuse the raw-digest signature it needs. Minting
> stays with the wallet app (see "What's new in v11").

Verified 2026-11-07. The QL1 `CawActions` contract checks an EIP-712
style digest per action:

- `digest = keccak256(0x1901 || DOMAIN_SEPARATOR || structHash)`, where
  `DOMAIN_SEPARATOR` (`0x1131b721…f37c96d`) is the value the contract
  itself keeps in its storage slot 2.
- `structHash = keccak256(TYPEHASH || fields)` with
  `TYPEHASH = 0xd2f7d945…ecc3517ac` (a constant in the contract's code)
  and the fields in the contract's own order: action type, sender token
  id, receiver token id, keccak of the (empty) tip-amount list,
  timestamp, keccak of the (empty) tip-recipient list, sender address,
  action id (`cawId`), keccak of the text. Posts carry their text;
  likes / re-caws / follows carry the labels `LIKE` / `REPOST` /
  `FOLLOW`, and a like or re-caw points at the original post's `cawId`
  and author.
- The wallet signs the raw digest (`eth_sign`); the site then submits
  the batch call `0x84e33f2f` itself.
- Why not `eth_signTypedData_v4`: a wallet computes the separator and
  typehash itself from a domain name and a type string, but only the
  resulting VALUES are stored in / used by this contract — the original
  strings exist in no public artifact (checked: the deployed bytecode
  and creation code, the official caw-js-sdk, the official front end).
  The separator's inputs were recovered by tracing the constructor in
  a local EVM (standard domain type hash, version "1", chain 766, the
  contract itself), which leaves a single unknown: the domain NAME
  whose keccak is `0x47219ae7…f37c96d`. Dictionary and phrase searches
  (~6.7M candidates) plus structured type-string searches (~330k
  targeted combinations, with a ~91M-combination sweep on top) did not
  recover either string, so typed-data signing cannot be shown to
  produce the digest the contract expects, and is not used. If the
  QL1 deployer ever publishes the contract source, this can be enabled
  and re-verified against the same 264 actions.
- When signing or sending fails, the site now shows the wallet's own
  error message (in small print under the plain-language explanation),
  and it checks before sending that the connected wallet still owns
  the name being posted as. The chosen posting name is remembered per
  wallet account (browser storage) and restored on reconnect.

How this was pinned down: the real contract code was executed locally
in an EVM against a real transaction and the hash inputs were read from
the trace; the resulting construction was then checked off-chain
against **all 264 actions** in 300 sampled real transactions — every
signature recovered its sender — and the site's calldata builder
rebuilt **every real batch byte for byte**. The v12 in-page signer
is checked the same way (signature recovery over the digest, plus
the byte-identical fixed transaction). No real post has been sent
from this site yet — the first post from a visitor's own built-in
wallet is the end-to-end check.

## Profile pictures and bios

There is **no way to set a display name, picture, header image or bio
for a name on-chain** in this port: the full function sets of all four
contracts (SDK ABIs plus a scan of every function selector in the
deployed code) contain no per-name profile function. The picture in a
name's metadata is generated by `CawNameURI` from the username itself,
and a username is written once, when the name is minted — it cannot be
changed afterwards. (The one description string in `CawNameURI` is a
single global text for all names, changeable only by that contract's
owner.)

## Fixes (2026-11-07, second round)

- **Profile pages said "not found" for real names.** Two causes: the
  profile loader built its `idByUsername` calldata with two hex
  characters cut off (the call always reverted and the failure was
  shown as "not found"). Name lookups verify the answer against the
  neighbouring ids and accept only an exact match; a failed read
  shows a load error with a retry button instead of "not found".
  *(Correction, settled later by the mint records: `idByUsername`
  returns the TRUE token id — the "+1" once suspected here was an
  artifact of comparing it against the shifted `usernames()` getter.
  The one broken getter is `usernames(n)`, which returns token
  n+1's name; the current viewer verifies lookup candidates against
  each token's CARD name and never trusts `usernames(id)`.)*
- **Wallets injected after page load were never seen.** The site now
  keeps looking for a wallet provider for ~12 s after load and also
  listens for EIP-6963 announcements; the wallet area always shows a
  large connect button (plus a re-check button and a short guide when
  no wallet has been found yet).
- **Look and feel.** Closer to X: profile pages have a header band
  with the picture overlapping it and a pill-shaped follow button,
  post actions use line icons, phones get a bottom navigation bar
  (home / get a name / my names) and a round floating post button.

## Contracts (QL1, chain ID 766)

| What | Address |
| --- | --- |
| CawName | `0x864f08Af11F6DC2c0De42562e4664d4f033D393f` |
| CawActions | `0x95c2AFEc2dE8b09323Cdc7E40Bcce42C3C49E496` |
| CawNameMinter | `0xFC2f8743E3b09a6c973B114c3a082433e974eD9f` |
| qCAW | `0xd2140E16aDf37194036865E90BbCA1139b739d0D` |
| CawNameURI | `0xFC070c597A9683d02cEA018d0DCf7BeaD91509e8` |

## Notes

- This is a **community port**. It is not run by, or affiliated with,
  the official cawdevelopment team. The contracts are not verified on
  the QL1 explorer; this site interacts with them as they are.
- The action calldata layout was reverse-engineered from 300 real
  transactions (264 full actions decoded; the rest are empty heartbeat
  calls). Name truth was settled by the mint transactions themselves:
  a token's card (`tokenURI`) carries its minted name, while the
  `usernames()` getter is shifted by one — the viewer always prefers
  the card.
- Static site, no build step: everything lives in `docs/`.
  Reading never handles keys. The site has exactly two writes:
  minting a name through the visitor's own wallet app (v11), and
  actions signed in-page by the built-in posting wallet, whose
  encrypted key never leaves the visitor's browser (v12).

Part of [Guppy's Guide](https://ql1-infinite42-guppy-histoire.github.io/links/) — Don't Panic.

## License

MIT
