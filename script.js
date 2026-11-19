const PALETTES = [
    'linear-gradient(to bottom,#fde9a2,#e5a93b)', // Champagne Gold (matches cake ribbon)
    'linear-gradient(to bottom,#ffb3c6,#e0457a)', // Rose Pink (matches theme)
    'linear-gradient(to bottom,#e2c2f5,#9b5de5)', // Soft Violet (matches aurora)
];

document.addEventListener('DOMContentLoaded', () => {
    initPetals();

    const cakeTop     = document.getElementById('cake-top');
    const candlesCt   = document.getElementById('candles-container');
    const micBtn      = document.getElementById('mic-btn');
    const resetBtn    = document.getElementById('reset-btn');
    const shareBtn    = document.getElementById('share-btn');
    const statusMsg   = document.getElementById('status-msg');
    const cakeContainer = document.querySelector('.cake-container');
    const mainContainer = document.getElementById('main-container');
    const mainTitle   = document.getElementById('main-title');

    let candles = [], audioCtx = null, mediaStream = null, analyser = null, rafId = null, blown = false;
    let customAge = '25';

    // --- MARGARET'S BIRTHDAY EXPERIENCE ---
    const welcomeScreen    = document.getElementById('welcome-screen');
    const letterScreen     = document.getElementById('letter-screen');
    const yesBtn           = document.getElementById('yes-btn');
    const noBtn            = document.getElementById('no-btn');
    const countdownWrapper = document.getElementById('countdown-wrapper');
    const cdDays           = document.getElementById('cd-days');
    const cdHours          = document.getElementById('cd-hours');
    const cdMinutes        = document.getElementById('cd-minutes');
    const cdSeconds        = document.getElementById('cd-seconds');
    const envelopeBtn      = document.getElementById('envelope-btn');
    const letterContent    = document.getElementById('letter-content');
    const typedMessage     = document.getElementById('typed-message');
    const continueBtn      = document.getElementById('continue-btn');

    // Target unlock time: 19 Nov 2026, 21:00 (9:00 PM) IST (+05:30)
    const UNLOCK_TIMESTAMP = new Date('2026-11-19T21:00:00+05:30').getTime();

    const LETTER_TEXT = "Happy 25th Birthday, Margaret! 💜\n\nI hope your day is filled with laughter, lovely surprises, good food, and all the little things that make you happy. Thank you for being such a wonderful best friend.\nI may not be able to fix all the things in your life, but I will stay with you until you feel lighter.";

    let noClicks = 0;
    let typingTimer = null;
    let countdownInterval = null;
    let letterOpened = false;

    document.title = "A Birthday Surprise for Margaret 💜";
    mainTitle.innerHTML = "Happy 25th Birthday,<br>Margaret!";
    customAge = "25";
    cakeContainer.classList.remove('flavor-strawberry', 'flavor-vanilla');
    cakeContainer.classList.add('flavor-chocolate');

    function placeAgeCandles() {
        candlesCt.style.transition = 'none';
        candlesCt.style.opacity = '1';
        candlesCt.innerHTML = '';
        candles = [];

        const width = cakeTop.offsetWidth || 320;
        const height = cakeTop.offsetHeight || 100;
        const cx = width / 2;
        const cy = (height / 2) + 6;

        // 6 themed normal candles arranged in an ellipse around the "25"
        const decorativeOffsets = [
            { dx: -102, dy: -6 },
            { dx: -68,  dy: -24 },
            { dx: 68,   dy: -24 },
            { dx: 102,  dy: -6 },
            { dx: -74,  dy: 20 },
            { dx: 74,   dy: 20 },
        ];

        decorativeOffsets.forEach(({ dx, dy }) => {
            createSingleCandle(cx + dx, cy + dy, null);
        });

        // Central "25" number candles
        const digits = customAge.split('');
        const startX = cx - ((digits.length - 1) * 26 / 2);
        digits.forEach((digit, i) => createSingleCandle(startX + (i * 26), cy + 6, digit));

        setStatus('Make a wish! 🕯️');
    }

    function showStage(stage) {
        [welcomeScreen, letterScreen].forEach(s => s.hidden = true);
        mainContainer.style.display = 'none';
        if (stage === 'welcome') welcomeScreen.hidden = false;
        if (stage === 'letter') letterScreen.hidden = false;
        if (stage === 'cake') {
            mainContainer.style.display = 'flex';
            if (candles.length === 0) {
                placeAgeCandles();
            }
        }
    }

    function padZero(num) {
        return String(num).padStart(2, '0');
    }

    function updateCountdown() {
        const now = Date.now();
        const diff = UNLOCK_TIMESTAMP - now;

        if (diff <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            cdDays.textContent = '00';
            cdHours.textContent = '00';
            cdMinutes.textContent = '00';
            cdSeconds.textContent = '00';
            showStage('letter');
            return;
        }

        const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        cdDays.textContent    = padZero(days);
        cdHours.textContent   = padZero(hours);
        cdMinutes.textContent = padZero(minutes);
        cdSeconds.textContent = padZero(seconds);
    }

    yesBtn.addEventListener('click', () => {
        if (Date.now() >= UNLOCK_TIMESTAMP) {
            showStage('letter');
            return;
        }

        // Reveal timer above the YES/NO buttons and start ticking
        countdownWrapper.hidden = false;
        updateCountdown();

        if (!countdownInterval) {
            countdownInterval = setInterval(updateCountdown, 1000);
        }
    });

    noBtn.addEventListener('click', () => {
        noClicks++;
        const yesScale = Math.min(1 + noClicks * 0.13, 2.25);
        const noScale = Math.max(1 - noClicks * 0.11, 0.42);
        yesBtn.style.transform = `scale(${yesScale})`;
        yesBtn.style.zIndex = '2';
        noBtn.style.transform = `scale(${noScale})`;
        noBtn.style.opacity = String(Math.max(1 - noClicks * 0.08, 0.35));
        noBtn.textContent = noClicks >= 5 ? 'Still no? 😅' : 'NO 🙈';
    });

    envelopeBtn.addEventListener('click', () => {
        if (letterOpened) return;
        letterOpened = true;
        envelopeBtn.classList.add('is-open');
        envelopeBtn.disabled = true;
        setTimeout(() => {
            envelopeBtn.hidden = true;
            letterContent.hidden = false;
            const message = LETTER_TEXT;
            let index = 0;
            typedMessage.textContent = '';
            typingTimer = setInterval(() => {
                typedMessage.textContent += message.charAt(index);
                index++;
                if (index >= message.length) {
                    clearInterval(typingTimer);
                    continueBtn.hidden = false;
                }
            }, 34);
        }, 850);
    });

    continueBtn.addEventListener('click', () => {
        showStage('cake');
    });

    showStage('welcome');

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const og = shareBtn.innerHTML;
                shareBtn.innerHTML = '✅ Copied!';
                setTimeout(() => shareBtn.innerHTML = og, 2000);
            });
        });
    }

    function initPetals() {
        const ct = document.getElementById('petals-container');
        const sym = ['🌸','✿','❀','💮','🌺','💗','✨','⭐','💫'];
        for (let i = 0; i < 28; i++) {
            const p = document.createElement('div');
            p.className = 'petal';
            p.textContent = sym[i % sym.length];
            p.style.cssText = `left:${Math.random()*100}%;font-size:${(Math.random()*.7+.5).toFixed(2)}rem;animation-duration:${(Math.random()*12+10).toFixed(1)}s;animation-delay:${(Math.random()*15).toFixed(1)}s;`;
            ct.appendChild(p);
        }
    }

    // Click on icing top → place extra themed candles if desired
    cakeTop.addEventListener('click', (e) => {
        if (blown) return;

        if (customAge && candles.length === 0) {
            placeAgeCandles();
            return;
        }

        const rect = cakeTop.getBoundingClientRect();
        const scaleX = rect.width / cakeTop.offsetWidth;
        const scaleY = rect.height / cakeTop.offsetHeight;
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top) / scaleY;

        const rx = cakeTop.offsetWidth / 2;
        const ry = cakeTop.offsetHeight / 2;
        const S = 0.85;
        if (((x - rx) ** 2) / ((rx * S) ** 2) + ((y - ry) ** 2) / ((ry * S) ** 2) > 1) return;

        createSingleCandle(x, y, null);
    });

    function createSingleCandle(x, y, digit) {
        const wrap = document.createElement('div');
        wrap.className = 'candle-wrap';
        wrap.style.left = x + 'px';
        wrap.style.top  = y + 'px';
        wrap.style.zIndex = Math.round(y) + 50;

        const body = document.createElement('div');
        body.className = 'candle-body';
        if (digit !== null) {
            body.classList.add('number-candle');
            body.textContent = digit;
        } else {
            body.style.background = PALETTES[candles.length % PALETTES.length];
        }
        body.style.animationDelay = (candles.length * 0.04) + 's';

        const wick  = document.createElement('div'); wick.className  = 'wick';
        const flame = document.createElement('div'); flame.className = 'flame';

        body.appendChild(wick);
        body.appendChild(flame);
        wrap.appendChild(body);
        candlesCt.appendChild(wrap);
        candles.push(wrap);

        micBtn.disabled = false;
        setStatus('Make a wish! 🕯️');
    }

    micBtn.addEventListener('click', async () => {
        if (!candles.length || blown) return;
        micBtn.disabled = true;
        setStatus('Listening… blow gently into your mic! 🌬️');
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Microphone is not supported in this browser or context.');
            }
            await setupMic();
            micBtn.textContent = '🌬️ Blow now!';
            startBlowDetect();
        } catch {
            setStatus('🎤 Mic access denied. Allow it and try again.');
            micBtn.disabled = false;
        }
    });

    async function setupMic() {
        if (audioCtx && audioCtx.state !== 'closed') return;
        mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        audioCtx.createMediaStreamSource(mediaStream).connect(analyser);
    }

    function startBlowDetect() {
        const buf = new Uint8Array(analyser.frequencyBinCount);
        let streak = 0;
        const loop = () => {
            if (!analyser || blown) return;
            analyser.getByteFrequencyData(buf);
            const avg = buf.reduce((s, v) => s + v, 0) / buf.length;
            if (avg > 68) {
                if (++streak >= 3) { blowOut(); return; }
            } else {
                streak = 0;
            }
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
    }

    function blowOut() {
        if (blown) return;
        blown = true;
        cancelAnimationFrame(rafId);
        candles.forEach(w => {
            setTimeout(() => {
                const flame = w.querySelector('.flame');
                if (flame) flame.classList.add('out');
                const s = document.createElement('div');
                s.className = 'smoke-puff';
                w.querySelector('.candle-body').appendChild(s);
                s.addEventListener('animationend', () => s.remove());
            }, Math.random() * 450);
        });
        setTimeout(() => {
            if (!blown) return;
            launchConfetti();
            setTimeout(() => {
                if (blown) showKnife();
            }, 2500);
        }, 700);
    }

    resetBtn.addEventListener('click', () => {
        blown = false;
        isDraggingKnife = false;
        cutIndex = 0;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
        }
        audioCtx = null;
        analyser = null;

        document.querySelectorAll('#knife').forEach(k => k.remove());
        const allScenes = document.querySelectorAll('.cake-scene');
        allScenes.forEach((scene, idx) => {
            if (idx === 0) {
                scene.style.clipPath = '';
                scene.style.transform = '';
                scene.style.opacity = '1';
            } else {
                scene.remove();
            }
        });

        placeAgeCandles();

        micBtn.disabled = false;
        micBtn.textContent = '🎤 Allow Mic';
        setStatus('Make a wish! 🕯️');
    });

    function launchConfetti() {
        const colors = ['#fd79a8','#fdbb2d','#d4a8e8','#fff','#ff6b95','#74b9ff','#ffeaa7'];
        for (let i = 0; i < 180; i++) {
            const el = document.createElement('div');
            el.className = 'confetti-piece';
            el.style.cssText = `width:${Math.random()*8+4}px;height:${Math.random()*14+5}px;background:${colors[i%colors.length]};top:-20px;left:${Math.random()*100}vw;border-radius:${Math.random()>.5?'50%':'2px'}`;
            document.body.appendChild(el);
            const dur = (Math.random()*3+2)*1000;
            el.animate([{transform:'translate(0,0) rotate(0)',opacity:1},{transform:`translate(${(Math.random()-.5)*300}px,105vh) rotate(${Math.random()*720}deg)`,opacity:0}],{duration:dur,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'forwards'});
            setTimeout(()=>el.remove(),dur+100);
        }
    }

    function setStatus(msg) { statusMsg.innerHTML = msg; }

    // --- CAKE CUTTING LOGIC ---
    let cutIndex = 0;
    let isDraggingKnife = false;

    const REMAINING_CLIP_PATHS = [
        '',
        'polygon(160px 50px, 420px 164px, 420px -64px, 420px -100px, 160px -100px, -100px -100px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, 420px -64px, 420px -100px, 160px -100px, -100px -100px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, 160px -100px, -100px -100px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, -100px -64px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, -100px 164px, -100px 350px, 160px 350px)',
        'polygon(160px 50px, 160px 50px, 160px 50px)'
    ];

    const SLICE_CLIP_PATHS = [
        'polygon(160px 50px, 160px 350px, 420px 350px, 420px 164px)',
        'polygon(160px 50px, 420px 164px, 420px -64px)',
        'polygon(160px 50px, 420px -64px, 420px -100px, 160px -100px)',
        'polygon(160px 50px, 160px -100px, -100px -100px, -100px -64px)',
        'polygon(160px 50px, -100px -64px, -100px 164px)',
        'polygon(160px 50px, -100px 164px, -100px 350px, 160px 350px)'
    ];

    const SLICE_ANIM_TRANSFORMS = [
        'translate(50px, 30px) rotate(10deg)',
        'translate(60px, -10px) rotate(15deg)',
        'translate(30px, -40px) rotate(5deg)',
        'translate(-30px, -40px) rotate(-5deg)',
        'translate(-60px, -10px) rotate(-15deg)',
        'translate(-50px, 30px) rotate(-10deg)'
    ];

    function positionKnife(cakeRect) {
        const knife = document.getElementById('knife');
        if (!knife) return;
        const maxLeft = window.innerWidth - 52;
        knife.style.left = Math.min(cakeRect.right + 8, maxLeft) + 'px';
        knife.style.top = Math.max(cakeRect.top - 15, 16) + 'px';
        knife.style.transform = 'rotate(30deg)';
    }

    function showKnife() {
        candlesCt.style.transition = 'opacity 1s';
        candlesCt.style.opacity = '0';
        setTimeout(() => {
            if (blown) candlesCt.innerHTML = '';
        }, 1000);

        const existingKnife = document.getElementById('knife');
        if (existingKnife) existingKnife.remove();

        const knife = document.createElement('div');
        knife.id = 'knife';
        knife.className = 'knife';
        knife.innerHTML = `<svg width="40" height="120" viewBox="0 0 40 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M 15 0 L 25 0 L 23 40 L 17 40 Z" fill="#2c3e50"/>
          <rect x="12" y="38" width="16" height="4" rx="2" fill="#f9c85a"/>
          <path d="M 16 42 L 24 42 L 35 90 C 38 110, 20 120, 20 120 C 20 120, 2 110, 5 90 Z" fill="#e0e0e0"/>
          <path d="M 20 42 L 24 42 L 35 90 C 38 110, 20 120, 20 120 L 20 42 Z" fill="#ffffff"/>
        </svg>`;
        document.body.appendChild(knife);

        const rect = document.querySelector('.cake-container').getBoundingClientRect();
        positionKnife(rect);

        setStatus('Drag the knife to cut a slice 🔪');

        const drag = (e) => {
            if (!isDraggingKnife) return;
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            if (x && y) {
                knife.style.left = (x - 20) + 'px';
                knife.style.top = (y - 20) + 'px';
                e.preventDefault();
            }
        };

        const endDrag = () => {
            if (!isDraggingKnife) return;
            isDraggingKnife = false;
            
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', endDrag);
            document.removeEventListener('touchend', endDrag);

            const kRect = knife.getBoundingClientRect();
            const cRect = document.querySelector('.cake-container').getBoundingClientRect();

            if (kRect.left < cRect.right + 50 && kRect.right > cRect.left - 50 &&
                kRect.top < cRect.bottom + 100 && kRect.bottom > cRect.top - 50) {
                performCut();
            } else {
                knife.style.transition = 'all 0.3s';
                positionKnife(cRect);
                setTimeout(() => knife.style.transition = 'transform 0.1s', 300);
            }
        };

        const startDrag = (e) => {
            if (knife.classList.contains('cutting')) return;
            isDraggingKnife = true;
            e.preventDefault();
            document.addEventListener('mousemove', drag, {passive: false});
            document.addEventListener('touchmove', drag, {passive: false});
            document.addEventListener('mouseup', endDrag);
            document.addEventListener('touchend', endDrag);
        };

        knife.addEventListener('mousedown', startDrag);
        knife.addEventListener('touchstart', startDrag, {passive: false});
    }

    function performCut() {
        if (cutIndex >= 6 || !blown) return;
        const knife = document.getElementById('knife');
        const cakeScene = document.querySelector('.cake-scene');
        const cRect = cakeContainer.getBoundingClientRect();
        
        knife.classList.add('cutting');
        knife.style.left = (cRect.left + cRect.width / 2 - 20) + 'px';
        knife.style.top = (cRect.top - 60) + 'px';
        knife.style.transform = 'rotate(0deg)';

        setTimeout(() => {
            if (!blown) return;
            knife.style.top = (cRect.bottom + 20) + 'px';
            
            setTimeout(() => {
                if (!blown) return;
                const slice = cakeScene.cloneNode(true);
                slice.style.clipPath = SLICE_CLIP_PATHS[cutIndex];
                slice.style.transition = 'all 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                cakeContainer.appendChild(slice);
                
                cutIndex++;
                cakeScene.style.clipPath = REMAINING_CLIP_PATHS[cutIndex];
                
                setTimeout(() => {
                    slice.style.transform = SLICE_ANIM_TRANSFORMS[cutIndex - 1];
                    slice.style.opacity = '0';
                    setTimeout(() => slice.remove(), 1200);
                }, 50);
                
                knife.classList.remove('cutting');
                if (cutIndex < 6) {
                    setStatus(`Cut ${cutIndex}/6! Keep going 🔪`);
                    positionKnife(cRect);
                } else {
                    setStatus('All gone! Hope you enjoyed the cake 🎉');
                    knife.style.opacity = '0';
                    setTimeout(() => knife.remove(), 500);
                }
            }, 400);
        }, 50);
    }
});
