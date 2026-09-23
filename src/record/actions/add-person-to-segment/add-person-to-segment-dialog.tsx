import {isErrored} from "@attio/fetchable"
import {
    Banner,
    Button,
    Forms,
    LoadingState,
    type PlainComboboxOptionsProvider,
    showToast,
    useAsyncCache,
    useForm,
    type ValueOf,
} from "attio/client"
import {Suspense} from "react"
import type {Segment} from "resend"
import {resendErrorMessage} from "../../../resend/messages"
import listSegments from "../../../server-functions/list-segments.server"
import addPersonToSegment, {type PersonForResend} from "./add-person-to-segment.server"

type Props = {
    person: PersonForResend & {otherEmails: string[]}
    hideDialog: () => void
}

const schema = {
    email: Forms.string(),
    segmentId: Forms.string(),
}

function createEmailOptionsProvider(emails: string[]): PlainComboboxOptionsProvider {
    return {
        getOption: async (value) => (emails.includes(value) ? {label: value} : undefined),

        search: async (query) => {
            const needle = query.trim().toLowerCase()
            return emails
                .filter((email) => needle === "" || email.toLowerCase().includes(needle))
                .map((email) => ({label: email, value: email}))
        },
    }
}

function AddPersonToSegmentForm({person, segments, hideDialog}: Props & {segments: Segment[]}) {
    const addresses = [person.email, ...person.otherEmails]
    const canChooseEmail = addresses.length > 1
    const {Form, Combobox, SubmitButton, TextInput} = useForm(schema, {
        email: person.email,
        segmentId: "",
    })

    const handleSubmit = async (values: ValueOf<typeof schema>) => {
        const selectedSegmentId = values.segmentId.trim()
        if (selectedSegmentId.length === 0) {
            await showToast({
                variant: "error",
                title: "No segment selected",
                text: "Select a segment before adding this person.",
            })
            return
        }

        const selectedSegment = segments.find((segment) => segment.id === selectedSegmentId)
        const {updateToast} = await showToast({
            variant: "neutral",
            title: "Adding person to segment",
            dismissable: false,
            durationMs: 60_000,
        })

        const result = await addPersonToSegment({
            person: {
                email: values.email,
                firstName: person.firstName,
                lastName: person.lastName,
            },
            segmentId: selectedSegmentId,
        })
        if (isErrored(result)) {
            await updateToast({
                variant: "error",
                title: "Could not add person to segment",
                text: resendErrorMessage(result.error),
                dismissable: true,
                durationMs: 10_000,
            })
            return
        }

        await updateToast({
            variant: "success",
            title: "Person added to segment",
            text: selectedSegment
                ? `${values.email} was added to ${selectedSegment.name}.`
                : `${values.email} was added to the Resend segment.`,
            dismissable: true,
            durationMs: 4_000,
        })
        hideDialog()
    }

    return (
        <>
            {segments.length === 0 ? (
                <Banner variant="warning">
                    No segments were found in Resend. Create a segment before adding people.
                </Banner>
            ) : null}
            <Form onSubmit={handleSubmit}>
                {canChooseEmail ? (
                    <Combobox
                        name="email"
                        label="Email"
                        searchPlaceholder="Search email addresses"
                        options={createEmailOptionsProvider(addresses)}
                    />
                ) : (
                    <TextInput name="email" label="Email" disabled />
                )}
                <Combobox
                    name="segmentId"
                    label="Segment"
                    placeholder="Select a segment"
                    options={segments.map((segment) => ({
                        value: segment.id,
                        label: segment.name.length > 0 ? segment.name : segment.id,
                    }))}
                    disabled={segments.length === 0}
                />
                <SubmitButton label="Add to segment" />
            </Form>
        </>
    )
}

function AddPersonToSegmentDialogLoaded({person, hideDialog}: Props) {
    const {
        values: {segments},
    } = useAsyncCache({segments: listSegments})

    if (isErrored(segments)) {
        return (
            <>
                <Banner variant="error">{resendErrorMessage(segments.error)}</Banner>
                <Button label="Close" onClick={hideDialog} />
            </>
        )
    }

    return (
        <AddPersonToSegmentForm person={person} segments={segments.value} hideDialog={hideDialog} />
    )
}

export default function AddPersonToSegmentDialog(props: Props) {
    return (
        <Suspense fallback={<LoadingState>Loading Resend segments…</LoadingState>}>
            <AddPersonToSegmentDialogLoaded {...props} />
        </Suspense>
    )
}
