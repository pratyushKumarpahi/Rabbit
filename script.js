// ===== APP STATE MANAGEMENT =====
const AppState = {
    WELCOME: 'welcome',
    IDLE: 'idle',
    LISTENING: 'listening',
    TALKING: 'talking',
    LAUGHING: 'laughing',
    MUSIC: 'music'
};

let currentState = AppState.WELCOME;
let mediaRecorder = null;
let audioChunks = [];
let audioContext = null;
let currentAudioSource = null;

// Audio loop counters
let laughingPlayCount = 0;
let musicPlayCount = 0;

// Mic hold
let micHoldActive = false;

// ===== DOM ELEMENTS =====
const welcomeScreen = document.getElementById('welcomeScreen');
const mainScreen = document.getElementById('mainScreen');
const enterBtn = document.getElementById('enterBtn');
const micBtn = document.getElementById('micBtn');
const laughingBtn = document.getElementById('laughingBtn');
const musicBtn = document.getElementById('musicBtn');
const statusText = document.getElementById('statusText');
const exitDialog = document.getElementById('exitDialog');
const exitYesBtn = document.getElementById('exitYesBtn');
const exitNoBtn = document.getElementById('exitNoBtn');
const videoContainer = document.getElementById('videoContainer');

const videoStanding = document.getElementById('videoStanding');
const videoListening = document.getElementById('videoListening');
const videoTalking = document.getElementById('videoTalking');
const videoLaughing = document.getElementById('videoLaughing');
const videoMusic = document.getElementById('videoMusic');

const audioLaughing = document.getElementById('audioLaughing');
const audioMusic = document.getElementById('audioMusic');

const tapHead = document.getElementById('tapHead');
const tapBody = document.getElementById('tapBody');
const tapFeet = document.getElementById('tapFeet');

// ===== VIDEO SWITCHING (FIXED) =====
function switchVideo(targetVideo, enableLoop = false) {
    [videoStanding, videoListening, videoTalking, videoLaughing, videoMusic].forEach(v => {
        v.pause();
        v.loop = false;
        v.classList.remove('active');
    });

    targetVideo.currentTime = 0;
    targetVideo.loop = enableLoop;
    targetVideo.classList.add('active');

    targetVideo.play().catch(() => {});
}

// ===== STATUS MESSAGE =====
function showStatus(message, duration = 2000) {
    statusText.textContent = message;
    statusText.classList.add('show');
    setTimeout(() => statusText.classList.remove('show'), duration);
}

// ===== FALLING ICONS =====
function createFallingIcon(emoji) {
    if (videoContainer.children.length > 50) return;

    const icon = document.createElement('div');
    icon.className = 'falling-icon';
    icon.textContent = emoji;
    icon.style.left = Math.random() * (window.innerWidth - 50) + 'px';
    icon.style.top = '-50px';
    videoContainer.appendChild(icon);

    setTimeout(() => icon.remove(), 4000);
}

function startFallingIcons(emoji, count = 15) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => createFallingIcon(emoji), i * 200);
    }
}

// ===== PARTICLES =====
function createParticle(x, y, emoji) {
    if (videoContainer.children.length > 50) return;

    const p = document.createElement('div');
    p.className = 'particle';
    p.textContent = emoji;
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    videoContainer.appendChild(p);

    setTimeout(() => p.remove(), 1500);
}

// ===== RIPPLE =====
function createRipple(event, element) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = event.clientX - rect.left - size / 2 + 'px';
    ripple.style.top = event.clientY - rect.top - size / 2 + 'px';
    ripple.classList.add('ripple');
    element.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

// ===== VIBRATION =====
function vibrate(duration = 40) {
    if (navigator.vibrate) navigator.vibrate(duration);
}

// ===== SHAKE =====
function shakeVideo() {
    videoContainer.classList.add('shake');
    setTimeout(() => videoContainer.classList.remove('shake'), 500);
}

// ===== TAP ZONES =====
const particles = ['⭐','💫','✨','🌟','💥','❤️','💛','💚','💙','💜'];

[tapHead, tapBody, tapFeet].forEach(zone => {
    zone.addEventListener('click', e => {
        if (currentState !== AppState.IDLE) return;
        vibrate(30);
        createParticle(e.clientX, e.clientY, particles[Math.floor(Math.random()*particles.length)]);
        shakeVideo();
    });
});

// ===== ENTER =====
enterBtn.addEventListener('click', async e => {
    createRipple(e, enterBtn);
    vibrate();

    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        await audioContext.resume();
    }

    welcomeScreen.classList.add('hidden');
    mainScreen.classList.add('active');

    currentState = AppState.IDLE;
    switchVideo(videoStanding, true);
    showStatus('Hold mic to talk 🐰', 3000);
});

