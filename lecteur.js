// ==============================
// Lecteur Audiobook v3.0
// ==============================
const audio = document.getElementById('audioPlayer');
const links = Array.from(document.querySelectorAll('#playlist a[href$=".mp3"]'));
let currentIndex = 0;
let trackDurations = {};
let totalDuration = 0;
let isSeeking = false;
let currentSpeed = 1;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function cleanTitle(text) {
  return (text || '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
}

function elapsedBeforeCurrent() {
  let elapsed = 0;
  for (let i = 0; i < currentIndex; i++) elapsed += trackDurations[i] || 0;
  return elapsed + (audio.currentTime || 0);
}

function getTrackLabel(link) {
  return cleanTitle(link ? link.textContent : '');
}

function getChapterLabel(link) {
  if (!link) return '';
  const li = link.closest('li');
  const parent = li ? li.parentElement : null;

  // Sous-chapitre : le titre du chapitre est dans le bloc .chapter-group précédent
  if (parent && parent.tagName && parent.tagName.toLowerCase() === 'ul' && parent.id !== 'playlist') {
    const chapterGroup = parent.previousElementSibling;
    const title = chapterGroup ? chapterGroup.querySelector('.chapter-title') : null;
    if (title) return cleanTitle(title.textContent);
  }

  // Introduction / Conclusion : le lien est lui-même le chapitre
  return getTrackLabel(link);
}

function updateMiniPlayerText() {
  const link = links[currentIndex];
  if (!link) return;

  const playlist = document.getElementById('playlist');
  const isDetailMode = playlist && !playlist.classList.contains('compact-list');
  const chapterLabel = getChapterLabel(link);
  const trackLabel = getTrackLabel(link);

  const miniTitle = document.querySelector('.mini-title');
  const miniTrack = document.getElementById('miniTrack');

  if (miniTitle) miniTitle.textContent = chapterLabel;

  if (miniTrack) {
    // Page réduite : afficher le chapitre.
    // Page détail : afficher le sous-chapitre en cours.
    if (isDetailMode && trackLabel && trackLabel !== chapterLabel) {
      miniTrack.textContent = trackLabel;
      miniTrack.style.display = '';
    } else {
      miniTrack.textContent = '';
      miniTrack.style.display = 'none';
    }
  }
}

function setActiveTrack(index) {
  links.forEach(a => {
    a.classList.remove('active');
    a.removeAttribute('aria-current');
    const li = a.closest('li');
    if (li) li.classList.remove('active');
  });

  const link = links[index];
  if (!link) return;

  link.classList.add('active');
  link.setAttribute('aria-current', 'true');
  const li = link.closest('li');
  if (li) li.classList.add('active');

  updateMiniPlayerText();

  // Déployer le groupe du chapitre en cours quand il s'agit d'un sous-chapitre
  const parentUl = li ? li.parentElement : null;
  if (parentUl && parentUl.tagName && parentUl.tagName.toLowerCase() === 'ul' && parentUl.id !== 'playlist') {
    document.querySelectorAll('#playlist ul').forEach(ul => ul.classList.remove('is-open'));
    parentUl.classList.add('is-open');
  }
}

function playTrack(index) {
  if (index < 0 || index >= links.length) return;
  const link = links[index];
  currentIndex = index;
  setActiveTrack(index);
  audio.src = link.getAttribute('href');
  audio.defaultPlaybackRate = currentSpeed;
  audio.playbackRate = currentSpeed;
  audio.load();
  audio.playbackRate = currentSpeed;
  audio.play().then(() => {
    audio.playbackRate = currentSpeed;
    syncPlayButton();
  }).catch(() => null);
}

function updateChapterDurations() {
  document.querySelectorAll('.chapter-group[data-chapter]').forEach(group => {
    const chapterNo = group.getAttribute('data-chapter');
    const subList = group.nextElementSibling;
    let sum = 0;
    if (subList && subList.tagName && subList.tagName.toLowerCase() === 'ul') {
      subList.querySelectorAll('a[href$=".mp3"]').forEach(a => {
        const idx = links.indexOf(a);
        if (idx >= 0) sum += trackDurations[idx] || 0;
      });
    }
    const target = group.querySelector('[data-chapter-duration="' + chapterNo + '"]');
    if (target) target.textContent = sum > 0 ? formatTime(sum) : '—';
  });
}

function getCurrentTrackDuration() {
  return trackDurations[currentIndex] || audio.duration || 0;
}

function updateTotalDuration() {
  document.querySelectorAll('[data-total-duration]').forEach(el => {
    if (el.id !== 'bottomTotalTime') {
      el.textContent = totalDuration > 0 ? formatTime(totalDuration) : '—';
    }
  });
}

function updateGlobalInfo() {
  const elapsed = elapsedBeforeCurrent();
  const remaining = Math.max(0, totalDuration - elapsed);
  const trackDuration = getCurrentTrackDuration();
  const trackElapsed = Math.min(audio.currentTime || 0, trackDuration || 0);

  const globalInfo = document.getElementById('globalInfo');
  if (globalInfo) globalInfo.textContent = `${formatTime(trackElapsed)} / ${formatTime(trackDuration)}`;

  const bottomCurrent = document.getElementById('bottomCurrentTime');
  if (bottomCurrent) bottomCurrent.textContent = formatTime(trackElapsed);

  const bottomTotal = document.getElementById('bottomTotalTime');
  if (bottomTotal) bottomTotal.textContent = trackDuration > 0 ? formatTime(trackDuration) : '—';

  const listened = document.getElementById('timeListened');
  if (listened) listened.textContent = formatTime(elapsed);

  const remainingEl = document.getElementById('timeRemaining');
  if (remainingEl) remainingEl.textContent = totalDuration > 0 ? formatTime(remaining) : '—';

  const progress = document.getElementById('playerProgress');
  if (progress && !isSeeking) {
    progress.value = trackDuration > 0 ? Math.round((trackElapsed / trackDuration) * 1000) : 0;
  }
}

function syncPlayButton() {
  const btn = document.getElementById('bigPlayBtn');
  const isPlaying = !audio.paused && !audio.ended;

  if (btn) {
    btn.classList.toggle('playing', isPlaying);
    btn.classList.toggle('is-playing', isPlaying);
    btn.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
  }

  document.body.classList.toggle('playing', isPlaying);
}

function setSpeed(val) {
  const speed = parseFloat(val);
  if (!Number.isFinite(speed)) return;

  currentSpeed = speed;
  audio.defaultPlaybackRate = currentSpeed;
  audio.playbackRate = currentSpeed;

  const speedInline = document.getElementById('speedInline');
  if (speedInline) speedInline.value = currentSpeed;

  const label = document.getElementById('speedText');
  if (label) label.textContent = currentSpeed.toFixed(2) + 'x';
}


function seekCurrentTrackFromSlider(value) {
  const trackDuration = getCurrentTrackDuration();
  if (trackDuration <= 0) return;
  audio.currentTime = Math.max(0, Math.min(trackDuration, (parseFloat(value) / 1000) * trackDuration));
  updateGlobalInfo();
}

function toggleSubListForGroup(group) {
  const subList = group.nextElementSibling;
  if (!subList || !subList.tagName || subList.tagName.toLowerCase() !== 'ul') return;
  const willOpen = !subList.classList.contains('is-open');
  document.querySelectorAll('#playlist ul').forEach(ul => ul.classList.remove('is-open'));
  if (willOpen) subList.classList.add('is-open');
}

function selectTrack(index) {
  if (index < 0 || index >= links.length) return;
  currentIndex = index;
  setActiveTrack(index);

  audio.src = links[index].getAttribute('href');
  audio.defaultPlaybackRate = currentSpeed;
  audio.playbackRate = currentSpeed;
  audio.load();
  audio.playbackRate = currentSpeed;
  syncPlayButton();
  updateGlobalInfo();
}

// Liens piste : sélection uniquement, aucune lecture
links.forEach((link, index) => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    selectTrack(index);
  });
});

