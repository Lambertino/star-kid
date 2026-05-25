// Battle scene — educational quiz against an enemy
// UX redesign: vertical choices, large instructions, clear selection indicator
function BattleScene(engine) {
    this.engine = engine;
}

// ── Layout constants ──────────────────────────────────────────────────────────
var GROUND_Y   = 240;  // combatants sit above this line
var PANEL_Y    = 268;  // quiz panel starts here
var CHOICE_H   = 50;   // height of each answer button
var CHOICE_GAP = 8;    // gap between buttons

BattleScene.prototype.enter = function () {
    this.time        = 0;
    // Skip the "how to play" panel after the very first battle
    this.phase       = this.engine._battleIntroDone ? 'quiz' : 'intro';
    this.introTimer  = 0;
    this.cursor      = 0;
    this.puzzle      = null;
    this.feedbackTimer   = 0;
    this.feedbackCorrect = false;
    this.shakeTimer  = 0;
    this.answerLocked = false;
    this.stars = Sprites.generateStars(80, 800, 600);
    this.enemy = this.engine.pendingEnemy;
    this._nextPuzzle();
};

BattleScene.prototype.exit = function () {};

BattleScene.prototype._nextPuzzle = function () {
    var pd = this.engine.playerData;
    var subject = this.enemy ? this.enemy.subject : 'math';
    this.puzzle = PuzzleEngine.generate(subject, pd.schoolLevel);
    this.cursor = 0;
    this.answerLocked = false;
};

BattleScene.prototype.update = function (dt) {
    this.time += dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // ── Intro: show "how to play" — player presses ENTER when ready ──────────
    if (this.phase === 'intro') {
        this.introTimer += dt;
        if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
            this.phase = 'quiz';
            this.engine._battleIntroDone = true; // never show again
        }
        return;
    }

    // ── Feedback: wait, then branch ───────────────────────────────────────────
    if (this.phase === 'feedback') {
        this.feedbackTimer -= dt;
        if (this.feedbackTimer <= 0) {
            if (this.feedbackCorrect) {
                if (this.enemy) {
                    this.enemy.defeated  = true;
                    this.enemy.deathTimer = 1.4; // drives explosion anim in mapScene
                }
                Audio.playEnemyDeath();           // laser/blaster sound on kill
                this.engine.playerData.score += 10;
                this.engine._justWonBattle = true; // signal mapScene to show guide
                this.engine.changeScene('map');
            } else {
                var ps = Player.getState();
                ps.hp = Math.max(0, ps.hp - 20);
                this.engine.playerData.hp = ps.hp;
                if (ps.hp <= 0) {
                    this.engine.changeScene('gameover');
                } else {
                    this._nextPuzzle();
                    this.phase = 'quiz';
                }
            }
        }
        return;
    }

    if (this.phase !== 'quiz' || this.answerLocked) return;

    // ── Quiz navigation: UP / DOWN only (linear, simpler for children) ────────
    if (Input.wasPressed('ArrowUp')   || Input.wasPressed('KeyW')) {
        this.cursor = Math.max(0, this.cursor - 1);
        Audio.playSelect();
    }
    if (Input.wasPressed('ArrowDown') || Input.wasPressed('KeyS')) {
        this.cursor = Math.min(3, this.cursor + 1);
        Audio.playSelect();
    }

    // Direct number keys 1–4
    for (var k = 1; k <= 4; k++) {
        if (Input.wasPressed('Digit' + k) || Input.wasPressed('Numpad' + k)) {
            this.cursor = k - 1;
            Audio.playSelect();
        }
    }

    if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
        this._submitAnswer();
    }
};

BattleScene.prototype._submitAnswer = function () {
    this.answerLocked = true;
    var correct = this.cursor === this.puzzle.correctIndex;
    this.feedbackCorrect = correct;
    this.phase = 'feedback';
    this.feedbackTimer = correct ? 2.2 : 2.8;
    if (correct) { Audio.playCorrect(); }
    else         { Audio.playWrong(); this.shakeTimer = 0.4; }
};

// ── Render ────────────────────────────────────────────────────────────────────

