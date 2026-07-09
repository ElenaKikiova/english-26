function getQueryParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    game: params.get('game') || '',
    player: params.get('player') || 'Anonymous',
  };
}

function imageStem(path) {
  const filename = path.split('/').pop();
  return filename.replace(/\.[^.]+$/, '');
}

function isCorrectImage(path, word) {
  if (word.correct) {
    return imageStem(path) === String(word.correct);
  }
  return path.split('/').pop().includes('-correct');
}

function validateWord(word, index) {
  if (!word.correct) {
    throw new Error(`Word ${index + 1} is missing "correct" (e.g. "correct": "16")`);
  }
  const hasCorrect = word.images.some((img) => isCorrectImage(img, word));
  if (!hasCorrect) {
    throw new Error(
      `Word ${index + 1}: no image matches correct "${word.correct}". Add images/…/${word.correct}.jpg (or .png) to the images list.`
    );
  }
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function gameAssetUrl(gameId, relativePath) {
  return `games/${gameId}/${relativePath}`;
}

async function loadGameManifest(gameId) {
  const res = await fetch(`games/${gameId}/manifest.json`);
  if (!res.ok) throw new Error(`Game "${gameId}" not found`);
  return res.json();
}

async function loadGamesRegistry() {
  const res = await fetch('games/games.json');
  if (!res.ok) throw new Error('Could not load games list');
  return res.json();
}

function buildGameUrl(gameId, player) {
  const url = new URL('game.html', window.location.href);
  url.searchParams.set('game', gameId);
  if (player) url.searchParams.set('player', player);
  return url.toString();
}
