/**
 * entities.js - Entity definitions and factory functions
 */

const Entities = {
    /**
     * Create a player entity
     */
    createPlayer(x, y) {
        return {
            type: 'player',
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            width: CONFIG.PLAYER_WIDTH,
            height: CONFIG.PLAYER_HEIGHT,
            grounded: false,
            facingRight: true,
            isActive: true
        };
    },

    /**
     * Create a ghost entity from a recording
     */
    createGhost(x, y, recording) {
        return {
            type: 'ghost',
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            width: CONFIG.PLAYER_WIDTH,
            height: CONFIG.PLAYER_HEIGHT,
            grounded: false,
            facingRight: true,
            isActive: true,
            recording: recording
        };
    },

    /**
     * Create a wall entity
     */
    createWall(x, y, width, height) {
        return {
            type: 'wall',
            x: x,
            y: y,
            width: width,
            height: height
        };
    },

    /**
     * Create a switch entity
     */
    createSwitch(x, y, linkedIds = []) {
        return {
            type: 'switch',
            id: generateId(),
            x: x,
            y: y,
            width: CONFIG.SWITCH_SIZE,
            height: CONFIG.SWITCH_SIZE / 2,
            isPressed: false,
            linkedIds: linkedIds
        };
    },

    /**
     * Create a door entity
     */
    createDoor(x, y, height = CONFIG.DOOR_HEIGHT, initiallyOpen = false) {
        return {
            type: 'door',
            id: generateId(),
            x: x,
            y: y,
            width: CONFIG.DOOR_WIDTH,
            height: height,
            isOpen: initiallyOpen,
            initiallyOpen: initiallyOpen
        };
    },

    /**
     * Create a laser entity
     */
    createLaser(x1, y1, x2, y2, linkedIds = []) {
        return {
            type: 'laser',
            id: generateId(),
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            isBlocked: false,
            linkedIds: linkedIds
        };
    },

    /**
     * Create a goal entity
     */
    createGoal(x, y, width = 48, height = 48) {
        return {
            type: 'goal',
            x: x,
            y: y,
            width: width,
            height: height,
            isReached: false
        };
    },

    /**
     * Update switch state based on entities standing on it
     */
    updateSwitch(sw, solidEntities) {
        const wasPressed = sw.isPressed;

        // Check if any entity is overlapping the switch
        sw.isPressed = solidEntities.some(entity =>
            entity.isActive && aabbOverlap(entity, sw)
        );

        // Return true if state changed (for sound effects, etc.)
        return wasPressed !== sw.isPressed;
    },

    /**
     * Update door state based on linked switches
     */
    updateDoor(door, allEntities) {
        const linkedSwitches = allEntities.filter(e =>
            e.type === 'switch' && e.linkedIds.includes(door.id)
        );

        if (linkedSwitches.length === 0) {
            // No linked switches, stay at initial state
            door.isOpen = door.initiallyOpen;
        } else {
            // Open if ANY linked switch is pressed
            door.isOpen = linkedSwitches.some(sw => sw.isPressed);
        }
    },

    /**
     * Update laser state based on entities blocking it
     */
    updateLaser(laser, solidEntities) {
        laser.isBlocked = solidEntities.some(entity => {
            if (!entity.isActive) return false;
            return lineIntersectsRect(
                laser.x1, laser.y1, laser.x2, laser.y2,
                entity
            );
        });
    },

    /**
     * Reset an entity to its initial state
     */
    reset(entity) {
        switch (entity.type) {
            case 'switch':
                entity.isPressed = false;
                break;
            case 'door':
                entity.isOpen = entity.initiallyOpen;
                break;
            case 'laser':
                entity.isBlocked = false;
                break;
            case 'goal':
                entity.isReached = false;
                break;
        }
    }
};
