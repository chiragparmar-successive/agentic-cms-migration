# Quality scripts (shared engine)

| Script | Purpose |
|--------|---------|
| `visual-parity-check.mjs` | Screenshot + text comparison: WordPress vs Next.js |

Logger: `scripts/lib/emoji-logger.mjs` (emoji on console + file).

| Emoji | Meaning |
|-------|---------|
| ✅ | Pass / success |
| ❌ | Fail |
| 📸 | Screenshot |
| 🔍 | Text compare |
| 🚦 | Gate result |
| ℹ️ | Info |

Artifacts are written under `output/<site>/` (project-specific):

- `test/reports/visual-parity-run.log` — full emoji log
- `test/reports/visual-parity/` — screenshots

```bash
node scripts/quality/visual-parity-check.mjs <site-slug>
```

Skill: `.claude/skills/PE-quality/frontend-visual-parity/SKILL.md`
