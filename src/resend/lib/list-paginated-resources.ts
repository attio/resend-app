import {complete, isErrored} from "@attio/fetchable"
import type {PaginationOptions} from "resend"
import {createLogger} from "../../utils/logger"
import type {ResendResult} from "../error"

const logger = createLogger("resend/list-paginated-resources")

const PAGINATION_TIME_LIMIT_MS = 10_000
const PAGE_LIMIT = 100

export async function listPaginatedResources<TItem extends {id: string}>({
    resourceLabel,
    list,
}: {
    resourceLabel: string
    list: (options: PaginationOptions) => ResendResult<{data: TItem[]; has_more: boolean}>
}): ResendResult<TItem[]> {
    const resources: TItem[] = []
    let after: string | undefined
    let requestCount = 0
    const startedAt = Date.now()

    while (true) {
        const result = await list(
            after === undefined ? {limit: PAGE_LIMIT} : {limit: PAGE_LIMIT, after}
        )

        if (isErrored(result)) {
            return result
        }

        resources.push(...result.value.data)
        requestCount++

        const nextAfter = result.value.has_more
            ? result.value.data[result.value.data.length - 1]?.id
            : undefined
        if (nextAfter === undefined) {
            break
        }
        after = nextAfter

        const elapsedMs = Date.now() - startedAt
        if (elapsedMs > PAGINATION_TIME_LIMIT_MS) {
            logger.log(
                `${resourceLabel} pagination time budget of ${PAGINATION_TIME_LIMIT_MS}ms exceeded after ` +
                    `${requestCount} request(s) (${elapsedMs}ms elapsed, ${resources.length} results); ` +
                    `returning partial results`
            )
            break
        }
    }

    return complete(resources)
}