BattleScene.prototype.render = function (ctx) {
    var W = 800, H = 600;
    var shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;
    var shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * 8 : 0;

    ctx.save();
    if (this.shakeTimer > 0) ctx.translate(shakeX, shakeY);

    var pd = this.engine.playerData;
    var isLight = pd.camp === 'light';

    // Space background
    ctx.fillStyle = isLight ? '#000820' : '#080010';
    ctx.fillRect(0, 0, W, H);
    Sprites.drawStars(ctx, this.stars, this.time);

    // Ground glow
    var grd = ctx.createLinearGradient(0, GROUND_Y - 20, 0, GROUND_Y + 40);
    grd.addColorStop(0, 'transparent');
    grd.addColorStop(1, isLight ? 'rgba(0,60,180,0.4)' : 'rgba(120,0,0,0.4)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, GROUND_Y - 20, W, 60);

    if (this.phase === 'intro') {
        this._renderArena(ctx, W, pd, isLight);
        this._renderIntroInstructions(ctx, W, H);
    } else {
        this._renderArena(ctx, W, pd, isLight);
        this._renderQuizPanel(ctx, W, H, pd);
    }

    ctx.restore();
};

BattleScene.prototype._renderArena = function (ctx, W, pd, isLight) {
    // Player sprite — left side
    ctx.save();
    ctx.shadowColor = isLight ? '#4488ff' : '#ff2222';
    ctx.shadowBlur = 18;
    Sprites.drawCharacter(ctx, pd.character, 60, GROUND_Y - 40, Math.floor(this.time * 2) % 4);
    ctx.restore();

    // Enemy sprite — right side (flipped)
    var enemyX = W - 140;
    ctx.save();
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 18;
    ctx.translate(enemyX + 32, 0);
    ctx.scale(-1, 1);
    var eFrame = Math.floor(this.time * 1.5) % 4;
    if (this.enemy && this.enemy.type === 'droid') {
        Sprites.drawDroid(ctx, 0, GROUND_Y - 40, eFrame);
    } else {
        Sprites.drawStormtrooper(ctx, 0, GROUND_Y - 40, eFrame);
    }
    ctx.restore();

    // Enemy name label
    var enemyNames = { stormtrooper: 'Stormtrooper', droid: 'Droïde B1' };
    ctx.fillStyle = '#ff8844';
    ctx.font = 'bold 12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(enemyNames[this.enemy ? this.enemy.type : 'stormtrooper'], W - 108, GROUND_Y - 48);

    // Player name label
    var charNames = {
        'obi-wan':'Obi-Wan', 'yoda':'Yoda', 'rey':'Rey', 'qui-gon':'Qui-Gon',
        'dark-vador':'Vador', 'kylo-ren':'Kylo Ren', 'grievous':'Grievous', 'inquisitor':'Inquisiteur'
    };
    ctx.fillStyle = isLight ? '#88bbff' : '#ff8888';
    ctx.textAlign = 'center';
    ctx.fillText(charNames[pd.character] || pd.character, 76, GROUND_Y - 48);

    // VS badge
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 22px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('VS', W / 2, GROUND_Y - 5);
    ctx.shadowBlur = 0;

    // Subject banner
    var subjectLabels = { math:'🔢 Mathématiques', french:'🇫🇷 Français', logic:'🧩 Logique' };
    var subj = this.enemy ? this.enemy.subject : 'math';
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Courier New"';
    ctx.fillText(subjectLabels[subj] || subj, W / 2, GROUND_Y + 18);
};

// ── Intro instructions panel ──────────────────────────────────────────────────

BattleScene.prototype._renderIntroInstructions = function (ctx, W, H) {
    var alpha = Math.min(1, this.introTimer / 0.6);
    var bw = 560, bh = 240;
    var bx = (W - bw) / 2, by = PANEL_Y + 8;

    ctx.globalAlpha = alpha;

    // Panel background
    ctx.fillStyle = 'rgba(0, 8, 30, 0.95)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('⚔  COMBAT — Comment jouer ?  ⚔', W / 2, by + 30);

    ctx.fillStyle = 'rgba(255,215,0,0.4)';
    ctx.fillRect(bx + 20, by + 38, bw - 40, 1);

    // Instruction lines
    var lines = [
        { icon: '📖', text: 'Une question apparaît en bas.' },
        { icon: '↑↓', text: 'Utilise les flèches HAUT / BAS pour choisir une réponse.' },
        { icon: '⏎', text: 'Appuie sur ENTRÉE pour valider ta réponse.' },
        { icon: '✅', text: 'Bonne réponse → l\'ennemi est vaincu !' },
        { icon: '❌', text: 'Mauvaise réponse → tu perds 20 PV, puis réessaies.' },
    ];

    ctx.font = '14px "Courier New"';
    ctx.textAlign = 'left';
    lines.forEach(function (line, i) {
        var ly = by + 60 + i * 34;
        ctx.fillStyle = '#FFD700';
        ctx.fillText(line.icon, bx + 24, ly);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line.text, bx + 60, ly);
    });

    // Auto-skip hint (blink)
    var blink = Math.sin(this.time * 3) > 0;
    if (blink) {
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('[ ENTRÉE pour passer — ou attends 3 secondes ]', W / 2, by + bh - 14);
    }

    ctx.globalAlpha = 1;
};

