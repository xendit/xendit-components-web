import { describe, expect, it } from "vitest";
import { parseSseChunk } from "./sse";

describe("sse - parseSseChunk", () => {
  it("reads a single complete message", () => {
    const result = parseSseChunk('event: update\ndata: {"a":1}\n\n');

    expect(result.messages).toEqual([{ event: "update", data: '{"a":1}' }]);
    expect(result.rest).toBe("");
  });

  it("reads several messages from one chunk in order", () => {
    const result = parseSseChunk(
      "event: heartbeat\ndata: 1\n\nevent: update\ndata: 2\n\nevent: final\ndata: 3\n\n",
    );

    expect(result.messages).toEqual([
      { event: "heartbeat", data: "1" },
      { event: "update", data: "2" },
      { event: "final", data: "3" },
    ]);
  });

  it("keeps an incomplete message as rest until the next chunk completes it", () => {
    const first = parseSseChunk('event: heartbeat\ndata: {"timesta');

    expect(first.messages).toEqual([]);
    expect(first.rest).toBe('event: heartbeat\ndata: {"timesta');

    const second = parseSseChunk(
      first.rest + 'mp":"2026-09-09T08:18:40Z"}\n\nevent: final\ndata: 3\n\n',
    );

    expect(second.messages).toEqual([
      { event: "heartbeat", data: '{"timestamp":"2026-09-09T08:18:40Z"}' },
      { event: "final", data: "3" },
    ]);
    expect(second.rest).toBe("");
  });

  it("accepts \\r\\n line endings", () => {
    const result = parseSseChunk("event: update\r\ndata: 1\r\n\r\n");

    expect(result.messages).toEqual([{ event: "update", data: "1" }]);
  });

  it("does not split a message when \\r\\n is cut between chunks", () => {
    const first = parseSseChunk("event: update\r");
    const second = parseSseChunk(first.rest + "\ndata: 1\r\n\r\n");

    expect(first.messages).toEqual([]);
    expect(second.messages).toEqual([{ event: "update", data: "1" }]);
  });

  it("joins multiple data lines with a newline", () => {
    const result = parseSseChunk("event: update\ndata: line1\ndata: line2\n\n");

    expect(result.messages).toEqual([
      { event: "update", data: "line1\nline2" },
    ]);
  });

  it("ignores comments, id and retry fields", () => {
    const result = parseSseChunk(
      ": keep-alive\nid: 7\nretry: 1000\nevent: update\ndata: 1\n\n",
    );

    expect(result.messages).toEqual([{ event: "update", data: "1" }]);
  });

  it("ignores a message without data", () => {
    const result = parseSseChunk("event: update\n\nevent: final\ndata: 1\n\n");

    expect(result.messages).toEqual([{ event: "final", data: "1" }]);
  });

  it("uses the default event name when the event field is missing", () => {
    const result = parseSseChunk("data: 1\n\n");

    expect(result.messages).toEqual([{ event: "message", data: "1" }]);
  });
});
