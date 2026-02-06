/**
 * input.js - Keyboard input handling and recording
 */

const InputSystem = {
    // Current keyboard state
    keys: {
        left: false,
        right: false,
        up: false,
        down: false,
        action: false
    },

    // Key mappings
    keyMap: {
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'KeyA': 'left',
        'KeyD': 'right',
        'KeyW': 'up',
        'KeyS': 'down',
        'Space': 'action',
        'KeyE': 'action'
    },

    /**
     * Initialize input listeners
     */
    init() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Prevent default for game keys
        window.addEventListener('keydown', (e) => {
            if (this.keyMap[e.code]) {
                e.preventDefault();
            }
        });
    },

    /**
     * Handle key press
     */
    handleKeyDown(e) {
        const action = this.keyMap[e.code];
        if (action) {
            this.keys[action] = true;
        }
    },

    /**
     * Handle key release
     */
    handleKeyUp(e) {
        const action = this.keyMap[e.code];
        if (action) {
            this.keys[action] = false;
        }
    },

    /**
     * Get current input state (snapshot for recording)
     */
    getState() {
        return {
            left: this.keys.left,
            right: this.keys.right,
            up: this.keys.up,
            down: this.keys.down,
            action: this.keys.action
        };
    },

    /**
     * Reset all keys (e.g., when window loses focus)
     */
    reset() {
        this.keys.left = false;
        this.keys.right = false;
        this.keys.up = false;
        this.keys.down = false;
        this.keys.action = false;
    }
};

// Handle window blur to prevent stuck keys
window.addEventListener('blur', () => InputSystem.reset());
