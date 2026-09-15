// A single message from a Server-Sent Events stream.
export type SseMessage = {
  event: string;
  data: string;
};

// Parses SSE text into messages. Returns every complete message, plus any trailing incomplete text to prepend to the next chunk.
export function parseSseChunk(buffer: string): {
  messages: SseMessage[];
  rest: string;
} {
  // a trailing "\r" may be the first half of a "\r\n" split across chunks
  const heldBack = buffer.endsWith("\r") ? "\r" : "";
  const text = buffer
    .slice(0, buffer.length - heldBack.length)
    .replace(/\r\n?/g, "\n");

  const blocks = text.split("\n\n");
  const rest = (blocks.pop() ?? "") + heldBack;

  const messages: SseMessage[] = [];
  for (const block of blocks) {
    const message = parseMessage(block);
    if (message) {
      messages.push(message);
    }
  }
  return { messages, rest };
}

// Parses one message block into its event name and data.
function parseMessage(block: string): SseMessage | null {
  let event = "message";
  const dataLines: string[] = [];

  for (const line of block.split("\n")) {
    // empty lines and comments
    if (line === "" || line.startsWith(":")) continue;

    const colonIndex = line.indexOf(":");
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    let value = colonIndex === -1 ? "" : line.slice(colonIndex + 1);
    if (value.startsWith(" ")) {
      value = value.slice(1);
    }

    if (field === "event") {
      event = value;
    } else if (field === "data") {
      dataLines.push(value);
    }
  }

  if (dataLines.length === 0) {
    return null;
  }
  return { event, data: dataLines.join("\n") };
}
