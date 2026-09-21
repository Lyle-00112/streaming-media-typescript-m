import assert from "node:assert/strict";
import { deliveryChannel, mediaRequestSchema } from "./media_stream_service.js";

const request = mediaRequestSchema.parse({ assetId: "a-7", title: "Session cut", mediaType: "audio", brief: "Intro and outro" });
assert.equal(deliveryChannel(request.mediaType), "waveform");
assert.throws(() => mediaRequestSchema.parse({ assetId: "", title: "", mediaType: "video", brief: "" }));
console.log("media request boundary: ok");
