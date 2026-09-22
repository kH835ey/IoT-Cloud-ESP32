// Web Audio API Synthesizer for Authentic Mechanical Switch Sounds (No external asset needed)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a realistic physical rocker/relay switch click sound.
 * @param state true = SWITCH ON (higher snap), false = SWITCH OFF (deeper release snap)
 */
export function playMechanicalSwitchSound(state: boolean = true) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. High frequency crisp mechanical snap (contact bounce)
    const snapOsc = ctx.createOscillator();
    const snapGain = ctx.createGain();

    snapOsc.type = 'triangle';
    // Frequency drops sharply to simulate plastic contact impact
    if (state) {
      snapOsc.frequency.setValueAtTime(2400, now);
      snapOsc.frequency.exponentialRampToValueAtTime(120, now + 0.035);
    } else {
      snapOsc.frequency.setValueAtTime(1800, now);
      snapOsc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
    }

    snapGain.gain.setValueAtTime(0.7, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    snapOsc.connect(snapGain);
    snapGain.connect(ctx.destination);

    snapOsc.start(now);
    snapOsc.stop(now + 0.04);

    // 2. Low resonance body thud / housing click (Plastic switch rocker casing)
    const thudOsc = ctx.createOscillator();
    const thudGain = ctx.createGain();

    thudOsc.type = 'sine';
    if (state) {
      thudOsc.frequency.setValueAtTime(320, now);
      thudOsc.frequency.exponentialRampToValueAtTime(60, now + 0.05);
    } else {
      thudOsc.frequency.setValueAtTime(260, now);
      thudOsc.frequency.exponentialRampToValueAtTime(50, now + 0.06);
    }

    thudGain.gain.setValueAtTime(0.5, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

    thudOsc.connect(thudGain);
    thudGain.connect(ctx.destination);

    thudOsc.start(now);
    thudOsc.stop(now + 0.06);

    // 3. Subtle metallic micro-click (contact point closing)
    const bufferSize = ctx.sampleRate * 0.015; // 15ms of white noise
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(state ? 4500 : 3500, now);
    noiseFilter.Q.setValueAtTime(3.0, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.016);

    // Haptic vibration feedback on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(state ? [18, 10, 12] : [22]);
    }
  } catch (err) {
    console.warn('Audio playback not allowed yet without user interaction', err);
  }
}
