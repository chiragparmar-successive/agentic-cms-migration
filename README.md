# final

Claude Desktop/Code workspace for agent definitions and reusable skills (no app code in this repo).

## Layout

| Path               | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `.claude/agents/`  | Orchestration entry points (`.agent.md`), grouped by domain  |
| `.claude/skills/`  | Reusable instructions (`SKILL.md` + supporting files)        |
| `skills-lock.json` | Upstream provenance + hashes for vendored Vercel skill packs |
| `.vscode/`         | Editor workspace file (`single-prompt.code-workspace`)       |

Authoritative tree and conventions: [.claude/README.md](.claude/README.md).
