// ===== Tank Class =====
class Tank {
    constructor(x, y, direction, isEnemy, color) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.direction = direction; // 0:up, 1:right, 2:down, 3:left
        this.speed = isEnemy ? 1 : 2;
        this.maxHp = isEnemy ? 1 : 3;
        this.hp = this.maxHp;
        this.isEnemy = isEnemy;
        this.color = color || (isEnemy ? '#e74c3c' : '#2ecc71');
        this.alive = true;
        this.cooldown = 0;
        this.fireCooldown = isEnemy ? 30 : 15; // frames between shots
        this.moveDir = direction;
    }

    // Get the pixel-aligned position (snap to half-tile for smooth movement)
    getRect() {
        return {
            x: this.x + 1,
            y: this.y + 1,
            w: this.size - 2,
            h: this.size - 2
        };
    }

    // Get center position
    getCenterX() {
        return this.x + this.size / 2;
    }

    getCenterY() {
        return this.y + this.size / 2;
    }

    // Move in current direction
    tryMove(direction, gameMap, otherTanks) {
        if (!this.alive) return false;

        let newX = this.x;
        let newY = this.y;

        switch (direction) {
            case 0: newY -= this.speed; break; // up
            case 1: newX += this.speed; break; // right
            case 2: newY += this.speed; break; // down
            case 3: newX -= this.speed; break; // left
        }

        // Clamp to canvas bounds
        if (newX < 0) newX = 0;
        if (newY < 0) newY = 0;
        if (newX + this.size > CANVAS_W) newX = CANVAS_W - this.size;
        if (newY + this.size > CANVAS_H) newY = CANVAS_H - this.size;

        // Check map collision
        if (gameMap.isPassable(newX + 1, newY + 1, this.size - 2, this.size - 2)) {
            // Check tank collision
            if (!this.collidesWithTanks(newX, newY, otherTanks)) {
                this.x = newX;
                this.y = newY;
                this.direction = direction;
                return true;
            }
        }

        // Even if can't move, update direction
        this.direction = direction;
        return false;
    }

    // Check if a position overlaps with any other tank
    collidesWithTanks(x, y, tanks) {
        if (!tanks || tanks.length === 0) return false;
        const left = x + 1;
        const top = y + 1;
        const right = left + this.size - 2;
        const bottom = top + this.size - 2;

        for (const tank of tanks) {
            if (!tank.alive || tank === this) continue;
            const r = tank.getRect();
            if (left < r.x + r.w && right > r.x && top < r.y + r.h && bottom > r.y) {
                return true;
            }
        }
        return false;
    }

    // Fire a bullet
    fire(bulletManager) {
        if (this.cooldown > 0 || !this.alive) return null;

        // Bullet starts from center of tank
        const bx = this.x + (this.size - 6) / 2;
        const by = this.y + (this.size - 6) / 2;

        const bullet = bulletManager.fire(bx, by, this.direction, this.isEnemy);
        if (bullet) {
            this.cooldown = this.fireCooldown;
            if (!this.isEnemy) Sound.playShoot();
        }
        return bullet;
    }

    hit() {
        this.hp--;
        if (this.hp <= 0) {
            this.alive = false;
        }
    }

    update(gameMap) {
        if (!this.alive) return;

        if (this.cooldown > 0) {
            this.cooldown--;
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const s = this.size;
        const x = this.x;
        const y = this.y;

        // Tank body
        ctx.fillStyle = this.color;
        ctx.fillRect(x + 2, y + 4, s - 4, s - 8);

        // Tank treads (left and right)
        ctx.fillStyle = this.darkenColor(this.color, 0.6);
        ctx.fillRect(x, y + 2, 4, s - 4);
        ctx.fillRect(x + s - 4, y + 2, 4, s - 4);

        // Tread details (lines)
        ctx.strokeStyle = this.darkenColor(this.color, 0.4);
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
            const ty = y + 4 + i * 7;
            ctx.beginPath();
            ctx.moveTo(x, ty);
            ctx.lineTo(x + 4, ty);
            ctx.moveTo(x + s - 4, ty);
            ctx.lineTo(x + s, ty);
            ctx.stroke();
        }

        // Turret (circle)
        ctx.fillStyle = this.lightenColor(this.color, 0.3);
        ctx.beginPath();
        ctx.arc(x + s / 2, y + s / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        // Cannon barrel
        ctx.fillStyle = this.darkenColor(this.color, 0.7);
        const barrelLen = 14;
        const barrelW = 4;
        let bx = x + s / 2 - barrelW / 2;
        let by = y + s / 2 - barrelW / 2;

        switch (this.direction) {
            case 0: // up
                bx = x + s / 2 - barrelW / 2;
                by = y + s / 2 - barrelLen;
                ctx.fillRect(bx, by, barrelW, barrelLen);
                break;
            case 1: // right
                bx = x + s / 2;
                by = y + s / 2 - barrelW / 2;
                ctx.fillRect(bx, by, barrelLen, barrelW);
                break;
            case 2: // down
                bx = x + s / 2 - barrelW / 2;
                by = y + s / 2;
                ctx.fillRect(bx, by, barrelW, barrelLen);
                break;
            case 3: // left
                bx = x + s / 2 - barrelLen;
                by = y + s / 2 - barrelW / 2;
                ctx.fillRect(bx, by, barrelLen, barrelW);
                break;
        }

        // HP indicator (only if > 1)
        if (this.hp > 1) {
            const hpWidth = s - 8;
            const hpHeight = 3;
            const hpX = x + 4;
            const hpY = y - 4;

            // Background
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(hpX, hpY, hpWidth, hpHeight);

            // HP fill
            const hpRatio = this.hp / this.maxHp;
            ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
            ctx.fillRect(hpX, hpY, hpWidth * hpRatio, hpHeight);
        }
    }

    darkenColor(color, factor) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
    }

    lightenColor(color, factor) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgb(${Math.min(255, Math.floor(r + (255 - r) * factor))},${Math.min(255, Math.floor(g + (255 - g) * factor))},${Math.min(255, Math.floor(b + (255 - b) * factor))})`;
    }
}

// ===== Enemy Tank Types =====
const ENEMY_TYPES = [
    // Normal - red, balanced
    { name: 'normal', color: '#e74c3c', score: 100, hp: 1, speed: 1, fireInterval: 90 },
    // Fast - yellow, faster but weaker
    { name: 'fast', color: '#f39c12', score: 150, hp: 1, speed: 2, fireInterval: 120 },
    // Heavy - purple, tough but slow
    { name: 'heavy', color: '#9b59b6', score: 250, hp: 2, speed: 0.8, fireInterval: 100 },
    // Elite - dark red, dangerous
    { name: 'elite', color: '#c0392b', score: 400, hp: 3, speed: 1.2, fireInterval: 60 },
];

// Pick an enemy type based on wave number (harder types appear later)
function pickEnemyType(wave) {
    // Early waves: mostly normal, occasional fast
    if (wave < 3) return Math.random() < 0.8 ? 0 : 1;
    // Mid waves: normal, fast, some heavy
    if (wave < 6) {
        const r = Math.random();
        if (r < 0.4) return 0;       // 40% normal
        if (r < 0.75) return 1;      // 35% fast
        return 2;                     // 25% heavy
    }
    // Late waves: heavy and elite become common
    if (wave < 10) {
        const r = Math.random();
        if (r < 0.25) return 0;
        if (r < 0.5) return 1;
        if (r < 0.8) return 2;
        return 3;
    }
    // Very late: all types
    const r = Math.random();
    if (r < 0.15) return 0;
    if (r < 0.35) return 1;
    if (r < 0.65) return 2;
    return 3;
}

// ===== Enemy Tank (AI) =====
class EnemyTank extends Tank {
    constructor(x, y, typeIndex) {
        const t = ENEMY_TYPES[typeIndex || 0];
        super(x, y, Math.floor(Math.random() * 4), true, t.color);

        this.enemyType = t;
        this.speed = t.speed;
        this.maxHp = t.hp;
        this.hp = t.hp;
        this.score = t.score;
        this.fireInterval = t.fireInterval;
        this.dirChangeTimer = 0;
        this.dirChangeInterval = 40 + Math.floor(Math.random() * 40);
        this.fireTimer = 0;
    }

    update(gameMap, bulletManager, player, enemies) {
        super.update(gameMap);

        if (!this.alive) return;

        // Direction change timer
        this.dirChangeTimer++;
        if (this.dirChangeTimer >= this.dirChangeInterval) {
            this.dirChangeTimer = 0;
            this.dirChangeInterval = 40 + Math.floor(Math.random() * 60);

            // Smart-ish AI: occasionally move toward player
            if (Math.random() < 0.3 && player && player.alive) {
                const dx = player.getCenterX() - this.getCenterX();
                const dy = player.getCenterY() - this.getCenterY();
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.moveDir = dx > 0 ? 1 : 3;
                } else {
                    this.moveDir = dy > 0 ? 2 : 0;
                }
            } else {
                this.moveDir = Math.floor(Math.random() * 4);
            }
        }

        // Move (pass player + other enemies for tank collision)
        const otherTanks = [player, ...enemies];
        this.tryMove(this.moveDir, gameMap, otherTanks);

        // Fire timer
        this.fireTimer++;
        if (this.fireTimer >= this.fireInterval) {
            this.fireTimer = 0;
            this.fireInterval = 60 + Math.floor(Math.random() * 60);
            this.fire(bulletManager);
        }
    }
}

// ===== Player Tank =====
class PlayerTank extends Tank {
    constructor(x, y) {
        super(x, y, 0, false, '#2ecc71');
        this.maxHp = 3;
        this.hp = 3;
    }

    handleInput(keys, gameMap, bulletManager, enemies) {
        if (!this.alive) return;

        let moved = false;

        if (keys['w'] || keys['W']) {
            moved = this.tryMove(0, gameMap, enemies);
        } else if (keys['s'] || keys['S']) {
            moved = this.tryMove(2, gameMap, enemies);
        } else if (keys['a'] || keys['A']) {
            moved = this.tryMove(3, gameMap, enemies);
        } else if (keys['d'] || keys['D']) {
            moved = this.tryMove(1, gameMap, enemies);
        }

        if (keys['j'] || keys['J']) {
            this.fire(bulletManager);
        }
    }

    update(gameMap) {
        super.update(gameMap);
    }
}
