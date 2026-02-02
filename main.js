/**
 * カセットデッキ・シミュレーター
 * 精密なカセットデッキのシミュレーション
 */

// ===================================
// グローバル状態管理
// ===================================
const state = {
    power: false,
    ejected: false,
    mode: 'STOP', // STOP, PLAY, PAUSE, REC, REW, FFWD
    counter: 0,
    tapePosition: 0, // 0-100 (左リールから右リールへ)
    wear: 0, // テープ劣化度 0-100
    recording: false,
    meterLevels: { L: 0, R: 0 },
    audioContext: null,
    audioInitialized: false
};

// ===================================
// DOM要素の取得
// ===================================
const elements = {
    // ボタン
    powerButton: document.getElementById('powerButton'),
    ejectButton: document.getElementById('ejectButton'),
    stopButton: document.getElementById('stopButton'),
    playButton: document.getElementById('playButton'),
    pauseButton: document.getElementById('pauseButton'),
    rewButton: document.getElementById('rewButton'),
    fwdButton: document.getElementById('fwdButton'),
    recordButton: document.getElementById('recordButton'),
    recMuteButton: document.getElementById('recMuteButton'),
    returnToZeroBtn: document.getElementById('returnToZeroBtn'),
    counterResetBtn: document.getElementById('counterResetBtn'),
    
    // ディスプレイ
    powerLed: document.getElementById('powerLed'),
    counter: document.getElementById('counter'),
    statusText: document.getElementById('statusText'),
    modeText: document.getElementById('modeText'),
    
    // カセット関連
    cassetteTape: document.getElementById('cassetteTape'),
    reelLeft: document.getElementById('reelLeft'),
    reelRight: document.getElementById('reelRight'),
    ejectOverlay: document.getElementById('ejectOverlay'),
    
    // テープ劣化
    wearFill: document.getElementById('wearFill'),
    wearStatus: document.getElementById('wearStatus'),
    
    // メーター
    meterLeds: document.querySelectorAll('.meter-led')
};

// ===================================
// Audio Context初期化
// ===================================
function initAudio() {
    if (!state.audioInitialized) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            state.audioContext = new AudioContext();
            state.audioInitialized = true;
            console.log('Audio Context initialized');
        } catch (e) {
            console.warn('Web Audio API not supported', e);
        }
    }
}

// ===================================
// サウンド生成
// ===================================
function playClickSound() {
    if (!state.audioContext) return;
    
    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
}

function playTapeHiss() {
    if (!state.audioContext || !state.power) return;
    
    const ctx = state.audioContext;
    
    // ノイズジェネレーター（簡易版）
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.02; // 非常に小さい音量
    
    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    whiteNoise.start();
    
    // 2秒後に停止
    setTimeout(() => {
        try {
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            setTimeout(() => whiteNoise.stop(), 500);
        } catch (e) {
            // エラー無視
        }
    }, 2000);
}

function playTransportSound(fast = false) {
    if (!state.audioContext) return;
    
    const ctx = state.audioContext;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = fast ? 200 : 150;
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
}

// ===================================
// ボタン操作ハンドラー
// ===================================
function handlePowerButton() {
    initAudio();
    state.power = !state.power;
    
    if (state.power) {
        elements.powerLed.classList.add('on');
        playClickSound();
    } else {
        elements.powerLed.classList.remove('on');
        // 電源OFFで全停止
        stopAllOperations();
        clearAllActiveStates();
    }
    
    updateDisplay();
}

function handleEjectButton() {
    if (!state.power) return;
    
    initAudio();
    playClickSound();
    
    state.ejected = !state.ejected;
    
    if (state.ejected) {
        stopAllOperations();
        elements.cassetteTape.classList.add('ejected');
        elements.ejectOverlay.classList.add('active');
        elements.statusText.textContent = 'EJECTED';
    } else {
        elements.cassetteTape.classList.remove('ejected');
        elements.ejectOverlay.classList.remove('active');
        elements.statusText.textContent = 'STOPPED';
        // EJECT解除でテープ劣化を少し下げる（メンテナンス効果）
        state.wear = Math.max(0, state.wear - 5);
        updateWearDisplay();
    }
}

function handleStopButton() {
    if (!state.power || state.ejected) return;
    
    initAudio();
    playClickSound();
    stopAllOperations();
    clearAllActiveStates();
    elements.stopButton.classList.add('active');
    setTimeout(() => elements.stopButton.classList.remove('active'), 200);
}

