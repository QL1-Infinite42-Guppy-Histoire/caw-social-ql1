# CAW SocialFi (QL1)

A simple front end for the **community port of CAW (A Hunters Dream) on QL1**.

- Site: https://ql1-infinite42-guppy-histoire.github.io/caw-social-ql1/
- Status: live (read features + name minting + name balance management).
  Posting / liking / following are **not enabled yet** — see "Posting" below.

## What works

- **Timeline** — posts, likes, re-caws and follows recorded by the QL1
  `CawActions` contract, decoded in your browser from the explorer API and
  the chain itself (author names resolved from the `CawName` NFT metadata).
- **Get a name** — live availability and price checks against the
  `CawNameMinter` contract; minting is a guided two-step flow
  (approve the exact qCAW cost, then mint) through your own wallet.
- **My names** — your `CawName` NFTs, their internal qCAW balance,
  follower counts, and deposit / withdraw of qCAW.

## Posting

On QL1, all historical actions were signed by their authors and then
submitted by a community relay address. The exact signature construction
could not yet be reproduced from on-chain data alone (the digest scheme
was tested against EIP-191, plain keccak and EIP-712 candidate layouts
without a match), so this site does **not** offer posting buttons it
cannot stand behind. The timeline stays fully readable.

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
  calls). Two name registries in the port disagree for some early
  token ids; this site prefers the NFT metadata name.
- Static site, no build step: everything lives in `docs/`.
  Writes happen only through the visitor's wallet — no keys are handled.

Part of [Guppy's Guide](https://ql1-infinite42-guppy-histoire.github.io/links/) — Don't Panic.

## License

MIT
