import {resend} from "../resend/client"

export default async function getSegment(segmentId: string) {
    return await resend.getSegment(segmentId)
}
