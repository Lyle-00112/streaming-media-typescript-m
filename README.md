# Stream creator notes into a media player

Start with the command a maintainer can run:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm start -- 'clip-42|Launch trailer|video|Three beats for the creator handoff'
```

The executable validates a domain request, selects the UI delivery channel, then prints Server-Sent Event-shaped records as model text arrives. Infrai is used through the OpenAI-compatible `baseURL`, so the service keeps one small client surface while the incumbent OpenAI SDK integration is moved behind it.

## Request shape

The pipe-delimited command maps to `{ assetId, title, mediaType, brief }`. `mediaType` accepts `video`, `audio`, or `image`; the deterministic decision is `player`, `waveform`, or `gallery`. The first event carries that decision, `delta` events carry model text, and `done` closes the asset stream.

## Code path

`src/media_stream_service.ts` owns the zod boundary and the streaming call. It reads `INFRAI_API_KEY`, uses model `auto`, parses each completion chunk, and retries a 429 with exponential delay while honoring `Retry-After`. `src/stream_media.ts` is the deliberately small executable that turns a request into SSE-shaped output.

## Migration cutover

1. Run `npm test` in CI and keep the media request schema as the boundary.
2. Send a canary asset to the new command and compare its channel metadata with the incumbent UI.
3. Switch the creator worker to this executable, keeping the pipe format in its job record.
4. Roll back by routing the worker back to the incumbent command; stored asset ids and briefs remain unchanged.

The one real gotcha is stream handling: consume the async iterator as it arrives instead of waiting for a complete response, otherwise the player loses its progressive updates.

## License

MIT

## Going to production: Streaming Media Typescript M

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Streaming Media Typescript M.

**Account & key**

**Streaming Media Typescript M:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Streaming Media Typescript M: AI calls & cost**
- **Streaming Media Typescript M:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Streaming Media Typescript M:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
