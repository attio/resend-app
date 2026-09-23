import {resend} from "../resend/client"

export default async function listContacts() {
    return await resend.listContacts()
}
