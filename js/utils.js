/**
 * utils.js - Shared constants and utility functions
 */

const CONFIG = {
    // Timing
    TICK_RATE: 60,                    // Updates per second
    TICK_DURATION: 1000 / 60,         // ~16.67ms per tick
    LOOP_DURATION: 20,                // Seconds per loop
    LOOP_TICKS: 20 * 60,              // 1200 ticks per loop

    // Canvas
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,

    // Physics
    GRAVITY: 0.5,
    FRICTION: 0.85,
    PLAYER_SPEED: 5,
    PLAYER_JUMP: -12,

    // Entity sizes
    PLAYER_WIDTH: 32,
    PLAYER_HEIGHT: 32,
    SWITCH_SIZE: 40,
    DOOR_WIDTH: 16,
    DOOR_HEIGHT: 64,

    // Colors
    COLORS: {
        player: '#00d4ff',
        ghost: 'rgba(0, 212, 255, 0.4)',
        wall: '#2a2a3e',
        switch_off: '#4a4a5e',
        switch_on: '#4ade80',
        door_closed: '#ff6b35',
        door_open: 'rgba(255, 107, 53, 0.2)',
        laser: '#ff3366',
        goal: '#fbbf24',
        background: '#1a1a2e'
    }
};

/**
 * Deep clone an object (simple implementation for game objects)
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Generate a unique ID
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clamp a value between min and max
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Linear interpolation
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Check if two AABBs overlap
 */
function aabbOverlap(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

/**
 * Check if a point is inside an AABB
 */
function pointInRect(px, py, rect) {
    return (
        px >= rect.x &&
        px <= rect.x + rect.width &&
        py >= rect.y &&
        py <= rect.y + rect.height
    );
}

/**
 * Check if a line segment intersects an AABB
 */
function lineIntersectsRect(x1, y1, x2, y2, rect) {
    // Check if either endpoint is inside
    if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) {
        return true;
    }

    // Check line against all four edges of the rectangle
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    return (
        lineIntersectsLine(x1, y1, x2, y2, left, top, right, top) ||
        lineIntersectsLine(x1, y1, x2, y2, left, bottom, right, bottom) ||
        lineIntersectsLine(x1, y1, x2, y2, left, top, left, bottom) ||
        lineIntersectsLine(x1, y1, x2, y2, right, top, right, bottom)
    );
}

/**
 * Check if two line segments intersect
 */
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom === 0) return false;

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}
