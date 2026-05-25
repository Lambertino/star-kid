// Selection scene — three steps: camp → character → school level
function SelectionScene(engine) {
    this.engine = engine;
}

SelectionScene.prototype.STEPS = ['camp', 'character', 'level'];

SelectionScene.prototype.LIGHT_CHARS = [
    { id: 'obi-wan',  name: 'Obi-Wan Kenobi', desc: 'Sage et équilibré' },
    { id: 'yoda',     name: 'Maître Yoda',     desc: 'Petite taille, grande sagesse' },
    { id: 'rey',      name: 'Rey',              desc: 'Déterminée et courageuse' },
    { id: 'qui-gon',  name: 'Qui-Gon Jinn',    desc: 'Maître de la Nature' },
];

SelectionScene.prototype.DARK_CHARS = [
    { id: 'dark-vador', name: 'Dark Vador',    desc: 'Puissant et implacable' },
    { id: 'kylo-ren',   name: 'Kylo Ren',      desc: 'Coléreux mais redoutable' },
    { id: 'grievous',   name: 'Gal. Grievous',  desc: 'Machine de guerre' },
    { id: 'inquisitor', name: 'Inquisiteur',    desc: 'Chasseur de Jedis' },
];

SelectionScene.prototype.LEVELS = [
    { id: 'CE1', name: 'CE1', desc: 'Additions & Soustractions\njusqu\'à 20' },
    { id: 'CE2', name: 'CE2', desc: 'Tables de 2, 5, 10\nFrançais de base' },
    { id: 'CM1', name: 'CM1', desc: 'Tables de multiplication\nGrammaire avancée' },
    { id: 'CM2', name: 'CM2', desc: 'Problèmes complexes\nLogique avancée' },
];

SelectionScene.prototype.enter = function () {
    this.step = 0;       // 0=camp, 1=character, 2=level
    this.cursor = 0;
    this.time = 0;
    this.stars = Sprites.generateStars(150, 800, 600);
    this.fadeIn = 0;
    // Temporary selections
    this.selectedCamp = null;
    this.selectedChar = null;
};

SelectionScene.prototype.exit = function () {};

SelectionScene.prototype.update = function (dt) {
    this.time += dt;
    this.fadeIn = Math.min(1, this.fadeIn + dt * 2);

    var items = this._currentItems();
    var maxCursor = items.length - 1;

    if (Input.wasPressed('ArrowRight') || Input.wasPressed('ArrowDown')) {
        this.cursor = Math.min(this.cursor + 1, maxCursor);
        Audio.playSelect();
    }
    if (Input.wasPressed('ArrowLeft') || Input.wasPressed('ArrowUp')) {
        this.cursor = Math.max(this.cursor - 1, 0);
        Audio.playSelect();
    }

    if (Input.wasPressed('Enter') || Input.wasPressed('Space')) {
        this._confirm();
    }

    // Escape goes back one step
    if (Input.wasPressed('Escape') && this.step > 0) {
        this.step--;
        this.cursor = 0;
        Audio.playSelect();
    }
};

SelectionScene.prototype._currentItems = function () {
    if (this.step === 0) return [{ id: 'light' }, { id: 'dark' }];
    if (this.step === 1) return this.selectedCamp === 'light' ? this.LIGHT_CHARS : this.DARK_CHARS;
    return this.LEVELS;
};

SelectionScene.prototype._confirm = function () {
    var items = this._currentItems();
    var item = items[this.cursor];

    if (this.step === 0) {
        this.selectedCamp = item.id;
        this.step = 1;
        this.cursor = 0;
        this.engine.playerData.camp = item.id;
        Audio.playConfirm();
    } else if (this.step === 1) {
        this.selectedChar = item.id;
        this.step = 2;
        this.cursor = 0;
        this.engine.playerData.character = item.id;
        Audio.playConfirm();
    } else {
        this.engine.playerData.schoolLevel = item.id;
        Audio.playVictory();
        var eng = this.engine;
        setTimeout(function () { eng.changeScene('map'); }, 600);
    }
};

