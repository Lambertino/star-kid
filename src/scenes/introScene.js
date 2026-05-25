// Introduction scene — Star Wars-style opening crawl + logo
function IntroScene(engine) {
    this.engine = engine;
}

IntroScene.prototype.enter = function () {
    this.time = 0;
    this.phase = 'logo'; // 'logo' → 'crawl'
    this.logoTimer = 0;
    this.crawlY = -600;  // starts off-screen bottom
    this.crawlDone = false;
    this.stars = Sprites.generateStars(200, 800, 600);
    this.introPlayed = false;

    this.crawlLines = [
        '',
        'Il y a très longtemps,',
        'dans une galaxie lointaine...',
        '',
        '',
        '— STAR KID —',
        '',
        "L'EMPIRE DES DONNÉES a lancé",
        'ses armées de droïdes contre',
        'les planètes libres.',
        '',
        'Seuls ceux qui maîtrisent',
        'le SAVOIR peuvent repousser',
        "les envahisseurs.",
        '',
        "Le Conseil de l'Académie",
        't\'a choisi pour une mission',
        'de la plus haute importance.',
        '',
        'Mathématiques, Français,',
        'Logique — telles sont tes',
        'armes contre les ténèbres.',
        '',
        '',
        'La FORCE du SAVOIR',
        '    est avec toi...',
        '',
        '',
    ];
};

IntroScene.prototype.exit = function () {};

IntroScene.prototype.update = function (dt) {
    this.time += dt;
    Sprites.drawStars; // just reference to avoid lint

    if (this.phase === 'logo') {
        this.logoTimer += dt;
        if (!this.introPlayed && this.logoTimer > 0.5) {
            Audio.playIntroTheme();
            this.introPlayed = true;
        }
        if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
            this.phase = 'crawl';
        }
    } else if (this.phase === 'crawl') {
        if (!this.crawlDone) {
            this.crawlY += 40 * dt; // scroll speed
            if (this.crawlY > this.crawlLines.length * 36 + 200) {
                this.crawlDone = true;
            }
        }
        if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
            Audio.resume();
            Audio.playConfirm();
            this.engine.changeScene('selection');
        }
    }
};

IntroScene.prototype.render = function (ctx) {
    var W = 800, H = 600;

    // Deep space background
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);

    // Twinkling stars
    Sprites.drawStars(ctx, this.stars, this.time);

    if (this.phase === 'logo') {
        this._renderLogo(ctx, W, H);
    } else {
        this._renderCrawl(ctx, W, H);
    }
};

IntroScene.prototype._renderLogo = function (ctx, W, H) {
    var alpha = Math.min(1, this.logoTimer / 1.2);
    var fadeOut = this.logoTimer > 2.5 ? Math.max(0, 1 - (this.logoTimer - 2.5) / 1) : 1;
    var a = alpha * fadeOut;

    ctx.save();
    ctx.globalAlpha = a;

    // Galaxy symbol (hand-drawn in canvas)
    this._drawGalaxySymbol(ctx, W / 2, H / 2 - 90, 50);

    // Main title
    ctx.shadowColor = '#4488ff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 72px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('STAR', W / 2, H / 2 - 10);

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 24;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 72px "Courier New"';
    ctx.fillText('KID', W / 2, H / 2 + 65);

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '16px "Courier New"';
    ctx.fillText('Apprends en sauvant la Galaxie', W / 2, H / 2 + 105);

    ctx.restore();

    // Press Enter prompt — outside fading block so it stays visible
    var blink = Math.sin(this.time * 3) > 0 ? 1 : 0;
    ctx.fillStyle = 'rgba(255,255,255,' + (blink * 0.85) + ')';
    ctx.font = '14px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('⏎  Appuyez sur ENTRÉE pour continuer', W / 2, H - 50);
};

IntroScene.prototype._drawGalaxySymbol = function (ctx, cx, cy, r) {
    ctx.save();
    ctx.translate(cx, cy);

    // Outer ring
    ctx.strokeStyle = 'rgba(68,136,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    var grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    grad.addColorStop(0, 'rgba(200,220,255,0.8)');
    grad.addColorStop(0.4, 'rgba(68,136,255,0.4)');
    grad.addColorStop(1, 'rgba(0,0,20,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Star lines / galaxy arms
    ctx.strokeStyle = 'rgba(200,220,255,0.5)';
    ctx.lineWidth = 1;
    for (var i = 0; i < 6; i++) {
        var angle = (i / 6) * Math.PI * 2 + this.time * 0.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * r * 0.9, Math.sin(angle) * r * 0.9);
        ctx.stroke();
    }

    // Center star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
};

IntroScene.prototype._renderCrawl = function (ctx, W, H) {
    ctx.save();

    // Clip to center column
    ctx.beginPath();
    ctx.rect(80, 0, 640, H - 40);
    ctx.clip();

    // Perspective transform anchored at bottom center
    ctx.translate(W / 2, H - 20);
    ctx.transform(1, 0, 0, 0.38, 0, 0); // flatten for perspective

    ctx.fillStyle = '#FFD700';
    ctx.textAlign = 'center';

    var lineH = 36;
    var startY = -this.crawlY;

    for (var i = 0; i < this.crawlLines.length; i++) {
        var lineY = startY + i * lineH;
        if (lineY < -100 || lineY > 1200) continue;

        var line = this.crawlLines[i];
        // Title line in larger text
        if (line.indexOf('STAR KID') !== -1) {
            ctx.font = 'bold 30px "Courier New"';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 15;
        } else if (line === '') {
            continue;
        } else {
            ctx.font = '22px "Courier New"';
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 0;
        }
        ctx.fillText(line, 0, lineY);
    }

    ctx.restore();

    // Fade out top (stars show through, text disappears)
    var topGrad = ctx.createLinearGradient(0, 0, 0, 200);
    topGrad.addColorStop(0, 'rgba(0,0,17,1)');
    topGrad.addColorStop(1, 'rgba(0,0,17,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, W, 200);

    // Fade out bottom
    var botGrad = ctx.createLinearGradient(0, H - 80, 0, H);
    botGrad.addColorStop(0, 'rgba(0,0,17,0)');
    botGrad.addColorStop(1, 'rgba(0,0,17,1)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, H - 80, W, 80);

    // Press Enter prompt
    var promptAlpha = 0.5 + 0.5 * Math.sin(this.time * 2.5);
    if (this.crawlDone) {
        // Crawl finished — prominent CTA, no more auto-advance
        ctx.fillStyle = 'rgba(0,0,17,0.9)';
        ctx.fillRect(W / 2 - 230, H - 40, 460, 30);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - 230, H - 40, 460, 30);
        ctx.fillStyle = 'rgba(255,215,0,' + promptAlpha + ')';
        ctx.font = 'bold 14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('⏎  ENTRÉE — Commencer l\'aventure !', W / 2, H - 20);
    } else if (this.crawlY > 150) {
        ctx.fillStyle = 'rgba(255,255,255,' + (promptAlpha * 0.6) + ')';
        ctx.font = '14px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText('ENTRÉE — passer', W / 2, H - 12);
    }
};
