// Top-down map scene — exploration, movement, enemy encounters
function MapScene(engine) {
    this.engine = engine;
}

// Tile types: 0=space floor  1=wall  2=crate  3=base floor  4=exit door
MapScene.prototype.TILEMAP = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,2,2,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,4,1],
    [1,3,3,2,2,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,1,1,1,1,3,3,3,1,1,1,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,2,2,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,3,3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,3,3,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

MapScene.prototype.MAP_COLS = 25;
MapScene.prototype.MAP_ROWS = 17;
MapScene.prototype.TILE_SIZE = 32;

MapScene.prototype.enter = function () {
    this.time = 0;
    this.stars = Sprites.generateStars(60, 800, 600);

    // Enemies — tile positions, with puzzle subjects cycling
    this.enemies = [
        { tx:4,  ty:6,  type:'stormtrooper', defeated:false, subject:'math',   pulse:0, deathTimer:0, name:'Commandant Calcul' },
        { tx:15, ty:3,  type:'droid',        defeated:false, subject:'french',  pulse:1, deathTimer:0, name:'Droïde Grammaire' },
        { tx:6,  ty:13, type:'stormtrooper', defeated:false, subject:'logic',   pulse:2, deathTimer:0, name:'Sergent Logique' },
        { tx:19, ty:10, type:'droid',        defeated:false, subject:'math',    pulse:3, deathTimer:0, name:'Droïde Équation' },
        { tx:22, ty:6,  type:'stormtrooper', defeated:false, subject:'french',  pulse:0, deathTimer:0, name:'Capitaine Syntaxe' },
    ];

    this.nearDefeatedEnemy = null;

    // Total enemies needed to defeat to unlock exit
    this.totalEnemies = this.enemies.length;

    // Camera offset
    this.camX = 0;
    this.camY = 0;

    // Show tutorial only on the very first entry (not after returning from battle)
    this.showTutorial = !this.engine._tutorialDone;

    // Guide banner (shown after defeating an enemy — points to the next one)
    if (this.engine._justWonBattle) {
        this.showGuide  = true;
        this.guideTimer = 7; // visible for 7 seconds
        this.engine._justWonBattle = false;
    } else if (!this.showGuide) {
        this.showGuide  = false;
        this.guideTimer = 0;
    }

    // Transition flash
    this.flashAlpha = 1;

    // Row 13 keeps the sprite's collision box clear of the bottom wall row (16).
    // startTileY 15 caused the 40px-tall sprite to overhang into row 16 (all walls),
    // making collides() return true for every direction and freezing the player.
    Player.init({
        startTileX: 2,
        startTileY: 13,
        hp:    this.engine.playerData.hp,
        maxHp: this.engine.playerData.maxHp,
    });
};

MapScene.prototype.exit = function () {};

MapScene.prototype.update = function (dt) {
    this.time += dt;
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2);

    if (this.showTutorial) {
        // No auto-advance — player decides when they are ready
        if (Input.wasPressed('Enter') || Input.wasPressed('Space') || Input.wasPressed('Escape')) {
            this.showTutorial = false;
            this.engine._tutorialDone = true; // won't show again on re-entry
        }
        return; // freeze player until tutorial is dismissed
    }

    Player.update(dt, this.TILEMAP, this.MAP_COLS, this.MAP_ROWS);

    // Tick death animations on defeated enemies
    this.enemies.forEach(function (e) {
        if (e.defeated && e.deathTimer > 0) {
            e.deathTimer = Math.max(0, e.deathTimer - dt);
        }
    });

    // Tick guide banner
    if (this.guideTimer > 0) {
        this.guideTimer -= dt;
        if (this.guideTimer <= 0) this.showGuide = false;
    }

    var W = 800, H = 600;
    var ts = this.TILE_SIZE;
    var ps = Player.getState();

    // Camera: center on player, clamp to map
    var targetCamX = ps.x + ts / 2 - W / 2;
    var targetCamY = ps.y + 20 - H / 2;
    var maxCamX = this.MAP_COLS * ts - W;
    var maxCamY = this.MAP_ROWS * ts - H;
    this.camX = Math.max(0, Math.min(maxCamX, targetCamX));
    this.camY = Math.max(0, Math.min(maxCamY, targetCamY));

    // Enemy encounter check
    var playerTX = Player.tileX();
    var playerTY = Player.tileY();

    for (var i = 0; i < this.enemies.length; i++) {
        var enemy = this.enemies[i];
        if (enemy.defeated) continue;
        var dist = Math.abs(enemy.tx - playerTX) + Math.abs(enemy.ty - playerTY);
        if (dist <= 1) {
            // Trigger battle
            this.engine.pendingEnemy = enemy;
            this.engine.changeScene('battle');
            return;
        }
    }

    // Track nearest fully-dead enemy for name dialogue
    this.nearDefeatedEnemy = null;
    var ptxd = Player.tileX(), ptyd = Player.tileY();
    for (var j = 0; j < this.enemies.length; j++) {
        var de = this.enemies[j];
        if (de.defeated && de.deathTimer === 0) {
            var ddist = Math.abs(de.tx - ptxd) + Math.abs(de.ty - ptyd);
            if (ddist <= 2) { this.nearDefeatedEnemy = de; break; }
        }
    }

    // Exit check — only unlocked when all enemies defeated
    var defeated = this.enemies.filter(function (e) { return e.defeated; }).length;
    if (defeated === this.totalEnemies) {
        // Check if player is on exit tile (column 23, row 1)
        if (playerTX === 23 && playerTY === 3) {
            this.engine.changeScene('victory');
        }
    }
};

