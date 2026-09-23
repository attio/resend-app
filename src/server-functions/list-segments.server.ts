import {resend} from "../resend/client"

export default async function listSegments() {
    return await resend.listSegments()
}
