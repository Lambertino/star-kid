// Main game engine — scene manager, game loop, shared state
var GameEngine = (function () {

    var canvas, ctx;
    var W = 800, H = 600;
    var lastTime = 0;
    var currentScene = null;
    var scenes = {};

    // Shared player data, readable by all scenes
    var playerData = {
        camp:        null,
        character:   null,
        schoolLevel: null,
        score:       0,
        hp:          100,
        maxHp:       100,
    };

    // Pending enemy for battle transitions
    var pendingEnemy = null;

    function init() {
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');

        // Build public engine object first so scenes can reference it
        var eng = engine;

        scenes.intro     = new IntroScene(eng);
        scenes.selection = new SelectionScene(eng);
        scenes.map       = new MapScene(eng);
        scenes.battle    = new BattleScene(eng);
        scenes.victory   = makeVictoryScene(eng);
        scenes.gameover  = makeGameOverScene(eng);

        Input.init ? Input.init() : null; // Input is self-initialising

        changeScene('intro');
        requestAnimationFrame(loop);
    }

    function changeScene(name, data) {
        if (currentScene && currentScene.exit) currentScene.exit();
        currentScene = scenes[name];
        if (!currentScene) {
            console.error('Unknown scene:', name);
            return;
        }
        if (currentScene.enter) currentScene.enter(data || {});
    }

    function loop(timestamp) {
        var dt = Math.min((timestamp - lastTime) / 1000, 0.1);
        lastTime = timestamp;

        ctx.clearRect(0, 0, W, H);

        if (currentScene) {
            currentScene.update(dt);
            currentScene.render(ctx);
        }

        Input.flush();
        requestAnimationFrame(loop);
    }

    // ── Inline simple scenes ─────────────────────────────────────────────────

    function makeVictoryScene(eng) {
        var t = 0, stars = [];
        return {
            enter: function () {
                t = 0;
                stars = Sprites.generateStars(200, W, H);
                Audio.playVictory();
            },
            exit: function () {},
            update: function (dt) {
                t += dt;
                if (t > 3 && (Input.wasPressed('Enter') || Input.wasPressed('Space'))) {
                    // Reset and restart
                    eng.playerData.score = 0;
                    eng.playerData.hp = 100;
                    eng.playerData.camp = null;
                    eng.playerData.character = null;
                    eng.playerData.schoolLevel = null;
                    changeScene('intro');
                }
            },
            render: function (ctx) {
                ctx.fillStyle = '#000011';
                ctx.fillRect(0, 0, W, H);
                Sprites.drawStars(ctx, stars, t);

                // Fireworks-like burst
                for (var i = 0; i < 8; i++) {
                    var angle = (i / 8) * Math.PI * 2 + t * 1.5;
                    var dist = 120 + 40 * Math.sin(t * 2 + i);
                    var sx = W / 2 + Math.cos(angle) * dist;
                    var sy = H / 2 - 60 + Math.sin(angle) * dist * 0.5;
                    ctx.fillStyle = ['#FFD700','#4488FF','#FF4444','#44FF88'][i % 4];
                    ctx.font = '22px serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('★', sx, sy);
                }

                ctx.shadowColor = '#FFD700';
                ctx.shadowBlur = 30;
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 48px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText('VICTOIRE !', W / 2, H / 2 - 30);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.font = '22px "Courier New"';
                ctx.fillText('Mission accomplie, Padawan !', W / 2, H / 2 + 20);

                ctx.fillStyle = '#FFD700';
                ctx.font = '20px "Courier New"';
                ctx.fillText('Score final : ' + eng.playerData.score, W / 2, H / 2 + 55);

                var blink = Math.sin(t * 3) > 0;
                if (blink) {
                    ctx.fillStyle = 'rgba(255,255,255,0.6)';
                    ctx.font = '14px "Courier New"';
                    ctx.fillText('ENTRÉE — rejouer', W / 2, H - 40);
                }
            }
        };
    }

    function makeGameOverScene(eng) {
        var t = 0, stars = [];
        return {
            enter: function () { t = 0; stars = Sprites.generateStars(100, W, H); },
            exit:  function () {},
            update: function (dt) {
                t += dt;
                if (t > 2 && (Input.wasPressed('Enter') || Input.wasPressed('Space'))) {
                    eng.playerData.score = 0;
                    eng.playerData.hp = 100;
                    changeScene('map');
                }
            },
            render: function (ctx) {
                ctx.fillStyle = '#0a0000';
                ctx.fillRect(0, 0, W, H);
                Sprites.drawStars(ctx, stars, t);

                ctx.shadowColor = '#ff2222';
                ctx.shadowBlur = 30;
                ctx.fillStyle = '#ff2222';
                ctx.font = 'bold 52px "Courier New"';
                ctx.textAlign = 'center';
                ctx.fillText('DÉFAITE', W / 2, H / 2 - 30);

                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffaaaa';
                ctx.font = '18px "Courier New"';
                ctx.fillText('Tes PV sont tombés à 0...', W / 2, H / 2 + 20);

                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '13px "Courier New"';
                ctx.fillText('ENTRÉE — recommencer la carte', W / 2, H - 40);
            }
        };
    }

    // ── Public API ────────────────────────────────────────────────────────────

    var engine = {
        get playerData() { return playerData; },
        get pendingEnemy() { return pendingEnemy; },
        set pendingEnemy(v) { pendingEnemy = v; },
        changeScene: changeScene,
        init: init,
        canvas: function () { return canvas; },
        ctx: function () { return ctx; },
    };

    return engine;
})();
