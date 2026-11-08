# CAW SocialFi (QL1)

A simple front end for the **community port of CAW (A Hunters Dream) on QL1**.

- Site: https://ql1-infinite42-guppy-histoire.github.io/caw-social-ql1/
- Status: **live as a web viewer — plus name minting** (viewer
  revived 2026-11-08; minting added in v11, 2026-11-08). The
  timeline, post pages and profiles are decoded in your browser
  from the public explorer API and the chain itself, and reading
  needs no wallet. Getting a name connects your own wallet and
  sends two ordinary transactions (a qCAW allowance, then the
  mint) — the only sends this site can make. It never asks for
  any kind of signature and never handles keys.
- Posting, likes, re-caws and follows live in the **Android app**
  ([download page](https://ql1-infinite42-guppy-histoire.github.io/caw-social-app/)),
  where signing happens inside the app. The web posting features
  were retired in November 2026: the scheme needs a raw-digest
  signature (`eth_sign`) that common wallet apps refuse, and the
  app made the whole question moot. Minting needs no such
  signature, which is why it — alone — could come back. The
  verified research behind the posting scheme is kept below
  under "Posting" as a historical record.
- Design: white, X-style timeline (round avatars, light borders),
  plain everyday wording, one accent colour. A two-pane layout on
  desktop (rail + reading column), a single column on phones. Also a
  **PWA**: add it to the home screen and it opens standalone.

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

- **Getting a name (the one write)** — check a name against the
  contract's rules, taken-ness and price; preview the real NFT
  card; then mint it through your own wallet in two confirmed
  steps (qCAW allowance, then the mint), with your owned names
  listed below. See "What's new in v11".
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

## Posting (historical — the retired web write path)

> The web version does not post: this section is kept as the
> research record behind the scheme the Android app now uses.
> The viewer never asks for a signature; its only send is name
> minting (see "What's new in v11").

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
rebuilt **every real batch byte for byte**. No real-money send test was
done from this site (no keys are handled here); the first post from a
visitor's own wallet is the end-to-end check.

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
  Reading never handles keys, and the site never asks for a
  signature; the only send it can make is minting a name through
  the visitor's own wallet (v11).

Part of [Guppy's Guide](https://ql1-infinite42-guppy-histoire.github.io/links/) — Don't Panic.

## License

MIT
