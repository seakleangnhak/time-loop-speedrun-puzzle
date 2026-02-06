/**
 * levels.js - Level definitions and loading
 */

const Levels = {
    /**
     * Level data definitions
     */
    data: [
        // Level 1: Tutorial - Simple goal
        {
            id: 'level-1',
            name: 'First Steps',
            spawnPoint: { x: 50, y: 500 },
            entities: [
                // Floor
                { type: 'wall', x: 0, y: 568, width: 800, height: 32 },

                // Goal - easy reach
                { type: 'goal', x: 700, y: 520, width: 48, height: 48 }
            ]
        },

        // Level 2: Switch and Door
        {
            id: 'level-2',
            name: 'Teamwork',
            spawnPoint: { x: 50, y: 500 },
            entities: [
                // Floor
                { type: 'wall', x: 0, y: 568, width: 800, height: 32 },

                // Platform with switch
                { type: 'wall', x: 100, y: 450, width: 150, height: 20 },
                { type: 'switch', x: 150, y: 430, linkedDoorIndex: 0 },

                // Wall blocking goal
                { type: 'wall', x: 500, y: 400, width: 20, height: 168 },

                // Door in the wall
                { type: 'door', x: 500, y: 504, height: 64, linkedIndex: 0 },

                // Goal behind door
                { type: 'goal', x: 700, y: 520, width: 48, height: 48 }
            ]
        },

        // Level 3: Multiple switches
        {
            id: 'level-3',
            name: 'Two Hands',
            spawnPoint: { x: 50, y: 500 },
            entities: [
                // Floor
                { type: 'wall', x: 0, y: 568, width: 800, height: 32 },

                // Left platform with switch
                { type: 'wall', x: 50, y: 400, width: 120, height: 20 },
                { type: 'switch', x: 80, y: 380, linkedDoorIndex: 0 },

                // Right platform with switch
                { type: 'wall', x: 300, y: 350, width: 120, height: 20 },
                { type: 'switch', x: 330, y: 330, linkedDoorIndex: 0 },

                // Double-locked door
                { type: 'wall', x: 550, y: 350, width: 20, height: 218 },
                { type: 'door', x: 550, y: 504, height: 64, linkedIndex: 0, requiresBoth: true },

                // Goal
                { type: 'goal', x: 700, y: 520, width: 48, height: 48 }
            ]
        },

        // Level 4: Laser blocking
        {
            id: 'level-4',
            name: 'Laser Maze',
            spawnPoint: { x: 50, y: 500 },
            entities: [
                // Floor
                { type: 'wall', x: 0, y: 568, width: 800, height: 32 },

                // Platforms
                { type: 'wall', x: 200, y: 500, width: 100, height: 20 },
                { type: 'wall', x: 400, y: 450, width: 100, height: 20 },

                // Laser that needs blocking
                { type: 'laser', x1: 600, y1: 300, x2: 600, y2: 568 },

                // Goal behind laser
                { type: 'goal', x: 700, y: 520, width: 48, height: 48 }
            ]
        }
    ],

    /**
     * Get a level by index
     */
    getLevel(index) {
        if (index < 0 || index >= this.data.length) {
            return null;
        }
        return deepClone(this.data[index]);
    },

    /**
     * Get level count
     */
    getLevelCount() {
        return this.data.length;
    },

    /**
     * Create entities from level data
     */
    createEntities(level) {
        const entities = [];
        const doorRefs = [];

        for (const def of level.entities) {
            let entity;

            switch (def.type) {
                case 'wall':
                    entity = Entities.createWall(def.x, def.y, def.width, def.height);
                    break;

                case 'switch':
                    entity = Entities.createSwitch(def.x, def.y, []);
                    // Store door link index for later resolution
                    entity._linkedDoorIndex = def.linkedDoorIndex;
                    break;

                case 'door':
                    entity = Entities.createDoor(def.x, def.y, def.height || CONFIG.DOOR_HEIGHT, false);
                    doorRefs[def.linkedIndex] = entity.id;
                    break;

                case 'laser':
                    entity = Entities.createLaser(def.x1, def.y1, def.x2, def.y2, def.linkedIds || []);
                    break;

                case 'goal':
                    entity = Entities.createGoal(def.x, def.y, def.width || 48, def.height || 48);
                    break;

                default:
                    console.warn('Unknown entity type:', def.type);
                    continue;
            }

            entities.push(entity);
        }

        // Resolve door links for switches
        for (const entity of entities) {
            if (entity.type === 'switch' && entity._linkedDoorIndex !== undefined) {
                const doorId = doorRefs[entity._linkedDoorIndex];
                if (doorId) {
                    entity.linkedIds.push(doorId);
                }
                delete entity._linkedDoorIndex;
            }
        }

        return entities;
    }
};
