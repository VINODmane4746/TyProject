let db;
let selectedFile = null;
let currentFilter = 'all';
let searchQuery = '';

const video = document.getElementById("videoEl");
const playBtn = document.getElementById("playPauseBtn");
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const timeDisplay = document.getElementById("timeDisplay");
const speedBtn = document.getElementById("speedBtn");
const speedMenu = document.getElementById("speedMenu");
const progressFilled = document.getElementById("progressFilled");
const bufferBar = document.getElementById("bufferBar");

/* ================= DATABASE ================= */
const request = indexedDB.open("StreamAsiaDB", 1);

request.onupgradeneeded = function (e) {
    db = e.target.result;
    db.createObjectStore("videos", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function (e) {
    db = e.target.result;
    renderAll(); // Initial load
};


/* ================= HERO BG ================= */
// Restore Hero Banner Video
document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("heroVideo");
    if (hero) {
        hero.src = "13973544_3840_2160_30fps.mp4"; // Ensure this filename is correct
        hero.play().catch(err => console.log("Auto-play blocked or file missing:", err));
    }
});

/* ================= FILE SELECTION & DRAG/DROP ================= */
function fileSelected(input) {
    selectedFile = input.files[0];
    if (!selectedFile) return;

    document.getElementById("selectedFile").classList.remove("hidden");
    document.getElementById("fileName").innerText = selectedFile.name;
    document.getElementById("fileSize").innerText = (selectedFile.size / (1024 * 1024)).toFixed(2) + " MB";
}

const dropZone = document.getElementById("dropZone");
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, e => { e.preventDefault(); e.stopPropagation(); });
});

dropZone.addEventListener('dragover', () => dropZone.classList.add('drag'));
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag'));
dropZone.addEventListener('drop', e => {
    dropZone.classList.remove('drag');
    const files = e.dataTransfer.files;
    if (files.length) {
        document.getElementById("fileInput").files = files;
        fileSelected(document.getElementById("fileInput"));
    }
});

/* ================= SAVE & DELETE ================= */
function saveVideo() {
    const title = document.getElementById("vidTitle").value;
    const cat = document.getElementById("vidCat").value;
    const tag = document.getElementById("vidTag").value;
    const desc = document.getElementById("vidDesc").value;

    if (!selectedFile || !title) {
        alert("Please select a video and enter a title.");
        return;
    }

    const tx = db.transaction("videos", "readwrite");
    const store = tx.objectStore("videos");

    store.add({
        title, cat, tag, desc,
        file: selectedFile,
        date: new Date().toLocaleDateString()
    });

    tx.oncomplete = () => {
        showToast("Video Saved ✅");
        closeUpload();
        renderAll();
        // Clear form
        document.getElementById("vidTitle").value = "";
        document.getElementById("selectedFile").classList.add("hidden");
    };
}

function deleteVideo(id) {
    if (confirm("Are you sure you want to delete this video?")) {
        const tx = db.transaction("videos", "readwrite");
        tx.objectStore("videos").delete(id);
        tx.oncomplete = () => {
            showToast("Video Deleted 🗑️");
            renderAll();
        };
    }
}

