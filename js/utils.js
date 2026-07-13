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
  if (!word.correct) {
    return path.split('/').pop().includes('-correct');
  }
  const filename = path.split('/').pop();
  const correct = String(word.correct);
  const lower = (s) => s.toLowerCase();
  return lower(filename) === lower(correct) || lower(imageStem(path)) === lower(correct);
}

const IMAGE_EXT = /\.(avif|gif|jpe?g|png|svg|webp)$/i;

async function resolveWordImages(gameId, word) {
  if (Array.isArray(word.images)) {
    return word.images;
  }

  if (typeof word.images !== 'string') {
    throw new Error('Each word needs "images" as a folder (e.g. "images/1") or a file list');
  }

  const folder = word.images.replace(/\/$/, '');
  const res = await fetch(`games/${gameId}/${folder}/list.json`);
  if (!res.ok) {
    throw new Error(
      `Missing ${folder}/list.json — open tools/list-generator.html, select the folder, save list.json inside it`
    );
  }

  const files = await res.json();
  return files
    .filter((name) => IMAGE_EXT.test(name))
    .map((name) => `${folder}/${name}`);
}

async function prepareManifest(gameId, manifest) {
  for (let i = 0; i < manifest.words.length; i++) {
    const word = manifest.words[i];
    if (typeof word.images === 'string') {
      word.imagesFolder = word.images;
    }
    word.images = await resolveWordImages(gameId, word);
    validateWord(word, i);
  }
  return manifest;
}

function validateWord(word, index) {
  if (!word.correct) {
    throw new Error(`Word ${index + 1} is missing "correct" (filename or name without extension)`);
  }
  if (!word.images.length) {
    throw new Error(`Word ${index + 1}: no images found in folder`);
  }
  const hasCorrect = word.images.some((img) => isCorrectImage(img, word));
  if (!hasCorrect) {
    throw new Error(
      `Word ${index + 1}: "${word.correct}" not found. ` +
      `Check the filename in manifest.json matches a file in ${word.imagesFolder || 'the folder'}, ` +
      `then regenerate list.json (tools/list-generator.html).`
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
  const games = await res.json();
  return games.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function buildGameUrl(gameId, player) {
  const url = new URL('game.html', window.location.href);
  url.searchParams.set('game', gameId);
  if (player) url.searchParams.set('player', player);
  return url.toString();
}
