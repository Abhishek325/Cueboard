# Contributing to Slateory

Thanks for helping creators get from an idea to a finished video. Contributions can be code, documentation, accessible UI improvements, reproducible bug reports or useful starter templates.

## Start small

Read the [roadmap](ROADMAP.md) and existing issues first. For a large feature or new dependency, open an issue describing the user problem and intended scope before implementing it. Roadmap entries are proposals, not delivery promises.

For a first contribution, try a small accessibility fix, a guide clarification or a focused template improvement. Explain who benefits and how you verified the change. Please keep discussions respectful and specific.

## Run a local copy

Use Node.js 22.22.2 or newer (the tested version is in `.nvmrc`).

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:8775/. Use fictional data in your development browser. IndexedDB is specific to the browser and origin; do not test destructive changes against your only copy of a personal board.

```sh
npm run check
npm run package
```

`check` runs the tests and production build. `package` also creates source/site ZIPs and checks their contents for common credential patterns. Generated `dist`, `release`, coverage and dependency folders should not be committed.

## Keep changes reviewable

- Describe the problem, the change and how it was verified.
- Add focused regression coverage for persistence, migrations or meaningful behavior changes. Small copy changes do not need implementation-mirroring tests.
- For UI changes, include a screenshot with fictional content when practical. Check light/dark mode, keyboard access and a narrow viewport.
- Preserve existing projects, backups and the separation of their YouTube settings.
- Keep planning useful without an account or YouTube connection. Do not add tracking, external services or credentials without discussing the change.
- Never include API keys, Google tokens, exported personal boards, private channel reports or identifying screenshots in an issue or pull request.

## Starter templates

Templates live in `src/data/templates.js`. Explain the intended creator, provide concrete demonstrations and viewer value, and keep all examples editable. Do not invent published work, audience metrics or guaranteed results. Template pages are generated from the same content, so review both the picker and public pages.

## License

Slateory uses the [MIT license](LICENSE). Contributions are offered under that license. Dependencies and third-party materials retain their own licenses; check that any new assets can be redistributed.
