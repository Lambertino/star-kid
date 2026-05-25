// Keyboard input manager — tracks held keys and single-frame presses
const Input = (function () {
    const _held = {};
    const _pressed = {};
    const _released = {};

    window.addEventListener('keydown', function (e) {
        if (!_held[e.code]) _pressed[e.code] = true;
        _held[e.code] = true;
        // Prevent page scroll on arrow keys and space
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','Enter'].includes(e.code)) {
            e.preventDefault();
        }
    });

    window.addEventListener('keyup', function (e) {
        _held[e.code] = false;
        _released[e.code] = true;
    });

    return {
        // True every frame the key is held
        isDown: function (code) { return !!_held[code]; },

        // True only on the first frame the key was pressed
        wasPressed: function (code) { return !!_pressed[code]; },

        // True only on the first frame the key was released
        wasReleased: function (code) { return !!_released[code]; },

        // Call once per frame, after all scene updates
        flush: function () {
            for (var k in _pressed)  delete _pressed[k];
            for (var k in _released) delete _released[k];
        }
    };
})();
