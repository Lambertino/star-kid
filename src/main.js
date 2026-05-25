// Entry point — start the game once the page is loaded
window.addEventListener('load', function () {
    // Resume audio context on first interaction (browser policy)
    window.addEventListener('keydown', function resumeAudio() {
        Audio.resume();
        window.removeEventListener('keydown', resumeAudio);
    }, { once: true });

    GameEngine.init();
});
