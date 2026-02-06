/**
 * main.js - Game entry point
 */

(function () {
    'use strict';

    /**
     * Initialize the game when DOM is ready
     */
    function init() {
        console.log('Time Loop - Initializing...');

        // Get canvas element
        const canvas = document.getElementById('game-canvas');
        if (!canvas) {
            console.error('Canvas element not found!');
            return;
        }

        // Initialize systems
        Renderer.init(canvas);
        InputSystem.init();

        // Load first level
        const level = Levels.getLevel(0);
        if (!level) {
            console.error('Failed to load level!');
            return;
        }

        // Start the game
        Game.init(level);

        // Setup keyboard shortcuts
        setupKeyboardShortcuts();

        console.log('Time Loop - Ready!');
        console.log('Controls: Arrow keys or WASD to move, Up/W to jump');
    }

    /**
     * Setup global keyboard shortcuts
     */
    function setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Escape':
                    Game.togglePause();
                    break;

                case 'KeyR':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        Game.restartLevel();
                    }
                    break;

                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                    // Quick level select (for testing)
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        const levelIndex = parseInt(e.code.charAt(5)) - 1;
                        const level = Levels.getLevel(levelIndex);
                        if (level) {
                            Game.currentLevel = level;
                            Game.restartLevel();
                            console.log(`Loaded Level ${levelIndex + 1}: ${level.name}`);
                        }
                    }
                    break;
            }
        });
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
