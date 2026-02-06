/**
 * replay.js - Recording and replay system for ghosts
 */

const ReplaySystem = {
    /**
     * Create a new recording
     */
    createRecording(loopIndex, startTick) {
        return {
            id: `loop-${loopIndex}-${Date.now()}`,
            loopIndex: loopIndex,
            startTick: startTick,
            inputs: [],
            reachedGoal: false,
            endTick: 0
        };
    },

    /**
     * Record input for the current tick
     */
    recordInput(recording, tick, inputState) {
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
     */
    getInputAtTick(recording, tick) {
        if (tick >= recording.inputs.length) {
            return null;
        }
        return recording.inputs[tick];
    },

    /**
     * Finalize a recording when the loop ends
     */
    finalizeRecording(recording, endTick, reachedGoal) {
        recording.endTick = endTick;
        recording.reachedGoal = reachedGoal;

        // Trim any undefined entries
        recording.inputs = recording.inputs.slice(0, endTick);

        return recording;
    },

    /**
     * Check if a ghost should still be active
     */
    isGhostActive(recording, currentTick) {
        return currentTick < recording.inputs.length;
    },

    /**
     * Export recordings to JSON (for save/load)
     */
    exportRecordings(recordings) {
        return JSON.stringify(recordings);
    },

    /**
     * Import recordings from JSON
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
