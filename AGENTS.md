# AGENTS.md

This file provides guidance to AI agents who are working on the code in this repository.

## Context

[Resend](https://resend.com) integration for Attio. Exposes workflow steps that act on Resend
contacts and send email.

| Block (`src/app/blocks/`) | What it does | Outcomes |
| --- | --- | --- |
| `create-contact/` | Create a contact from an email address, with optional name and subscription status | `success` with `contact_id` |
| `add-contact-to-segment/` | Add an existing contact to a Resend segment by contact ID | `success` with `segment_id` |
| `send-email/` | Send a plain-text email, or a published Resend template | `success` with `email_id` |

Everything else: `src/resend/` (API client), `src/server-functions/` (configurator list/get
controllers), `src/utils/` (logger, combobox options), `src/__mocks__/` (Vitest stub for
`attio/server`).

### External service

- **API:** REST `https://api.resend.com`
  ([docs](https://resend.com/docs/api-reference/introduction))
- **Auth:** workspace Secret connection; the `resend` client sends the key as
  `Authorization: Bearer`
- **Endpoints:** `POST /contacts`, `GET /contacts`, `GET /segments`,
  `POST /contacts/{id}/segments/{segment_id}`, `GET /templates`, `GET /topics`, `POST /emails`

### What is the App SDK?

The App SDK is a set of components and functionality to build apps that are embedded directly in the Attio CRM platform.

#### App SDK capabilities

- Use React to render components provided by the `attio/client` package.
- Run server-side code and make API calls to external services using `.server.ts` files.
- Store API tokens using the connections system.
- Receive incoming requests from third-party services via webhooks.
- Subscribe to events e.g. connection.added
- Manage form rendering, validation and submission with `useForm()`.
- Manage data fetching and async caching with `useAsyncCache()` and `useQuery()`.

## Architecture

### File and folder structure

Entry points are discovered by folder convention under `src/app/` — there is no central manifest. `app.ts` / `app.settings.ts` are the deprecated legacy layout and MUST NOT be added.
See https://docs.attio.com/sdk/extensions/overview for the discovery rules.

| Path                     | Description                                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/extensions`     | One folder per UI [extension](https://docs.attio.com/sdk/extensions/overview), each with an `extension.tsx` that default-exports a single `defineExtension` call. Covers record actions, bulk actions, widgets, object actions and call-recording text actions. |
| `src/app/settings`       | [Workspace settings](https://docs.attio.com/sdk/settings/overview) — `schema.ts` (`defineWorkspaceSchema`) and `page.tsx` (`defineWorkspacePage`)                                                                                   |
| `src/app/events`         | `.event.ts` [event handlers](https://docs.attio.com/sdk/server/events/events) e.g. `connection-added.event.ts`                                                                                                                     |
| `src/app/webhooks`       | `.webhook.ts` [webhook handlers](https://docs.attio.com/sdk/server/webhooks/webhook-handlers)                                                                                                                                      |
| `src/app/blocks`         | One folder per [workflow block](https://docs.attio.com/sdk/workflows/file-structure), named after the block id, with fixed filenames (`block.ts`, `execute.ts`, `configurator.tsx`)                                                 |
| `src/attio`              | Code interacting with the [Attio API](https://docs.attio.com/rest-api/overview)                                                                                                                                                   |
| `src/<service>`          | Code interacting with the third-party service (e.g. `src/notion`). Holds the API client wrapper, error types and helpers.                                                                                                          |
| `src/components`         | React components                                                                                                                                                                                                                  |
| `src/graphql`            | GraphQL queries for the [Attio GraphQL schema](https://docs.attio.com/sdk/graphql/graphql)                                                                                                                                         |
| `src/server-functions`   | `.server.ts` files exposing server-side functions to the client. Treat these like controllers — thin pass-throughs to the API client. `.server.ts` files may live anywhere in `src/`.                                              |
| `src/utils`              | Shared utility functions                                                                                                                                                                                                          |

Do not add `app.ts` / `app.settings.ts`. Workflow blocks live under `src/app/blocks/<id>/`.

## Environment

Code for the app may run either in a client-side or server-side context.

### Client-side code

Client-side code runs in the browser. However, it runs inside a safe sandbox, using a custom JS runtime. This means that:

- You MUST NOT render HTML tags directly e.g. `<div>Hello</div>`. Instead, you MUST only use components provided by the App SDK.
- You MUST NOT use custom styles or CSS. Only use the pre-styled components provided by the App SDK.
- You MUST NOT try to read the DOM directly.
- Some browser APIs may not be available.
- `fetch` calls are not allowed. You MUST NOT call `fetch` directly and should instead use `fetch` via server-side functions.

Files which render React components MUST use the `.tsx` extension.

### Server-side code

Server-side code runs in files ending in:

- `.server.ts`
- `.webhook.ts`
- `.event.ts`

Code that any of the above files import will also run in a server-side environment.

Server-side code DOES NOT run in Node.js but instead in a custom JS runtime. While many Node.js APIs are supported, some are not and you may need to factor this into your decision to use certain packages.

## Using the Attio App SDK

Attio provides three packages to help you build apps:

1. `attio/client` - for client-side imports
2. `attio/server` - for server-side imports
3. `attio` - for shared/environment-agnostic imports

IMPORTANT: Before importing from these packages, you MUST always check one of the following to confirm that your import is correct:

1. Existing examples in the codebase
2. TypeScript type definitions and JSDoc strings for the package
3. The Attio SDK documentation (the `attio-docs` MCP server is configured in `.mcp.json`)

If you are unsure about an import, always check explicitly and do not guess.

## Coding guidelines

- You SHOULD use Zod to validate data from public APIs.
- You SHOULD only include properties in Zod schemas that we explicitly need.
- You SHOULD use try/catch around calls to `.json()`.
- You SHOULD use console.error to capture information about unexpected errors.
- You MUST NOT log sensitive information such as email addresses or passwords.
- You MUST handle API errors gracefully. Do not throw an error within a React component, but instead return a clear fallback UI.
- You SHOULD prefer named arguments over positional arguments when using 3 or more arguments.
- You MUST NOT use `any` when typing your code. Type errors MUST be fixed properly as usage of `any` is a likely source of bugs.
- You SHOULD order functions/values within code so that all values are defined before being used. Default export should go at the bottom of a file.

### API clients

- If there is an official API client for the service, use it (e.g. `@notionhq/client`) unless there is a strong reason not to. Any errors you hit using such a client should be reported as a bug/feature request for AttioJS.
- All API clients MUST be wrapped in a [`@attio/fetchable`](https://www.npmjs.com/package/@attio/fetchable) layer so we get standardized, explicit error handling via `AsyncResult`.
- The wrapper MUST NOT leak transport-layer details. Don't return HTTP status codes on errors — return a semantic error (e.g. `NOT_FOUND`) instead. Test: if you switched from HTTP to GraphQL (or vice versa), would the errors need to change? If yes, they leak.
- Split distinct HTTP statuses into distinct error codes when they call for different user-facing messages or handling — don't collapse them just because the template groups them. `401` (not authenticated — missing/invalid/expired credentials, fixed by reconnecting) and `403` (authenticated but not authorized — the token lacks a scope or permission, reconnecting the same credentials won't help) are the canonical example: map them to `UNAUTHORIZED` and `FORBIDDEN` respectively, not both to `UNAUTHORIZED`.
- Errors SHOULD include extra data useful for logging and for clear messages (e.g. which scopes are missing on an auth error).
- Error message _formatting_ is the responsibility of the caller, not the API client — final messages depend on the context they're rendered in.
- You MUST return data fast enough to avoid the 30s server execution timeout and keep the UI responsive. The usual culprit is pagination — bound paginated calls with a time budget so you stay well under the limit.
- Rate-limit errors SHOULD be retried with appropriate backoff. Retries MUST NOT exceed the 30s timeout.

### App-specific guidelines

- Use the official `resend` npm SDK for the actual HTTP calls. Unlike most clients it does not
  throw on failure — every method resolves to `{data, error}`. All calls MUST go through
  `callResend` in `src/resend/wrap.ts`, which collapses that pair into an
  `AsyncResult<_, ResendApiError>`. Never construct `Resend` or call its methods outside
  `callResend`. Construct it with explicit `baseUrl` and `userAgent` (the SDK defaults) so
  Attio's runtime does not warn that `RESEND_BASE_URL` / `RESEND_USER_AGENT` are unset.
- Keep the response object intact inside `callResend`. Destructuring `{data, error}` breaks the
  discriminated union, so `data` no longer narrows to a value once `error` is ruled out.
- Error mapping is driven by Resend's own `error.name`, not the HTTP status — the names are already
  semantic. The status is consulted only for `application_error`, where a null `statusCode` is the
  one signal that the request never reached Resend (`NETWORK_ERROR`) rather than Resend answering
  badly (`RESEND_API_ERROR`).
- `validation_error` about an unverified sending domain maps to `UNVERIFIED_DOMAIN` with copy that
  does not name the domain. Other validation failures stay `INVALID_REQUEST`. Never put HTTP status
  codes, raw JSON, or Resend's domain-specific message on the error.
- `mapResendError` needs a `default` branch: `allowUnreachableCode` is off, so a trailing return
  after an exhaustive switch fails typecheck. The default also catches error codes added by a
  newer Resend release than the pinned client.
- The client renames fields to snake_case on the wire (`firstName` → `first_name`). Tests that
  assert on a request body MUST use the wire names.
- Auth is a workspace API key. Do not set `requireUserConnection`.
- `Resend`'s constructor throws when handed an empty key, which is the only throw `callResend`
  expects to catch. Map that to `UNAUTHORIZED`.
- Email is the contact identity key on create. A repeated `contacts.create` with the same email
  returns the same contact id and applies name/subscription changes to it, so a retried execution
  is safe even though `CreateContactRequestOptions` has no idempotency key. Between workflow
  blocks, pass that contact id — Create contact only outputs `contact_id`, and Add contact to
  segment only accepts an id.
- Send email requires `from`, `to`, and `subject` in the configurator. Plain text and template
  are optional in the form; Resend still needs one of them. The configurator cannot require
  one-of-two, so those fields stay optional and share help text; execute returns "Plain text or a
  template is required." if neither is set. If a template is selected, omit `text` — Resend
  rejects that mix. `from` and `subject` in the payload override the template defaults. Selecting
  a published template loads `GET /templates/{id}` and renders one value field per variable,
  labelled with the key, bound as `templateVariables.${templateId}.${key}` on a nested
  `ConfigSchema.record(record(string()))`. Every variable is required — Resend rejects a send that
  omits any of them. Execute reads only the map for the selected template id. After changing
  storage shape, remove and re-add the block once so leftover flat keys from earlier spikes do not
  block publish.
- Send email is not naturally idempotent. Pass `metadata.uniqueExecutionId` as `idempotencyKey`
  so a retried workflow run does not create a second email.
- Pass contacts as the non-audience overload so the call lands on `POST /contacts`. `audienceId`
  selects a deprecated path; use `segments` if grouping is needed.
- Use `createLogger` from `src/utils/logger`, not bare `console.error`.
- Reuse `resendErrorMessage` from execute handlers. Never include HTTP status codes or raw JSON in
  user-facing copy.
- Trust the official SDK's response types. Do not Zod-parse Resend payloads.
- Never log email addresses, names, or raw Resend response bodies. Note the SDK itself
  console.errors error bodies unless `process.env.NODE_ENV` is `"production"` (it no-ops where
  `process` is undefined).
- Do not retry Resend calls in-process. Surface the error once and set the workflow `retryable`
  flag from `isRetryable`.

### Getting connections

When `getUserConnection()` / `getWorkspaceConnection()` is called, you MUST NOT wrap it in a try/catch. These functions throw special `AttioError`s that power the connection dialogs in the UI. Call them OUTSIDE the try/catch, then proceed with the rest of your API code handling errors as normal.

### `.server.ts` files

Treat server functions like controllers — thin pass-throughs that call into the API client and return its `AsyncResult`. Keep business logic in the client/service layer.

### Workflow block configurators

- A configurator that loads data MUST keep loading until it is fully ready, **including all `Outcome`s**. Declare outcomes up front — the editor does NOT treat a block as loading just because it has no outcomes yet, so leaving them undeclared while data loads causes `Invalid path` errors in downstream blocks.
- You SHOULD load `ComboboxInput` options via an options provider (the `options` prop) rather than fetching the list yourself — outcomes stay stable and there is no loading state to manage.
- For other data, use `useAsyncCache` as a one-time, stable load with a fixed cache key. Do NOT re-key it off a value the member is still editing, or the block re-loads on every change.
- See https://docs.attio.com/sdk/workflows/configurator for details.

### Logging

- You MUST NOT log PII e.g. email addresses, physical addresses.
- Apps MUST NOT be submitted with temporary debug logging in place.

### User-facing error messages

- All error messages must be clean — don't dump raw JSON, square brackets etc into the UI.
- Don't leak technical detail the user doesn't care about (say "An unexpected error occurred when calling Notion's API", not "503 error from Notion").
- Strive to be actionable. If the user hits an auth error because a scope is missing, tell them which scope and, ideally, where to configure it.

### Testing

- Where appropriate, use Vitest to add unit tests. Aim for tests that increase confidence in the correctness of non-trivial logic (parsing, error mapping, helpers).
- Do NOT test React components with React Testing Library or similar.
- When passing functions/classes to `describe`, pass the value directly — `describe(myFn, () => {})`, not `describe("myFn", () => {})`.

## Reference: wrapping a service in `@attio/fetchable`

When you add a third-party service, follow this shape. Put it under `src/<service>/`.
This is the canonical pattern — copy and adapt it; don't invent a different one.

**1. Transport-agnostic error type** (`src/<service>/error.ts`):

```ts
// No HTTP status codes leak out — just semantic codes the caller can switch on.
export type ServiceAPIError =
    | {code: "NOT_FOUND"}
    | {code: "RATE_LIMITED"}
    | {code: "UNAUTHORIZED"} // 401 — not authenticated (missing/invalid/expired credentials)
    | {code: "FORBIDDEN"} // 403 — authenticated, but not allowed (missing scope/permission)
    | {code: "INVALID_REQUEST"}
    | {code: "SERVICE_API_ERROR"} // 5xx from upstream
    | {code: "UNEXPECTED_ERROR"}
```

**2. A wrapper that authenticates and maps failures onto those codes** (`src/<service>/wrap.ts`):

```ts
import {type AsyncResult, complete, errored} from "@attio/fetchable"
import {getWorkspaceConnection} from "attio/server"
import type {ServiceAPIError} from "./error"

const SERVICE_API_BASE_URL = "https://api.example.com/v1"

/** Single place mapping an upstream HTTP response onto our semantic errors. */
function mapStatusToError(status: number): ServiceAPIError {
    switch (status) {
        case 400:
            return {code: "INVALID_REQUEST"}
        case 401:
            return {code: "UNAUTHORIZED"}
        case 403:
            return {code: "FORBIDDEN"}
        case 404:
            return {code: "NOT_FOUND"}
        case 429:
            return {code: "RATE_LIMITED"}
        default:
            return status >= 500 ? {code: "SERVICE_API_ERROR"} : {code: "UNEXPECTED_ERROR"}
    }
}

export async function wrapService(
    path: string,
    init: RequestInit = {}
): AsyncResult<unknown, ServiceAPIError> {
    // Throws an AttioError if the user hasn't connected. This powers the connection
    // dialog in the UI, so it MUST stay outside the try/catch below.
    const connection = getWorkspaceConnection()

    try {
        const response = await fetch(`${SERVICE_API_BASE_URL}${path}`, {
            ...init,
            headers: {
                authorization: `Bearer ${connection.value}`,
                "content-type": "application/json",
                ...init.headers,
            },
        })

        if (!response.ok) {
            return errored(mapStatusToError(response.status))
        }

        try {
            return complete(await response.json())
        } catch (error) {
            console.error("[service] failed to parse response body", error)
            return errored({code: "UNEXPECTED_ERROR"})
        }
    } catch (error) {
        console.error("[service] network error calling service API", error)
        return errored({code: "UNEXPECTED_ERROR"})
    }
}
```

**3. A typed client that validates responses with Zod** (`src/<service>/client.ts`):

```ts
import {type AsyncResult, bind, complete, errored} from "@attio/fetchable"
import {z} from "zod"
import type {ServiceAPIError} from "./error"
import {wrapService} from "./wrap"

// Only model the fields we actually use.
const WidgetSchema = z.object({id: z.string(), name: z.string()})
export type Widget = z.infer<typeof WidgetSchema>

export const service = {
    /** @see https://api.example.com/docs/widgets */
    async getWidget(id: string): AsyncResult<Widget, ServiceAPIError> {
        return bind(await wrapService(`/widgets/${id}`), (body) => {
            const parsed = WidgetSchema.safeParse(body)
            if (!parsed.success) {
                console.error("[service] unexpected widget shape", parsed.error)
                return errored({code: "UNEXPECTED_ERROR"})
            }
            return complete(parsed.data)
        })
    },
}
```

**4. A thin server-function controller** (`src/server-functions/get-widget.server.ts`):

```ts
import {service} from "../service/client"

export default async function getWidget(id: string) {
    return await service.getWidget(id)
}
```

**Paginated endpoints** must be bounded by a wall-clock budget so they stay under the
30s server timeout — accumulate pages in a loop and `break` once you exceed a
conservative budget (~10s), logging that you returned partial results.

## Validation

You MUST validate all your changes using the commands in `package.json`. CI runs the same checks on every PR.

- Validate formatting: `pnpm run format:check`
- Run and fix lint rules: `pnpm run lint:fix`
- Validate types: `pnpm run typecheck`
- Check for dead code: `pnpm run knip`
- Run tests: `pnpm run test`
