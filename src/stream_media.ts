import { streamCreatorBrief } from "./media_stream_service.js";

const input = process.argv.slice(2).join(" ") || "clip-42|Launch trailer|video|Three beats for the creator handoff";
const [assetId, title, mediaType, brief] = input.split("|");
const request = { assetId, title, mediaType, brief };

for await (const event of streamCreatorBrief(request)) {
  process.stdout.write(`event: ${event.event}\ndata: ${event.data}\n\n`);
}
