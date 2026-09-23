import {resend} from "../resend/client"

export default async function getTemplate(templateId: string) {
    return await resend.getTemplate(templateId)
}