SelectionScene.prototype.render = function (ctx) {
    var W = 800, H = 600;
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, W, H);
    Sprites.drawStars(ctx, this.stars, this.time);

    ctx.save();
    ctx.globalAlpha = this.fadeIn;

    if (this.step === 0) this._renderCampSelection(ctx, W, H);
    else if (this.step === 1) this._renderCharacterSelection(ctx, W, H);
    else this._renderLevelSelection(ctx, W, H);

    // Step indicator at bottom
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('← → pour choisir   ENTRÉE pour confirmer   ÉCHAP pour revenir', W / 2, H - 12);

    ctx.restore();
};

// ── Camp selection ─────────────────────────────────────────────────────────────

SelectionScene.prototype._renderCampSelection = function (ctx, W, H) {
    Sprites.drawGlowText(ctx, 'CHOISIS TON CAMP', W / 2, 60, 24, '#FFD700', '#FFD700', 10);

    var cards = [
        { x: 130, label: 'CÔTÉ LUMINEUX', color1: '#001840', color2: '#0044aa',
          border: '#4488FF', glowColor: '#4488ff', emoji: '✨',
          desc: ['Jedi, gardiens de la paix', 'Sabre laser bleu/vert', 'Protecteurs de la Galaxie'] },
        { x: 470, label: 'CÔTÉ OBSCUR',  color1: '#1a0000', color2: '#660000',
          border: '#FF3333', glowColor: '#ff2222', emoji: '⚡',
          desc: ['Sith, maîtres du pouvoir', 'Sabre laser rouge', 'Conquérants de la Galaxie'] },
    ];

    cards.forEach(function (card, i) {
        var selected = this.cursor === i;
        var cardW = 220, cardH = 320;
        var cardY = H / 2 - cardH / 2 + (selected ? -8 : 0);

        // Card shadow
        if (selected) {
            ctx.shadowColor = card.glowColor;
            ctx.shadowBlur = 30;
        }

        // Background
        var grad = ctx.createLinearGradient(card.x, cardY, card.x, cardY + cardH);
        grad.addColorStop(0, card.color2);
        grad.addColorStop(1, card.color1);
        ctx.fillStyle = grad;
        ctx.fillRect(card.x, cardY, cardW, cardH);

        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = selected ? card.border : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = selected ? 3 : 1;
        ctx.strokeRect(card.x, cardY, cardW, cardH);

        // Selection indicator
        if (selected) {
            ctx.fillStyle = card.border;
            ctx.fillRect(card.x, cardY, cardW, 4);
        }

        // Emoji icon
        ctx.font = '48px serif';
        ctx.textAlign = 'center';
        ctx.fillText(card.emoji, card.x + cardW / 2, cardY + 70);

        // Label
        ctx.fillStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 16px "Courier New"';
        ctx.fillText(card.label, card.x + cardW / 2, cardY + 110);

        // Divider
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(card.x + 20, cardY + 122, cardW - 40, 1);

        // Description
        ctx.font = '12px "Courier New"';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        card.desc.forEach(function (line, li) {
            ctx.fillText(line, card.x + cardW / 2, cardY + 148 + li * 22);
        });

        // Character preview sprites
        var spriteId = i === 0 ? 'obi-wan' : 'dark-vador';
        Sprites.drawCharacter(ctx, spriteId, card.x + cardW / 2 - 16, cardY + 220, Math.floor(this.time * 4) % 4);

    }.bind(this));
};

// ── Character selection ────────────────────────────────────────────────────────

