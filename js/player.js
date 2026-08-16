let ytPlayer = null, currentSongIndex = 0, isPlaying = false, isShuffle = false, isCassetteMode = false, currentPlaylist = SONGS_DATABASE, progressUpdateInterval = null, audioCtx = null, cassetteNoiseNode = null;

function getAudioContext() {
  if (!audioCtx) { const AudioContext = window.AudioContext || window.webkitAudioContext; audioCtx = new AudioContext(); }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function initYouTubePlayer() {
  const tag = document.createElement('script'); tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0]; firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

window.onYouTubeIframeAPIReady = function() {
  ytPlayer = new YT.Player('yt-hidden-player', { height: '0', width: '0', videoId: currentPlaylist[0].youtubeId, playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1 }, events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange, onError: onPlayerError } });
};

function onPlayerReady() { updatePlayerUI(); renderDrawerQueue(); setupProgressTracking(); setupKeyboardShortcuts(); }
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) { isPlaying = true; setSpinningState(true); updatePlayPauseButtonUI(); updatePlayerUI(); startProgressTimer(); }
  else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) { isPlaying = false; setSpinningState(false); updatePlayPauseButtonUI(); stopProgressTimer(); if (event.data === YT.PlayerState.ENDED) playNextTrack(); }
}
function onPlayerError() { playNextTrack(); }

function togglePlayPause() { if (!ytPlayer) return; getAudioContext(); if (isPlaying) ytPlayer.pauseVideo(); else ytPlayer.playVideo(); }
function playSong(songId) { getAudioContext(); const index = currentPlaylist.findIndex(s => s.id === songId); if (index !== -1) currentSongIndex = index; else { const fullIndex = SONGS_DATABASE.findIndex(s => s.id === songId); if (fullIndex !== -1) { currentPlaylist = SONGS_DATABASE; currentSongIndex = fullIndex; } } loadAndPlayCurrentSong(); }
function loadAndPlayCurrentSong() { const song = currentPlaylist[currentSongIndex]; if (!song) return; updatePlayerUI(); if (ytPlayer && ytPlayer.loadVideoById) ytPlayer.loadVideoById(song.youtubeId); renderDrawerQueue(); }
function playNextTrack() { if (isShuffle) currentSongIndex = Math.floor(Math.random() * currentPlaylist.length); else currentSongIndex = (currentSongIndex + 1) % currentPlaylist.length; loadAndPlayCurrentSong(); }
function playPreviousTrack() { currentSongIndex = (currentSongIndex - 1 + currentPlaylist.length) % currentPlaylist.length; loadAndPlayCurrentSong(); }
function toggleShuffle() { isShuffle = !isShuffle; const btn = document.getElementById('btn-shuffle'); if (btn) btn.classList.toggle('active', isShuffle); }