function handlePlayButton() {
    if (!state.power || state.ejected) return;
    if (state.mode === 'PLAY') return;
    
    initAudio();
    playClickSound();
    playTapeHiss();
    
    stopAllOperations();
    clearAllActiveStates();
    
    state.mode = 'PLAY';
    state.recording = false;
    
    elements.playButton.classList.add('active');
    elements.reelLeft.classList.add('spinning-slow');
    elements.reelRight.classList.add('spinning-slow');
    
    updateDisplay();
}

function handlePauseButton() {
    if (!state.power || state.ejected) return;
    if (state.mode === 'STOP') return;
    
    initAudio();
    playClickSound();
    
    if (state.mode === 'PAUSE') {
        // PAUSE解除
        if (state.recording) {
            state.mode = 'REC';
            elements.recordButton.classList.add('active');
        } else {
            state.mode = 'PLAY';
            elements.playButton.classList.add('active');
        }
        elements.pauseButton.classList.remove('active');
        elements.reelLeft.classList.add('spinning-slow');
        elements.reelRight.classList.add('spinning-slow');
    } else {
        // PAUSE開始
        state.mode = 'PAUSE';
        elements.pauseButton.classList.add('active');
        elements.reelLeft.classList.remove('spinning-slow', 'spinning-fast', 'spinning-reverse');
        elements.reelRight.classList.remove('spinning-slow', 'spinning-fast', 'spinning-reverse');
    }
    
    updateDisplay();
}

function handleRecordButton() {
    if (!state.power || state.ejected) return;
    
    initAudio();
    playClickSound();
    
    if (state.mode === 'REC') {
        // 録音停止
        stopAllOperations();
        clearAllActiveStates();
    } else {
        // 録音開始
        stopAllOperations();
        clearAllActiveStates();
        
        state.mode = 'REC';
        state.recording = true;
        
        elements.recordButton.classList.add('active');
        elements.playButton.classList.add('active');
        elements.reelLeft.classList.add('spinning-slow');
        elements.reelRight.classList.add('spinning-slow');
        
        // 録音はテープを劣化させる
        state.wear = Math.min(100, state.wear + 1);
        updateWearDisplay();
    }
    
    updateDisplay();
}

function handleRewindButton() {
    if (!state.power || state.ejected) return;
    
    initAudio();
    playClickSound();
    playTransportSound(true);
    
    stopAllOperations();
    clearAllActiveStates();
    
    state.mode = 'REW';
    
    elements.rewButton.classList.add('active');
    elements.reelLeft.classList.add('spinning-reverse');
    elements.reelRight.classList.add('spinning-reverse');
    
    // REW多用でテープ劣化
    state.wear = Math.min(100, state.wear + 0.5);
    updateWearDisplay();
    
    updateDisplay();
}

function handleFastForwardButton() {
    if (!state.power || state.ejected) return;
    
    initAudio();
    playClickSound();
    playTransportSound(true);
    
    stopAllOperations();
    clearAllActiveStates();
    
    state.mode = 'FFWD';
    
    elements.fwdButton.classList.add('active');
    elements.reelLeft.classList.add('spinning-fast');
    elements.reelRight.classList.add('spinning-fast');
    
    // FFWD多用でテープ劣化
    state.wear = Math.min(100, state.wear + 0.5);
    updateWearDisplay();
    
    updateDisplay();
}

function handleReturnToZero() {
    if (!state.power || state.ejected) return;
    
    initAudio();
    playClickSound();
    
    // カウンターが0になるまで巻き戻す（簡略版）
    if (state.counter > 0) {
        stopAllOperations();
        clearAllActiveStates();
        state.mode = 'REW';
        elements.rewButton.classList.add('active');
        elements.reelLeft.classList.add('spinning-reverse');
        elements.reelRight.classList.add('spinning-reverse');
        
        // 一定時間後に停止
        const returnInterval = setInterval(() => {
            if (state.counter <= 0 || state.mode !== 'REW') {
                clearInterval(returnInterval);
                if (state.mode === 'REW') {
                    handleStopButton();
                }
            }
        }, 100);
    }
}

function handleCounterReset() {
    if (!state.power) return;
    
    initAudio();
    playClickSound();
    
    state.counter = 0;
    updateDisplay();
}

function handleRecMute() {
    if (!state.power || state.ejected) return;
    
    initAudio();
    playClickSound();
    
    elements.recMuteButton.classList.toggle('active');
}

// ===================================
// 補助関数
// ===================================
function stopAllOperations() {
    state.mode = 'STOP';
    state.recording = false;
    
    elements.reelLeft.classList.remove('spinning-slow', 'spinning-fast', 'spinning-reverse');
    elements.reelRight.classList.remove('spinning-slow', 'spinning-fast', 'spinning-reverse');
    
    // メーターを0に
    state.meterLevels.L = 0;
    state.meterLevels.R = 0;
}