SelectionScene.prototype._renderCharacterSelection = function (ctx, W, H) {
    var isLight = this.selectedCamp === 'light';
    var color = isLight ? '#4488FF' : '#FF3333';
    Sprites.drawGlowText(ctx, 'CHOISIS TON PERSONNAGE', W / 2, 50, 20, '#FFD700', '#FFD700', 8);

    var chars = isLight ? this.LIGHT_CHARS : this.DARK_CHARS;

    // 2×2 grid layout
    var cols = 2;
    var cardW = 170, cardH = 200;
    var startX = W / 2 - cols * (cardW + 20) / 2 + 10;
    var startY = 80;

    chars.forEach(function (ch, i) {
        var col = i % 2, row = (i / 2) | 0;
        var cx = startX + col * (cardW + 20);
        var cy = startY + row * (cardH + 16);
        var selected = this.cursor === i;

        if (selected) { ctx.shadowColor = color; ctx.shadowBlur = 20; }

        // Background
        ctx.fillStyle = selected ? (isLight ? '#001840' : '#200010') : '#0a0a1a';
        ctx.fillRect(cx, cy, cardW, cardH);

        ctx.shadowBlur = 0;

        // Border
        ctx.strokeStyle = selected ? color : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(cx, cy, cardW, cardH);

        // Sprite
        var spriteX = cx + cardW / 2 - 16;
        var spriteY = cy + 15;
        Sprites.drawCharacter(ctx, ch.id, spriteX, spriteY, selected ? Math.floor(this.time * 4) % 4 : 0);

        // Name
        ctx.fillStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 11px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(ch.name, cx + cardW / 2, cy + 115);

        // Desc
        ctx.fillStyle = 'rgba(200,200,200,0.6)';
        ctx.font = '10px "Courier New"';
        ctx.fillText(ch.desc, cx + cardW / 2, cy + 132);

    }.bind(this));
};

// ── Level selection ────────────────────────────────────────────────────────────

SelectionScene.prototype._renderLevelSelection = function (ctx, W, H) {
    Sprites.drawGlowText(ctx, 'CHOISIS TON NIVEAU', W / 2, 60, 22, '#FFD700', '#FFD700', 10);

    var cardW = 160, cardH = 320;
    var gap = 16;
    var totalW = 4 * cardW + 3 * gap;
    var startX = (W - totalW) / 2;
    var cardY = 100;

    var LEVEL_COLORS = {
        CE1: { bg:'#001a10', border:'#44dd88', label:'#44ff99' },
        CE2: { bg:'#001520', border:'#4488ff', label:'#44aaff' },
        CM1: { bg:'#180018', border:'#aa44ff', label:'#cc77ff' },
        CM2: { bg:'#1a0800', border:'#ff8844', label:'#ffaa66' },
    };

    this.LEVELS.forEach(function (lv, i) {
        var cx = startX + i * (cardW + gap);
        var selected = this.cursor === i;
        var cols = LEVEL_COLORS[lv.id];

        if (selected) { ctx.shadowColor = cols.border; ctx.shadowBlur = 25; }

        ctx.fillStyle = cols.bg;
        ctx.fillRect(cx, cardY, cardW, selected ? cardH + 6 : cardH);

        ctx.shadowBlur = 0;

        ctx.strokeStyle = selected ? cols.border : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = selected ? 2 : 1;
        ctx.strokeRect(cx, cardY, cardW, selected ? cardH + 6 : cardH);

        // Level badge
        ctx.fillStyle = cols.label;
        ctx.font = 'bold 36px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(lv.name, cx + cardW / 2, cardY + 60);

        // Age range
        var ages = ['7-8 ans', '8-9 ans', '9-10 ans', '10-11 ans'];
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = '11px "Courier New"';
        ctx.fillText(ages[i], cx + cardW / 2, cardY + 80);

        // Divider
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(cx + 10, cardY + 90, cardW - 20, 1);

        // Description lines
        var lines = lv.desc.split('\n');
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '11px "Courier New"';
        lines.forEach(function (line, li) {
            ctx.fillText(line, cx + cardW / 2, cardY + 115 + li * 20);
        });

        // Difficulty stars
        var stars = i + 1;
        ctx.font = '20px serif';
        var starStr = '';
        for (var s = 0; s < 4; s++) starStr += s < stars ? '★' : '☆';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(starStr, cx + cardW / 2, cardY + cardH - 30);

    }.bind(this));
};
