let currentShayariIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
  initLiveClockAndRotation(); initShayariShowcaseLoop(); initHighwayCounter(); renderRotationCards(); renderSongsGrid(SONGS_DATABASE); renderShayariWall(); initYouTubePlayer(); setupEventListeners();
});

function initLiveClockAndRotation() { updateClockDisplay(); setInterval(updateClockDisplay, 1000); }
function getISTDateParts() { const now = new Date(); const options = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }; const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(now); let hour = 0, minute = 0, second = 0; parts.forEach(p => { if (p.type === 'hour') hour = parseInt(p.value, 10); if (p.type === 'minute') minute = parseInt(p.value, 10); if (p.type === 'second') second = parseInt(p.value, 10); }); return { hour, minute, second }; }
function updateClockDisplay() { const { hour, minute, second } = getISTDateParts(); const pad = n => String(n).padStart(2, '0'); const clockEl = document.getElementById('system-clock'); if (clockEl) clockEl.textContent = `${pad(hour)}:${pad(minute)}:${pad(second)} IST`; }

function initShayariShowcaseLoop() { updateShayariShowcaseDisplay(); setInterval(() => nextShayariQuote(), 7000); }
function nextShayariQuote() { currentShayariIndex = (currentShayariIndex + 1) % SHAYARI_COLLECTION.length; updateShayariShowcaseDisplay(); }
function prevShayariQuote() { currentShayariIndex = (currentShayariIndex - 1 + SHAYARI_COLLECTION.length) % SHAYARI_COLLECTION.length; updateShayariShowcaseDisplay(); }

function updateShayariShowcaseDisplay() {
  const item = SHAYARI_COLLECTION[currentShayariIndex]; if (!item) return;
  const hindiEl = document.getElementById('shayari-main-hindi'); const hinglishEl = document.getElementById('shayari-main-hinglish'); const englishEl = document.getElementById('shayari-main-english'); const authorEl = document.getElementById('shayari-author-tag'); const tickerText = document.getElementById('ticker-text');
  if (hindiEl) hindiEl.textContent = item.hindi; if (hinglishEl) hinglishEl.textContent = `"${item.hinglish}"`; if (englishEl) englishEl.textContent = item.english; if (authorEl) authorEl.textContent = `— ${item.author} (${item.category})`; if (tickerText) tickerText.textContent = item.hindi;
}

function initHighwayCounter() { const counterEl = document.getElementById('highway-count'); if (!counterEl) return; let count = 650; setInterval(() => { count = Math.max(540, count + Math.floor(Math.random() * 5) - 2); counterEl.textContent = count; }, 5000); }

function renderRotationCards() {
  const container = document.getElementById('rotations-cards-grid'); if (!container) return;
  const playlists = Object.values(PLAYLISTS_INFO); const { hour } = getISTDateParts();
  container.innerHTML = playlists.map(pl => { let isActive = (pl.id === 'pehla-nasha' && hour >= 6 && hour < 12) || (pl.id === 'ishq-mohabbat' && hour >= 12 && hour < 18) || (pl.id === 'dard-90s' && hour >= 18 && hour < 22) || (pl.id === 'raat-humsafar' && (hour >= 22 || hour < 6)); return `<div class="rotation-card ${isActive ? 'active' : ''}" onclick="selectRotationPlaylist('${pl.id}')"><div><span style="font-size:0.65rem; color:var(--color-brass); letter-spacing:0.18em; text-transform:uppercase;">${pl.timeWindow}</span><h3 style="font-family:var(--font-devanagari); font-size:1.35rem; color:var(--text-cream); margin-top:0.3rem;">${pl.titleHi}</h3><div style="font-size:0.8rem; color:var(--text-cream-dim);">${pl.titleEn}</div><p style="font-size:0.8rem; color:var(--text-muted); margin-top:0.6rem; line-height:1.5;">${pl.description}</p></div></div>`; }).join('');
}

function selectRotationPlaylist(playlistId) { const filtered = SONGS_DATABASE.filter(s => s.playlists.includes(playlistId)); renderSongsGrid(filtered.length ? filtered : SONGS_DATABASE); if (filtered.length) { currentPlaylist = filtered; currentSongIndex = 0; loadAndPlayCurrentSong(); } }