function clearAllActiveStates() {
    elements.playButton.classList.remove('active');
    elements.pauseButton.classList.remove('active');
    elements.recordButton.classList.remove('active');
    elements.rewButton.classList.remove('active');
    elements.fwdButton.classList.remove('active');
}

function updateDisplay() {
    // カウンター表示
    elements.counter.textContent = String(state.counter).padStart(4, '0');
    
    // ステータステキスト
    if (!state.power) {
        elements.statusText.textContent = 'POWER OFF';
        elements.modeText.textContent = '---';
    } else if (state.ejected) {
        elements.statusText.textContent = 'EJECTED';
        elements.modeText.textContent = '---';
    } else {
        elements.statusText.textContent = state.mode;
        elements.modeText.textContent = state.recording ? 'RECORDING' : 
                                         state.mode === 'PLAY' ? 'PLAYBACK' : 
                                         state.mode === 'PAUSE' ? 'PAUSED' : '---';
    }
}

function updateWearDisplay() {
    elements.wearFill.style.width = state.wear + '%';
    
    if (state.wear < 30) {
        elements.wearStatus.textContent = 'EXCELLENT';
        elements.wearStatus.style.color = 'var(--led-green)';
    } else if (state.wear < 60) {
        elements.wearStatus.textContent = 'GOOD';
        elements.wearStatus.style.color = 'var(--led-orange)';
    } else if (state.wear < 85) {
        elements.wearStatus.textContent = 'FAIR';
        elements.wearStatus.style.color = 'var(--led-orange)';
    } else {
        elements.wearStatus.textContent = 'POOR';
        elements.wearStatus.style.color = 'var(--led-red)';
    }
    
    // テープ劣化が高いと警告
    if (state.wear >= 95) {
        elements.wearStatus.textContent = 'CRITICAL!';
        elements.wearStatus.classList.add('pulsing');
        
        // テープ絡まりイベント（確率的）
        if (Math.random() < 0.3 && state.mode !== 'STOP') {
            tapeJamEvent();
        }
    } else {
        elements.wearStatus.classList.remove('pulsing');
    }
}

function tapeJamEvent() {
    console.log('Tape jam!');
    
    // 強制停止
    handleStopButton();
    
    // グリッチエフェクト
    elements.counter.classList.add('glitching');
    setTimeout(() => elements.counter.classList.remove('glitching'), 300);
    
    // カウンターが暴れる
    const originalCounter = state.counter;
    let glitchCount = 0;
    const glitchInterval = setInterval(() => {
        state.counter = Math.floor(Math.random() * 9999);
        updateDisplay();
        glitchCount++;
        
        if (glitchCount > 5) {
            clearInterval(glitchInterval);
            state.counter = originalCounter;
            updateDisplay();
            
            // EJECTを促す
            alert('テープが絡まりました！EJECTして入れ直してください。');
            state.wear = 100;
            updateWearDisplay();
        }
    }, 100);
}

// ===================================
// メーターアニメーション
// ===================================
function updateMeters() {
    if (!state.power) {
        state.meterLevels.L = 0;
        state.meterLevels.R = 0;
    } else if (state.mode === 'PLAY') {
        // 再生中：ランダムに振れる（音楽っぽく）
        const baseLevel = 3 + Math.random() * 3;
        state.meterLevels.L = Math.max(0, Math.min(10, state.meterLevels.L + (Math.random() - 0.5) * 2));
        state.meterLevels.R = Math.max(0, Math.min(10, state.meterLevels.R + (Math.random() - 0.5) * 2));
        
        // スムージング
        state.meterLevels.L = state.meterLevels.L * 0.7 + baseLevel * 0.3;
        state.meterLevels.R = state.meterLevels.R * 0.7 + baseLevel * 0.3;
    } else if (state.mode === 'REC') {
        // 録音中：大きく振れる
        const baseLevel = 5 + Math.random() * 4;
        state.meterLevels.L = Math.max(0, Math.min(10, state.meterLevels.L + (Math.random() - 0.5) * 3));
        state.meterLevels.R = Math.max(0, Math.min(10, state.meterLevels.R + (Math.random() - 0.5) * 3));
        
        state.meterLevels.L = state.meterLevels.L * 0.6 + baseLevel * 0.4;
        state.meterLevels.R = state.meterLevels.R * 0.6 + baseLevel * 0.4;
    } else {
        // 停止中：徐々に0に
        state.meterLevels.L *= 0.9;
        state.meterLevels.R *= 0.9;
    }
    
    // テープ劣化でメーターが暴れる
    if (state.wear > 70 && state.mode !== 'STOP') {
        const chaos = (state.wear - 70) / 30; // 0-1
        state.meterLevels.L += (Math.random() - 0.5) * chaos * 4;
        state.meterLevels.R += (Math.random() - 0.5) * chaos * 4;
    }
    
    // LED更新
    elements.meterLeds.forEach(led => {
        const level = parseInt(led.getAttribute('data-level'));
        const channel = led.closest('.meter-channel').querySelector('.channel-label').textContent;
        const meterLevel = channel === 'L' ? state.meterLevels.L : state.meterLevels.R;
        
        if (level <= Math.floor(meterLevel)) {
            led.classList.add('active');
        } else {
            led.classList.remove('active');
        }
    });
}

