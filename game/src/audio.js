// Tiny WebAudio synth: every sound is built from oscillators, no audio files.
// Created lazily on the first user gesture so browsers allow it.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context === null) {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    }
    if (context.state === 'suspended') void context.resume();
    return context;
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }

  function noise(duration, volume, lowpass) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start();
  }

  return {
    get muted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    /** Called on the first gesture so later sounds are allowed. */
    unlock() {
      ensure();
    },
    jump() {
      tone(280, 0.16, 'sine', 0.16, 620);
    },
    corn() {
      tone(880, 0.09, 'triangle', 0.18, 1320);
    },
    pie() {
      tone(660, 0.12, 'triangle', 0.2, 990);
      setTimeout(() => tone(990, 0.14, 'triangle', 0.18, 1320), 90);
    },
    feather() {
      tone(520, 0.2, 'sine', 0.16, 1560);
    },
    dash() {
      noise(0.22, 0.12, 2400);
    },
    hit() {
      noise(0.25, 0.3, 500);
      tone(140, 0.22, 'square', 0.18, 60);
    },
    gobble() {
      // Two quick low clucks, the turkey's own voice.
      tone(220, 0.09, 'square', 0.1, 140);
      setTimeout(() => tone(200, 0.09, 'square', 0.1, 130), 110);
    },
    farmerYell() {
      tone(180, 0.35, 'sawtooth', 0.14, 90);
    },
    stage() {
      tone(523, 0.12, 'triangle', 0.18);
      setTimeout(() => tone(659, 0.12, 'triangle', 0.18), 110);
      setTimeout(() => tone(784, 0.2, 'triangle', 0.2), 220);
    },
    escape() {
      const notes = [523, 659, 784, 1047, 1319];
      notes.forEach((freq, i) => setTimeout(() => tone(freq, 0.22, 'triangle', 0.2), i * 130));
    },
    caught() {
      const notes = [392, 330, 262, 196];
      notes.forEach((freq, i) => setTimeout(() => tone(freq, 0.3, 'sawtooth', 0.14), i * 160));
    },
  };
}
