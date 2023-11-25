import type {RequestEvent} from "@sveltejs/kit";
import {error} from "@sveltejs/kit";
import * as utils from "@house-search/utils"

export async function GET(req: RequestEvent) {
    const env = req.platform?.env
    if (!env) throw error(500, "Environment is not set up.")
    const search = req.url.searchParams.get("q")
    if (!search) throw error(400, "Missing search query")
    const embedding = await utils.ai.createEmbedding(search, {
        cloudflareAccountId: env.CLOUDFLARE_ACCOUNT_ID,
        cloudflareApiKey: env.CLOUDFLARE_API_KEY
    })
    const result = (await env.VECTORIZE_INDEX.query(embedding, {
        topK: 1
    })).matches[0]
    if (!result) return {result: "Could not find any matches."}
    const metadata = (await env.VECTORIZE_INDEX.getByIds([result.vectorId]))[0].metadata
    return Response.json({
        result: JSON.stringify(metadata)
    })
}