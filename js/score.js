async function submitScore(result) {
  if (!CONFIG.SHEETS_URL) {
    console.warn('SHEETS_URL not configured — score not sent');
    return { ok: false, reason: 'not_configured' };
  }

  const params = new URLSearchParams({
    timestamp: result.timestamp,
    player: result.player,
    game: result.game,
    gameTitle: result.gameTitle,
    score: String(result.score),
    totalWords: String(result.totalWords),
    firstTry: String(result.firstTry),
    secondTry: String(result.secondTry),
    failed: String(result.failed),
  });

  const callbackName = `onScoreSaved_${Date.now()}`;

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup({ ok: false, reason: 'timeout' });
    }, 10000);

    let script;

    function cleanup(status) {
      clearTimeout(timeout);
      delete window[callbackName];
      if (script && script.parentNode) script.parentNode.removeChild(script);
      resolve(status);
    }

    window[callbackName] = () => cleanup({ ok: true });

    script = document.createElement('script');
    script.src = `${CONFIG.SHEETS_URL}?${params.toString()}&callback=${callbackName}`;
    script.onerror = () => cleanup({ ok: false, reason: 'network' });
    document.body.appendChild(script);
  });
}
