# Input Documents

Drop any of the following here before running `playwright-test-gen`:

- BRD (Business Requirements Document)
- User stories
- Acceptance criteria
- Feature specifications
- Functional requirements
- Any plain text describing expected behaviour

## Supported formats

| Format | Works |
|--------|-------|
| `.md` Markdown | Yes |
| `.txt` Plain text | Yes |
| `.csv` Tabular stories | Yes |
| `.html` Exported HTML | Yes |
| `.pdf` PDF | **No** — export to `.txt` or `.md` first |
| `.docx` Word | **No** — paste content into a `.md` file |

## How it works

When you run `playwright-test-gen <url>`, the skill automatically scans this folder.

- If files are found → requirements are merged and used to enrich test scenarios
- If the folder is empty → the skill runs in URL-only mode, no change in behaviour

You do not need any flags or arguments. Just drop the file here and run.

## Example contents

```
As a guest user I want to see a login form on the homepage
  - Email field must be visible
  - Password field must be visible
  - Submit button labelled "Log In" must be visible
  - Invalid credentials must show an error message

US-002: Region filter
  The hotel grid must update when a region tab is clicked
  Only hotels in the selected region are shown
  The active tab is visually highlighted
```

## Multiple files

All files in this folder are merged into a single requirements context.
Name them however you like — `brd.md`, `user-stories.md`, `sprint-1.txt`, etc.
