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
        let isProcessing = false;
        let mediaRecorder = null;
        let audioChunks = [];
        let audioContext = null;
        let currentAudioSource = null;

        // Audio loop counters
        let laughingPlayCount = 0;
        let musicPlayCount = 0;

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

        // ===== VIDEO SWITCHING (SIMPLE LOOP) =====
        function switchVideo(targetVideo, enableLoop = false) {
            // Stop all videos
            videoStanding.pause();
            videoListening.pause();
            videoTalking.pause();
            videoLaughing.pause();
            videoMusic.pause();

            // Hide all videos
            videoStanding.classList.remove('active');
            videoListening.classList.remove('active');
            videoTalking.classList.remove('active');
            videoLaughing.classList.remove('active');
            videoMusic.classList.remove('active');

            // Show and play target video
            targetVideo.classList.add('active');
            targetVideo.currentTime = 0;
            
            if (enableLoop) {
                targetVideo.loop = true;
            } else {
                targetVideo.loop = false;
            }

            targetVideo.play().catch(err => {
                console.log('Play error:', err);
                setTimeout(() => {
                    targetVideo.play().catch(e => console.log('Retry failed:', e));
                }, 100);
            });
        }

        // ===== STATUS MESSAGE =====
        function showStatus(message, duration = 2000) {
            statusText.textContent = message;
            statusText.classList.add('show');
            setTimeout(() => {
                statusText.classList.remove('show');
            }, duration);
        }

        // ===== SMOOTH FALLING ICONS ANIMATION =====
        function createFallingIcon(emoji) {
            const icon = document.createElement('div');
            icon.className = 'falling-icon';
            icon.textContent = emoji;
            
            const randomX = Math.random() * (window.innerWidth - 50);
            icon.style.left = randomX + 'px';
            icon.style.top = '-50px';
            
            videoContainer.appendChild(icon);

            setTimeout(() => {
                icon.remove();
            }, 4000);
        }

        function startFallingIcons(emoji, count = 15) {
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    createFallingIcon(emoji);
                }, i * 200);
            }
        }

        // ===== PARTICLE EFFECTS =====
        function createParticle(x, y, emoji) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emoji;
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            videoContainer.appendChild(particle);

            setTimeout(() => {
                particle.remove();
            }, 1500);
        }

        // ===== RIPPLE EFFECT =====
        function createRipple(event, element) {
            const ripple = document.createElement('span');
            const rect = element.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = event.clientX - rect.left - size / 2;
            const y = event.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            element.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        }

        // ===== VIBRATION =====
        function vibrate(duration = 50) {
            if ('vibrate' in navigator) {
                navigator.vibrate(duration);
            }
        }

        // ===== SHAKE EFFECT =====
        function shakeVideo() {
            videoContainer.classList.add('shake');
            setTimeout(() => {
                videoContainer.classList.remove('shake');
            }, 500);
        }

        // ===== TAP ZONE INTERACTIONS =====
        const particles = ['⭐', '💫', '✨', '🌟', '💥', '❤️', '💛', '💚', '💙', '💜'];

        tapHead.addEventListener('click', (e) => {
            if (currentState !== AppState.IDLE) return;
            
            vibrate(30);
            const randomParticle = particles[Math.floor(Math.random() * particles.length)];
            createParticle(e.clientX, e.clientY, randomParticle);
            shakeVideo();
            showStatus('Hehe! That tickles!', 1500);
        });

        tapBody.addEventListener('click', (e) => {
            if (currentState !== AppState.IDLE) return;
            
            vibrate(30);
            const randomParticle = particles[Math.floor(Math.random() * particles.length)];
            createParticle(e.clientX, e.clientY, randomParticle);
            shakeVideo();
            showStatus('Ha ha ha!', 1500);
        });

        tapFeet.addEventListener('click', (e) => {
            if (currentState !== AppState.IDLE) return;
            
            vibrate(30);
            const randomParticle = particles[Math.floor(Math.random() * particles.length)];
            createParticle(e.clientX, e.clientY, randomParticle);
            shakeVideo();
            showStatus('Stop it! Haha!', 1500);
        });

        // ===== ENTER BUTTON =====
        enterBtn.addEventListener('click', (e) => {
            createRipple(e, enterBtn);
            vibrate();
            
            welcomeScreen.classList.add('hidden');
            mainScreen.classList.add('active', 'fade-in');
            
            currentState = AppState.IDLE;
            videoStanding.muted = true;
            
            switchVideo(videoStanding, true);
            showStatus('Tap anywhere on Rabbit!', 3000);
        });

        // ===== LAUGHING BUTTON WITH 2X LOOP =====
        laughingBtn.addEventListener('click', (e) => {
            if (currentState !== AppState.IDLE) return;
            
            createRipple(e, laughingBtn);
            vibrate();
            
            currentState = AppState.LAUGHING;
            isProcessing = true;
            laughingPlayCount = 0;
            
            switchVideo(videoLaughing, true);
            
            audioLaughing.currentTime = 0;
            audioLaughing.play().catch(err => console.log('Audio error:', err));
            
            startFallingIcons('😂', 15);
            
            showStatus('Ha ha ha ha!', 1500);
            
            audioLaughing.onended = () => {
                laughingPlayCount++;
                console.log('🎵 Laughing play count:', laughingPlayCount);
                
                if (laughingPlayCount < 1) {
                    audioLaughing.currentTime = 0;
                    audioLaughing.play().catch(err => console.log('Audio replay error:', err));
                } else {
                    isProcessing = false;
                    resetToIdle();
                }
            };
        });

        // ===== MUSIC BUTTON WITH 2X LOOP =====
        musicBtn.addEventListener('click', (e) => {
            if (currentState !== AppState.IDLE) return;
            
            createRipple(e, musicBtn);
            vibrate();
            
            currentState = AppState.MUSIC;
            isProcessing = true;
            musicPlayCount = 0;
            
            switchVideo(videoMusic, true);
            
            audioMusic.currentTime = 0;
            audioMusic.play().catch(err => console.log('Audio error:', err));
            
            startFallingIcons('🎵', 15);
            
            showStatus('Let\'s dance!', 500);
            
            audioMusic.onended = () => {
                musicPlayCount++;
                console.log('🎵 Music play count:', musicPlayCount);
                
                if (musicPlayCount < 1) {
                    audioMusic.currentTime = 0;
                    audioMusic.play().catch(err => console.log('Audio replay error:', err));
                } else {
                    isProcessing = false;
                    resetToIdle();
                }
            };
        });

        // ===== AUDIO RECORDING =====
        async function startRecording() {
            try {
                audioChunks = [];
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    } 
                });
                
                mediaRecorder = new MediaRecorder(stream);
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };
                
                mediaRecorder.onstop = () => {
                    stream.getTracks().forEach(track => track.stop());
                    processAndPlayAudio();
                };
                
                mediaRecorder.start();
                
                currentState = AppState.LISTENING;
                micBtn.classList.add('listening');
                switchVideo(videoListening, false);
                showStatus('Listening...', 5000);
                
                setTimeout(() => {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        stopRecording();
                    }
                }, 5000);
                
            } catch (error) {
                console.error('Recording error:', error);
                showStatus('Mic access denied', 3000);
                resetToIdle();
            }
        }

        function stopRecording() {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
                showStatus('Processing...', 2000);
            }
        }

        async function processAndPlayAudio() {
            if (audioChunks.length === 0) {
                showStatus('No audio recorded', 2000);
                resetToIdle();
                return;
            }

            try {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const arrayBuffer = await audioBlob.arrayBuffer();
                
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                if (currentAudioSource) {
                    currentAudioSource.stop();
                }
                
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.playbackRate.value = 1.5;
                source.connect(audioContext.destination);
                
                currentAudioSource = source;
                
                currentState = AppState.TALKING;
                micBtn.classList.remove('listening');
                micBtn.classList.add('speaking');
                switchVideo(videoTalking, false);
                showStatus('Rabbit speaking...', 3000);
                
                source.start(0);
                
                source.onended = () => {
                    currentAudioSource = null;
                    setTimeout(() => {
                        resetToIdle();
                    }, 500);
                };
                
            } catch (error) {
                console.error('Audio processing error:', error);
                showStatus('Processing failed', 2000);
                resetToIdle();
            }
        }

        // ===== RESET TO IDLE STATE =====
        function resetToIdle() {
            currentState = AppState.IDLE;
            micBtn.classList.remove('listening', 'speaking');
            
            audioLaughing.onended = null;
            audioMusic.onended = null;
            
            audioLaughing.pause();
            audioMusic.pause();
            audioLaughing.currentTime = 0;
            audioMusic.currentTime = 0;
            
            switchVideo(videoStanding, true);
            showStatus('Ready!', 1500);
            isProcessing = false;
        }

        // ===== MIC BUTTON CLICK =====
        micBtn.addEventListener('click', async (e) => {
            createRipple(e, micBtn);
            vibrate();

            if (isProcessing) {
                showStatus('Please wait...', 1000);
                return;
            }

            if (currentState === AppState.LISTENING) {
                stopRecording();
                return;
            }

            if (currentState === AppState.TALKING) {
                if (currentAudioSource) {
                    currentAudioSource.stop();
                    currentAudioSource = null;
                }
                resetToIdle();
                return;
            }

            isProcessing = true;
            await startRecording();
            isProcessing = false;
        });

        // ===== BACK BUTTON HANDLER =====
        window.addEventListener('popstate', (e) => {
            e.preventDefault();
            
            if (currentState === AppState.WELCOME) {
                return;
            }

            exitDialog.classList.add('show');
            history.pushState(null, null, window.location.href);
        });

        exitYesBtn.addEventListener('click', () => {
            vibrate();
            welcomeScreen.classList.remove('hidden');
            mainScreen.classList.remove('active');
            exitDialog.classList.remove('show');
            videoStanding.pause();
            
            audioLaughing.pause();
            audioMusic.pause();
            audioLaughing.onended = null;
            audioMusic.onended = null;
            
            resetToIdle();
            currentState = AppState.WELCOME;
        });

        exitNoBtn.addEventListener('click', () => {
            vibrate();
            exitDialog.classList.remove('show');
        });

        // ===== PREVENT ZOOM ON DOUBLE TAP =====
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // ===== VIDEO ERROR HANDLING =====
        [videoStanding, videoListening, videoTalking, videoLaughing, videoMusic].forEach(video => {
            video.addEventListener('error', (e) => {
                console.error('❌ Video error:', video.id, e);
            });
            
            video.addEventListener('loadeddata', () => {
                console.log('✅ Video loaded:', video.id);
            });
        });

        // ===== INITIALIZE =====
        console.log('🐰 Talking Rabbit App Ready');
        console.log('🔊 Audio files will play 2 times each');
        
        videoStanding.load();
        videoListening.load();
        videoTalking.load();
        videoLaughing.load();
        videoMusic.load();

        history.pushState(null, null, window.location.href);
   
