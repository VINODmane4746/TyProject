let db;
let selectedFile = null;
const video = document.getElementById("videoEl");
const playBtn = document.getElementById("playPauseBtn");
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const timeDisplay = document.getElementById("timeDisplay");
const speedBtn = document.getElementById("speedBtn");
const speedMenu = document.getElementById("speedMenu");


/* ================= DATABASE ================= */

const request = indexedDB.open("StreamAsiaDB", 1);

request.onupgradeneeded = function (e) {
    db = e.target.result;
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function (e) {
    db = e.target.result;
    loadVideos();
};

request.onerror = function () {
    alert("Database error");
};


/* ================= FILE SELECT ================= */

function fileSelected(input) {
    selectedFile = input.files[0];

    document.getElementById("selectedFile").classList.remove("hidden");
    document.getElementById("fileName").innerText = selectedFile.name;
    document.getElementById("fileSize").innerText =
        (selectedFile.size / 1024 / 1024).toFixed(2) + " MB";
}


/* ================= SAVE VIDEO ================= */

function saveVideo() {

    const title = document.getElementById("vidTitle").value;
    const cat = document.getElementById("vidCat").value;
    const tag = document.getElementById("vidTag").value;
    const desc = document.getElementById("vidDesc").value;

    if (!selectedFile || !title) {
        alert("Select video and enter title");
        return;
    }

    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");

    const videoData = {
        title,
        cat,
        tag,
        desc,
        file: selectedFile,
        size: selectedFile.size,
        date: new Date().toLocaleDateString()
    };

    store.add(videoData);

    tx.oncomplete = function () {
        alert("Video Saved ✅");
        closeUpload();
        loadVideos();
    };
}


/* ================= LOAD VIDEOS ================= */

function loadVideos() {

    const grid = document.getElementById("videoGrid");
    grid.innerHTML = "";

    const tx = db.transaction("videos", "readonly");
    const store = tx.objectStore("videos");

    store.openCursor().onsuccess = function (e) {

        const cursor = e.target.result;

        if (cursor) {

            const v = cursor.value;

            const url = URL.createObjectURL(v.file);

            const card = document.createElement("div");
            card.className = "video-card";

            card.innerHTML = `
                <video src="${url}" class="thumb" style="width: 220px; height: 176px";></video>
                <div class="video-card-sec">
                    <div class="v-title">${v.title}</div>
                    <div class="v-meta">${v.cat}</div>
                    <button class="video-card-btn" onclick="playVideo('${url}','${v.title}')">Play</button>
                </div>
                    `;

            grid.appendChild(card);

            cursor.continue();
        }
    };
}


/* ================= PLAYER ================= */

function playVideo(url, title) {

    document.getElementById("playerModal").classList.remove("hidden");

    const video = document.getElementById("videoEl");
    video.src = url;
    video.play();

    document.getElementById("playerVideoTitle").innerText = title;
}

function closePlayer() {
    document.getElementById("playerModal").classList.add("hidden");
    document.getElementById("videoEl").pause();
}


/* ================= MODAL ================= */

function openUpload() {
    document.getElementById("uploadModal").classList.remove("hidden");
}

function closeUpload() {
    document.getElementById("uploadModal").classList.add("hidden");
}

/* ================= HEROBANNER ================= */

 window.onload = function () {

    const hero = document.getElementById("heroVideo");

    hero.src = "13973544_3840_2160_30fps.mp4";   // your background video file
    hero.play();
};

/* ================= VIDEO BANNER ================= */

/* ================= PLAY / PAUSE ================= */

function togglePlayPause() {

    if (video.paused) {
        video.play();
        playBtn.innerHTML = "⏸";
    } else {
        video.pause();
        playBtn.innerHTML = "▶";
    }
}


/* ================= SKIP TIME ================= */

function skipTime(sec) {
    video.currentTime += sec;
}


/* ================= VOLUME ================= */

function setVolume(val) {
    video.volume = val;
}

function toggleMute() {

    video.muted = !video.muted;

    if (video.muted) {
        muteBtn.innerHTML = "🔇";
    } else {
        muteBtn.innerHTML = "🔊";
    }
}


/* ================= TIME UPDATE ================= */

video.addEventListener("timeupdate", function () {

    const current = formatTime(video.currentTime);
    const total = formatTime(video.duration);

    timeDisplay.innerText = current + " / " + total;
});


function formatTime(time) {

    if (isNaN(time)) return "0:00";

    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);

    return min + ":" + (sec < 10 ? "0" + sec : sec);
}


/* ================= SPEED ================= */

function toggleSpeedMenu() {
    speedMenu.classList.toggle("hidden");
}

function setSpeed(rate) {

    video.playbackRate = rate;
    speedBtn.innerText = rate + "× Speed";
    speedMenu.classList.add("hidden");
}


/* ================= FULLSCREEN ================= */

function toggleFullscreen() {

    if (!document.fullscreenElement) {
        video.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ==================== FILTER / SEARCH ====================
function filterCat(cat, btn) {
  currentFilter = cat;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAll();
}

function doSearch() {
  searchQuery = document.getElementById('searchBar').value.trim();
  renderAll();
}

// ==================== missing func ====================
// playHero() - Play hero banner video
function playHero() {
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo.paused) {
    heroVideo.play();
  }
}

// Seek preview on mouse move
function previewSeek(event) {
  const container = document.getElementById("progressContainer");
  const rect = container.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  // Preview tooltip can be added here if needed
}

// Seek to time when clicking progress bar
function seekTo(event) {
  const container = document.getElementById("progressContainer");
  const rect = container.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  video.currentTime = percent * video.duration;
}

// Render all videos with filter and search
let currentFilter = 'all';
let searchQuery = '';

function renderAll() {
  const grid = document.getElementById("videoGrid");
  grid.innerHTML = "";
  
  const tx = db.transaction("videos", "readonly");
  const store = tx.objectStore("videos");
  
  store.openCursor().onsuccess = function (e) {
    const cursor = e.target.result;
    if (cursor) {
      const v = cursor.value;
      
      // Filter by category
      if (currentFilter !== 'all' && v.cat !== currentFilter) {
        cursor.continue();
        return;
      }
      
      // Filter by search query
      if (searchQuery && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        cursor.continue();
        return;
      }
      
      const url = URL.createObjectURL(v.file);
      const card = document.createElement("div");
      card.className = "video-card";
      
      card.innerHTML = `
        <video src="${url}" class="thumb" style="width: 220px; height: 176px"></video>
        <div class="video-card-sec">
          <div class="v-title">${v.title}</div>
          <div class="v-meta">${v.cat}</div>
          <button class="video-card-btn" onclick="playVideo('${url}','${v.title}')">Play</button>
        </div>
      `;
      
      grid.appendChild(card);
      cursor.continue();
    }
  };
}
