export class AudioEngine {
  context: AudioContext | null = null;
  master: GainNode | null = null;
  muted = false;
  paused = false;
  lastShot = 0;
  lastCollect = 0;
  async unlock() {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.master.gain.value = this.muted ? 0 : 0.19;
      }
      if (this.context.state === "suspended") await this.context.resume();
    } catch {
      /* Audio is optional; denied gestures never block a match. */
    }
  }
  setMuted(muted: boolean) {
    this.muted = muted;
    this.update();
  }
  setPaused(paused: boolean) {
    this.paused = paused;
    this.update();
  }
  update() {
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        this.muted || this.paused ? 0 : 0.19,
        this.context.currentTime,
        0.04,
      );
  }
  tone(
    freq: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.3,
    delay = 0,
    end?: number,
  ) {
    const c = this.context;
    if (
      !c ||
      !this.master ||
      this.muted ||
      this.paused ||
      c.state !== "running"
    )
      return;
    const o = c.createOscillator(),
      g = c.createGain(),
      at = c.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (end) o.frequency.exponentialRampToValueAtTime(end, at + duration);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(volume, at + 0.007);
    g.gain.exponentialRampToValueAtTime(0.001, at + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(at);
    o.stop(at + duration + 0.01);
  }
  noise(duration: number, volume = 0.3, cutoff = 1200) {
    const c = this.context;
    if (
      !c ||
      !this.master ||
      this.muted ||
      this.paused ||
      c.state !== "running"
    )
      return;
    const buffer = c.createBuffer(
        1,
        Math.floor(c.sampleRate * duration),
        c.sampleRate,
      ),
      data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++)
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const src = c.createBufferSource(),
      filter = c.createBiquadFilter(),
      gain = c.createGain();
    src.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    gain.gain.value = volume;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
  }
  play(name: string) {
    const now = this.context?.currentTime ?? 0;
    if (name === "shot") {
      if (now - this.lastShot < 0.065) return;
      this.lastShot = now;
      this.noise(0.055, 0.16, 2300);
      this.tone(160, 0.05, "square", 0.07, 0, 60);
    } else if (name === "cannon") {
      this.noise(0.2, 0.5, 900);
      this.tone(90, 0.3, "triangle", 0.4, 0, 28);
    } else if (name === "explosion") {
      this.noise(0.5, 0.8, 600);
      this.tone(70, 0.4, "sine", 0.4, 0, 24);
    } else if (name === "hit") this.noise(0.08, 0.12, 1300);
    else if (name === "collect") {
      if (now - this.lastCollect < 1) return;
      this.lastCollect = now;
      this.tone(710, 0.08, "sine", 0.08);
      this.tone(940, 0.11, "sine", 0.08, 0.07);
    } else if (name === "order") {
      this.tone(320, 0.055, "triangle", 0.2);
      this.tone(500, 0.065, "triangle", 0.13, 0.04);
    } else if (name === "build") {
      this.tone(160, 0.12, "triangle", 0.25);
      this.tone(240, 0.16, "triangle", 0.2, 0.09);
    } else if (name === "alert") {
      this.tone(620, 0.18, "square", 0.07);
      this.tone(450, 0.16, "square", 0.07, 0.2);
    } else if (name === "ready" || name === "capture") {
      [440, 554, 659].forEach((f, i) =>
        this.tone(f, 0.16, "triangle", 0.14, i * 0.09),
      );
    } else if (name === "victory") {
      [262, 330, 392, 523, 659, 784].forEach((f, i) =>
        this.tone(f, 0.5, "triangle", 0.25, i * 0.16),
      );
    } else if (name === "defeat") {
      [330, 294, 247, 196].forEach((f, i) =>
        this.tone(f, 0.5, "triangle", 0.23, i * 0.22),
      );
    } else this.tone(580, 0.045, "sine", 0.1);
  }
}
