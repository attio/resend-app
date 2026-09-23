# Resend

Resend app for Attio, built with the [App SDK](https://docs.attio.com/sdk/overview).

## Overview

[Resend](https://resend.com) is an email API for developers. This app exposes Resend actions as
Attio workflow steps, so a workflow can push people from the CRM into Resend's contact list.

## Features

- **Create contact** workflow step — create a Resend contact from an email address, with an
  optional name and subscription status
- **Add contact to segment** workflow step — add an existing Resend contact to a segment

## Folder structure

| Path             | Description                                                                                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/app`               | Entry points, discovered by folder convention: `extensions/`, `settings/`, `events/`, `webhooks/`, `blocks/` ([App structure](https://docs.attio.com/sdk/extensions/overview)) |
| `src/resend`            | Code interacting with the [Resend API](https://resend.com/docs/api-reference/introduction) — the client wrapper, error types and messages                                       |
| `src/server-functions`  | Thin controllers the block configurator calls to list/get contacts and segments                                                                                                |
| `src/utils`             | Shared utility functions                                                                                                                                                       |
| `src/__mocks__`         | Vitest stubs for `attio/server`                                                                                                                                                |

## Development

```bash
pnpm install      # install dependencies
pnpm run dev      # run the app in dev mode
pnpm run lint     # lint
pnpm run test     # run tests
```

See `AGENTS.md` for architecture and coding guidelines.
