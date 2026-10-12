export function connectBridge(handlers: {
  pause: () => void;
  resume: () => void;
}) {
  let channel: string | undefined;
  const receive = (event: MessageEvent) => {
    if (
      event.source !== window.parent ||
      event.data?.protocol !== "pepe-game/1"
    )
      return;
    const m = event.data;
    if (
      m.type === "init" &&
      typeof m.channel === "string" &&
      m.channel.length > 0 &&
      m.channel.length <= 200
    ) {
      channel = m.channel;
      window.parent.postMessage(
        { protocol: "pepe-game/1", type: "ready", channel },
        "*",
      );
      return;
    }
    if (!channel || m.channel !== channel) return;
    if (m.type === "pause") handlers.pause();
    if (m.type === "resume") handlers.resume();
  };
  window.addEventListener("message", receive);
  return {
    score(value: number) {
      if (channel && Number.isSafeInteger(value) && value >= 0)
        window.parent.postMessage(
          { protocol: "pepe-game/1", type: "score", channel, score: value },
          "*",
        );
    },
  };
}
