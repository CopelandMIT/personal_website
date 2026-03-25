(() => {
  const PHASES = [
    { key: "inhale", label: "Inhale", duration: 4 },
    { key: "hold-right", label: "Hold", duration: 4 },
    { key: "exhale", label: "Exhale", duration: 4 },
    { key: "hold-left", label: "Hold", duration: 4 },
  ];

  const indicator = document.getElementById("breathingIndicator");
  const square = document.getElementById("breathingSquare");
  const phaseLabel = document.getElementById("phaseLabel");
  const phaseCountdown = document.getElementById("phaseCountdown");
  const sessionCountdown = document.getElementById("sessionCountdown");
  const durationSelect = document.getElementById("durationSelect");
  const audioHint = document.getElementById("audioHint");

  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const resetBtn = document.getElementById("resetBtn");

  const rainAudio = new Audio("/audio/rain_1min.mp3");
  rainAudio.loop = true;
  rainAudio.volume = 0.35;

  let state = "idle";
  let durationSeconds = Number(durationSelect.value);
  let sessionRemaining = durationSeconds;
  let phaseIndex = 0;
  let phaseElapsed = 0;
  let animationFrameId = null;
  let lastTimestamp = null;
  let audioFadeFrameId = null;

  function formatSeconds(sec) {
    const total = Math.max(0, Math.ceil(sec));
    const m = Math.floor(total / 60);
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function setIndicatorPosition(x, y) {
    indicator.style.left = `calc(${x * 100}% - 0.5rem)`;
    indicator.style.top = `calc(${y * 100}% - 0.5rem)`;
  }

  function updateIndicator() {
    const phase = PHASES[phaseIndex];
    const progress = Math.min(1, Math.max(0, phaseElapsed / phase.duration));

    let x = 0;
    let y = 0;

    if (phase.key === "inhale") {
      x = progress;
      y = 0;
    } else if (phase.key === "hold-right") {
      x = 1;
      y = progress;
    } else if (phase.key === "exhale") {
      x = 1 - progress;
      y = 1;
    } else {
      x = 0;
      y = 1 - progress;
    }

    square.dataset.phase = phase.key;
    setIndicatorPosition(x, y);
  }

  function updateText() {
    const phase = PHASES[phaseIndex];
    phaseLabel.textContent = state === "complete" ? "Complete" : phase.label;
    phaseCountdown.textContent = String(Math.max(1, Math.ceil(phase.duration - phaseElapsed)));
    sessionCountdown.textContent = formatSeconds(sessionRemaining);
  }

  function stopAudioFade() {
    if (audioFadeFrameId !== null) {
      cancelAnimationFrame(audioFadeFrameId);
      audioFadeFrameId = null;
    }
  }

  function fadeOutAudioAndStop(durationMs = 1500) {
    stopAudioFade();
    const startVol = rainAudio.volume;
    const startTs = performance.now();

    function step(now) {
      const progress = Math.min(1, (now - startTs) / durationMs);
      rainAudio.volume = startVol * (1 - progress);

      if (progress < 1) {
        audioFadeFrameId = requestAnimationFrame(step);
        return;
      }

      rainAudio.pause();
      rainAudio.currentTime = 0;
      rainAudio.volume = 0.35;
      audioFadeFrameId = null;
    }

    audioFadeFrameId = requestAnimationFrame(step);
  }

  async function playAudio() {
    stopAudioFade();
    try {
      if (rainAudio.paused) {
        await rainAudio.play();
      }
      audioHint.hidden = true;
    } catch (_err) {
      audioHint.hidden = false;
    }
  }

  function tick(timestamp) {
    if (lastTimestamp === null) {
      lastTimestamp = timestamp;
    }

    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (state !== "running") {
      return;
    }

    sessionRemaining -= dt;
    phaseElapsed += dt;

    while (phaseElapsed >= PHASES[phaseIndex].duration) {
      phaseElapsed -= PHASES[phaseIndex].duration;
      phaseIndex = (phaseIndex + 1) % PHASES.length;
    }

    if (sessionRemaining <= 0) {
      sessionRemaining = 0;
      state = "complete";
      updateIndicator();
      updateText();
      fadeOutAudioAndStop(1500);
      animationFrameId = null;
      return;
    }

    updateIndicator();
    updateText();
    animationFrameId = requestAnimationFrame(tick);
  }

  function startSession() {
    if (state === "running") {
      return;
    }

    if (state === "complete") {
      resetSession(false);
    }

    state = "running";
    lastTimestamp = null;
    playAudio();
    animationFrameId = requestAnimationFrame(tick);
  }

  function pauseSession() {
    if (state !== "running") {
      return;
    }

    state = "paused";

    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    rainAudio.pause();
  }

  function resetSession(fromDurationChange) {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    state = "idle";
    phaseIndex = 0;
    phaseElapsed = 0;
    sessionRemaining = Number(durationSelect.value);

    if (!fromDurationChange) {
      stopAudioFade();
      rainAudio.pause();
      rainAudio.currentTime = 0;
      rainAudio.volume = 0.35;
      audioHint.hidden = true;
    }

    phaseLabel.textContent = "Ready";
    phaseCountdown.textContent = "4";
    sessionCountdown.textContent = formatSeconds(sessionRemaining);
    square.dataset.phase = PHASES[phaseIndex].key;
    setIndicatorPosition(0, 0);
  }

  durationSelect.addEventListener("change", () => {
    durationSeconds = Number(durationSelect.value);
    sessionRemaining = durationSeconds;

    if (state !== "running") {
      resetSession(true);
    }
  });

  startBtn.addEventListener("click", startSession);
  pauseBtn.addEventListener("click", pauseSession);
  resetBtn.addEventListener("click", () => resetSession(false));

  resetSession(true);
})();
