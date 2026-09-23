import {resend} from "../resend/client"

export default async function listTemplates() {
    return await resend.listTemplates()
}
