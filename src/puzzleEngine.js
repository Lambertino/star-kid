// Educational puzzle generator — returns quiz objects for math, french, logic
// Each puzzle: { subject, question, choices[4], correctIndex, explanation, emoji }

const PuzzleEngine = (function () {

    function rnd(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Build 4 choices where answer is one of them; distractors are near-misses
    function buildChoices(answer, delta) {
        var pool = new Set([answer]);
        var spread = delta || Math.max(3, Math.floor(Math.abs(answer) * 0.3));
        while (pool.size < 4) {
            var d = rnd(-spread, spread);
            if (d !== 0) pool.add(answer + d);
        }
        var choices = Array.from(pool);
        // Shuffle
        for (var i = choices.length - 1; i > 0; i--) {
            var j = rnd(0, i);
            var tmp = choices[i]; choices[i] = choices[j]; choices[j] = tmp;
        }
        return { choices: choices, correctIndex: choices.indexOf(answer) };
    }

    // ── Math puzzles ─────────────────────────────────────────────────────────

    function mathCE1() {
        var type = rnd(0, 1);
        if (type === 0) {
            var a = rnd(1, 10), b = rnd(1, 10);
            var ans = a + b;
            var c = buildChoices(ans, 3);
            return { subject:'math', question: a + ' + ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' + ' + b + ' = ' + ans, emoji:'🔢' };
        } else {
            var a = rnd(2, 15), b = rnd(1, a - 1);
            var ans = a - b;
            var c = buildChoices(ans, 3);
            return { subject:'math', question: a + ' − ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' − ' + b + ' = ' + ans, emoji:'🔢' };
        }
    }

    function mathCE2() {
        var type = rnd(0, 2);
        if (type === 0) {
            var a = rnd(5, 30), b = rnd(5, 30);
            var ans = a + b;
            var c = buildChoices(ans, 5);
            return { subject:'math', question: a + ' + ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' + ' + b + ' = ' + ans, emoji:'🔢' };
        } else if (type === 1) {
            var a = rnd(10, 50), b = rnd(5, a);
            var ans = a - b;
            var c = buildChoices(ans, 5);
            return { subject:'math', question: a + ' − ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' − ' + b + ' = ' + ans, emoji:'🔢' };
        } else {
            var tables = [2, 5, 10];
            var t = tables[rnd(0, 2)], b = rnd(1, 10);
            var ans = t * b;
            var c = buildChoices(ans, t);
            return { subject:'math', question: t + ' × ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: t + ' × ' + b + ' = ' + ans, emoji:'✖️' };
        }
    }

    function mathCM1() {
        var type = rnd(0, 2);
        if (type === 0) {
            var a = rnd(2, 9), b = rnd(2, 9);
            var ans = a * b;
            var c = buildChoices(ans, Math.max(4, a));
            return { subject:'math', question: a + ' × ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' × ' + b + ' = ' + ans, emoji:'✖️' };
        } else if (type === 1) {
            var b = rnd(2, 9), a = b * rnd(2, 9);
            var ans = a / b;
            var c = buildChoices(ans, 3);
            return { subject:'math', question: a + ' ÷ ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' ÷ ' + b + ' = ' + ans, emoji:'➗' };
        } else {
            var a = rnd(10, 99), b = rnd(10, 99);
            var ans = a + b;
            var c = buildChoices(ans, 10);
            return { subject:'math', question: a + ' + ' + b + ' = ?',
                     choices: c.choices, correctIndex: c.correctIndex,
                     explanation: a + ' + ' + b + ' = ' + ans, emoji:'🔢' };
        }
    }

    function mathCM2() {
        var type = rnd(0, 1);
        if (type === 0) {
            var a = rnd(3, 9), b = rnd(3, 9), c2 = rnd(2, 5);
            var ans = a * b + c2;
            var ch = buildChoices(ans, 6);
            return { subject:'math', question: a + ' × ' + b + ' + ' + c2 + ' = ?',
                     choices: ch.choices, correctIndex: ch.correctIndex,
                     explanation: a + '×' + b + ' = ' + (a*b) + ', puis +' + c2 + ' = ' + ans,
                     emoji:'🧮' };
        } else {
            var b = rnd(3, 9), a = b * rnd(3, 9), c2 = rnd(1, 10);
            var ans = a / b - c2;
            if (ans <= 0) ans = a / b;
            var ch = buildChoices(ans, 4);
            return { subject:'math', question: a + ' ÷ ' + b + ' − ' + c2 + ' = ?',
                     choices: ch.choices, correctIndex: ch.correctIndex,
                     explanation: a + '÷' + b + ' = ' + (a/b) + ', puis −' + c2 + ' = ' + ans,
                     emoji:'🧮' };
        }
    }

    // ── French puzzles ───────────────────────────────────────────────────────

    var frenchPuzzles = {
        CE1: [
            { question:'Comment s\'écrit le son [CH] ?',
              choices:['ch','sh','sch','tch'], correctIndex:0,
              explanation:'"ch" fait le son [CH] : chat, chien, chocolat', emoji:'🇫🇷' },
            { question:'Quel mot est bien écrit ?',
              choices:['cheval','chval','cheval','chevals'], correctIndex:0,
              explanation:'On écrit "cheval" avec un "e" entre "ch" et "val"', emoji:'🐴' },
            { question:'Complete : "Le chat ___ sur le toit."',
              choices:['est','et','ai','es'], correctIndex:0,
              explanation:'"est" = forme du verbe être (il est)', emoji:'🐱' },
            { question:'Quel est le pluriel de "un oiseau" ?',
              choices:['des oiseaux','des oiseaus','des oiseau','des oiseauxs'], correctIndex:0,
              explanation:'Les mots en -eau font -eaux au pluriel', emoji:'🐦' },
            { question:'Complète : "J\'___ un bonbon."',
              choices:['ai','ais','est','ai'],correctIndex:0,
              explanation:'J\'ai = verbe avoir, 1ère personne', emoji:'🍬' },
        ],
        CE2: [
            { question:'"a" ou "à" ? "Il ___ une étoile dans le ciel."',
              choices:['a','à','as','est'], correctIndex:0,
              explanation:'"a" = verbe avoir (on peut dire "avait")', emoji:'⭐' },
            { question:'"et" ou "est" ? "Le droïde ___ rapide."',
              choices:['est','et','ai','es'], correctIndex:0,
              explanation:'"est" = verbe être (on peut dire "était")', emoji:'🤖' },
            { question:'Quel adjectif s\'accorde avec "planète" ?',
              choices:['lointaine','lointain','lointains','lointaines'], correctIndex:0,
              explanation:'"planète" est féminin singulier → "lointaine"', emoji:'🪐' },
            { question:'Pluriel de "le vaisseau spatial" ?',
              choices:['les vaisseaux spatiaux','les vaisseau spatial','les vaisseaux spaciaux','les vaisseau spatiaux'], correctIndex:0,
              explanation:'vaisseau→vaisseaux ; spatial→spatiaux', emoji:'🚀' },
        ],
        CM1: [
            { question:'"on" ou "ont" ? "Les Jedis ___ vaincu l\'Empire."',
              choices:['ont','on','n\'ont','os'], correctIndex:0,
              explanation:'"ont" = verbe avoir (ils ont)', emoji:'⚔️' },
            { question:'"se" ou "ce" ? "___ droïde est dangereux."',
              choices:['Ce','Se','Sa','Ses'], correctIndex:0,
              explanation:'"Ce" = déterminant démonstratif (Ce droïde…)', emoji:'🤖' },
            { question:'Conjugue "aller" à la 1ère pers. pluriel au présent.',
              choices:['nous allons','nous allez','nous vont','nous ailles'], correctIndex:0,
              explanation:'Aller : je vais, tu vas, il va, nous allons…', emoji:'🏃' },
            { question:'"leur" ou "leurs" ? "Les padawans ont rangé ___ sabres."',
              choices:['leurs','leur','les','l\''], correctIndex:0,
              explanation:'"leurs" car "sabres" est pluriel', emoji:'🗡️' },
        ],
        CM2: [
            { question:'"quand" ou "quant" ? "___ le combat commence, sois prêt."',
              choices:['Quand','Quant','Quant à','Comme'], correctIndex:0,
              explanation:'"Quand" introduit une circonstance de temps', emoji:'⏱️' },
            { question:'"quel" ou "quelle" ? "___ est ta mission ?"',
              choices:['Quelle','Quel','Quels','Quelles'], correctIndex:0,
              explanation:'"mission" est féminin singulier → "quelle"', emoji:'🎯' },
            { question:'Imparfait de "voir" — "Ils ___ les étoiles chaque nuit."',
              choices:['voyaient','voyais','voient','verront'], correctIndex:0,
              explanation:'Imparfait 3ème pers. pl. : ils voyaient', emoji:'🌌' },
        ],
    };

    function frenchPuzzle(level) {
        var pool = frenchPuzzles[level] || frenchPuzzles.CE1;
        return pool[rnd(0, pool.length - 1)];
    }

    // ── Logic puzzles ────────────────────────────────────────────────────────

    var logicPuzzles = {
        CE1: [
            { question:'Suite : 1, 2, 3, 4, … ?',
              choices:['5','6','4','10'], correctIndex:0,
              explanation:'On ajoute 1 à chaque fois', emoji:'🧩' },
            { question:'Suite : 2, 4, 6, 8, … ?',
              choices:['10','9','12','11'], correctIndex:0,
              explanation:'On ajoute 2 à chaque fois', emoji:'🔢' },
            { question:'Lequel est différent ? 🌟 🌟 🌟 🌙 🌟',
              choices:['🌙','🌟','⭐','🌟'], correctIndex:0,
              explanation:'La lune est différente des étoiles', emoji:'🌙' },
        ],
        CE2: [
            { question:'Suite : 5, 10, 15, 20, … ?',
              choices:['25','24','30','22'], correctIndex:0,
              explanation:'On ajoute 5 à chaque fois (table de 5)', emoji:'🧩' },
            { question:'Suite : 100, 90, 80, 70, … ?',
              choices:['60','65','50','75'], correctIndex:0,
              explanation:'On enlève 10 à chaque fois', emoji:'🔢' },
            { question:'Si 🚀 > 🛸 et 🛸 > 🌙, alors ?',
              choices:['🚀 > 🌙','🌙 > 🚀','🚀 = 🌙','🛸 > 🚀'], correctIndex:0,
              explanation:'Par transitivité : 🚀 > 🛸 > 🌙', emoji:'🧠' },
        ],
        CM1: [
            { question:'Suite : 1, 3, 6, 10, 15, … ?',
              choices:['21','20','18','24'], correctIndex:0,
              explanation:'+2, +3, +4, +5, +6… = nombres triangulaires', emoji:'🧩' },
            { question:'Suite : 2, 4, 8, 16, … ?',
              choices:['32','24','20','28'], correctIndex:0,
              explanation:'On multiplie par 2 à chaque fois', emoji:'✖️' },
            { question:'Un vaisseau met 3 jours pour aller de A à B. Combien pour 4 allers-retours ?',
              choices:['24','12','8','20'], correctIndex:0,
              explanation:'1 aller-retour = 6 jours × 4 = 24 jours', emoji:'🧠' },
        ],
        CM2: [
            { question:'Suite : 1, 1, 2, 3, 5, 8, … ?',
              choices:['13','11','10','12'], correctIndex:0,
              explanation:'Fibonacci : chaque terme = somme des deux précédents', emoji:'🧩' },
            { question:'3 Jedis peuvent garder 6 portes en 2 heures. Combien de portes en 1 heure ?',
              choices:['3','6','2','9'], correctIndex:0,
              explanation:'6 portes en 2h → 3 portes en 1h', emoji:'🧠' },
        ],
    };

    function logicPuzzle(level) {
        var pool = logicPuzzles[level] || logicPuzzles.CE1;
        return pool[rnd(0, pool.length - 1)];
    }

    // ── Public API ───────────────────────────────────────────────────────────

    function generate(subject, level) {
        if (subject === 'math') {
            if (level === 'CE1') return mathCE1();
            if (level === 'CE2') return mathCE2();
            if (level === 'CM1') return mathCM1();
            return mathCM2();
        }
        if (subject === 'french') return frenchPuzzle(level);
        if (subject === 'logic')  return logicPuzzle(level);
        return mathCE1();
    }

    // Round-robin subject selection so player gets variety
    var _subjectIdx = 0;
    var _subjects = ['math', 'french', 'logic'];

    function generateNext(level) {
        var subj = _subjects[_subjectIdx % _subjects.length];
        _subjectIdx++;
        return generate(subj, level);
    }

    return { generate, generateNext };
})();
