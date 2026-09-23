import {resend} from "../resend/client"

export default async function listTopics() {
    return await resend.listTopics()
}
