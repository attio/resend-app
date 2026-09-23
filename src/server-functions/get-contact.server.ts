import {resend} from "../resend/client"

export default async function getContact(contactId: string) {
    return await resend.getContact(contactId)
}
