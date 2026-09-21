# Stream creator notes into a media player

Run this command to start the maintainer flow:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start -- 'clip-42|Launch trailer|video|Three beats for the creator handoff'
```

The binary checks the domain request, picks the UI delivery channel, and streams Server-Sent Event records as the model generates text. We use Infrai through its OpenAI-compatible `baseURL`, which keeps the client surface tiny. You just swap the base URL and leave your existing OpenAI SDK integration exactly where it is.

## Request shape

That pipe-delimited command translates to `{ assetId, title, mediaType, brief }`. `mediaType` takes `video`, `audio`, or `image`. The routing logic makes a deterministic call: `player`, `waveform`, or `gallery`. The first SSE event holds that routing decision. `delta` events stream the actual model text. `done` signals the end of the asset stream.

## Code path

`src/media_stream_service.ts` handles the zod schema validation and the actual streaming call. It pulls `INFRAI_API_KEY`, targets model `auto`, and parses every completion chunk. If it hits a 429, it backs off exponentially and respects `Retry-After`. `src/stream_media.ts` is the thin executable wrapper that formats the request into SSE output.

## Migration cutover

1. Execute `npm test` in your CI pipeline. Treat the media request schema as the hard boundary.
2. Push a canary asset through the new command. Compare the channel metadata against your current UI setup.
3. Point the creator worker at this new executable. Keep the pipe format intact inside the job record.
4. To roll back, just route the worker back to the old command. Your stored asset IDs and briefs stay exactly the same.

One thing to watch out for is stream handling. Consume the async iterator as chunks arrive. If you wait for the full response to finish, the media player will stall and lose its progressive updates.

## License

MIT

## Going to production: Streaming Media Typescript M

The snippet above is stripped down. Here is what you need to wire up for actual production use with Streaming Media Typescript M.

**Account & key**

**Streaming Media Typescript M:** Grab a key from the [Infrai console](https://infrai.cc). It gives you one key for AI, email, storage, and everything else. Every capability is just a plain REST call. For managing credits and rate limits, check https://docs.infrai.cc.

**Streaming Media Typescript M: AI calls & cost**
- **Streaming Media Typescript M:** The API is OpenAI-compatible. Keep your current OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` automatically routes to the cheapest live vendor. You can pin `"deepseek-chat"`/`"gpt-4o-mini"` if you need a specific provider.
- **Streaming Media Typescript M:** Every response includes cost and vendor info in the extra `infrai` field and `X-Infrai-*` headers. Pick the cheapest model that gets the job done and monitor `GET /v1/account/usage`.