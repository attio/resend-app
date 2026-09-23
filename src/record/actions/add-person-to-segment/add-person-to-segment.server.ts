import {resend} from "../../../resend/client"

export type PersonForResend = {
    email: string
    firstName: string | null
    lastName: string | null
}

export default async function addPersonToSegment({
    person,
    segmentId,
}: {
    person: PersonForResend
    segmentId: string
}) {
    return await resend.addContactToSegmentByEmail({
        contact: {
            email: person.email,
            firstName: person.firstName ?? undefined,
            lastName: person.lastName ?? undefined,
        },
        segmentId,
    })
}
