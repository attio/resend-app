import {complete, errored, type Result} from "@attio/fetchable"
import type {CreateEmailOptions} from "resend"

type EmailAddress = {normalized: string}

export type SendEmailFields = {
    from: EmailAddress
    fromName?: string
    to: EmailAddress
    subject: string
    cc?: EmailAddress[]
    bcc?: EmailAddress[]
    replyTo?: EmailAddress[]
    scheduledAt?: Date | string | number
    text?: string
    templateId?: string
    templateVariables?: Record<string, string>
    tags?: Array<{name: string; value: string}>
    topicId?: string
    attachments?: Array<{filename: string; path: string}>
}

export const EMAIL_BODY_REQUIRED = "Plain text or a template is required."

export function pickTemplateVariables(
    saved: Record<string, string> | undefined,
    keys: string[]
): Result<Record<string, string>, {message: string}> {
    const variables: Record<string, string> = {}
    const missing: string[] = []

    for (const key of keys) {
        const value = saved?.[key]
        if (value === undefined) {
            missing.push(key)
            continue
        }

        variables[key] = value
    }

    if (missing.length > 0) {
        return errored({
            message:
                missing.length === 1
                    ? `Template updated. Set the ${missing[0]} variable in the editor.`
                    : `Template updated. Set these variables in the editor: ${missing.join(", ")}.`,
        })
    }

    return complete(variables)
}

export function buildCreateEmailOptions(
    fields: SendEmailFields
): Result<CreateEmailOptions, {code: "INVALID_REQUEST"; message: string}> {
    let scheduledAt: string | undefined
    if (fields.scheduledAt !== undefined) {
        const epochMs =
            fields.scheduledAt instanceof Date
                ? fields.scheduledAt.getTime()
                : typeof fields.scheduledAt === "number"
                  ? fields.scheduledAt
                  : Date.parse(fields.scheduledAt)

        if (!Number.isFinite(epochMs)) {
            return errored({
                code: "INVALID_REQUEST",
                message: "The scheduled time isn't a valid date.",
            })
        }

        scheduledAt = new Date(epochMs).toISOString()
    }

    const createEmailFields = {
        from:
            fields.fromName === undefined
                ? fields.from.normalized
                : `${fields.fromName} <${fields.from.normalized}>`,
        to: fields.to.normalized,
        subject: fields.subject,
        cc: fields.cc?.length ? fields.cc.map((address) => address.normalized) : undefined,
        bcc: fields.bcc?.length ? fields.bcc.map((address) => address.normalized) : undefined,
        replyTo: fields.replyTo?.length
            ? fields.replyTo.map((address) => address.normalized)
            : undefined,
        scheduledAt,
        tags: fields.tags?.length ? fields.tags : undefined,
        topicId: fields.topicId,
        attachments: fields.attachments?.length ? fields.attachments : undefined,
    }

    if (fields.templateId !== undefined) {
        return complete({
            ...createEmailFields,
            template: {
                id: fields.templateId,
                variables: fields.templateVariables,
            },
        })
    }

    if (fields.text === undefined) {
        return errored({
            code: "INVALID_REQUEST",
            message: EMAIL_BODY_REQUIRED,
        })
    }

    return complete({
        ...createEmailFields,
        text: fields.text,
    })
}