// ===================================
// カウンター更新
// ===================================
function updateCounter() {
    if (!state.power || state.ejected) return;
    
    if (state.mode === 'PLAY' || state.mode === 'REC') {
        state.counter = Math.min(9999, state.counter + 1);
        state.tapePosition = Math.min(100, state.tapePosition + 0.1);
    } else if (state.mode === 'REW') {
        state.counter = Math.max(0, state.counter - 5);
        state.tapePosition = Math.max(0, state.tapePosition - 0.5);
    } else if (state.mode === 'FFWD') {
        state.counter = Math.min(9999, state.counter + 5);
        state.tapePosition = Math.min(100, state.tapePosition + 0.5);
    }
    
    // テープ劣化でカウンターがたまに飛ぶ
    if (state.wear > 80 && Math.random() < 0.01) {
        state.counter += Math.floor((Math.random() - 0.5) * 10);
        state.counter = Math.max(0, Math.min(9999, state.counter));
    }
    
    updateDisplay();
}

// ===================================
// アニメーションループ
// ===================================
let lastUpdateTime = 0;
const UPDATE_INTERVAL = 100; // 100ms

function animationLoop(timestamp) {
    if (timestamp - lastUpdateTime >= UPDATE_INTERVAL) {
        updateMeters();
        updateCounter();
        lastUpdateTime = timestamp;
    }
    
    requestAnimationFrame(animationLoop);
}

// ===================================
// イベントリスナー登録
// ===================================
function initEventListeners() {
    elements.powerButton.addEventListener('click', handlePowerButton);
    elements.ejectButton.addEventListener('click', handleEjectButton);
    elements.stopButton.addEventListener('click', handleStopButton);
    elements.playButton.addEventListener('click', handlePlayButton);
    elements.pauseButton.addEventListener('click', handlePauseButton);
    elements.recordButton.addEventListener('click', handleRecordButton);
    elements.rewButton.addEventListener('click', handleRewindButton);
    elements.fwdButton.addEventListener('click', handleFastForwardButton);
    elements.returnToZeroBtn.addEventListener('click', handleReturnToZero);
    elements.counterResetBtn.addEventListener('click', handleCounterReset);
    elements.recMuteButton.addEventListener('click', handleRecMute);
    
    // ノブのドラッグ操作（簡易実装）
    const knobs = [
        document.getElementById('pitchKnob'),
        document.getElementById('micKnob'),
        document.getElementById('recLevelKnob')
    ];
    
    knobs.forEach(knob => {
        if (!knob) return;
        
        let isDragging = false;
        let startY = 0;
        let startRotation = 0;
        
        knob.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            const transform = window.getComputedStyle(knob).transform;
            if (transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                startRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            } else {
                startRotation = 0;
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaY = startY - e.clientY;
            const rotation = startRotation + deltaY;
            knob.style.transform = `rotate(${rotation}deg)`;
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        // タッチ対応
        knob.addEventListener('touchstart', (e) => {
            isDragging = true;
            startY = e.touches[0].clientY;
            const transform = window.getComputedStyle(knob).transform;
            if (transform !== 'none') {
                const matrix = new DOMMatrix(transform);
                startRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
            } else {
                startRotation = 0;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            
            const deltaY = startY - e.touches[0].clientY;
            const rotation = startRotation + deltaY;
            knob.style.transform = `rotate(${rotation}deg)`;
        });
        
        document.addEventListener('touchend', () => {
            isDragging = false;
        });
    });
}

// ===================================
// 初期化
// ===================================
function init() {
    console.log('カセットデッキ・シミュレーター起動');
    initEventListeners();
    updateDisplay();
    updateWearDisplay();
    
    // アニメーションループ開始
    requestAnimationFrame(animationLoop);
    
    // 初期状態の表示
    console.log('準備完了。POWERボタンを押してください。');
}

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