// ── Quiz panel ────────────────────────────────────────────────────────────────

BattleScene.prototype._renderQuizPanel = function (ctx, W, H, pd) {
    var pz = this.puzzle;
    if (!pz) return;

    var px = 30, pw = W - 60;
    var py = PANEL_Y;
    var ph = H - py - 8;

    // Panel background + border
    ctx.fillStyle = 'rgba(0, 8, 28, 0.95)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = 'rgba(68,136,255,0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, pw, ph);

    // ── HP bar + score in top-right corner ───────────────────────────────────
    var ps = Player.getState();
    Sprites.drawHP(ctx, W - 160, py + 8, ps.hp, ps.maxHp);
    ctx.fillStyle = '#FFD700';
    ctx.font = '11px "Courier New"';
    ctx.textAlign = 'right';
    ctx.fillText('★ ' + this.engine.playerData.score, W - 35, py + 20);

    // ── Feedback overlay (replaces choices) ──────────────────────────────────
    if (this.phase === 'feedback') {
        this._renderFeedback(ctx, px, py, pw, ph);
        return;
    }

    // ── Question ─────────────────────────────────────────────────────────────
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 10px "Courier New"';
    ctx.textAlign = 'left';
    ctx.fillText('QUESTION :', px + 16, py + 18);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText(pz.emoji + '  ' + pz.question, W / 2, py + 46);

    ctx.fillStyle = 'rgba(68,136,255,0.4)';
    ctx.fillRect(px + 20, py + 54, pw - 40, 1);

    // ── Answer choices (vertical list) ───────────────────────────────────────
    var choiceStartY = py + 64;
    var choiceW = pw - 40;
    var choiceX = px + 20;

    pz.choices.forEach(function (choice, i) {
        var cy = choiceStartY + i * (CHOICE_H + CHOICE_GAP);
        var selected = this.cursor === i;

        // Glow effect on selected button
        if (selected) {
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 16;
        }

        // Button fill
        ctx.fillStyle = selected ? '#0e2a55' : '#080f20';
        ctx.fillRect(choiceX, cy, choiceW, CHOICE_H);
        ctx.shadowBlur = 0;

        // Button border — thicker and brighter when selected
        ctx.strokeStyle = selected ? '#66aaff' : 'rgba(68,136,255,0.25)';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.strokeRect(choiceX, cy, choiceW, CHOICE_H);

        // Left accent bar on selected
        if (selected) {
            ctx.fillStyle = '#4488ff';
            ctx.fillRect(choiceX, cy, 5, CHOICE_H);
        }

        // Key number badge
        var badgeColor = selected ? '#FFD700' : 'rgba(255,215,0,0.35)';
        ctx.fillStyle = badgeColor;
        ctx.font = 'bold 13px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(i + 1, choiceX + 22, cy + CHOICE_H / 2 + 5);

        // Selection arrow
        if (selected) {
            ctx.fillStyle = '#66aaff';
            ctx.font = 'bold 16px "Courier New"';
            ctx.textAlign = 'left';
            ctx.fillText('►', choiceX + 38, cy + CHOICE_H / 2 + 6);
        }

        // Answer text — larger, centered
        ctx.fillStyle = selected ? '#ffffff' : 'rgba(200,210,230,0.75)';
        ctx.font = (selected ? 'bold ' : '') + '16px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(String(choice), choiceX + choiceW / 2 + 20, cy + CHOICE_H / 2 + 6);

    }.bind(this));

    // ── Control instructions (always visible, bottom of panel) ───────────────
    var ctrlY = choiceStartY + 4 * (CHOICE_H + CHOICE_GAP) + 10;

    // ENTER button — pulsing
    var pulse = 0.7 + 0.3 * Math.sin(this.time * 3);
    ctx.fillStyle = 'rgba(0, 30, 80, ' + (0.7 * pulse) + ')';
    ctx.fillRect(W / 2 - 160, ctrlY, 320, 32);
    ctx.strokeStyle = 'rgba(68,136,255,' + pulse + ')';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 160, ctrlY, 320, 32);

    ctx.fillStyle = 'rgba(255,255,255,' + pulse + ')';
    ctx.font = 'bold 14px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('⏎  ENTRÉE  →  Valider ma réponse', W / 2, ctrlY + 21);

    // Navigation hint (smaller, below)
    ctx.fillStyle = 'rgba(160,180,220,0.55)';
    ctx.font = '11px "Courier New"';
    ctx.fillText('↑ ↓ pour naviguer   Touches 1 2 3 4 pour sélection rapide', W / 2, ctrlY + 46);
};

