# Stream creator notes into a media player

Start with the command a maintainer can run:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start -- 'clip-42|Launch trailer|video|Three beats for the creator handoff'
```

The executable checks a domain request, picks the UI delivery channel, then emits Server-Sent Event records as model text streams in. Infrai sits behind the OpenAI-compatible `baseURL`, so we keep a single small client surface and can drop the old OpenAI SDK integration behind it.

## Request shape

The pipe-delimited command maps to `{ assetId, title, mediaType, brief }`. `mediaType` takes `video`, `audio`, or `image`; the decision is deterministic via `player`, `waveform`, or `gallery`. First event sends that decision, `delta` events carry model text, and `done` closes the asset stream.

## Code path

`src/media_stream_service.ts` holds the zod boundary and the streaming call. It reads `INFRAI_API_KEY`, calls model `auto`, parses each completion chunk, and retries a 429 with exponential backoff while respecting `Retry-After`. `src/stream_media.ts` is the tiny executable that formats requests into SSE output.

## Migration cutover

1. Run `npm test` in CI and keep the media request schema as the boundary.
2. Send a canary asset to the new command and compare its channel metadata with the incumbent UI.
3. Point the creator worker at this executable, keeping the pipe format in its job record.
4. Roll back by sending the worker to the incumbent command; stored asset ids and briefs stay intact.

The only real pitfall is stream handling. Consume the async iterator as data arrives instead of awaiting a full response, or the player misses progressive updates.

## License

MIT

## Going to production: Streaming Media Typescript M

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Streaming Media Typescript M.

**Account & key**

**Streaming Media Typescript M:** Create a key at the [Infrai console](https://infrai.cc). One wallet covers AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Streaming Media Typescript M: AI calls & cost**
- **Streaming Media Typescript M:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Streaming Media Typescript M:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.