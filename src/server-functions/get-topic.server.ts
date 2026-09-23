import {resend} from "../resend/client"

export default async function getTopic(topicId: string) {
    return await resend.getTopic(topicId)
}
