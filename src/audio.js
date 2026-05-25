// Web Audio API sound system — generates all sounds procedurally (no files needed)
const Audio = (function () {
    var ctx = null;
    var masterGain = null;
    var bgNode = null;
    var enabled = true;

    function getCtx() {
        if (!ctx) {
            try {
                ctx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = ctx.createGain();
                masterGain.gain.value = 0.4;
                masterGain.connect(ctx.destination);
            } catch (e) {
                enabled = false;
            }
        }
        return ctx;
    }

    function beep(freq, duration, type, vol) {
        if (!enabled) return;
        var c = getCtx();
        if (!c) return;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(freq, c.currentTime);
        gain.gain.setValueAtTime(vol || 0.3, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    }

    function playLaser() {
        if (!enabled) return;
        var c = getCtx();
        if (!c) return;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.connect(gain);
        gain.connect(masterGain);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, c.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.2);
    }

    function playCorrect() {
        // Rising fanfare
        beep(523, 0.1, 'square', 0.3);
        setTimeout(function () { beep(659, 0.1, 'square', 0.3); }, 100);
        setTimeout(function () { beep(784, 0.2, 'square', 0.3); }, 200);
        setTimeout(function () { beep(1047, 0.3, 'square', 0.4); }, 350);
    }

    function playWrong() {
        beep(200, 0.15, 'sawtooth', 0.3);
        setTimeout(function () { beep(150, 0.25, 'sawtooth', 0.25); }, 150);
    }

    function playSelect() {
        beep(440, 0.08, 'square', 0.2);
    }

    function playConfirm() {
        beep(660, 0.1, 'square', 0.3);
        setTimeout(function () { beep(880, 0.15, 'square', 0.3); }, 100);
    }

    function playVictory() {
        var melody = [523, 659, 784, 659, 784, 1047];
        var times  = [0, 120, 240, 400, 520, 650];
        melody.forEach(function (f, i) {
            setTimeout(function () { beep(f, 0.18, 'square', 0.35); }, times[i]);
        });
    }

    function playStepSound() {
        beep(80 + Math.random() * 40, 0.05, 'sine', 0.05);
    }

    function playIntroTheme() {
        if (!enabled) return;
        var c = getCtx();
        if (!c) return;
        // Short heroic fanfare riff
        var notes = [
            [329, 0.0, 0.25], [329, 0.3, 0.1], [329, 0.45, 0.1],
            [262, 0.6, 0.4],  [392, 1.0, 0.3], [349, 1.35, 0.2],
            [330, 1.6, 0.2],  [294, 1.85, 0.2],[262, 2.1, 0.6]
        ];
        notes.forEach(function (n) {
            var osc = c.createOscillator();
            var gain = c.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.type = 'square';
            osc.frequency.setValueAtTime(n[0], c.currentTime + n[1]);
            gain.gain.setValueAtTime(0.25, c.currentTime + n[1]);
            gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + n[1] + n[2]);
            osc.start(c.currentTime + n[1]);
            osc.stop(c.currentTime + n[1] + n[2] + 0.05);
        });
    }

    // Double laser blast — played when an enemy is defeated
    function playEnemyDeath() {
        if (!enabled) return;
        var c = getCtx();
        if (!c) return;

        // First blast: descending laser sweep
        var o1 = c.createOscillator(), g1 = c.createGain();
        o1.connect(g1); g1.connect(masterGain);
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(900, c.currentTime);
        o1.frequency.exponentialRampToValueAtTime(120, c.currentTime + 0.35);
        g1.gain.setValueAtTime(0.45, c.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.4);
        o1.start(c.currentTime);
        o1.stop(c.currentTime + 0.45);

        // Second blast (slightly higher, delayed)
        setTimeout(function () {
            var c2 = getCtx();
            if (!c2) return;
            var o2 = c2.createOscillator(), g2 = c2.createGain();
            o2.connect(g2); g2.connect(masterGain);
            o2.type = 'square';
            o2.frequency.setValueAtTime(1100, c2.currentTime);
            o2.frequency.exponentialRampToValueAtTime(160, c2.currentTime + 0.25);
            g2.gain.setValueAtTime(0.3, c2.currentTime);
            g2.gain.exponentialRampToValueAtTime(0.001, c2.currentTime + 0.3);
            o2.start(c2.currentTime);
            o2.stop(c2.currentTime + 0.35);
        }, 120);

        // Low thud / impact
        setTimeout(function () {
            var c3 = getCtx();
            if (!c3) return;
            var o3 = c3.createOscillator(), g3 = c3.createGain();
            o3.connect(g3); g3.connect(masterGain);
            o3.type = 'sine';
            o3.frequency.setValueAtTime(80, c3.currentTime);
            o3.frequency.exponentialRampToValueAtTime(30, c3.currentTime + 0.2);
            g3.gain.setValueAtTime(0.5, c3.currentTime);
            g3.gain.exponentialRampToValueAtTime(0.001, c3.currentTime + 0.25);
            o3.start(c3.currentTime);
            o3.stop(c3.currentTime + 0.3);
        }, 200);
    }

    function resume() {
        // Must be called from a user gesture before audio plays
        if (ctx && ctx.state === 'suspended') ctx.resume();
        else getCtx();
    }

    return {
        playLaser,
        playCorrect,
        playWrong,
        playSelect,
        playConfirm,
        playVictory,
        playStepSound,
        playIntroTheme,
        playEnemyDeath,
        resume
    };
})();