/* ================= CORE RENDERING ================= */
// Replace your existing renderAll with this
function renderAll() {
    const grid = document.getElementById("videoGrid");
    const countEl = document.getElementById("sectionCount");
    const emptyState = document.getElementById("emptyState");
    grid.innerHTML = "";
    
    let count = 0;
    const tx = db.transaction("videos", "readonly");
    const store = tx.objectStore("videos");

    store.openCursor().onsuccess = function (e) {
        const cursor = e.target.result;
        if (cursor) {
            const v = cursor.value;
            const matchesSearch = !searchQuery || v.title.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = currentFilter === 'all' || v.cat === currentFilter;

            if (matchesSearch && matchesCat) {
                count++;
                const url = URL.createObjectURL(v.file);
                const card = document.createElement("div");
                card.className = "video-card";
                card.innerHTML = `
                    <div class="video-thumb">
                        <video src="${url}#t=0.5" class="thumb-video"></video>
                        <div class="play-overlay" onclick="playVideo('${url}','${v.title}')">
                            <div class="play-circle">▶</div>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="card-title">${v.title}</div>
                        <div class="card-meta">
                            <span class="card-cat">${v.cat}</span>
                            <span class="card-dur">${v.date}</span>
                        </div>
                        <div class="card-actions">
                            <button class="action-btn btn-watch" onclick="playVideo('${url}','${v.title}')">Watch</button>
                            <button class="action-btn btn-del" onclick="deleteVideo(${v.id})">Delete</button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            }
            cursor.continue();
        } else {
            if (countEl) countEl.innerText = `${count} Videos`;
            if (emptyState) emptyState.classList.toggle("hidden", count > 0);
        }
    };
}

// RESTORE BACKGROUND VIDEO (Add this at the very bottom of app.js)
document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("heroVideo");
    if (hero) {
        hero.src = "13973544_3840_2160_30fps.mp4"; 
        hero.play().catch(() => console.log("Waiting for user interaction to play hero."));
    }
});

/* ================= PLAYER CONTROLS ================= */
function playVideo(url, title) {
    document.getElementById("playerModal").classList.remove("hidden");
    video.src = url;
    video.play();
    document.getElementById("playerVideoTitle").innerText = title;
    playBtn.innerHTML = "⏸";
}

function closePlayer() {
    document.getElementById("playerModal").classList.add("hidden");
    video.pause();
    video.src = ""; 
}

function togglePlayPause() {
    if (video.paused) { video.play(); playBtn.innerHTML = "⏸"; }
    else { video.pause(); playBtn.innerHTML = "▶"; }
}

video.addEventListener("timeupdate", () => {
    const curr = video.currentTime;
    const dur = video.duration;
    if (dur) {
        progressFilled.style.width = (curr / dur * 100) + "%";
        if (video.buffered.length > 0) {
            bufferBar.style.width = (video.buffered.end(0) / dur * 100) + "%";
        }
    }
    timeDisplay.innerText = `${formatTime(curr)} / ${formatTime(dur)}`;
});

function seekTo(event) {
    const rect = document.getElementById("progressContainer").getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    video.currentTime = pos * video.duration;
}

function formatTime(t) {
    if (isNaN(t)) return "0:00";
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' + s : s}`;
}

/* ================= HELPERS & UI ================= */
function filterCat(cat, btn) {
    currentFilter = cat;
    document.querySelectorAll('.cat-tab, .nav-link').forEach(el => el.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderAll();
}

function doSearch() {
    searchQuery = document.getElementById('searchBar').value.trim();
    renderAll();
}

function showToast(msg) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function openUpload() { document.getElementById("uploadModal").classList.remove("hidden"); }
function closeUpload() { document.getElementById("uploadModal").classList.add("hidden"); }
function setSpeed(r) { video.playbackRate = r; speedBtn.innerText = r + "× Speed"; speedMenu.classList.add("hidden"); }
function toggleSpeedMenu() { speedMenu.classList.toggle("hidden"); }
function skipTime(s) { video.currentTime += s; }
function setVolume(v) { video.volume = v; }
function toggleFullscreen() { video.requestFullscreen ? video.requestFullscreen() : video.webkitRequestFullscreen(); }

/* ================= AUTHENTICATION GUARD ================= */

/**
 * Centrally manages access to protected actions.
 * If logged in, it runs the provided callback function.
 * If not, it redirects to the login page.
 */
function requireAuth(callback) {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (isLoggedIn) {
        // Run the action (e.g., open modal, delete video, etc.)
        if (typeof callback === "function") callback();
    } else {
        // Redirect if unauthorized
        alert("Authentication required. Redirecting to login...");
        window.location.href = "login.html"; 
    }
}

// --- UPDATED BUTTON HANDLERS ---

// 1. For Uploading
function openUpload() { 
    requireAuth(() => {
        document.getElementById("uploadModal").classList.remove("hidden"); 
    });
}

// 2. For Deleting (Updated to accept the ID)
function deleteVideo(id) {
    requireAuth(() => {
        if (confirm("Are you sure you want to delete this video?")) {
            const tx = db.transaction("videos", "readwrite");
            tx.objectStore("videos").delete(id);
            tx.oncomplete = () => {
                showToast("Video Deleted 🗑️");
                renderAll();
            };
        }
    });
}

// 3. For Playing (If you want to restrict watching)
function playVideo(url, title) {
    requireAuth(() => {
        document.getElementById("playerModal").classList.remove("hidden");
        video.src = url;
        video.play();
        document.getElementById("playerVideoTitle").innerText = title;
        playBtn.innerHTML = "⏸";
    });
}