// Clic sur un chapitre : déploiement uniquement, aucune lecture
document.querySelectorAll('.chapter-group').forEach(group => {
  group.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSubListForGroup(group);
  });
});

// Initialisation piste 1, sans lecture
if (links.length > 0) {
  selectTrack(0);
}

// Chargement des durées
links.forEach((link, i) => {
  const tmp = new Audio();
  tmp.preload = 'metadata';
  tmp.src = link.getAttribute('href');
  tmp.addEventListener('loadedmetadata', () => {
    trackDurations[i] = tmp.duration || 0;

    const li = link.closest('li');
    if (li && !li.querySelector('.track-duration')) {
      const span = document.createElement('span');
      span.className = 'track-duration';
      span.textContent = formatTime(tmp.duration || 0);
      li.appendChild(span);
    }

    totalDuration = Object.values(trackDurations).reduce((a, b) => a + b, 0);
    updateTotalDuration();
    updateChapterDurations();
    updateGlobalInfo();
  });
});

// Contrôles bas
const playBtn = document.getElementById('bigPlayBtn');
if (playBtn) playBtn.addEventListener('click', () => {
  if (!audio.src && links[currentIndex]) {
    audio.src = links[currentIndex].getAttribute('href');
    audio.defaultPlaybackRate = currentSpeed;
    audio.playbackRate = currentSpeed;
    audio.load();
    audio.playbackRate = currentSpeed;
  }

  if (audio.paused) {
    audio.play().then(() => {
      audio.playbackRate = currentSpeed;
      syncPlayButton();
    }).catch(() => null);
  } else {
    audio.pause();
    syncPlayButton();
  }
});