MapScene.prototype.render = function (ctx) {
    var W = 800, H = 600;

    // Dark space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);

    var ts = this.TILE_SIZE;
    var camX = this.camX, camY = this.camY;

    // Draw visible tiles
    var startCol = Math.max(0, (camX / ts) | 0) - 1;
    var endCol   = Math.min(this.MAP_COLS - 1, ((camX + W) / ts) | 0) + 1;
    var startRow = Math.max(0, (camY / ts) | 0) - 1;
    var endRow   = Math.min(this.MAP_ROWS - 1, ((camY + H) / ts) | 0) + 1;

    for (var row = startRow; row <= endRow; row++) {
        for (var col = startCol; col <= endCol; col++) {
            var tile = this.TILEMAP[row] ? this.TILEMAP[row][col] : 1;
            Sprites.drawTile(ctx, tile || 0, col * ts - camX, row * ts - camY);
        }
    }

    // Draw enemies (with proximity pulse effect)
    var playerTX = Player.tileX();
    var playerTY = Player.tileY();
    var defeated = 0;

    this.enemies.forEach(function (enemy) {
        var ex = enemy.tx * ts - camX + ts / 2 - 16;
        var ey = enemy.ty * ts - camY + ts / 2 - 20;

        // ── Defeated enemy: explosion then tombstone ──────────────────────────
        if (enemy.defeated) {
            defeated++;

            if (enemy.deathTimer > 0) {
                // Expanding explosion ring
                var prog  = 1 - enemy.deathTimer / 1.4;
                var size  = 8 + prog * 36;
                var alpha = enemy.deathTimer / 1.4;

                ctx.save();
                ctx.globalAlpha = alpha;

                // Outer orange ring
                ctx.strokeStyle = '#ff8800';
                ctx.lineWidth = 4;
                ctx.shadowColor = '#ff8800';
                ctx.shadowBlur = 20;
                ctx.beginPath();
                ctx.arc(ex + 16, ey + 20, size, 0, Math.PI * 2);
                ctx.stroke();

                // Inner white core (shrinks as explosion grows)
                var coreSize = Math.max(0, 16 - prog * 16);
                ctx.fillStyle = '#ffffff';
                ctx.shadowBlur = 30;
                ctx.beginPath();
                ctx.arc(ex + 16, ey + 20, coreSize, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            } else {
                // Ghost sprite (dim, grayscale-ish)
                ctx.save();
                ctx.globalAlpha = 0.28;
                ctx.filter = 'grayscale(100%)';
                if (enemy.type === 'stormtrooper') {
                    Sprites.drawStormtrooper(ctx, ex, ey, 0);
                } else {
                    Sprites.drawDroid(ctx, ex, ey, 0);
                }
                ctx.filter = 'none';
                ctx.globalAlpha = 1;

                // Red cross overlay
                ctx.fillStyle = '#ff2222';
                ctx.font = 'bold 28px serif';
                ctx.textAlign = 'center';
                ctx.fillText('✕', ex + 16, ey + 28);

                // "VAINCU" label above
                ctx.fillStyle = '#ff6666';
                ctx.font = 'bold 9px "Courier New"';
                ctx.fillText('VAINCU', ex + 16, ey - 2);
                ctx.restore();
            }
            return;
        }

        var dist = Math.abs(enemy.tx - playerTX) + Math.abs(enemy.ty - playerTY);

        // ── Proximity glow halo ───────────────────────────────────────────────
        if (dist <= 4) {
            var glow = 0.25 + 0.25 * Math.sin(this.time * 6 + enemy.pulse);
            ctx.save();
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 20;
            ctx.globalAlpha = glow;
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(ex + 16, ey + 20, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // ── Enemy sprite ──────────────────────────────────────────────────────
        var frame = Math.floor(this.time * 3) % 4;
        if (enemy.type === 'stormtrooper') {
            Sprites.drawStormtrooper(ctx, ex, ey, frame);
        } else {
            Sprites.drawDroid(ctx, ex, ey, frame);
        }

        // ── Subject badge (always visible above enemy) ────────────────────────
        var subjectLabels = { math:'MATHS', french:'FRANÇAIS', logic:'LOGIQUE' };
        var subjectColors = { math:'#88ccff', french:'#ffcc44', logic:'#88ff88' };
        var subj = enemy.subject;
        var badgeW = 64, badgeH = 16;
        var badgeX = ex + 16 - badgeW / 2;
        var badgeY = ey - 22;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(badgeX, badgeY, badgeW, badgeH);
        ctx.strokeStyle = subjectColors[subj] || '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(badgeX, badgeY, badgeW, badgeH);
        ctx.fillStyle = subjectColors[subj] || '#ffffff';
        ctx.font = 'bold 9px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(subjectLabels[subj] || subj, ex + 16, badgeY + 11);

        // ── Distance 2–4: "APPROCHE !" callout ───────────────────────────────
        if (dist >= 2 && dist <= 4) {
            var calloutAlpha = 0.6 + 0.4 * Math.sin(this.time * 4 + enemy.pulse);
            ctx.fillStyle = 'rgba(255, 120, 0, ' + calloutAlpha + ')';
            ctx.font = 'bold 11px "Courier New"';
            ctx.textAlign = 'center';
            ctx.fillText('⚠ APPROCHE !', ex + 16, badgeY - 6);
        }

        // ── Distance 1: "⚔ COMBAT !" — about to trigger ──────────────────────
        if (dist === 1) {
            var blink = Math.sin(this.time * 8) > 0;
            if (blink) {
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 12;
                ctx.fillStyle = '#ffcc00';
                ctx.font = 'bold 13px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText('⚔ COMBAT !', ex + 16, badgeY - 8);
                ctx.shadowBlur = 0;
            }
        }

    }.bind(this));

    // Draw player
    Player.draw(ctx, this.engine.playerData.character, camX, camY);

    // Exit door highlight + NIVEAU 2 label
    if (defeated === this.totalEnemies) {
        var glow = 0.5 + 0.5 * Math.sin(this.time * 3);
        var exitCX = 23 * ts - camX + ts / 2;
        var exitCY = 3  * ts - camY + ts / 2;

        ctx.save();
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 30 * glow;
        ctx.fillStyle = 'rgba(0,170,255,' + (glow * 0.3) + ')';
        ctx.beginPath();
        ctx.arc(exitCX, exitCY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // "★ NIVEAU 2 ★" label above the exit
        var pulse = 0.7 + 0.3 * Math.sin(this.time * 3);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 13px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('★ NIVEAU 2 ★', exitCX, exitCY - 32);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // HUD
    this._renderHUD(ctx, W, H, defeated);

    // Defeated enemy dialogue — shown when player walks near a ghost
    if (this.nearDefeatedEnemy) {
        this._renderDefeatedMessage(ctx, W, H, defeated);
    }

    // Guide banner — points to next enemy; permanent once all are defeated
    var allDefeated = (defeated === this.totalEnemies);
    if ((this.showGuide && this.guideTimer > 0) || allDefeated) {
        this._renderEnemyGuide(ctx, W, H, camX, camY, allDefeated);
    }

    // Tutorial overlay
    if (this.showTutorial) {
        this._renderTutorial(ctx, W, H);
    }

    // Flash transition
    if (this.flashAlpha > 0) {
        ctx.fillStyle = 'rgba(0,0,0,' + this.flashAlpha + ')';
        ctx.fillRect(0, 0, W, H);
    }
};

MapScene.prototype._renderHUD = function (ctx, W, H, defeated) {
    var pd = this.engine.playerData;
    var ps = Player.getState();

    // Semi-transparent HUD bar
    ctx.fillStyle = 'rgba(0,0,17,0.75)';
    ctx.fillRect(0, 0, W, 44);
    ctx.fillStyle = 'rgba(68,136,255,0.3)';
    ctx.fillRect(0, 43, W, 1);

    // Player name / camp
    var campColor = pd.camp === 'light' ? '#4488FF' : '#FF4444';
    ctx.fillStyle = campColor;
    ctx.font = 'bold 13px "Courier New"';
    ctx.textAlign = 'left';
    var charNames = {
        'obi-wan':'Obi-Wan', 'yoda':'Yoda', 'rey':'Rey', 'qui-gon':'Qui-Gon',
        'dark-vador':'Vador', 'kylo-ren':'Kylo', 'grievous':'Grievous', 'inquisitor':'Inquisiteur'
    };
    ctx.fillText('⚔ ' + (charNames[pd.character] || pd.character), 10, 18);

    // School level
    ctx.fillStyle = '#FFD700';
    ctx.font = '11px "Courier New"';
    ctx.fillText('Niveau: ' + pd.schoolLevel, 10, 33);

    // HP bar
    Sprites.drawHP(ctx, 160, 16, ps.hp, ps.maxHp);

    // Score
    Sprites.drawScore(ctx, W - 10, 22, pd.score);

    // Enemy counter
    var total = this.enemies.length;
    ctx.fillStyle = defeated < total ? '#ff8844' : '#44ff88';
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('Ennemis vaincus: ' + defeated + ' / ' + total, W / 2, 20);

    if (defeated < total) {
        ctx.fillStyle = 'rgba(255,136,68,0.7)';
        ctx.font = '10px "Courier New"';
        ctx.fillText('Vaincs tous pour débloquer la sortie →', W / 2, 36);
    } else {
        ctx.fillStyle = 'rgba(68,255,136,0.9)';
        ctx.font = 'bold 10px "Courier New"';
        ctx.fillText('✓ Sortie débloquée ! Va jusqu\'à la porte bleue !', W / 2, 36);
    }
};

MapScene.prototype._renderTutorial = function (ctx, W, H) {
    // Full-screen dark overlay
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, W, H);

    var bw = 560, bh = 280;
    var bx = (W - bw) / 2, by = H / 2 - bh / 2;

    // Panel
    ctx.fillStyle = '#000f28';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Title bar
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(bx, by, bw, 34);
    ctx.fillStyle = '#000011';
    ctx.font = 'bold 15px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('📖  COMMENT JOUER ?', W / 2, by + 22);

    // NPC sprite
    Sprites.drawJedi(ctx, bx + 16, by + 50, 0);

    // Steps
    var steps = [
        { key:'⬆⬇⬅➡', label:'Flèches du clavier pour te déplacer sur la carte.' },
        { key:'⚠',      label:'Quand tu vois "APPROCHE !", marche vers l\'ennemi.' },
        { key:'⚔',      label:'"COMBAT !" = tu es adjacent. Le combat démarre seul !' },
        { key:'↑↓',     label:'Dans le combat : flèches HAUT/BAS pour choisir.' },
        { key:'⏎',      label:'ENTRÉE pour valider ta réponse. Bonne = ennemi vaincu.' },
        { key:'🚪',     label:'Vaincre tous les ennemis débloque la porte de sortie.' },
    ];

    ctx.textAlign = 'left';
    steps.forEach(function (s, i) {
        var ly = by + 58 + i * 34;
        // Key badge
        ctx.fillStyle = 'rgba(255,215,0,0.12)';
        ctx.fillRect(bx + 72, ly - 14, 30, 20);
        ctx.strokeStyle = 'rgba(255,215,0,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 72, ly - 14, 30, 20);
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px serif';
        ctx.textAlign = 'center';
        ctx.fillText(s.key, bx + 87, ly);
        // Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '13px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText(s.label, bx + 112, ly);
    });

    // Blinking prompt
    var blink = Math.sin(this.time * 3) > 0;
    if (blink) {
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('[ Appuie sur ENTRÉE pour commencer l\'aventure ]', W / 2, by + bh - 12);
    }
};

// ── Defeated enemy name dialogue ─────────────────────────────────────────────

MapScene.prototype._renderDefeatedMessage = function (ctx, W, H, defeatedCount) {
    var enemy = this.nearDefeatedEnemy;
    var allDefeated = (defeatedCount === this.totalEnemies);
    var line2 = allDefeated ? 'Rejoins la porte de sortie !' : 'Affronte l\'ennemi suivant !';

    var bw = 420, bh = 62;
    var bx = (W - bw) / 2, by = Math.round(H * 0.62);

    ctx.fillStyle = 'rgba(0,8,22,0.93)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // Icon
    ctx.fillStyle = '#ff6666';
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✕', bx + 26, by + 26);

    ctx.fillStyle = '#ffbbbb';
    ctx.font = 'bold 13px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('Tu as vaincu ' + enemy.name + ' !', W / 2, by + 24);

    ctx.fillStyle = '#aaddff';
    ctx.font = '12px "Courier New"';
    ctx.fillText(line2, W / 2, by + 46);
};

// ── Helper: nearest undefeated enemy ─────────────────────────────────────────

MapScene.prototype._nearestEnemy = function () {
    var nearest = null, best = Infinity;
    var ptx = Player.tileX(), pty = Player.tileY();
    this.enemies.forEach(function (e) {
        if (e.defeated) return;
        var d = Math.abs(e.tx - ptx) + Math.abs(e.ty - pty);
        if (d < best) { best = d; nearest = e; }
    });
    return nearest;
};

// ── Guide banner: shown after winning a battle ────────────────────────────────

MapScene.prototype._renderEnemyGuide = function (ctx, W, H, camX, camY, allDefeated) {
    var nearest = this._nearestEnemy();

    var SUBJECT = {
        math:   { label:'MATHS',    color:'#88ccff', icon:'🔢' },
        french: { label:'FRANÇAIS', color:'#ffcc44', icon:'🇫🇷' },
        logic:  { label:'LOGIQUE',  color:'#88ff88', icon:'🧩' },
    };

    // Fade out in the last 2 seconds — but stay solid when all enemies are defeated
    var fadeAlpha = allDefeated ? 1 : Math.min(1, this.guideTimer / 1.5);
    var ts = this.TILE_SIZE;

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    if (!nearest) {
        // All enemies gone — point to exit door
        var gx = 23 * ts - camX + ts / 2;
        var gy = 3  * ts - camY + ts / 2;

        // Pulsing ring around exit
        var ring = 28 + 8 * Math.sin(this.time * 4);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(gx, gy, ring, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Banner
        var bw = 440, bh = 44, bx = (W - bw) / 2, by = 50;
        ctx.fillStyle = 'rgba(0,20,50,0.92)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = '#00aaff';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = '#00ddff';
        ctx.font = 'bold 15px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('🚪  Tous vaincus ! Rejoins la porte de sortie !  🚪', W / 2, by + 28);

    } else {
        var info = SUBJECT[nearest.subject] || { label: nearest.subject, color:'#ffffff', icon:'⚔' };

        // Pulsing ring around the next target
        var ex = nearest.tx * ts - camX + ts / 2;
        var ey = nearest.ty * ts - camY + ts / 2;
        var ring2 = 28 + 8 * Math.sin(this.time * 5);
        ctx.strokeStyle = info.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = info.color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(ex, ey, ring2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Directional arrow from player toward next enemy
        var ptx = Player.tileX() * ts - camX + ts / 2;
        var pty = Player.tileY() * ts - camY + ts / 2;
        var angle = Math.atan2(ey - pty, ex - ptx);
        var arrowR = 48;
        var ax = Math.max(30, Math.min(W - 30, ptx + Math.cos(angle) * arrowR));
        var ay = Math.max(60, Math.min(H - 30, pty + Math.sin(angle) * arrowR));

        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(angle);
        ctx.fillStyle = info.color;
        ctx.shadowColor = info.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(18, 0);
        ctx.lineTo(-9, -9);
        ctx.lineTo(-4, 0);
        ctx.lineTo(-9, 9);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Banner (below HUD bar)
        var bw = 500, bh = 44, bx = (W - bw) / 2, by = 50;
        ctx.fillStyle = 'rgba(0,15,35,0.92)';
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = info.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = info.color;
        ctx.font = 'bold 15px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(info.icon + '  Prochain combat : ' + info.label + '  ' + info.icon, W / 2, by + 28);
    }

    ctx.restore();
};
