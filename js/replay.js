/**
 * replay.js - Recording and replay system for ghosts
 * 
 * DETERMINISM: Inputs are recorded per fixed timestep (tick), not per render frame.
 * This ensures ghosts replay identically regardless of the user's frame rate.
 * Each Recording.inputs array is indexed by localTick [0..1199] for a 20-second loop.
 */

const ReplaySystem = {
    /**
     * Create a new recording for a loop
     * @param {number} loopIndex - The loop number (1, 2, 3...)
     * @returns {Recording} A new empty recording
     */
    createRecording(loopIndex) {
        return {
            id: `loop-${loopIndex}`,
            loopIndex: loopIndex,
            inputs: [],           // InputState[] indexed by tick
            reachedGoal: false,
            endTick: 0
        };
    },

    /**
     * Record input for a specific tick
     * @param {Recording} recording - The active recording
     * @param {number} tick - The current localTick (0-indexed)
     * @param {InputState} inputState - Snapshot of player input
     */
    recordTick(recording, tick, inputState) {
        recording.inputs[tick] = {
            left: inputState.left,
            right: inputState.right,
            up: inputState.up,
            down: inputState.down,
            action: inputState.action
        };
    },

    /**
     * Get input for a ghost at a specific tick
     * @param {Recording} recording - The ghost's recording
     * @param {number} tick - The current localTick
     * @returns {InputState|null} The recorded input or null if past recording end
     */
    getInputAtTick(recording, tick) {
        if (tick >= recording.inputs.length) {
            return null;
        }
        return recording.inputs[tick];
    },

    /**
     * Finalize a recording when the loop ends
     * @param {Recording} recording - The recording to finalize
     * @param {number} endTick - The tick when the loop ended
     * @param {boolean} reachedGoal - Whether the player reached the goal
     * @returns {Recording} The finalized recording
     */
    finalizeRecording(recording, endTick, reachedGoal) {
        recording.endTick = endTick;
        recording.reachedGoal = reachedGoal;

        // Trim any undefined entries (happens if loop ends early)
        recording.inputs = recording.inputs.slice(0, endTick);

        return recording;
    },

    /**
     * Check if a ghost should still be active at the given tick
     * @param {Recording} recording - The ghost's recording
     * @param {number} tick - The current localTick
     * @returns {boolean} True if ghost has input data for this tick
     */
    isGhostActive(recording, tick) {
        return tick < recording.inputs.length;
    },

    /**
     * Export recordings to JSON string (for save/load functionality)
     * @param {Recording[]} recordings - Array of recordings
     * @returns {string} JSON representation
     */
    exportRecordings(recordings) {
        return JSON.stringify(recordings);
    },

    /**
     * Import recordings from JSON string
     * @param {string} json - JSON string of recordings
     * @returns {Recording[]} Parsed recordings or empty array on error
     */
    importRecordings(json) {
        try {
            return JSON.parse(json);
        } catch (e) {
            console.error('Failed to import recordings:', e);
            return [];
        }
    }
};