function setupProgressTracking() { const progressBar = document.getElementById('progress-bar'); if (progressBar) { progressBar.addEventListener('input', (e) => { if (ytPlayer && ytPlayer.getDuration) { const duration = ytPlayer.getDuration(); ytPlayer.seekTo((e.target.value / 100) * duration, true); } }); } }
function startProgressTimer() { stopProgressTimer(); progressUpdateInterval = setInterval(() => { if (!ytPlayer || !ytPlayer.getCurrentTime) return; const currentTime = ytPlayer.getCurrentTime() || 0; const duration = ytPlayer.getDuration() || (currentPlaylist[currentSongIndex]?.durationSeconds || 300); const percent = (currentTime / duration) * 100; const fill = document.getElementById('progress-fill'); const slider = document.getElementById('progress-bar'); const timeDisplay = document.getElementById('time-display'); if (fill) fill.style.width = `${percent}%`; if (slider) slider.value = percent; if (timeDisplay) timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`; }, 500); }
function stopProgressTimer() { if (progressUpdateInterval) { clearInterval(progressUpdateInterval); progressUpdateInterval = null; } }
function formatTime(seconds) { const mins = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60); return `${mins}:${String(secs).padStart(2, '0')}`; }

function triggerHeartReaction(event) {
  const heartEmojis = ['❤️', '💖', '💔', '💕', '💗', '🌹', '💌']; const btn = document.getElementById('btn-heart-reaction'); const rect = btn ? btn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight - 50 }; playHeartChimeSound();
  for (let i = 0; i < 5; i++) { setTimeout(() => { const heart = document.createElement('div'); heart.className = 'floating-heart-particle'; heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)]; heart.style.left = `${rect.left + 10 + (Math.random() - 0.5) * 80}px`; heart.style.top = `${rect.top - 10}px`; document.body.appendChild(heart); setTimeout(() => { if (heart.parentNode) heart.parentNode.removeChild(heart); }, 2200); }, i * 120); }
}

function playHeartChimeSound() { const ctx = getAudioContext(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(587.33, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); gain.gain.setValueAtTime(0.25, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5); osc.connect(gain); gain.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + 0.5); }
function toggleCassetteTapeMode() { isCassetteMode = !isCassetteMode; const btn = document.getElementById('btn-cassette'); if (btn) btn.classList.toggle('active', isCassetteMode); const ctx = getAudioContext(); if (isCassetteMode) { const bufferSize = ctx.sampleRate * 2; const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate); const output = noiseBuffer.getChannelData(0); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < bufferSize; i++) { const white = Math.random() * 2 - 1; b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.96900 * b2 + white * 0.1538520; output[i] = (b0 + b1 + b2) * 0.012; } cassetteNoiseNode = ctx.createBufferSource(); cassetteNoiseNode.buffer = noiseBuffer; cassetteNoiseNode.loop = true; const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 2500; cassetteNoiseNode.connect(filter); filter.connect(ctx.destination); cassetteNoiseNode.start(); } else { if (cassetteNoiseNode) { try { cassetteNoiseNode.stop(); } catch(e){} cassetteNoiseNode = null; } } }
function triggerChaiBreak() { if (ytPlayer) { ytPlayer.pauseVideo(); playHeartChimeSound(); const ticker = document.getElementById('ticker-text'); if (ticker) ticker.textContent = "☕ चाय ब्रेक! (Chai Break — Take a breath...)"; } }
function togglePlaylistDrawer() { const modal = document.getElementById('playlist-modal'); if (modal) modal.classList.toggle('open'); }

function renderDrawerQueue() {
  const container = document.getElementById('playlist-tracks'); const countBadge = document.getElementById('playlist-count'); if (!container) return; if (countBadge) countBadge.textContent = `${currentPlaylist.length} Tracks`;
  container.innerHTML = currentPlaylist.map((song, i) => { const isPlayingThis = (i === currentSongIndex); return `<div style="display:flex; justify-content:space-between; align-items:center; padding:0.7rem 0.9rem; border-radius:var(--radius-sm); background:${isPlayingThis ? 'rgba(230,184,106,0.12)' : 'rgba(255,255,255,0.03)'}; cursor:pointer;" onclick="playSong('${song.id}')"><div><div style="font-family:var(--font-devanagari); font-size:0.92rem; color:${isPlayingThis ? 'var(--color-brass)' : 'var(--text-cream)'}">${song.title.hi} (${song.title.en})</div><div style="font-size:0.75rem; color:var(--text-muted);">🎬 ${song.film} • ${song.singers[0]}</div></div><div style="font-size:0.8rem; color:var(--color-brass);">${isPlayingThis ? '🔊 Playing' : '▶'}</div></div>`; }).join('');
}

function updatePlayerUI() {
  const song = currentPlaylist[currentSongIndex]; if (!song) return;
  const barTitle = document.getElementById('track-title'); const barArtist = document.getElementById('track-artist');
  if (barTitle) barTitle.textContent = `${song.title.hi} (${song.title.en})`; if (barArtist) barArtist.textContent = `🎬 ${song.film} (${song.year}) • ${song.singers.join(', ')}`;
}

function updatePlayPauseButtonUI() {
  const playIcon = document.getElementById('icon-play'); const pauseIcon = document.getElementById('icon-pause');
  if (playIcon && pauseIcon) { if (isPlaying) { playIcon.style.display = 'none'; pauseIcon.style.display = 'block'; } else { playIcon.style.display = 'block'; pauseIcon.style.display = 'none'; } }
}
function setSpinningState(spinning) { const el = document.getElementById('album-art-wrap'); if (el) el.classList.toggle('spinning', spinning); }
function setupKeyboardShortcuts() { document.addEventListener('keydown', (e) => { if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return; if (e.code === 'Space') { e.preventDefault(); togglePlayPause(); } else if (e.key === 'n' || e.key === 'N') playNextTrack(); else if (e.key === 'p' || e.key === 'P') playPreviousTrack(); else if (e.key === 'h' || e.key === 'H') triggerHeartReaction(); else if (e.key === 'c' || e.key === 'C') toggleCassetteTapeMode(); else if (e.key === 'l' || e.key === 'L') togglePlaylistDrawer(); }); }