// ===== LAUGHING (FIXED LOOP) =====
laughingBtn.addEventListener('click', e => {
    if (currentState !== AppState.IDLE) return;

    createRipple(e, laughingBtn);
    vibrate();

    currentState = AppState.LAUGHING;
    laughingPlayCount = 0;

    switchVideo(videoLaughing, true);
    audioLaughing.currentTime = 0;
    audioLaughing.play();
    startFallingIcons('😂', 15);

    audioLaughing.onended = () => {
    resetToIdle();
};
});

// ===== MUSIC (FIXED LOOP) =====
musicBtn.addEventListener('click', e => {
    if (currentState !== AppState.IDLE) return;

    createRipple(e, musicBtn);
    vibrate();

    currentState = AppState.MUSIC;
    musicPlayCount = 0;

    switchVideo(videoMusic, true);
    audioMusic.currentTime = 0;
    audioMusic.play();
    startFallingIcons('🎵', 15);

    audioMusic.onended = () => {
    resetToIdle();
};
});

// ===== AUDIO RECORDING =====
async function startRecording() {
    try {
        audioChunks = [];

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = e => e.data.size && audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            processAndPlayAudio();
        };

        mediaRecorder.start();
        currentState = AppState.LISTENING;
        micBtn.classList.add('listening');
        switchVideo(videoListening);
        showStatus('Listening...', 5000);
    } catch {
        resetToIdle();
    }
}

function stopRecording() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state !== 'recording') return;
    mediaRecorder.stop();
}

// ===== PROCESS AUDIO (FIXED MOBILE) =====
async function processAndPlayAudio() {
    if (!audioChunks.length) {
        resetToIdle();
        return;
    }

    const blob = new Blob(audioChunks, { type: 'audio/webm' });
    const buffer = await blob.arrayBuffer();

    if (audioContext.state === 'suspended') await audioContext.resume();

    const audioBuffer = await audioContext.decodeAudioData(buffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = 1.5;
    source.connect(audioContext.destination);

    currentAudioSource = source;
    currentState = AppState.TALKING;
    micBtn.classList.remove('listening');
    micBtn.classList.add('speaking');
    switchVideo(videoTalking);

    source.start();
    source.onended = () => resetToIdle();
}

// ===== RESET =====
function resetToIdle() {
    currentState = AppState.IDLE;
    micBtn.classList.remove('listening', 'speaking');
    audioLaughing.pause();
    audioMusic.pause();
    switchVideo(videoStanding, true);
    showStatus('Ready!', 1500);
}

// ===== 🎤 TAP & HOLD MIC =====
micBtn.addEventListener('pointerdown', async e => {
    if (currentState !== AppState.IDLE) return;
    micHoldActive = true;
    createRipple(e, micBtn);
    vibrate();
    await startRecording();
});

micBtn.addEventListener('pointerup', () => {
    if (!micHoldActive) return;
    micHoldActive = false;
    stopRecording();
});

micBtn.addEventListener('pointerleave', () => {
    if (micHoldActive) {
        micHoldActive = false;
        stopRecording();
    }
});

// ===== BACK BUTTON (FIXED) =====
window.addEventListener('popstate', e => {
    e.preventDefault();
    if (currentState === AppState.WELCOME) return;
    if (!exitDialog.classList.contains('show')) {
        exitDialog.classList.add('show');
        history.pushState(null, null, location.href);
    }
});

exitYesBtn.addEventListener('click', () => {
    vibrate();
    exitDialog.classList.remove('show');
    mainScreen.classList.remove('active');
    welcomeScreen.classList.remove('hidden');
    currentState = AppState.WELCOME;
});

exitNoBtn.addEventListener('click', () => {
    vibrate();
    exitDialog.classList.remove('show');
});

// ===== PREVENT DOUBLE TAP ZOOM (SCOPED) =====
videoContainer.addEventListener('touchstart', e => {
    if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

// ===== VIDEO DEBUG =====
[videoStanding, videoListening, videoTalking, videoLaughing, videoMusic].forEach(v => {
    v.addEventListener('error', e => console.error('Video error:', v.id, e));
    v.addEventListener('loadeddata', () => console.log('Loaded:', v.id));
});

// ===== INIT =====
[videoStanding, videoListening, videoTalking, videoLaughing, videoMusic].forEach(v => v.load());
history.pushState(null, null, location.href);
console.log('🐰 Talking Rabbit App READY (tap & hold mic)');