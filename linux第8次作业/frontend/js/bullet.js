// ===== Bullet Class =====
class Bullet {
    constructor(x, y, direction, isEnemy) {
        this.x = x;
        this.y = y;
        this.size = 6;
        this.speed = isEnemy ? 3 : 5;
        this.direction = direction; // 0:up, 1:right, 2:down, 3:left
        this.isEnemy = isEnemy;
        this.active = true;
    }

    move() {
        switch (this.direction) {
            case 0: this.y -= this.speed; break;
            case 1: this.x += this.speed; break;
            case 2: this.y += this.speed; break;
            case 3: this.x -= this.speed; break;
        }

        // Check bounds
        if (this.x < 0 || this.x > CANVAS_W ||
            this.y < 0 || this.y > CANVAS_H) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.fillStyle = this.isEnemy ? '#ff4444' : '#ffd700';
        ctx.shadowColor = this.isEnemy ? '#ff4444' : '#ffd700';
        ctx.shadowBlur = 8;

        // Draw bullet as a filled circle
        ctx.beginPath();
        ctx.arc(
            this.x + this.size / 2,
            this.y + this.size / 2,
            this.size / 2,
            0,
            Math.PI * 2
        );
        ctx.fill();

        // Inner bright core
        ctx.fillStyle = '#fff';
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(
            this.x + this.size / 2,
            this.y + this.size / 2,
            this.size / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            w: this.size,
            h: this.size
        };
    }
}

// ===== Bullet Manager =====
class BulletManager {
    constructor() {
        this.bullets = [];
    }

    fire(x, y, direction, isEnemy) {
        // Player can only have one bullet on screen at a time
        if (!isEnemy) {
            const hasPlayerBullet = this.bullets.some(b => b.active && !b.isEnemy);
            if (hasPlayerBullet) return null;
        }

        const bullet = new Bullet(x, y, direction, isEnemy);
        this.bullets.push(bullet);
        return bullet;
    }

    update(gameMap, player, enemies) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }

            b.move();
            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }

            // Check bullet vs bullet collision
            if (!b.isEnemy) {
                for (let k = this.bullets.length - 1; k >= 0; k--) {
                    const other = this.bullets[k];
                    if (k === i || !other.active || !other.isEnemy) continue;
                    if (rectCollide(b.getRect(), other.getRect())) {
                        b.active = false;
                        other.active = false;
                        this.bullets.splice(Math.max(i, k), 1);
                        this.bullets.splice(Math.min(i, k), 1);
                        // i has shifted, restart from here
                        i = Math.min(i, k);
                        break;
                    }
                }
                if (!b.active) continue;
            }

            // Check wall collision
            if (gameMap.handleBulletCollision(b)) {
                b.active = false;
                this.bullets.splice(i, 1);
                continue;
            }

            // Check base hit
            if (gameMap.checkBaseHit(b)) {
                b.active = false;
                this.bullets.splice(i, 1);
                continue;
            }

            // Check tank collision
            if (b.isEnemy) {
                // Enemy bullet hits player
                if (rectCollide(b.getRect(), player.getRect())) {
                    player.hit();
                    b.active = false;
                    this.bullets.splice(i, 1);
                    continue;
                }
            } else {
                // Player bullet hits enemies
                for (let j = enemies.length - 1; j >= 0; j--) {
                    const e = enemies[j];
                    if (e.alive && rectCollide(b.getRect(), e.getRect())) {
                        e.hit();
                        b.active = false;
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }

    draw(ctx) {
        this.bullets.forEach(b => b.draw(ctx));
    }

    reset() {
        this.bullets = [];
    }
}

// ===== Utility =====
function rectCollide(a, b) {
    return a.x < b.x + b.w &&
           a.x + a.w > b.x &&
           a.y < b.y + b.h &&
           a.y + a.h > b.y;
}