// ── Feedback ──────────────────────────────────────────────────────────────────

BattleScene.prototype._renderFeedback = function (ctx, panelX, panelY, panelW, panelH) {
    var pz  = this.puzzle;
    var pct = this.feedbackTimer / (this.feedbackCorrect ? 2.2 : 2.8);
    var W   = 800;
    var cy  = panelY + panelH / 2;

    if (this.feedbackCorrect) {
        ctx.fillStyle = 'rgba(0, 35, 15, 0.9)';
        ctx.fillRect(panelX + 1, panelY + 1, panelW - 2, panelH - 2);

        // Orbiting stars
        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2 + this.time * 2.5;
            var dist  = 50 + 30 * (1 - pct);
            ctx.fillStyle = ['#FFD700','#44ff88','#88ffff'][i % 3];
            ctx.font = '18px serif';
            ctx.textAlign = 'center';
            ctx.fillText('★', W / 2 + Math.cos(angle) * dist, cy - 30 + Math.sin(angle) * dist * 0.5);
        }

        ctx.shadowColor = '#44ff88';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 36px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('✓  BONNE RÉPONSE !', W / 2, cy - 10);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(100,255,180,0.85)';
        ctx.font = 'bold 16px "Courier New"';
        ctx.fillText('+10 points  ★', W / 2, cy + 28);

        ctx.fillStyle = 'rgba(180,255,210,0.7)';
        ctx.font = '13px "Courier New"';
        ctx.fillText(pz.explanation, W / 2, cy + 56);

    } else {
        ctx.fillStyle = 'rgba(35, 8, 0, 0.9)';
        ctx.fillRect(panelX + 1, panelY + 1, panelW - 2, panelH - 2);

        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ff6644';
        ctx.font = 'bold 30px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('✗  PAS TOUT À FAIT…', W / 2, cy - 20);
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(255,220,160,0.95)';
        ctx.font = 'bold 15px "Courier New"';
        ctx.fillText('La bonne réponse était : ' + pz.choices[pz.correctIndex], W / 2, cy + 16);

        ctx.fillStyle = 'rgba(255,200,140,0.8)';
        ctx.font = '13px "Courier New"';
        ctx.fillText(pz.explanation, W / 2, cy + 42);

        ctx.fillStyle = '#ff9966';
        ctx.font = '12px "Courier New"';
        ctx.fillText('−20 PV  —  Tu peux réessayer !', W / 2, cy + 68);
    }
};
