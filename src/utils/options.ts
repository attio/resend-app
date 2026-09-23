import {isErrored, map, type Result} from "@attio/fetchable"
import {type PlainComboboxOptionsProvider, showToast, useAsyncCache} from "attio/client"
import {matchSorter} from "match-sorter"
import {useEffect} from "react"
import type {Contact, Template} from "resend"
import type {ResendApiError} from "../resend/error"
import {resendErrorMessage} from "../resend/messages"
import getContact from "../server-functions/get-contact.server"
import getSegment from "../server-functions/get-segment.server"
import getTemplate from "../server-functions/get-template.server"
import getTopic from "../server-functions/get-topic.server"
import listContacts from "../server-functions/list-contacts.server"
import listSegments from "../server-functions/list-segments.server"
import listTemplates from "../server-functions/list-templates.server"
import listTopics from "../server-functions/list-topics.server"

function formatContactOption(contact: Contact) {
    const name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim()

    return {
        value: contact.id,
        label: name.length > 0 ? `${name} (${contact.email})` : contact.email,
    }
}

function formatNamedOption({id, name}: {id: string; name: string}) {
    return {
        value: id,
        label: name.length > 0 ? name : id,
    }
}

function formatTemplateOption(template: Pick<Template, "id" | "name" | "alias">) {
    return {
        value: template.id,
        label: template.name.length > 0 ? template.name : (template.alias ?? template.id),
    }
}

function useCachedOptions<TItem extends {id: string}, TKey extends string>({
    result,
    invalidate,
    cacheKey,
    subject,
    formatOption,
    searchKey,
    resolveMissing,
}: {
    result: Result<TItem[], ResendApiError>
    invalidate: (key: TKey) => void
    cacheKey: TKey
    subject: string
    formatOption: (item: TItem) => {value: string; label: string}
    searchKey: (keyof TItem & string) | ReadonlyArray<keyof TItem & string>
    resolveMissing: (value: string) => Promise<Result<TItem, ResendApiError>>
}): PlainComboboxOptionsProvider {
    const errorMessage = isErrored(result) ? resendErrorMessage(result.error) : undefined

    useEffect(() => {
        if (errorMessage !== undefined) {
            showToast({
                title: `Could not load Resend ${subject}`,
                text: errorMessage,
                variant: "error",
                durationMs: 10_000,
            })

            return () => invalidate(cacheKey)
        }

        return
    }, [cacheKey, errorMessage, invalidate, subject])

    const items = isErrored(result) ? [] : result.value

    return {
        search: async (query) => {
            const keys = Array.isArray(searchKey) ? [...searchKey] : [searchKey]
            const filtered = query.length === 0 ? items : matchSorter(items, query, {keys})

            return filtered.map(formatOption)
        },
        getOption: async (value) => {
            const cached = items.find((item) => item.id === value)
            if (cached !== undefined) {
                return {label: formatOption(cached).label}
            }

            const fetched = await resolveMissing(value)
            if (isErrored(fetched)) {
                showToast({
                    title: `Could not load Resend ${subject}`,
                    text: resendErrorMessage(fetched.error),
                    variant: "error",
                    durationMs: 10_000,
                })
                return undefined
            }

            return {label: formatOption(fetched.value).label}
        },
    }
}

export function useContactOptions(): PlainComboboxOptionsProvider {
    const {
        values: {contactsResult},
        invalidate,
    } = useAsyncCache({contactsResult: listContacts})

    return useCachedOptions({
        result: contactsResult,
        invalidate,
        cacheKey: "contactsResult",
        subject: "contacts",
        formatOption: formatContactOption,
        searchKey: ["email", "first_name", "last_name", "id"],
        resolveMissing: getContact,
    })
}

export function useSegmentOptions(): PlainComboboxOptionsProvider {
    const {
        values: {segmentsResult},
        invalidate,
    } = useAsyncCache({segmentsResult: listSegments})

    return useCachedOptions({
        result: segmentsResult,
        invalidate,
        cacheKey: "segmentsResult",
        subject: "segments",
        formatOption: formatNamedOption,
        searchKey: ["name", "id"],
        resolveMissing: getSegment,
    })
}

export function useTemplateOptions(): PlainComboboxOptionsProvider {
    const {
        values: {templatesResult},
        invalidate,
    } = useAsyncCache({templatesResult: listTemplates})

    const published = map(templatesResult, (templates) =>
        templates.filter((template) => template.status === "published")
    )

    return useCachedOptions({
        result: published,
        invalidate,
        cacheKey: "templatesResult",
        subject: "templates",
        formatOption: formatTemplateOption,
        searchKey: ["name", "alias", "id"],
        resolveMissing: getTemplate,
    })
}

export function useTopicOptions(): PlainComboboxOptionsProvider {
    const {
        values: {topicsResult},
        invalidate,
    } = useAsyncCache({topicsResult: listTopics})

    return useCachedOptions({
        result: topicsResult,
        invalidate,
        cacheKey: "topicsResult",
        subject: "topics",
        formatOption: formatNamedOption,
        searchKey: ["name", "id"],
        resolveMissing: getTopic,
    })
}
