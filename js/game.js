/**
 * game.js - Game loop and state management
 * 
 * ARCHITECTURE: Fixed-Timestep Simulation Loop
 * =============================================
 * 
 * The game uses a FIXED TIMESTEP (16.67ms = 60 ticks/second) for all gameplay
 * logic, completely decoupled from the rendering frame rate.
 * 
 * This ensures DETERMINISM: given the same inputs, the simulation produces
 * identical results regardless of whether the game runs at 30fps, 60fps, or 144fps.
 * 
 * LOOP STRUCTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │  requestAnimationFrame (variable rate: 30-144+ fps)         │
 * │    │                                                        │
 * │    ├─► accumulator += deltaTime                             │
 * │    │                                                        │
 * │    ├─► while (accumulator >= TICK_DURATION) [SIMULATION]    │
 * │    │     ├─► Record input at localTick                      │
 * │    │     ├─► Update player physics                          │
 * │    │     ├─► Update all ghosts (same physics)               │
 * │    │     ├─► Update world entities                          │
 * │    │     ├─► Check win/reset conditions                     │
 * │    │     ├─► localTick++                                    │
 * │    │     └─► accumulator -= TICK_DURATION                   │
 * │    │                                                        │
 * │    └─► Renderer.render(state, alpha) [PRESENTATION]         │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * WHY THIS PREVENTS DESYNC:
 * - All physics/logic runs in update() at exactly 60Hz
 * - Input is sampled once per tick, not per frame
 * - Ghosts read the same tick-indexed input array
 * - No time-based calculations (only tick counts)
 * - Consistent entity update order every tick
 * 
 * LOOP BOUNDARIES:
 * - START: localTick = 0, player/ghosts at spawn, world reset
 * - END: localTick >= LOOP_TICKS (1200) OR player reaches goal
 * - RESET: Recording finalized, ghost created, localTick = 0
 */

const Game = {
    // ═══════════════════════════════════════════════════════════
    // SIMULATION STATE (modified only in update(), never in render)
    // ═══════════════════════════════════════════════════════════

    globalTick: 0,      // Total ticks since game start (never resets)
    localTick: 0,       // Current tick within loop [0..LOOP_TICKS-1]
    loopIndex: 1,       // Current loop number (1, 2, 3...)

    // Entities (state changes only in update())
    player: null,
    ghosts: [],
    entities: [],

    // Replay system
    currentRecording: null,
    recordings: [],

    // Level data
    currentLevel: null,

    // ═══════════════════════════════════════════════════════════
    // FRAME STATE (timing for render loop, not simulation)
    // ═══════════════════════════════════════════════════════════

    accumulator: 0,     // Accumulated time for fixed timestep
    lastTime: 0,        // Last frame timestamp

    // Control flags
    isRunning: false,
    isPaused: false,
    levelComplete: false,

    // UI elements (updated per-tick for consistency)
    timerElement: null,
    loopCounterElement: null,

    /**
     * Initialize the game with a level
     */
    init(level) {
        this.currentLevel = level;
        this.timerElement = document.getElementById('timer');
        this.loopCounterElement = document.getElementById('loop-counter');

        this.startNewLoop();
        this.isRunning = true;
        this.lastTime = performance.now();

        // Start the frame-driven loop
        requestAnimationFrame((time) => this.frameLoop(time));
    },

    // ═══════════════════════════════════════════════════════════
    // FRAME LOOP (runs at display refresh rate: 30-144+ fps)
    // Only handles timing and calls simulation + render
    // ═══════════════════════════════════════════════════════════

    /**
     * Frame loop - runs per display frame, drives simulation ticks
     * This is the ONLY place that touches real time (performance.now)
     */
    frameLoop(currentTime) {
        if (!this.isRunning) return;

        // Calculate elapsed real time since last frame
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Run simulation ticks if not paused
        if (!this.isPaused && !this.levelComplete) {
            this.accumulator += deltaTime;

            // Consume accumulated time in fixed-size chunks
            // Each chunk = one simulation tick at exactly TICK_DURATION
            while (this.accumulator >= CONFIG.TICK_DURATION) {
                this.simulationTick();
                this.accumulator -= CONFIG.TICK_DURATION;
            }
        }

        // Render current state (alpha for optional interpolation)
        const alpha = this.accumulator / CONFIG.TICK_DURATION;
        Renderer.render(this, alpha);

        // Continue frame loop
        requestAnimationFrame((time) => this.frameLoop(time));
    },

    // ═══════════════════════════════════════════════════════════
    // SIMULATION TICK (runs at exactly 60Hz, deterministic)
    // ALL gameplay logic happens here, NEVER in frameLoop
    // ═══════════════════════════════════════════════════════════

    /**
     * Single simulation tick - all gameplay logic
     * Runs at exactly 60 ticks/second regardless of frame rate
     * 
     * UPDATE ORDER (critical for determinism):
     * 1. Capture & record input
     * 2. Update player
     * 3. Update ghosts (in spawn order)
     * 4. Update world entities
     * 5. Check conditions
     * 6. Advance tick counter
     */
    simulationTick() {
        // ─── 1. INPUT CAPTURE ───────────────────────────────────
        // Capture input state ONCE at the start of this tick
        const inputState = InputSystem.getState();
        ReplaySystem.recordTick(this.currentRecording, this.localTick, inputState);

        // ─── 2. PLAYER UPDATE ───────────────────────────────────
        this.updatePlayer(inputState);

        // ─── 3. GHOST UPDATES ───────────────────────────────────
        // Update in spawn order (oldest ghost first) for consistency
        for (let i = 0; i < this.ghosts.length; i++) {
            this.updateGhost(this.ghosts[i]);
        }

        // ─── 4. WORLD ENTITY UPDATES ────────────────────────────
        this.updateWorldEntities();

        // ─── 5. CONDITION CHECKS ────────────────────────────────
        this.checkWinCondition();
        this.updateUI();

        // ─── 6. TICK ADVANCEMENT ────────────────────────────────
        this.localTick++;
        this.globalTick++;

        // ─── 7. LOOP BOUNDARY CHECK ─────────────────────────────
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

        // Get recorded input for this tick (deterministic playback)
        const input = ReplaySystem.getInputAtTick(ghost.recording, this.localTick);
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

        // Create new recording via ReplaySystem
        this.currentRecording = ReplaySystem.createRecording(this.loopIndex);

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
        // Finalize and store recording
        ReplaySystem.finalizeRecording(this.currentRecording, this.localTick, reachedGoal);
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
