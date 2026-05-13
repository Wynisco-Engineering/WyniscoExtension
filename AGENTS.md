# AGENTS.md

This guide helps both humans and AI contributors work effectively on the `WyniscoExtension` repo.

---


<!-- BEGIN: docs-repo-block (managed) -->
## Documentation lives in the central docs repo

All architecture, feature, ops, runbook, ADR, postmortem, guide, and reference docs for Wynisco live in the central docs repo, **not in this code repo**.

- **Repo:** [`Wynisco-Engineering/docs`](https://github.com/Wynisco-Engineering/docs) (private)
- **Expected local path:** sibling of this repo at `../docs/`
- **Source of truth for structure and conventions:** the README at the root of that repo — read it before writing or moving any doc.

### Rules

- Do **not** create product docs, feature docs, runbooks, ops docs, ADRs, design specs, or postmortems inside this code repo.
- This code repo keeps only: `README.md`, `CONTRIBUTING.md`, this `AGENTS.md`, code-level comments, and auto-generated API references (if any). Anything longer belongs in the docs repo.
- When writing or updating a doc, work in `../docs/` and commit there. Cross-link from this repo's `README.md` to specific files in `../docs/` when relevant.

### If `../docs/` is missing, clone it first

```bash
# from the parent directory containing this repo
gh repo clone Wynisco-Engineering/docs docs
cd docs && make install-hooks
```

`make install-hooks` enables the lychee pre-commit linkcheck. Install lychee once: `brew install lychee` (macOS).
<!-- END: docs-repo-block (managed) -->
