# Remove Interests and development from Skills

Tracker: [GitHub issue #89](https://github.com/komed-uth/Game-QA-Portfolio/issues/89).

The owner confirmed this scope on 2026-10-12 and authorized implementation.
This supersedes the Skills interests requirements in the earlier #74/#77 scope;
their validation records remain historical evidence of the previous page.

- Remove the entire Interests and development section, including its heading
  and the sentence listing player psychology, neuroscience, game design,
  Unreal Engine, and automated testing in games.
- Skills ends with Tools, following QA capabilities. Add no replacement section.
- Keep About me and its game design/player psychology motivation unchanged.
- Preserve capabilities, tools, evidence links, navigation, and the legacy
  QA approach redirect.

Verify the production build and rendered Skills checks, including the remaining
section order and absence of the removed copy. Run the existing About me checks
to confirm the approved biography still renders unchanged. Review the narrow
and wide captures produced by these checks.

This change introduces no new domain term or lasting architectural trade-off;
no ADR is needed. Merging into main or deploying requires separate authorization.