const rewind10 = document.getElementById('rewind10');
if (rewind10) rewind10.addEventListener('click', () => {
  audio.currentTime = Math.max(0, (audio.currentTime || 0) - 10);
  updateGlobalInfo();
});

const forward10 = document.getElementById('forward10');
if (forward10) forward10.addEventListener('click', () => {
  audio.currentTime = Math.min(audio.duration || 0, (audio.currentTime || 0) + 10);
  updateGlobalInfo();
});

const prevTrack = document.getElementById('prevTrack');
if (prevTrack) prevTrack.addEventListener('click', () => playTrack(Math.max(0, currentIndex - 1)));

const nextTrack = document.getElementById('nextTrack');
if (nextTrack) nextTrack.addEventListener('click', () => playTrack(Math.min(links.length - 1, currentIndex + 1)));

const progress = document.getElementById('playerProgress');
if (progress) {
  progress.addEventListener('input', () => {
    isSeeking = true;
    const trackDuration = getCurrentTrackDuration();
    if (trackDuration > 0) {
      const preview = (parseFloat(progress.value) / 1000) * trackDuration;
      const bottomCurrent = document.getElementById('bottomCurrentTime');
      if (bottomCurrent) bottomCurrent.textContent = formatTime(preview);
    }
  });
  progress.addEventListener('change', () => {
    seekCurrentTrackFromSlider(progress.value);
    isSeeking = false;
  });
}

const speedInline = document.getElementById('speedInline');
if (speedInline) speedInline.addEventListener('input', () => setSpeed(speedInline.value));
setSpeed(speedInline ? speedInline.value : 1);

const volumeInline = document.getElementById('volumeInline');
if (volumeInline) {
  audio.volume = parseFloat(volumeInline.value);
  volumeInline.addEventListener('input', () => {
    audio.volume = parseFloat(volumeInline.value);
  });
}

audio.addEventListener('play', syncPlayButton);
audio.addEventListener('pause', syncPlayButton);
audio.addEventListener('ended', () => {
  if (currentIndex + 1 < links.length) playTrack(currentIndex + 1);
  else syncPlayButton();
});
audio.addEventListener('timeupdate', updateGlobalInfo);

audio.addEventListener('loadedmetadata', () => {
  audio.defaultPlaybackRate = currentSpeed;
  audio.playbackRate = currentSpeed;
  updateGlobalInfo();
});

syncPlayButton();
updateGlobalInfo();

// Sommaire toujours en mode liste de chapitres
const seeAll = document.getElementById('seeAllChapters');
if (seeAll) seeAll.remove();

const list = document.getElementById('playlist');
if (list) {
  list.classList.remove('compact-list');
}

// Actions : marque-page / PWA hors ligne
const bookmarkAction = document.getElementById('bookmarkAction');
if (bookmarkAction) {
  bookmarkAction.addEventListener('click', () => {
    const isMac = navigator.platform && navigator.platform.toUpperCase().includes('MAC');
    const shortcut = isMac ? 'Cmd + D' : 'Ctrl + D';
    alert('Pour ajouter cette page à vos favoris, utilisez ' + shortcut + '.');
  });
}

let deferredPrompt;
const installButton = document.getElementById('installButton');
if (installButton) {
  installButton.style.display = 'inline-block';
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
  installButton.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
      deferredPrompt = null;
    } else {
      alert("L'installation hors ligne dépend du navigateur. Utilisez le menu du navigateur pour installer cette application ou ajouter cette page à l'écran d'accueil.");
    }
  });
}
