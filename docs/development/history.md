# History reference

[Task index](validation.md).

## Synchronize history before implementation

Before editing, identify the intended remote and branch from the task and the checkout's upstream. Use that branch explicitly; it may differ from `main`. Inspect local changes, fetch the remote, and compare ancestry and patch equivalence:

```sh
git status --short --branch
git remote -v
git branch -vv
git fetch <remote>
git log --left-right --cherry-mark --oneline HEAD...<remote>/<branch>
git rev-list --left-right --count HEAD...<remote>/<branch>
```

Preserve uncommitted work before changing history. When behind with no local commits, fast-forward with `git merge --ff-only <remote>/<branch>`. When histories diverge, inspect the local-only commits and use the fetched remote history as the base, replaying only genuinely unpublished changes. `=` in the cherry-mark output identifies equivalent patches with different SHAs; retain the published commits instead of merging duplicate local copies. Preserve local commits on a backup branch before replacing their history, and preserve uncommitted files separately. Avoid hard resets and force pushes as routine synchronization.

Implementation starts only when the intended remote tip is an ancestor of `HEAD` (`git merge-base --is-ancestor <remote>/<branch> HEAD` succeeds) and all remaining local-only commits are understood as unpublished work. If fetching fails, report that synchronization is blocked before implementing.

## After connector-created commits

A connector can publish equivalent changes with different commit SHAs. Record its returned SHA, fetch the intended branch again, and verify that the published SHA is reachable from the fetched branch. Synchronize the local checkout onto that published history using the procedure above before further edits or a local push. Compare the resulting file tree with the tested source; revalidate if the content changed.

Completion requires the published SHA to be an ancestor of local `HEAD`, with only intentionally unpublished work remaining. If all task changes were published, local `HEAD` must equal the fetched branch tip. Confirm this using `git rev-parse HEAD <remote>/<branch>` and the left/right history checks above. Verify again after any later connector write.

## Bounded merge inspection

Inspect filenames first when incoming work includes generated HTML or image evidence:

```sh
git diff --name-status HEAD <remote>/<branch>
git diff HEAD <remote>/<branch> -- src scripts package.json .github
git merge-tree --write-tree --name-only HEAD <remote>/<branch>
```

The last command reports the candidate tree and conflict paths (exit 1 means conflicts); it creates Git objects without changing the checkout or refs. Request a text diff for a specific documentation file when needed, and inspect images visually. This keeps generated report data and image contents out of merge-inspection output.
