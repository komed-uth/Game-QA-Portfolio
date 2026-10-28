# Inspection reference

[Task index](validation.md).

## Bounded tool discovery

Discover matching tool names first, then read the metadata/schema for the one selected tool. Keep descriptions out of inventory output and bound the number of matches; narrow the query when it is still broad. For dynamic tool discovery, project matches to names before printing rather than printing complete tool objects. When a host startup fails with the documented sandbox error, follow [host runtime recovery](workstation.md#host-runtime-failures).

The executable local example accepts a retained JSON array of tool objects. Export the inventory without printing it, then run:

```sh
node scripts/bounded-inspection.mjs --source .scratch/tools.json --tools github
node scripts/bounded-inspection.mjs --source .scratch/tools.json --schema exact_tool_name
```

Inventory prints at most ten matching names without descriptions or schemas. `REFINE` means more matches exist. Schema lookup requires exactly one complete name, rejects missing/duplicate selections, and prints that tool's complete metadata. The retained file is unchanged. For an in-process tool host, use the same names-first projection before exporting selected metadata:

```js
const matches = ALL_TOOLS.filter(tool => /github/i.test(tool.name));
text(matches.slice(0, 10).map(tool => tool.name));
if (matches.length > 10) text('REFINE: narrow the query.');
```

Then request exactly one returned name, rejecting missing or ambiguous selections:

```js
const selected = ALL_TOOLS.filter(tool => tool.name === 'exact_returned_tool_name');
if (selected.length !== 1) throw new Error('Missing or ambiguous exact tool name; refine discovery.');
text(selected[0]);
```

Select one exact name in the host's schema lookup interface; the local adapter does not invent schemas omitted by the host.

## Issue source and section inspection

List scoped issue identifiers/titles before downloading individual bodies. Keep the complete selected source on disk for lossless edits; do not replace it with a displayed excerpt. A GitHub read example is:

```powershell
New-Item -ItemType Directory -Force .scratch | Out-Null
gh issue list --repo komed-uth/Game-QA-Portfolio --search 'publication' --limit 10 --json number,title
$source = gh issue view 85 --repo komed-uth/Game-QA-Portfolio --json number,title,body,comments
if ($LASTEXITCODE -ne 0) { throw 'Issue source read failed' }
[IO.File]::WriteAllText((Join-Path (Get-Location) '.scratch/issue-source.json'), "[$($source -join [Environment]::NewLine)]", [Text.UTF8Encoding]::new($false))
node scripts/bounded-inspection.mjs --source .scratch/issue-source.json --headings 85
node scripts/bounded-inspection.mjs --source .scratch/issue-source.json --section '85:Testing Decisions'
```

A connector can retain its complete structured issue array instead; the adapter accepts `id`/`number` and `body`/`description`. For a retained search response, `--issues publication` projects only matching identifiers/titles and signals more than ten candidates. Comments/history remain in retained source without entering the excerpt. `--headings` shows up to ten section names; `--section '85:Exact subsection'` displays only that selected section (including nested headings). More than 4000 characters or 60 lines exits unsuccessfully with `REFINE`; choose a smaller subsection instead of retrying a whole-body read. Missing or repeated headings require refinement. Full retained source remains available for deliberate edits.

For repository documents, inspect paths and headings first:

```sh
rg --files docs/development
rg -n '^#{1,3} ' docs/development/validation.md docs/development/workstation.md
```

Then read the selected branch/section. An output truncation cap is only a fallback. Exercise the exact local examples with `node --test scripts/bounded-inspection.test.mjs`; no live connector inventory is needed.

## Searching generated reports

Report HTML contains long embedded data and minified scripts. Keep search output bounded:

```sh
rg -n --max-columns 200 --max-columns-preview 'pattern' 'public/Performance-Testing-Mobile/Full Report'
```

Read a small excerpt around a match instead of printing entire embedded lines.
