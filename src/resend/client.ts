import {errored, isErrored, map} from "@attio/fetchable"
import {
    type Contact,
    type CreateContactOptions,
    type CreateEmailOptions,
    type CreateEmailRequestOptions,
    type Segment,
    type Template,
    type Topic,
} from "resend"
import type {ResendResult} from "./error"
import {listPaginatedResources} from "./lib/list-paginated-resources"
import {callResend} from "./wrap"

export const resend = {
    /** @see https://resend.com/docs/api-reference/contacts/create-contact */
    async createContact(contact: CreateContactOptions) {
        return callResend("create contact", (client) => client.contacts.create(contact))
    },

    /** @see https://resend.com/docs/api-reference/contacts/list-contacts */
    async listContacts(): ResendResult<Contact[]> {
        return listPaginatedResources({
            resourceLabel: "contacts",
            list: (contactOptions) =>
                callResend("list contacts", (client) => client.contacts.list(contactOptions)),
        })
    },

    /** @see https://resend.com/docs/api-reference/contacts/retrieve-contact */
    async getContact(contactId: string) {
        return callResend("get contact", (client) => client.contacts.get({id: contactId}))
    },

    /** @see https://resend.com/docs/api-reference/segments/list-segments */
    async listSegments(): ResendResult<Segment[]> {
        return listPaginatedResources({
            resourceLabel: "segments",
            list: (segmentOptions) =>
                callResend("list segments", (client) => client.segments.list(segmentOptions)),
        })
    },

    /** @see https://resend.com/docs/api-reference/segments/retrieve-segment */
    async getSegment(segmentId: string) {
        return callResend("get segment", (client) => client.segments.get(segmentId))
    },

    /** @see https://resend.com/docs/api-reference/contacts/add-contact-to-segment */
    async addContactToSegment({contactId, segmentId}: {contactId: string; segmentId: string}) {
        return callResend("add contact to segment", (client) =>
            client.contacts.segments.add({contactId, segmentId})
        )
    },

    /** Add an existing contact by email, or create it with the segment when it does not exist. */
    async addContactToSegmentByEmail({
        contact,
        segmentId,
    }: {
        contact: Pick<CreateContactOptions, "email" | "firstName" | "lastName">
        segmentId: string
    }): ResendResult<{contactId: string}> {
        const existingContact = await callResend("get contact", (client) =>
            client.contacts.get({email: contact.email})
        )

        if (isErrored(existingContact)) {
            if (existingContact.error.code !== "NOT_FOUND") {
                return errored(existingContact.error)
            }

            return map(
                await callResend("create contact", (client) =>
                    client.contacts.create({
                        ...contact,
                        segments: [{id: segmentId}],
                    })
                ),
                ({id}) => ({contactId: id})
            )
        }

        return map(
            await callResend("add contact to segment", (client) =>
                client.contacts.segments.add({
                    contactId: existingContact.value.id,
                    segmentId,
                })
            ),
            () => ({contactId: existingContact.value.id})
        )
    },

    /** @see https://resend.com/docs/api-reference/templates/list-templates */
    async listTemplates(): ResendResult<Array<Pick<Template, "id" | "name" | "alias" | "status">>> {
        return listPaginatedResources({
            resourceLabel: "templates",
            list: (templateOptions) =>
                callResend("list templates", (client) => client.templates.list(templateOptions)),
        })
    },

    /** @see https://resend.com/docs/api-reference/templates/retrieve-template */
    async getTemplate(templateId: string) {
        return callResend("get template", (client) => client.templates.get(templateId))
    },

    /** @see https://resend.com/docs/api-reference/emails/send-email */
    async sendEmail(email: CreateEmailOptions, request?: CreateEmailRequestOptions) {
        return callResend("send email", (client) => client.emails.send(email, request))
    },

    /** @see https://resend.com/docs/api-reference/topics/list-topics */
    async listTopics(): ResendResult<Topic[]> {
        return map(
            await callResend("list topics", (client) => client.topics.list()),
            ({data}) => data
        )
    },

    /** @see https://resend.com/docs/api-reference/topics/get-topic */
    async getTopic(topicId: string) {
        return callResend("get topic", (client) => client.topics.get(topicId))
    },
}