function renderSongsGrid(songs) {
  const grid = document.getElementById('songs-grid'); if (!grid) return;
  if (songs.length === 0) { grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">कोई गाना नहीं मिला।</div>`; return; }
  grid.innerHTML = songs.map(song => `<div class="song-card fade-in"><div style="display:flex; justify-content:space-between; align-items:flex-start;"><div><h4 style="font-family:var(--font-devanagari); font-size:1.25rem; font-weight:700; color:var(--text-cream);">${song.title.hi}</h4><div style="font-size:0.82rem; color:var(--text-cream-dim);">${song.title.en}</div><div style="font-size:0.75rem; color:var(--color-brass); margin-top:4px;">🎬 ${song.film} (${song.year})</div></div><button class="control-btn" style="width:36px; height:36px;" onclick="playSong('${song.id}')" title="Play Song">▶</button></div><p style="font-size:0.8rem; color:var(--text-muted); line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin-top:0.6rem;">${song.blurb.en}</p><div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-subtle); padding-top:0.6rem; font-size:0.75rem; margin-top:0.6rem;"><span style="color:var(--text-muted);">🎙️ ${song.singers[0]}</span><span style="color:var(--color-rose); cursor:pointer; font-weight:500;" onclick="openSongDetailModal('${song.id}')">कहानी पढ़ो →</span></div></div>`).join('');
}

const PRESET_USER_SHAYARI = [
  { id: "ush-1", text: "अधूरी मोहब्बत ही तो अमर होती है, पूरी हो जाए तो नाम ख़त्म हो जाता है...", author: "दिल का मुसाफ़िर", tag: "Heartbreak Shayari", hearts: 184 },
  { id: "ush-2", text: "I still check your profile when this radio station plays 'Ab Tere Bin'...", author: "Silent Lover", tag: "Unsaid Love", hearts: 142 }
];

function getStoredShayari() { const stored = localStorage.getItem('radio_ishq_shayari_wall'); if (stored) { try { return JSON.parse(stored); } catch(e) { return PRESET_USER_SHAYARI; } } return PRESET_USER_SHAYARI; }
function saveShayari(list) { localStorage.setItem('radio_ishq_shayari_wall', JSON.stringify(list)); }
function renderShayariWall() { const container = document.getElementById('shayari-wall-grid'); if (!container) return; container.innerHTML = getStoredShayari().map(item => `<div class="shayari-card-item fade-in"><p style="font-size:0.85rem; font-style:italic; color:var(--text-cream-dim); line-height:1.5;">"${escapeHtml(item.text)}"</p><div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed var(--border-subtle); padding-top:0.5rem; font-size:0.75rem;"><span style="color:var(--color-brass); font-weight:500;">— ${escapeHtml(item.author)}</span><button style="background:transparent; border:none; color:var(--color-rose); cursor:pointer;" onclick="likeUserShayari('${item.id}')">❤️ ${item.hearts}</button></div></div>`).join(''); }

function submitNewShayari(e) { e.preventDefault(); const textInput = document.getElementById('shayari-text-input'); const authorInput = document.getElementById('shayari-author-input'); const categorySelect = document.getElementById('shayari-category-select'); if (!textInput || !textInput.value.trim()) return; const list = getStoredShayari(); list.unshift({ id: 'ush-' + Date.now(), text: textInput.value.trim(), author: (authorInput && authorInput.value.trim()) ? authorInput.value.trim() : "गुमनाम आशिक", tag: categorySelect ? categorySelect.value : "Heartbreak Shayari", hearts: 1 }); saveShayari(list); textInput.value = ''; if (authorInput) authorInput.value = ''; renderShayariWall(); }
function likeUserShayari(id) { const list = getStoredShayari(); const item = list.find(s => s.id === id); if (item) { item.hearts += 1; saveShayari(list); renderShayariWall(); } }

function setupEventListeners() {
  const searchInput = document.getElementById('song-search-input'); if (searchInput) searchInput.addEventListener('input', (e) => { const query = e.target.value.toLowerCase().trim(); renderSongsGrid(SONGS_DATABASE.filter(song => song.title.en.toLowerCase().includes(query) || song.title.hi.toLowerCase().includes(query) || song.film.toLowerCase().includes(query) || song.singers.some(s => s.toLowerCase().includes(query)))); });
  const form = document.getElementById('shayari-submission-form'); if (form) form.addEventListener('submit', submitNewShayari);
}

function openSongDetailModal(songId) {
  const song = SONGS_DATABASE.find(s => s.id === songId); if (!song) return; const backdrop = document.getElementById('song-modal-backdrop'); if (!backdrop) return;
  document.getElementById('modal-title-hi').textContent = song.title.hi; document.getElementById('modal-title-en').textContent = song.title.en; document.getElementById('modal-meta-film').textContent = `${song.film} (${song.year})`; document.getElementById('modal-meta-singers').textContent = song.singers.join(', '); document.getElementById('modal-meta-composer').textContent = song.composer; document.getElementById('modal-meta-lyricist').textContent = song.lyricist || 'Classic'; document.getElementById('modal-story-en').textContent = song.blurb.en; document.getElementById('modal-story-hi').textContent = song.blurb.hi;
  const spotifyBtn = document.getElementById('modal-spotify-link'); const ytMusicBtn = document.getElementById('modal-ytmusic-link'); const playBtn = document.getElementById('modal-play-now-btn');
  if (spotifyBtn) spotifyBtn.href = song.spotifyUrl; if (ytMusicBtn) ytMusicBtn.href = song.ytMusicUrl; if (playBtn) playBtn.onclick = () => { playSong(song.id); closeSongDetailModal(); };
  backdrop.classList.add('open');
}
function closeSongDetailModal() { const backdrop = document.getElementById('song-modal-backdrop'); if (backdrop) backdrop.classList.remove('open'); }
function escapeHtml(str) { return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }
