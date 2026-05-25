// Player entity — handles position, movement, collision, animation
var Player = (function () {

    var TILE_SIZE = 32;
    var SPEED = 120; // pixels/second

    // Sprite is 32×40 px (16×20 game px at scale 2)
    var SPRITE_W = 32;
    var SPRITE_H = 40;

    var _state = null;

    function init(data) {
        _state = {
            // Position in pixel space
            x: data.startTileX * TILE_SIZE,
            y: data.startTileY * TILE_SIZE,
            vx: 0,
            vy: 0,
            direction: 'down',
            // Animation
            frame: 0,
            frameTimer: 0,
            FRAME_RATE: 0.18, // seconds per frame
            moving: false,
            // Stats (from game engine)
            hp:    data.hp    || 100,
            maxHp: data.maxHp || 100,
            // Bounding box (slightly smaller than tile for better feel)
            bw: 20,
            bh: 20,
        };
        return _state;
    }

    function getState() { return _state; }

    function update(dt, tilemap, mapCols, mapRows) {
        var s = _state;
        var dx = 0, dy = 0;

        if (Input.isDown('ArrowLeft')  || Input.isDown('KeyA')) { dx = -1; s.direction = 'left'; }
        if (Input.isDown('ArrowRight') || Input.isDown('KeyD')) { dx =  1; s.direction = 'right'; }
        if (Input.isDown('ArrowUp')    || Input.isDown('KeyW')) { dy = -1; s.direction = 'up'; }
        if (Input.isDown('ArrowDown')  || Input.isDown('KeyS')) { dy =  1; s.direction = 'down'; }

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

        s.moving = dx !== 0 || dy !== 0;

        var nx = s.x + dx * SPEED * dt;
        var ny = s.y + dy * SPEED * dt;

        // Collision: try X then Y separately
        if (!collides(nx, s.y, s.bw, s.bh, tilemap, mapCols, mapRows)) {
            s.x = nx;
        }
        if (!collides(s.x, ny, s.bw, s.bh, tilemap, mapCols, mapRows)) {
            s.y = ny;
        }

        // Clamp to map bounds
        s.x = Math.max(0, Math.min(mapCols * TILE_SIZE - SPRITE_W, s.x));
        s.y = Math.max(0, Math.min(mapRows * TILE_SIZE - SPRITE_H, s.y));

        // Animate walking frames
        if (s.moving) {
            s.frameTimer += dt;
            if (s.frameTimer >= s.FRAME_RATE) {
                s.frameTimer -= s.FRAME_RATE;
                s.frame = (s.frame + 1) % 4;
            }
        } else {
            s.frame = 0;
            s.frameTimer = 0;
        }
    }

    // AABB collision check against solid tiles (1, 2)
    function collides(px, py, bw, bh, tilemap, mapCols, mapRows) {
        var SOLID = { 1: true, 2: true };

        // Bounding box uses only the lower half of the sprite (feet area).
        // SPRITE_H=40, TILE_SIZE=32: without trimming the bottom, the sprite
        // overhangs into the row below and the player gets stuck in wall tiles.
        var margin = (TILE_SIZE - bw) / 2;
        var left   = px + margin;
        var right  = px + TILE_SIZE - margin - 1;
        var top    = py + SPRITE_H - bh;   // feet start
        var bottom = py + SPRITE_H - 10;   // 10px above sprite bottom — avoids wall creep

        var corners = [
            [left, top], [right, top],
            [left, bottom], [right, bottom]
        ];

        for (var i = 0; i < corners.length; i++) {
            var cx = (corners[i][0] / TILE_SIZE) | 0;
            var cy = (corners[i][1] / TILE_SIZE) | 0;
            if (cx < 0 || cy < 0 || cx >= mapCols || cy >= mapRows) return true;
            var tile = tilemap[cy] ? tilemap[cy][cx] : 1;
            if (SOLID[tile]) return true;
        }
        return false;
    }

    function draw(ctx, characterId, offsetX, offsetY) {
        var s = _state;
        var screenX = s.x - offsetX;
        var screenY = s.y - offsetY;
        Sprites.drawCharacter(ctx, characterId, screenX, screenY, s.frame);
    }

    // Center of sprite in world space
    function centerX() { return _state.x + TILE_SIZE / 2; }
    function centerY() { return _state.y + SPRITE_H / 2; }

    // Center in screen space
    function screenCenterX(offsetX) { return centerX() - offsetX; }
    function screenCenterY(offsetY) { return centerY() - offsetY; }

    // Tile position of player center
    function tileX() { return (centerX() / TILE_SIZE) | 0; }
    function tileY() { return (centerY() / TILE_SIZE) | 0; }

    return { init, getState, update, draw, centerX, centerY, screenCenterX, screenCenterY, tileX, tileY };
})();
