import {Extensions, runQuery, showDialog, showToast} from "attio/client"
import getPersonForSegment from "../../../graphql/get-person-for-segment.graphql"
import AddPersonToSegmentDialog from "../../../record/actions/add-person-to-segment/add-person-to-segment-dialog"

export default Extensions.defineExtension({
    type: "record-action",
    id: "add-person-to-segment",
    label: "Add to segment",
    objects: "people",
    onTrigger: async ({recordId}) => {
        const {person} = await runQuery(getPersonForSegment, {recordId})

        if (!person) {
            await showToast({
                variant: "error",
                title: "Person not found",
                text: "Could not load this Person record from Attio.",
            })
            return
        }

        const [email, ...otherEmails] = person.email_addresses
            .map((address) => address.trim())
            .filter((address) => address !== "")

        if (email === undefined) {
            await showToast({
                variant: "error",
                title: "No email address",
                text: "This person has no email address. Add an email before adding them to a segment.",
            })
            return
        }

        const personForResend = {
            email,
            otherEmails,
            firstName: person.name?.first_name ?? null,
            lastName: person.name?.last_name ?? null,
        }
        const fullName = person.name?.full_name?.trim()

        await showDialog({
            title: fullName ? `Add ${fullName} to segment` : "Add person to segment",
            Dialog: ({hideDialog}) => (
                <AddPersonToSegmentDialog person={personForResend} hideDialog={hideDialog} />
            ),
        })
    },
})
