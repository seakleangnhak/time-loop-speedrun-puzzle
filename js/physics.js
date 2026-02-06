/**
 * physics.js - Movement and collision detection
 */

const Physics = {
    /**
     * Apply input to an entity (player or ghost)
     */
    applyInput(entity, input) {
        // Horizontal movement
        if (input.left) {
            entity.vx = -CONFIG.PLAYER_SPEED;
            entity.facingRight = false;
        } else if (input.right) {
            entity.vx = CONFIG.PLAYER_SPEED;
            entity.facingRight = true;
        } else {
            entity.vx = 0;
        }

        // Jump (only when grounded)
        if (input.up && entity.grounded) {
            entity.vy = CONFIG.PLAYER_JUMP;
            entity.grounded = false;
        }
    },

    /**
     * Apply physics (gravity, friction)
     */
    applyPhysics(entity) {
        // Apply gravity
        entity.vy += CONFIG.GRAVITY;

        // Apply velocity
        entity.x += entity.vx;
        entity.y += entity.vy;

        // Reset grounded status (will be set by collision)
        entity.grounded = false;
    },

    /**
     * Resolve collisions with world entities
     */
    resolveCollisions(entity, worldEntities) {
        for (const world of worldEntities) {
            // Only collide with solid entities
            if (world.type !== 'wall' &&
                !(world.type === 'door' && !world.isOpen)) {
                continue;
            }

            if (!aabbOverlap(entity, world)) {
                continue;
            }

            // Calculate overlap on each axis
            const overlapX = this.getOverlapX(entity, world);
            const overlapY = this.getOverlapY(entity, world);

            // Resolve the smaller overlap first
            if (Math.abs(overlapX) < Math.abs(overlapY)) {
                entity.x += overlapX;
                entity.vx = 0;
            } else {
                entity.y += overlapY;
                entity.vy = 0;

                // Check if landed on top
                if (overlapY < 0) {
                    entity.grounded = true;
                }
            }
        }

        // Keep entity in bounds
        this.clampToBounds(entity);
    },

    /**
     * Calculate X overlap between two AABBs
     */
    getOverlapX(a, b) {
        const aCenter = a.x + a.width / 2;
        const bCenter = b.x + b.width / 2;

        if (aCenter < bCenter) {
            // Entity is to the left
            return b.x - (a.x + a.width);
        } else {
            // Entity is to the right
            return (b.x + b.width) - a.x;
        }
    },

    /**
     * Calculate Y overlap between two AABBs
     */
    getOverlapY(a, b) {
        const aCenter = a.y + a.height / 2;
        const bCenter = b.y + b.height / 2;

        if (aCenter < bCenter) {
            // Entity is above
            return b.y - (a.y + a.height);
        } else {
            // Entity is below
            return (b.y + b.height) - a.y;
        }
    },

    /**
     * Keep entity within canvas bounds
     */
    clampToBounds(entity) {
        // Left boundary
        if (entity.x < 0) {
            entity.x = 0;
            entity.vx = 0;
        }

        // Right boundary
        if (entity.x + entity.width > CONFIG.CANVAS_WIDTH) {
            entity.x = CONFIG.CANVAS_WIDTH - entity.width;
            entity.vx = 0;
        }

        // Bottom boundary (floor)
        if (entity.y + entity.height > CONFIG.CANVAS_HEIGHT) {
            entity.y = CONFIG.CANVAS_HEIGHT - entity.height;
            entity.vy = 0;
            entity.grounded = true;
        }

        // Top boundary
        if (entity.y < 0) {
            entity.y = 0;
            entity.vy = 0;
        }
    }
};
