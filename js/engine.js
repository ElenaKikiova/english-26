class GameEngine {
  constructor({ gameId, player, manifest, onComplete }) {
    this.gameId = gameId;
    this.player = player;
    this.manifest = manifest;
    this.onComplete = onComplete;

    this.words = manifest.words;
    this.currentIndex = 0;
    this.score = 0;
    this.attempt = 1;
    this.locked = false;

    this.stats = {
      firstTry: 0,
      secondTry: 0,
      failed: 0,
    };

    this.audio = new Audio();

    this.el = {
      title: document.getElementById('game-title'),
      player: document.getElementById('player-name'),
      score: document.getElementById('score'),
      progress: document.getElementById('word-progress'),
      playBtn: document.getElementById('btn-play'),
      grid: document.getElementById('images-grid'),
      feedback: document.getElementById('feedback'),
      gameArea: document.getElementById('game-area'),
      results: document.getElementById('results'),
    };

    this.el.title.textContent = manifest.title || gameId;
    this.el.player.textContent = player;
    this.el.playBtn.addEventListener('click', () => this.playAudio());

    this.renderWord();
  }

  get currentWord() {
    return this.words[this.currentIndex];
  }

  playAudio() {
    const src = gameAssetUrl(this.gameId, this.currentWord.audio);
    this.audio.src = src;
    this.audio.play();
  }

  renderWord() {
    this.attempt = 1;
    this.locked = false;
    this.el.feedback.textContent = '';
    this.el.feedback.className = 'feedback';
    this.el.progress.textContent = `Word ${this.currentIndex + 1} of ${this.words.length}`;
    this.updateScoreDisplay();

    const images = shuffleArray(this.currentWord.images);
    this.el.grid.innerHTML = '';

    images.forEach((imagePath) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'image-card';
      btn.dataset.path = imagePath;

      const img = document.createElement('img');
      img.src = gameAssetUrl(this.gameId, imagePath);
      img.alt = 'Choice';
      img.loading = 'lazy';
      img.onerror = () => {
        btn.classList.add('image-error');
        const label = document.createElement('span');
        label.className = 'image-error-label';
        label.textContent = imageStem(imagePath);
        btn.appendChild(label);
      };

      btn.appendChild(img);
      btn.addEventListener('click', () => this.handleGuess(btn, imagePath));
      this.el.grid.appendChild(btn);
    });
  }

  updateScoreDisplay() {
    this.el.score.textContent = this.score;
  }

  handleGuess(btn, imagePath) {
    if (this.locked) return;

    const correct = isCorrectImage(imagePath, this.currentWord);

    if (correct) {
      this.locked = true;
      btn.classList.add('correct-flash');

      if (this.attempt === 1) {
        this.score += 10;
        this.stats.firstTry++;
        this.el.feedback.textContent = '🎉 Great! +10 points';
        this.el.feedback.className = 'feedback success';
      } else {
        this.score += 5;
        this.stats.secondTry++;
        this.el.feedback.textContent = '👍 Good! +5 points';
        this.el.feedback.className = 'feedback success';
      }

      this.updateScoreDisplay();
      setTimeout(() => this.nextWord(), 1200);
    } else if (this.attempt === 1) {
      this.attempt = 2;
      btn.classList.add('wrong-flash');
      btn.disabled = true;
      this.el.feedback.textContent = '🔄 Try again!';
      this.el.feedback.className = 'feedback retry';
      setTimeout(() => btn.classList.remove('wrong-flash'), 400);
    } else {
      this.locked = true;
      btn.classList.add('wrong-flash');
      this.stats.failed++;
      this.el.feedback.textContent = 'The correct answer was:';
      this.el.feedback.className = 'feedback fail';

      this.el.grid.querySelectorAll('.image-card').forEach((card) => {
        card.disabled = true;
        if (isCorrectImage(card.dataset.path, this.currentWord)) {
          card.classList.add('reveal-correct');
        }
      });

      setTimeout(() => this.nextWord(), 2500);
    }
  }

  nextWord() {
    this.currentIndex++;
    if (this.currentIndex >= this.words.length) {
      this.showResults();
    } else {
      this.renderWord();
    }
  }

  async showResults() {
    this.el.gameArea.classList.add('hidden');
    this.el.results.classList.remove('hidden');

    document.getElementById('final-score').textContent = this.score;
    document.getElementById('stat-first').textContent = this.stats.firstTry;
    document.getElementById('stat-second').textContent = this.stats.secondTry;
    document.getElementById('stat-failed').textContent = this.stats.failed;

    const result = {
      player: this.player,
      game: this.gameId,
      gameTitle: this.manifest.title || this.gameId,
      score: this.score,
      totalWords: this.words.length,
      firstTry: this.stats.firstTry,
      secondTry: this.stats.secondTry,
      failed: this.stats.failed,
      timestamp: new Date().toISOString(),
    };

    const statusEl = document.getElementById('save-status');
    statusEl.textContent = 'Saving your score…';
    statusEl.className = 'save-status';

    const saveResult = await submitScore(result);

    if (saveResult.ok) {
      statusEl.textContent = '✅ Score saved!';
      statusEl.className = 'save-status ok';
    } else if (saveResult.reason === 'not_configured') {
      statusEl.textContent = 'Score not saved (teacher has not set up Google Sheets yet)';
      statusEl.className = 'save-status';
    } else {
      statusEl.textContent = 'Could not save score — ask teacher to check Google Script deployment (must be "Anyone", not "Anyone with Google account")';
      statusEl.className = 'save-status err';
    }

    if (this.onComplete) this.onComplete(result);
  }
}

async function initGame() {
  const { game, player } = getQueryParams();
  const errorEl = document.getElementById('error');
  const appEl = document.getElementById('app');

  if (!game) {
    errorEl.textContent = 'No game specified. Ask your teacher for a link.';
    errorEl.classList.remove('hidden');
    return;
  }

  try {
    const manifest = await loadGameManifest(game);
    await prepareManifest(game, manifest);
    appEl.classList.remove('hidden');
    new GameEngine({ gameId: game, player, manifest });
  } catch (err) {
    errorEl.textContent = err.message || 'Could not load game.';
    errorEl.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', initGame);
