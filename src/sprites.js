// Pixel art drawing functions — all sprites drawn with canvas fillRect (no image files)
// Scale: S = 2 → 1 game pixel = 2×2 canvas pixels

var Sprites = (function () {
    var S = 2; // pixel scale

    // Helper: fill a game-pixel at (gx,gy) relative to (bx,by)
    function p(ctx, bx, by, gx, gy) {
        ctx.fillRect(bx + gx * S, by + gy * S, S, S);
    }

    // Fill a rectangle of game-pixels
    function rect(ctx, bx, by, gx, gy, w, h) {
        ctx.fillRect(bx + gx * S, by + gy * S, w * S, h * S);
    }

    // ── Star field ────────────────────────────────────────────────────────────

    function generateStars(n, w, h) {
        var stars = [];
        for (var i = 0; i < n; i++) {
            stars.push({
                x:     (Math.random() * w) | 0,
                y:     (Math.random() * h) | 0,
                sz:    Math.random() < 0.12 ? 2 : 1,
                base:  0.3 + Math.random() * 0.7,
                phase: Math.random() * Math.PI * 2,
                spd:   0.5 + Math.random() * 2
            });
        }
        return stars;
    }

    function drawStars(ctx, stars, t) {
        stars.forEach(function (s) {
            var b = s.base + 0.2 * Math.sin(s.phase + t * s.spd);
            b = Math.max(0.1, Math.min(1, b));
            ctx.fillStyle = 'rgba(255,255,255,' + b + ')';
            ctx.fillRect(s.x, s.y, s.sz, s.sz);
        });
    }

    // ── Tile rendering ────────────────────────────────────────────────────────

    var TILE_SIZE = 32;

    var TILE_COLORS = {
        0: { base:'#0a0a1e', accent:'#111133' },   // deep space floor
        1: { base:'#2a2a3a', accent:'#1a1a2a' },   // asteroid wall
        2: { base:'#3a2a1a', accent:'#2a1a0a' },   // metal crate
        3: { base:'#0e1a2e', accent:'#162438' },   // base floor (lighter)
        4: { base:'#004466', accent:'#006688' },   // exit door
        5: { base:'#1a0a0a', accent:'#2a1010' },   // lava/danger
    };

    function drawTile(ctx, type, cx, cy) {
        var colors = TILE_COLORS[type] || TILE_COLORS[0];
        var ts = TILE_SIZE;

        ctx.fillStyle = colors.base;
        ctx.fillRect(cx, cy, ts, ts);

        if (type === 0 || type === 3) {
            // Grid lines for floor
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx, cy, ts, 1);
            ctx.fillRect(cx, cy, 1, ts);
        } else if (type === 1) {
            // Asteroid texture
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx + 4, cy + 4, ts - 8, ts - 8);
            ctx.fillStyle = '#3a3a4a';
            ctx.fillRect(cx + 8, cy + 8, 6, 6);
            ctx.fillRect(cx + 18, cy + 14, 5, 5);
        } else if (type === 2) {
            // Crate detail
            ctx.fillStyle = colors.accent;
            ctx.fillRect(cx + 2, cy + 2, ts - 4, ts - 4);
            ctx.fillStyle = '#4a3a2a';
            ctx.fillRect(cx + ts/2 - 1, cy + 4, 2, ts - 8);
            ctx.fillRect(cx + 4, cy + ts/2 - 1, ts - 8, 2);
        } else if (type === 4) {
            // Exit door — glowing portal
            ctx.fillStyle = '#004466';
            ctx.fillRect(cx, cy, ts, ts);
            ctx.fillStyle = '#0088CC';
            ctx.fillRect(cx + 6, cy + 4, ts - 12, ts - 8);
            ctx.fillStyle = '#00AAFF';
            ctx.fillRect(cx + 10, cy + 8, ts - 20, ts - 16);
            ctx.fillStyle = 'rgba(0,200,255,0.4)';
            ctx.fillRect(cx + 12, cy + 10, ts - 24, ts - 20);
            // Arrows pointing up
            ctx.fillStyle = '#FFFFFF';
            var ax = cx + ts / 2;
            ctx.fillRect(ax - 1, cy + 6, 2, 8);
            ctx.fillRect(ax - 3, cy + 10, 6, 2);
        }
    }

    // ── Characters ────────────────────────────────────────────────────────────
    // All sprites are 16×20 game pixels (32×40 canvas pixels at S=2)
    // Origin (bx,by) = top-left corner

    function drawJedi(ctx, bx, by, frame) {
        // Hood (dark blue)
        ctx.fillStyle = '#1a44aa';
        rect(ctx, bx, by, 4, 0, 8, 1);
        rect(ctx, bx, by, 3, 1, 10, 1);
        rect(ctx, bx, by, 2, 2, 12, 1);

        // Face (skin)
        ctx.fillStyle = '#ffddaa';
        rect(ctx, bx, by, 4, 2, 8, 5);

        // Hood sides overlapping face
        ctx.fillStyle = '#1a44aa';
        p(ctx, bx, by, 3, 3); p(ctx, bx, by, 3, 4); p(ctx, bx, by, 3, 5); p(ctx, bx, by, 3, 6);
        p(ctx, bx, by, 12, 3); p(ctx, bx, by, 12, 4); p(ctx, bx, by, 12, 5); p(ctx, bx, by, 12, 6);

        // Eyes
        ctx.fillStyle = '#221111';
        p(ctx, bx, by, 6, 4); p(ctx, bx, by, 10, 4);

        // Mouth
        ctx.fillStyle = '#cc8855';
        p(ctx, bx, by, 7, 6); p(ctx, bx, by, 8, 6); p(ctx, bx, by, 9, 6);

        // Neck
        ctx.fillStyle = '#ffddaa';
        rect(ctx, bx, by, 6, 7, 4, 1);

        // Robe body
        ctx.fillStyle = '#3377ee';
        rect(ctx, bx, by, 3, 8, 10, 8);

        // Robe shadow edges
        ctx.fillStyle = '#1a44aa';
        for (var gy = 8; gy < 16; gy++) {
            p(ctx, bx, by, 3, gy);
            p(ctx, bx, by, 12, gy);
        }

        // Lightsaber blade (animated glow)
        ctx.fillStyle = '#aaddff';
        for (var gy = 9; gy < 17; gy++) p(ctx, bx, by, 6, gy);

        // Lightsaber glow
        ctx.fillStyle = 'rgba(136,204,255,0.35)';
        for (var gy = 9; gy < 17; gy++) { p(ctx, bx, by, 5, gy); p(ctx, bx, by, 7, gy); }

        // Belt
        ctx.fillStyle = '#FFD700';
        rect(ctx, bx, by, 7, 12, 4, 1);

        // Legs
        ctx.fillStyle = '#2255BB';
        var legShift = frame % 4 < 2 ? 0 : 1;
        rect(ctx, bx, by, 4, 16, 3, 2 + legShift);
        rect(ctx, bx, by, 9, 16, 3, 2 - legShift);

        // Boots
        ctx.fillStyle = '#112266';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);
    }

    function drawSith(ctx, bx, by, frame) {
        // Helmet
        ctx.fillStyle = '#111111';
        rect(ctx, bx, by, 4, 0, 8, 1);
        rect(ctx, bx, by, 3, 1, 10, 2);
        rect(ctx, bx, by, 2, 3, 12, 2);

        // Visor (dark gray stripe)
        ctx.fillStyle = '#333333';
        rect(ctx, bx, by, 4, 3, 8, 2);

        // Breath mask
        ctx.fillStyle = '#555555';
        rect(ctx, bx, by, 5, 5, 6, 1);

        // Neck armor
        ctx.fillStyle = '#222222';
        rect(ctx, bx, by, 5, 6, 6, 2);

        // Armor body
        ctx.fillStyle = '#1a1a1a';
        rect(ctx, bx, by, 3, 8, 10, 8);

        // Armor highlights
        ctx.fillStyle = '#333333';
        rect(ctx, bx, by, 4, 9, 4, 1);
        rect(ctx, bx, by, 8, 9, 4, 1);

        // Red lightsaber
        ctx.fillStyle = '#ff2222';
        for (var gy = 9; gy < 17; gy++) p(ctx, bx, by, 6, gy);

        // Saber glow
        ctx.fillStyle = 'rgba(255,50,50,0.35)';
        for (var gy = 9; gy < 17; gy++) { p(ctx, bx, by, 5, gy); p(ctx, bx, by, 7, gy); }

        // Belt clasp
        ctx.fillStyle = '#880000';
        rect(ctx, bx, by, 7, 12, 3, 1);

        // Legs
        ctx.fillStyle = '#111111';
        var legShift = frame % 4 < 2 ? 0 : 1;
        rect(ctx, bx, by, 4, 16, 3, 2 + legShift);
        rect(ctx, bx, by, 9, 16, 3, 2 - legShift);

        // Boots
        ctx.fillStyle = '#000000';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);
    }

    function drawYoda(ctx, bx, by, frame) {
        // Small green character — offset to look shorter
        var oy = 4; // vertical offset to center

        // Ears
        ctx.fillStyle = '#44aa44';
        p(ctx, bx, by, 2, oy + 2); p(ctx, bx, by, 1, oy + 3);
        p(ctx, bx, by, 13, oy + 2); p(ctx, bx, by, 14, oy + 3);

        // Head (green)
        ctx.fillStyle = '#55bb55';
        rect(ctx, bx, by, 4, oy, 8, 6);
        p(ctx, bx, by, 3, oy + 1); p(ctx, bx, by, 3, oy + 2);
        p(ctx, bx, by, 12, oy + 1); p(ctx, bx, by, 12, oy + 2);

        // Eyes (large, Yoda-style)
        ctx.fillStyle = '#88dd00';
        p(ctx, bx, by, 5, oy + 2); p(ctx, bx, by, 6, oy + 2);
        p(ctx, bx, by, 9, oy + 2); p(ctx, bx, by, 10, oy + 2);
        ctx.fillStyle = '#000000';
        p(ctx, bx, by, 5, oy + 3); p(ctx, bx, by, 10, oy + 3);

        // Robe (brown/tan Jedi robe)
        ctx.fillStyle = '#885522';
        rect(ctx, bx, by, 3, oy + 6, 10, 6);

        // Green saber
        ctx.fillStyle = '#44ff44';
        for (var gy = oy + 7; gy < oy + 13; gy++) p(ctx, bx, by, 11, gy);

        // Stick/cane
        ctx.fillStyle = '#663300';
        for (var gy = oy + 7; gy < oy + 14; gy++) p(ctx, bx, by, 4, gy);

        // Legs (short)
        ctx.fillStyle = '#663300';
        rect(ctx, bx, by, 5, oy + 12, 2, 3);
        rect(ctx, bx, by, 9, oy + 12, 2, 3);
    }

    function drawRey(ctx, bx, by, frame) {
        // Hair bun (light brown)
        ctx.fillStyle = '#cc9955';
        rect(ctx, bx, by, 5, 0, 6, 2);
        p(ctx, bx, by, 7, 1);

        // Face
        ctx.fillStyle = '#ffcc99';
        rect(ctx, bx, by, 4, 2, 8, 5);

        // Eyes
        ctx.fillStyle = '#442200';
        p(ctx, bx, by, 6, 4); p(ctx, bx, by, 10, 4);

        // White wrappings / outfit
        ctx.fillStyle = '#ddddcc';
        rect(ctx, bx, by, 3, 7, 10, 9);

        // Outfit sash
        ctx.fillStyle = '#996633';
        rect(ctx, bx, by, 3, 11, 10, 2);

        // Staff
        ctx.fillStyle = '#885533';
        for (var gy = 4; gy < 19; gy++) p(ctx, bx, by, 13, gy);

        // Blue saber (Rey uses blue in sequels)
        ctx.fillStyle = '#4488ff';
        for (var gy = 8; gy < 17; gy++) p(ctx, bx, by, 5, gy);

        // Legs
        ctx.fillStyle = '#ccbbaa';
        var legShift = frame % 4 < 2 ? 0 : 1;
        rect(ctx, bx, by, 4, 16, 3, 2 + legShift);
        rect(ctx, bx, by, 9, 16, 3, 2 - legShift);

        // Boots
        ctx.fillStyle = '#664422';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);
    }

    function drawQuiGon(ctx, bx, by, frame) {
        // Long hair (dark)
        ctx.fillStyle = '#553311';
        rect(ctx, bx, by, 3, 1, 10, 2);
        p(ctx, bx, by, 2, 3); p(ctx, bx, by, 13, 3);

        // Face
        ctx.fillStyle = '#ffddaa';
        rect(ctx, bx, by, 4, 2, 8, 5);

        // Beard
        ctx.fillStyle = '#885533';
        p(ctx, bx, by, 6, 6); p(ctx, bx, by, 7, 6); p(ctx, bx, by, 8, 6); p(ctx, bx, by, 9, 6);

        // Eyes
        ctx.fillStyle = '#331100';
        p(ctx, bx, by, 6, 4); p(ctx, bx, by, 10, 4);

        // Robe (tan/brown)
        ctx.fillStyle = '#aa8855';
        rect(ctx, bx, by, 3, 7, 10, 9);

        // Cloak (darker)
        ctx.fillStyle = '#775533';
        for (var gy = 7; gy < 16; gy++) {
            p(ctx, bx, by, 3, gy); p(ctx, bx, by, 12, gy);
        }

        // Green saber
        ctx.fillStyle = '#44ff44';
        for (var gy = 9; gy < 17; gy++) p(ctx, bx, by, 6, gy);

        // Saber glow
        ctx.fillStyle = 'rgba(68,255,68,0.3)';
        for (var gy = 9; gy < 17; gy++) { p(ctx, bx, by, 5, gy); p(ctx, bx, by, 7, gy); }

        // Legs
        ctx.fillStyle = '#775533';
        var legShift = frame % 4 < 2 ? 0 : 1;
        rect(ctx, bx, by, 4, 16, 3, 2 + legShift);
        rect(ctx, bx, by, 9, 16, 3, 2 - legShift);

        ctx.fillStyle = '#553311';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);
    }

    function drawKyloRen(ctx, bx, by, frame) {
        // Helmet (rounded, more angular than Vader)
        ctx.fillStyle = '#0a0a0a';
        rect(ctx, bx, by, 3, 0, 10, 7);
        p(ctx, bx, by, 2, 2); p(ctx, bx, by, 2, 3); p(ctx, bx, by, 2, 4);
        p(ctx, bx, by, 13, 2); p(ctx, bx, by, 13, 3); p(ctx, bx, by, 13, 4);

        // Visor line
        ctx.fillStyle = '#222222';
        rect(ctx, bx, by, 4, 3, 8, 1);

        // Crossguard saber (unique to Kylo)
        ctx.fillStyle = '#ff2222';
        for (var gy = 9; gy < 17; gy++) p(ctx, bx, by, 7, gy);
        // Crossguard vents
        p(ctx, bx, by, 4, 10); p(ctx, bx, by, 5, 10); p(ctx, bx, by, 6, 10);
        p(ctx, bx, by, 8, 10); p(ctx, bx, by, 9, 10); p(ctx, bx, by, 10, 10);

        // Saber glow
        ctx.fillStyle = 'rgba(255,50,50,0.3)';
        for (var gy = 9; gy < 17; gy++) { p(ctx, bx, by, 6, gy); p(ctx, bx, by, 8, gy); }

        // Body (black robes)
        ctx.fillStyle = '#111111';
        rect(ctx, bx, by, 2, 7, 12, 9);

        // Belt
        ctx.fillStyle = '#333333';
        rect(ctx, bx, by, 3, 12, 10, 1);

        // Legs
        var legShift = frame % 4 < 2 ? 0 : 1;
        ctx.fillStyle = '#111111';
        rect(ctx, bx, by, 3, 16, 4, 2 + legShift);
        rect(ctx, bx, by, 9, 16, 4, 2 - legShift);

        ctx.fillStyle = '#000000';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);
    }

    function drawGrievous(ctx, bx, by, frame) {
        // Metal head (skulled cyborg)
        ctx.fillStyle = '#888877';
        rect(ctx, bx, by, 4, 1, 8, 6);

        // Eye visor (yellow glowing eyes)
        ctx.fillStyle = '#ccaa00';
        p(ctx, bx, by, 6, 3); p(ctx, bx, by, 7, 3);
        p(ctx, bx, by, 9, 3); p(ctx, bx, by, 10, 3);

        // Face plate detail
        ctx.fillStyle = '#666655';
        rect(ctx, bx, by, 5, 5, 6, 2);

        // Body armor (white plates)
        ctx.fillStyle = '#ccccbb';
        rect(ctx, bx, by, 3, 7, 10, 5);

        // Armor detail
        ctx.fillStyle = '#888877';
        rect(ctx, bx, by, 3, 8, 2, 4);
        rect(ctx, bx, by, 11, 8, 2, 4);

        // Four arms (simplified — two visible)
        ctx.fillStyle = '#888877';
        rect(ctx, bx, by, 1, 8, 2, 6);
        rect(ctx, bx, by, 13, 8, 2, 6);

        // Green sabers (two)
        ctx.fillStyle = '#00ff44';
        for (var gy = 7; gy < 15; gy++) p(ctx, bx, by, 5, gy);
        for (var gy = 7; gy < 15; gy++) p(ctx, bx, by, 10, gy);

        // Legs (mechanical)
        ctx.fillStyle = '#888877';
        rect(ctx, bx, by, 4, 12, 3, 6);
        rect(ctx, bx, by, 9, 12, 3, 6);

        ctx.fillStyle = '#555544';
        rect(ctx, bx, by, 3, 17, 5, 2);
        rect(ctx, bx, by, 8, 17, 5, 2);
    }

    function drawInquisitor(ctx, bx, by, frame) {
        // Helmet (red/black Inquisitor style)
        ctx.fillStyle = '#660000';
        rect(ctx, bx, by, 4, 0, 8, 3);
        rect(ctx, bx, by, 3, 3, 10, 4);

        ctx.fillStyle = '#111111';
        rect(ctx, bx, by, 4, 2, 8, 3); // dark visor

        // Red glowing eyes
        ctx.fillStyle = '#ff4444';
        p(ctx, bx, by, 6, 3); p(ctx, bx, by, 10, 3);

        // Body (dark armor with purple accents)
        ctx.fillStyle = '#1a0022';
        rect(ctx, bx, by, 3, 7, 10, 9);

        ctx.fillStyle = '#660066';
        rect(ctx, bx, by, 4, 8, 2, 4);
        rect(ctx, bx, by, 10, 8, 2, 4);

        // Double-bladed red saber
        ctx.fillStyle = '#ff2222';
        for (var gy = 7; gy < 17; gy++) p(ctx, bx, by, 7, gy);
        p(ctx, bx, by, 4, 9); p(ctx, bx, by, 5, 9); p(ctx, bx, by, 6, 9);
        p(ctx, bx, by, 8, 9); p(ctx, bx, by, 9, 9); p(ctx, bx, by, 10, 9);

        // Legs
        ctx.fillStyle = '#1a0022';
        var legShift = frame % 4 < 2 ? 0 : 1;
        rect(ctx, bx, by, 4, 16, 3, 2 + legShift);
        rect(ctx, bx, by, 9, 16, 3, 2 - legShift);

        ctx.fillStyle = '#660000';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);
    }

    // ── Enemy sprites ─────────────────────────────────────────────────────────

    function drawStormtrooper(ctx, bx, by, frame) {
        // Helmet (white)
        ctx.fillStyle = '#eeeeee';
        rect(ctx, bx, by, 4, 0, 8, 6);
        p(ctx, bx, by, 3, 2); p(ctx, bx, by, 3, 3); p(ctx, bx, by, 3, 4);
        p(ctx, bx, by, 12, 2); p(ctx, bx, by, 12, 3); p(ctx, bx, by, 12, 4);

        // Visor (black)
        ctx.fillStyle = '#222222';
        rect(ctx, bx, by, 5, 2, 6, 2);

        // Mouth grille
        ctx.fillStyle = '#888888';
        p(ctx, bx, by, 5, 5); p(ctx, bx, by, 7, 5); p(ctx, bx, by, 9, 5); p(ctx, bx, by, 11, 5);

        // Neck/undersuit
        ctx.fillStyle = '#333333';
        rect(ctx, bx, by, 6, 6, 4, 2);

        // Armor (white chest)
        ctx.fillStyle = '#dddddd';
        rect(ctx, bx, by, 3, 8, 10, 6);

        // Chest detail
        ctx.fillStyle = '#bbbbbb';
        rect(ctx, bx, by, 4, 9, 3, 2);
        rect(ctx, bx, by, 9, 9, 3, 2);

        // Belt (black)
        ctx.fillStyle = '#222222';
        rect(ctx, bx, by, 3, 14, 10, 1);

        // Belt pouches
        ctx.fillStyle = '#444444';
        rect(ctx, bx, by, 4, 14, 2, 1);
        rect(ctx, bx, by, 7, 14, 2, 1);
        rect(ctx, bx, by, 10, 14, 2, 1);

        // Legs
        ctx.fillStyle = '#cccccc';
        var legShift = frame % 4 < 2 ? 0 : 1;
        rect(ctx, bx, by, 4, 15, 3, 3 + legShift);
        rect(ctx, bx, by, 9, 15, 3, 3 - legShift);

        // Boots
        ctx.fillStyle = '#222222';
        rect(ctx, bx, by, 3, 18, 5, 1);
        rect(ctx, bx, by, 8, 18, 5, 1);

        // Blaster
        ctx.fillStyle = '#888888';
        rect(ctx, bx, by, 13, 10, 3, 1);
        ctx.fillStyle = '#aaaaaa';
        p(ctx, bx, by, 15, 9);
    }

    function drawDroid(ctx, bx, by, frame) {
        // Head (tan/brown B1 battle droid)
        ctx.fillStyle = '#ccaa66';
        rect(ctx, bx, by, 5, 1, 6, 5);
        // Antenna
        ctx.fillStyle = '#996633';
        p(ctx, bx, by, 8, 0);

        // Eyes (red dots)
        ctx.fillStyle = '#ff3333';
        p(ctx, bx, by, 6, 3); p(ctx, bx, by, 9, 3);

        // Neck (thin)
        ctx.fillStyle = '#996633';
        rect(ctx, bx, by, 7, 6, 2, 2);

        // Torso
        ctx.fillStyle = '#ccaa66';
        rect(ctx, bx, by, 5, 8, 6, 5);

        // Torso detail
        ctx.fillStyle = '#996633';
        rect(ctx, bx, by, 6, 9, 4, 1);
        rect(ctx, bx, by, 6, 11, 4, 1);

        // Arms (thin)
        ctx.fillStyle = '#bbaa55';
        for (var gy = 8; gy < 13; gy++) p(ctx, bx, by, 4, gy);
        for (var gy = 8; gy < 13; gy++) p(ctx, bx, by, 11, gy);

        // Blaster (right arm)
        ctx.fillStyle = '#555544';
        rect(ctx, bx, by, 12, 10, 3, 1);

        // Legs (thin, jointed)
        ctx.fillStyle = '#bbaa55';
        p(ctx, bx, by, 6, 13); p(ctx, bx, by, 6, 14); p(ctx, bx, by, 6, 15);
        p(ctx, bx, by, 9, 13); p(ctx, bx, by, 9, 14); p(ctx, bx, by, 9, 15);

        // Feet
        ctx.fillStyle = '#996633';
        rect(ctx, bx, by, 5, 16, 3, 1);
        rect(ctx, bx, by, 8, 16, 3, 1);

        // Animate: slight tilt on moving
        if (frame % 4 >= 2) {
            ctx.fillStyle = '#ccaa66';
            p(ctx, bx, by, 6, 17);
            p(ctx, bx, by, 9, 15);
        }
    }

    // ── Character sprite selection ────────────────────────────────────────────

    var CHARACTER_DRAW_FNS = {
        'obi-wan':    drawJedi,
        'yoda':       drawYoda,
        'rey':        drawRey,
        'qui-gon':    drawQuiGon,
        'dark-vador': drawSith,
        'kylo-ren':   drawKyloRen,
        'grievous':   drawGrievous,
        'inquisitor': drawInquisitor,
    };

    function drawCharacter(ctx, id, bx, by, frame) {
        var fn = CHARACTER_DRAW_FNS[id] || drawJedi;
        fn(ctx, bx, by, frame);
    }

    // ── HUD elements ──────────────────────────────────────────────────────────

    function drawHP(ctx, x, y, current, max) {
        var w = 120, h = 12;
        // Background
        ctx.fillStyle = '#330000';
        ctx.fillRect(x, y, w, h);
        // Fill
        var pct = Math.max(0, current / max);
        ctx.fillStyle = pct > 0.5 ? '#44ff44' : pct > 0.25 ? '#ffaa00' : '#ff2222';
        ctx.fillRect(x, y, w * pct, h);
        // Border
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = '9px "Courier New"';
        ctx.textAlign = 'left';
        ctx.fillText('PV: ' + current + '/' + max, x + 2, y + 9);
    }

    function drawScore(ctx, x, y, score) {
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 12px "Courier New"';
        ctx.textAlign = 'right';
        ctx.fillText('★ ' + score, x, y);
    }

    // ── Pixel text helper ─────────────────────────────────────────────────────

    function drawGlowText(ctx, text, x, y, size, color, glowColor, glowBlur) {
        ctx.save();
        ctx.shadowColor = glowColor || color;
        ctx.shadowBlur = glowBlur || 0;
        ctx.fillStyle = color;
        ctx.font = 'bold ' + size + 'px "Courier New"';
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    return {
        TILE_SIZE,
        generateStars,
        drawStars,
        drawTile,
        drawCharacter,
        drawJedi,
        drawSith,
        drawStormtrooper,
        drawDroid,
        drawHP,
        drawScore,
        drawGlowText,
        PIXEL_SCALE: S,
    };
})();
