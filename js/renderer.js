/**
 * renderer.js - Canvas rendering system
 */

const Renderer = {
    canvas: null,
    ctx: null,

    /**
     * Initialize the renderer
     */
    init(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = CONFIG.CANVAS_WIDTH;
        canvas.height = CONFIG.CANVAS_HEIGHT;

        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = false;
    },

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.fillStyle = CONFIG.COLORS.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    /**
     * Main render function
     */
    render(gameState, alpha) {
        this.clear();

        // Render world entities (walls, switches, doors, goal)
        for (const entity of gameState.entities) {
            this.renderEntity(entity);
        }

        // Render lasers (on top of entities)
        for (const entity of gameState.entities) {
            if (entity.type === 'laser') {
                this.renderLaser(entity);
            }
        }

        // Render ghosts (semi-transparent)
        for (const ghost of gameState.ghosts) {
            if (ghost.isActive) {
                this.renderGhost(ghost, alpha);
            }
        }

        // Render player
        if (gameState.player && gameState.player.isActive) {
            this.renderPlayer(gameState.player, alpha);
        }
    },

    /**
     * Render a generic entity based on type
     */
    renderEntity(entity) {
        switch (entity.type) {
            case 'wall':
                this.renderWall(entity);
                break;
            case 'switch':
                this.renderSwitch(entity);
                break;
            case 'door':
                this.renderDoor(entity);
                break;
            case 'goal':
                this.renderGoal(entity);
                break;
        }
    },

    /**
     * Render player with optional interpolation
     */
    renderPlayer(player, alpha) {
        const ctx = this.ctx;

        // Glow effect
        ctx.shadowColor = CONFIG.COLORS.player;
        ctx.shadowBlur = 15;

        ctx.fillStyle = CONFIG.COLORS.player;
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Reset shadow
        ctx.shadowBlur = 0;

        // Direction indicator
        ctx.fillStyle = '#ffffff';
        const indicatorX = player.facingRight
            ? player.x + player.width - 8
            : player.x + 4;
        ctx.fillRect(indicatorX, player.y + 10, 4, 12);
    },

    /**
     * Render ghost with transparency
     */
    renderGhost(ghost, alpha) {
        const ctx = this.ctx;

        ctx.globalAlpha = 0.4;
        ctx.fillStyle = CONFIG.COLORS.player;
        ctx.fillRect(ghost.x, ghost.y, ghost.width, ghost.height);

        // Ghost number indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
            ghost.recording.loopIndex.toString(),
            ghost.x + ghost.width / 2,
            ghost.y + ghost.height / 2 + 4
        );

        ctx.globalAlpha = 1;
    },

    /**
     * Render wall
     */
    renderWall(wall) {
        this.ctx.fillStyle = CONFIG.COLORS.wall;
        this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);

        // Subtle border
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    },

    /**
     * Render switch
     */
    renderSwitch(sw) {
        const ctx = this.ctx;
        const color = sw.isPressed ? CONFIG.COLORS.switch_on : CONFIG.COLORS.switch_off;

        // Glow when pressed
        if (sw.isPressed) {
            ctx.shadowColor = CONFIG.COLORS.switch_on;
            ctx.shadowBlur = 10;
        }

        ctx.fillStyle = color;
        ctx.fillRect(sw.x, sw.y, sw.width, sw.height);

        ctx.shadowBlur = 0;

        // Button indicator
        ctx.fillStyle = sw.isPressed ? '#ffffff' : '#2a2a3e';
        ctx.fillRect(sw.x + 8, sw.y + 8, sw.width - 16, sw.height - 16);
    },

    /**
     * Render door
     */
    renderDoor(door) {
        const ctx = this.ctx;
        const color = door.isOpen ? CONFIG.COLORS.door_open : CONFIG.COLORS.door_closed;

        if (!door.isOpen) {
            ctx.shadowColor = CONFIG.COLORS.door_closed;
            ctx.shadowBlur = 8;
        }

        ctx.fillStyle = color;
        ctx.fillRect(door.x, door.y, door.width, door.height);

        ctx.shadowBlur = 0;
    },

    /**
     * Render laser
     */
    renderLaser(laser) {
        const ctx = this.ctx;

        if (laser.isBlocked) {
            ctx.globalAlpha = 0.3;
        }

        ctx.strokeStyle = CONFIG.COLORS.laser;
        ctx.lineWidth = laser.isBlocked ? 2 : 4;
        ctx.shadowColor = CONFIG.COLORS.laser;
        ctx.shadowBlur = laser.isBlocked ? 5 : 15;

        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    },

    /**
     * Render goal
     */
    renderGoal(goal) {
        const ctx = this.ctx;

        // Pulsing glow effect
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;

        ctx.shadowColor = CONFIG.COLORS.goal;
        ctx.shadowBlur = 20 * pulse;

        ctx.fillStyle = CONFIG.COLORS.goal;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);

        // Star/flag indicator
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('★', goal.x + goal.width / 2, goal.y + goal.height / 2 + 7);

        ctx.shadowBlur = 0;
    }
};
