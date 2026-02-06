/**
 * game.js - Game loop and state management
 */

const Game = {
    // Timing state
    globalTick: 0,
    localTick: 0,
    loopIndex: 1,
    accumulator: 0,
    lastTime: 0,

    // Game state
    isRunning: false,
    isPaused: false,
    levelComplete: false,

    // Entities
    player: null,
    ghosts: [],
    entities: [],

    // Replay
    currentRecording: null,
    recordings: [],

    // Level
    currentLevel: null,

    // UI elements
    timerElement: null,
    loopCounterElement: null,

    /**
     * Initialize the game
     */
    init(level) {
        this.currentLevel = level;
        this.timerElement = document.getElementById('timer');
        this.loopCounterElement = document.getElementById('loop-counter');

        this.startNewLoop();
        this.isRunning = true;
        this.lastTime = performance.now();

        // Start game loop
        requestAnimationFrame((time) => this.loop(time));
    },

    /**
     * Main game loop with fixed timestep
     */
    loop(currentTime) {
        if (!this.isRunning) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (!this.isPaused && !this.levelComplete) {
            this.accumulator += deltaTime;

            // Fixed timestep updates
            while (this.accumulator >= CONFIG.TICK_DURATION) {
                this.update();
                this.accumulator -= CONFIG.TICK_DURATION;
            }
        }

        // Render with interpolation alpha
        const alpha = this.accumulator / CONFIG.TICK_DURATION;
        Renderer.render(this, alpha);

        // Continue loop
        requestAnimationFrame((time) => this.loop(time));
    },

    /**
     * Fixed timestep update
     */
    update() {
        // 1. Record player input
        const inputState = InputSystem.getState();
        this.currentRecording.inputs[this.localTick] = inputState;

        // 2. Update player
        this.updatePlayer(inputState);

        // 3. Update all ghosts
        for (const ghost of this.ghosts) {
            this.updateGhost(ghost);
        }

        // 4. Update world entities (switches, doors, etc.)
        this.updateWorldEntities();

        // 5. Check win condition
        this.checkWinCondition();

        // 6. Increment tick
        this.localTick++;
        this.globalTick++;

        // 7. Update UI
        this.updateUI();

        // 8. Check for loop reset
        if (this.localTick >= CONFIG.LOOP_TICKS) {
            this.endLoop(false);
        }
    },

    /**
     * Update player based on input
     */
    updatePlayer(input) {
        if (!this.player.isActive) return;

        Physics.applyInput(this.player, input);
        Physics.applyPhysics(this.player);
        Physics.resolveCollisions(this.player, this.entities);
    },

    /**
     * Update ghost using recorded input
     */
    updateGhost(ghost) {
        if (!ghost.isActive) return;

        const input = ghost.recording.inputs[this.localTick];
        if (!input) {
            ghost.isActive = false;
            return;
        }

        Physics.applyInput(ghost, input);
        Physics.applyPhysics(ghost);
        Physics.resolveCollisions(ghost, this.entities);
    },

    /**
     * Update switches, doors, lasers based on entity positions
     */
    updateWorldEntities() {
        // Get all solid entities (player + active ghosts)
        const solidEntities = [this.player, ...this.ghosts.filter(g => g.isActive)];

        for (const entity of this.entities) {
            if (entity.type === 'switch') {
                Entities.updateSwitch(entity, solidEntities);
            }
        }

        // Update doors based on switch states
        for (const entity of this.entities) {
            if (entity.type === 'door') {
                Entities.updateDoor(entity, this.entities);
            }
        }

        // Update lasers
        for (const entity of this.entities) {
            if (entity.type === 'laser') {
                Entities.updateLaser(entity, solidEntities);
            }
        }
    },

    /**
     * Check if player reached the goal
     */
    checkWinCondition() {
        const goal = this.entities.find(e => e.type === 'goal');
        if (goal && this.player.isActive && aabbOverlap(this.player, goal)) {
            this.endLoop(true);
        }
    },

    /**
     * Update UI elements
     */
    updateUI() {
        const remainingSeconds = Math.ceil((CONFIG.LOOP_TICKS - this.localTick) / CONFIG.TICK_RATE);
        this.timerElement.textContent = remainingSeconds;

        // Timer color states
        this.timerElement.classList.remove('warning', 'critical');
        if (remainingSeconds <= 5) {
            this.timerElement.classList.add('critical');
        } else if (remainingSeconds <= 10) {
            this.timerElement.classList.add('warning');
        }

        this.loopCounterElement.textContent = `Loop: ${this.loopIndex}`;
    },

    /**
     * Start a new loop
     */
    startNewLoop() {
        this.localTick = 0;

        // Create new recording
        this.currentRecording = {
            id: `loop-${this.loopIndex}`,
            loopIndex: this.loopIndex,
            startTick: this.globalTick,
            inputs: [],
            reachedGoal: false,
            endTick: 0
        };

        // Reset player
        this.player = Entities.createPlayer(
            this.currentLevel.spawnPoint.x,
            this.currentLevel.spawnPoint.y
        );

        // Spawn ghosts from all previous recordings
        this.ghosts = this.recordings.map(recording =>
            Entities.createGhost(
                this.currentLevel.spawnPoint.x,
                this.currentLevel.spawnPoint.y,
                recording
            )
        );

        // Reset world entities
        this.entities = Levels.createEntities(this.currentLevel);
    },

    /**
     * End current loop
     */
    endLoop(reachedGoal) {
        // Finalize recording
        this.currentRecording.endTick = this.localTick;
        this.currentRecording.reachedGoal = reachedGoal;
        this.recordings.push(this.currentRecording);

        if (reachedGoal) {
            this.levelComplete = true;
            // Could trigger next level here
            console.log(`Level complete in ${this.loopIndex} loop(s)!`);
        } else {
            // Start next loop
            this.loopIndex++;
            this.startNewLoop();
        }
    },

    /**
     * Pause/unpause the game
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused) {
            this.lastTime = performance.now();
            this.accumulator = 0;
        }
    },

    /**
     * Restart the current level
     */
    restartLevel() {
        this.globalTick = 0;
        this.loopIndex = 1;
        this.recordings = [];
        this.levelComplete = false;
        this.startNewLoop();
    }
};
