(() => {
  const API_URL = "https://api.chess.com/pub/puzzle";
  const FALLBACK_URL = "https://www.chess.com/daily-puzzle";

  const loadingEl = document.getElementById("chessLoading");
  const contentEl = document.getElementById("chessContent");
  const errorEl = document.getElementById("chessError");
  const titleEl = document.getElementById("chessTitle");
  const dateEl = document.getElementById("chessDate");
  const linkEl = document.getElementById("chessLink");
  const boardWrapEl = document.getElementById("chessBoardWrap");
  const refreshBtn = document.getElementById("refreshPuzzleBtn");

  function formatLocalDate(rawDate) {
    const d = rawDate ? new Date(rawDate) : new Date();
    return d.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function showLoading() {
    loadingEl.hidden = false;
    contentEl.hidden = true;
    errorEl.hidden = true;
  }

  function showError() {
    loadingEl.hidden = true;
    contentEl.hidden = true;
    errorEl.hidden = false;
  }

  function renderPuzzle(data) {
    const title = data.title || data.name || "Chess.com Daily Puzzle";
    const url = data.url || FALLBACK_URL;
    const image = data.image || data.image_url || "";
    const fen = data.fen || data.initial_fen || "";

    const publishedDate = data.publish_time
      ? new Date(Number(data.publish_time) * 1000)
      : data.date
        ? new Date(data.date)
        : new Date();

    titleEl.textContent = title;
    dateEl.textContent = `Date: ${formatLocalDate(publishedDate)}`;
    linkEl.href = url;
    linkEl.target = "_blank";
    linkEl.rel = "noopener noreferrer";

    boardWrapEl.innerHTML = "";

    if (image) {
      const img = document.createElement("img");
      img.className = "chess-puzzle-image";
      img.src = image;
      img.alt = `${title} board position`;
      img.loading = "lazy";
      boardWrapEl.appendChild(img);
    } else {
      const fallback = document.createElement("pre");
      fallback.className = "chess-fallback";
      fallback.textContent = fen
        ? `FEN:\n${fen}`
        : "Board preview unavailable. Use the link above to solve on Chess.com.";
      boardWrapEl.appendChild(fallback);
    }

    loadingEl.hidden = true;
    errorEl.hidden = true;
    contentEl.hidden = false;
  }

  async function loadPuzzle() {
    showLoading();

    try {
      const response = await fetch(API_URL, { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      renderPuzzle(data);
    } catch (_err) {
      showError();
    }
  }

  refreshBtn.addEventListener("click", loadPuzzle);
  loadPuzzle();
})();
