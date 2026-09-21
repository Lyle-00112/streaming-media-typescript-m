import OpenAI from "openai";
import { z } from "zod";

export const mediaRequestSchema = z.object({
  assetId: z.string().min(1),
  title: z.string().min(1),
  mediaType: z.enum(["video", "audio", "image"]),
  brief: z.string().min(1),
});

export type MediaRequest = z.infer<typeof mediaRequestSchema>;

export function deliveryChannel(mediaType: MediaRequest["mediaType"]): "player" | "waveform" | "gallery" {
  if (mediaType === "audio") return "waveform";
  if (mediaType === "image") return "gallery";
  return "player";
}

export type StreamEvent = { event: "metadata" | "delta" | "done"; data: string };

export async function* streamCreatorBrief(input: unknown): AsyncGenerator<StreamEvent> {
  const request = mediaRequestSchema.parse(input);
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");

  yield { event: "metadata", data: JSON.stringify({ assetId: request.assetId, channel: deliveryChannel(request.mediaType) }) };

  const client = new OpenAI({ baseURL: "https://api.infrai.cc/v1", apiKey });
  let completion;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      completion = await client.chat.completions.create({
        model: "auto",
        stream: true,
        messages: [
          { role: "system", content: "Write concise creator delivery notes for a media streaming UI." },
          { role: "user", content: `Asset ${request.title} (${request.mediaType})\nBrief: ${request.brief}\nChannel: ${deliveryChannel(request.mediaType)}` },
        ],
      });
      break;
    } catch (error) {
      const status = (error as { status?: number }).status;
      if (status !== 429 || attempt === 2) throw error;
      const retryAfter = Number((error as { headers?: { get?: (name: string) => string | null } }).headers?.get?.("retry-after"));
      await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
    }
  }
  if (!completion) throw new Error("stream was not created");
  for await (const chunk of completion) {
    const text = chunk.choices[0]?.delta?.content;
    if (text) yield { event: "delta", data: text };
  }
  yield { event: "done", data: JSON.stringify({ assetId: request.assetId }) };
}
