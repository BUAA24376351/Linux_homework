// ===== Game State =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let gameMap;
let player;
let enemies;
let bulletManager;
let gameRunning = false;
let gameOver = false;
let gameWin = false;
let gamePaused = false;
let kills = 0;
let score = 0;
let totalScore = 0;
let gameStartTime = 0;
let keys = {};
let animationId = null;
let frameCount = 0;

// Level management
let currentLevel = 1;
let currentEnemyTotal = 4;
let enemiesSpawned = 0;
let unlockedLevel = parseInt(localStorage.getItem('tankUnlockedLevel')) || 1;

// Mode: 'campaign' or 'endless'
let gameMode = 'campaign';
let endlessWave = 0;
let endlessSpawnInterval = 180; // frames between spawns, decreases over time

// Speed control — internal multiplier
// 0.4 = user's preferred "normal" speed (displayed as 1.00x)
let speedMultiplier = 0.4;
let speedAccumulator = 0;
const SPEED_MIN = 0.1;   // display 0.25x
const SPEED_MAX = 1.2;   // display 3.00x
const SPEED_STEP = 0.1;  // display step 0.25x
const SPEED_NORM = 0.4;  // normalization divisor for display

// ===== Keyboard Input =====
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Pause toggle
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        if (gameRunning && !gameOver && !gameWin) {
            gamePaused = !gamePaused;
        }
    }

    // Speed control (only when game is running)
    if (gameRunning && !gameOver && !gameWin) {
        if (e.key === '[') {
            speedMultiplier = Math.max(SPEED_MIN, speedMultiplier - SPEED_STEP);
            updateUI();
        } else if (e.key === ']') {
            speedMultiplier = Math.min(SPEED_MAX, speedMultiplier + SPEED_STEP);
            updateUI();
        }
    }

    // Prevent page scrolling with WASD/game keys
    if (['w', 'W', 'a', 'A', 's', 'S', 'd', 'D', 'j', 'J', '[', ']'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// ===== Game Functions =====

function startGame(levelNumber) {
    gameMode = 'campaign';
    const level = LEVELS[levelNumber - 1];
    if (!level) return;

    currentLevel = levelNumber;
    currentEnemyTotal = level.enemies;

    document.getElementById('homePage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';

    // Reset game state
    gameMap = new GameMap(level);
    bulletManager = new BulletManager();

    const spawn = level.playerSpawn || DEFAULT_PLAYER_SPAWN;
    player = new PlayerTank(spawn.col * TILE_SIZE + 1, spawn.row * TILE_SIZE + 1);

    enemies = [];
    kills = 0;
    score = 0;
    enemiesSpawned = 0;
    endlessWave = 0;
    endlessSpawnInterval = 180;
    gameOver = false;
    gameWin = false;
    gamePaused = false;
    speedMultiplier = 0.4;
    speedAccumulator = 0;
    gameRunning = true;
    gameStartTime = Date.now();
    frameCount = 0;

    // Spawn first enemy
    spawnNextEnemy();

    updateUI();

    // Start game loop
    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function startEndless() {
    gameMode = 'endless';
    currentLevel = 0;

    document.getElementById('homePage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'flex';

    // Use the special endless arena map
    gameMap = new GameMap({ layout: ENDLESS_MAP });
    gameMap.hasBase = false;
    bulletManager = new BulletManager();

    const spawn = DEFAULT_PLAYER_SPAWN;
    player = new PlayerTank(spawn.col * TILE_SIZE + 1, spawn.row * TILE_SIZE + 1);

    enemies = [];
    kills = 0;
    score = 0;
    enemiesSpawned = 0;
    endlessWave = 0;
    endlessSpawnInterval = 180;
    gameOver = false;
    gameWin = false;
    gamePaused = false;
    speedMultiplier = 0.4;
    speedAccumulator = 0;
    gameRunning = true;
    gameStartTime = Date.now();
    frameCount = 0;

    updateUI();

    if (animationId) cancelAnimationFrame(animationId);
    gameLoop();
}

function startCurrentLevel() {
    startGame(currentLevel);
}

function spawnNextEnemy() {
    if (gameMode === 'campaign' && enemiesSpawned >= currentEnemyTotal) return;

    // Endless mode: max 8 enemies on screen at once
    if (gameMode === 'endless') {
        const aliveCount = enemies.filter(e => e.alive).length;
        if (aliveCount >= 8) return;
    }

    let spawns;
    if (gameMode === 'endless') {
        spawns = DEFAULT_ENEMY_SPAWNS;
    } else {
        const level = LEVELS[currentLevel - 1];
        spawns = level.enemySpawns || DEFAULT_ENEMY_SPAWNS;
    }
    const spawnPoint = spawns[enemiesSpawned % spawns.length];
    let enemy;
    if (gameMode === 'endless') {
        const typeIdx = pickEnemyType(endlessWave);
        enemy = new EnemyTank(spawnPoint.col * TILE_SIZE + 1, spawnPoint.row * TILE_SIZE + 1, typeIdx);
    } else {
        // Campaign mode: use level-based enemy types
        const level = LEVELS[currentLevel - 1];
        const typeIdx = Math.min(2, Math.floor((currentLevel - 1) / 10));
        enemy = new EnemyTank(spawnPoint.col * TILE_SIZE + 1, spawnPoint.row * TILE_SIZE + 1, typeIdx);
    }

    enemies.push(enemy);
    enemiesSpawned++;
}

function restartGame() {
    document.getElementById('overlay').style.display = 'none';
    if (gameMode === 'endless') {
        startEndless();
    } else {
        startGame(currentLevel);
    }
}

function nextLevel() {
    document.getElementById('overlay').style.display = 'none';
    if (currentLevel < 30) {
        // Unlock next level
        if (currentLevel + 1 > unlockedLevel) {
            unlockedLevel = currentLevel + 1;
            localStorage.setItem('tankUnlockedLevel', unlockedLevel.toString());
        }
        startGame(currentLevel + 1);
    } else {
        // Beat the game!
        backToHome();
    }
}

function backToHome() {
    gameRunning = false;
    if (animationId) cancelAnimationFrame(animationId);
    document.getElementById('gamePage').style.display = 'none';
    document.getElementById('homePage').style.display = 'flex';
    document.getElementById('overlay').style.display = 'none';
}

function updateUI() {
    document.getElementById('hpDisplay').textContent = player ? player.hp : 0;
    document.getElementById('scoreDisplay').textContent = score;

    if (gameMode === 'endless') {
        document.getElementById('killDisplay').textContent = `💀 ${kills}`;
    } else {
        document.getElementById('killDisplay').textContent = `${kills}/${currentEnemyTotal}`;
    }

    // Show mode + speed in the header
    let infoLabel = document.getElementById('infoDisplay');
    if (!infoLabel) {
        infoLabel = document.createElement('span');
        infoLabel.id = 'infoDisplay';
        document.querySelector('.game-info').appendChild(infoLabel);
    }
    const displaySpeed = speedMultiplier / SPEED_NORM;
    if (gamePaused) {
        infoLabel.innerHTML = `⏸ 暂停`;
        infoLabel.style.color = '#ffd700';
    } else if (gameMode === 'endless') {
        infoLabel.innerHTML = `♾️ 无尽模式 ⚡ ${displaySpeed.toFixed(2)}x`;
        infoLabel.style.color = '#ff6b35';
    } else {
        infoLabel.innerHTML = `第 ${currentLevel}/30 关 ⚡ ${displaySpeed.toFixed(2)}x`;
        infoLabel.style.color = displaySpeed > 1 ? '#ff6b35' : displaySpeed < 1 ? '#4a9eff' : '#aaa';
    }
}

// ===== Game Loop =====
function gameLoop() {
    if (!gameRunning) return;

    frameCount++;

    // Spawn enemies
    if (gameMode === 'endless') {
        // Endless mode: continuous spawning with increasing difficulty
        if (frameCount % endlessSpawnInterval === 0) {
            spawnNextEnemy();
            endlessWave++;
            // Speed up spawning every ~5 waves
            if (endlessWave % 5 === 0 && endlessSpawnInterval > 30) {
                endlessSpawnInterval = Math.max(30, endlessSpawnInterval - 10);
            }
        }
    } else {
        // Campaign mode: limited enemies
        if (enemiesSpawned < currentEnemyTotal && frameCount % 180 === 0) {
            spawnNextEnemy();
        }
    }

    // Update (with speed multiplier via frame accumulator)
    if (!gameOver && !gameWin && !gamePaused) {
        speedAccumulator += speedMultiplier;
        while (speedAccumulator >= 1) {
            update();
            speedAccumulator -= 1;
        }
    }

    // Draw
    draw();

    // Draw pause overlay
    if (gamePaused) {
        drawPauseOverlay();
    }

    updateUI();

    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    if (gameOver || gameWin) return;

    // Player input and update
    player.handleInput(keys, gameMap, bulletManager, enemies);
    player.update(gameMap);

    // Update enemies
    enemies.forEach(e => e.update(gameMap, bulletManager, player, enemies));

    // Count alive enemies BEFORE bullet processing
    const beforeAlive = enemies.filter(e => e.alive);

    // Update bullets (may set enemies' alive = false)
    bulletManager.update(gameMap, player, enemies);

    // Calculate score from killed enemies
    let scoreThisFrame = 0;
    for (const e of beforeAlive) {
        if (!e.alive) {
            scoreThisFrame += e.score || 100;
        }
    }

    // Remove dead enemies
    enemies = enemies.filter(e => e.alive);

    // Count kills and add score
    const killedCount = beforeAlive.length - enemies.length;
    if (killedCount > 0) {
        kills += killedCount;
        score += scoreThisFrame;
        Sound.playExplosion();
    }

    // Check win condition (campaign mode only)
    if (gameMode === 'campaign') {
        const aliveEnemies = enemies.filter(e => e.alive).length;
        if (enemiesSpawned >= currentEnemyTotal && aliveEnemies === 0 && !gameWin) {
            gameWin = true;
            gameRunning = false;
            totalScore += score;
            const timeBonus = Math.max(0, Math.floor((300 - (Date.now() - gameStartTime) / 1000) * 10));
            score += timeBonus;
            showGameOver(true, timeBonus);
        }
    }

    // Check player death
    if (!player.alive && !gameOver) {
        gameOver = true;
        gameRunning = false;
        showGameOver(false, 0);
        if (gameMode === 'endless') {
            submitScoreToServer();
        }
    }

    // Check base destroyed (campaign mode only)
    if (gameMode !== 'endless' && !gameMap.baseAlive && !gameOver) {
        gameOver = true;
        gameRunning = false;
        showGameOver(false, 0);
        submitScoreToServer();
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw ground grid
    drawGroundGrid();

    // Draw map elements (non-grass first)
    drawMapElements(ctx, false);

    // Draw bullets
    bulletManager.draw(ctx);

    // Draw tanks (enemies first, then player on top)
    enemies.forEach(e => e.draw(ctx));
    if (player) player.draw(ctx);

    // Draw grass on top (grass covers everything)
    drawMapElements(ctx, true);
}

function drawPauseOverlay() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸ 暂停', CANVAS_W / 2, CANVAS_H / 2 - 20);

    ctx.fillStyle = '#ccc';
    ctx.font = '20px sans-serif';
    ctx.fillText('按 P 或 ESC 继续', CANVAS_W / 2, CANVAS_H / 2 + 40);

    ctx.fillStyle = '#888';
    ctx.font = '16px sans-serif';
    const displaySpeed = speedMultiplier / SPEED_NORM;
    ctx.fillText(`速度: ${displaySpeed.toFixed(2)}x  [ 减速  ] 加速`, CANVAS_W / 2, CANVAS_H / 2 + 80);
}

function drawGroundGrid() {
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * TILE_SIZE);
        ctx.lineTo(CANVAS_W, r * TILE_SIZE);
        ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * TILE_SIZE, 0);
        ctx.lineTo(c * TILE_SIZE, CANVAS_H);
        ctx.stroke();
    }
}

function drawMapElements(ctx, grassOnly) {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = gameMap.grid[row][col];
            const x = col * TILE_SIZE;
            const y = row * TILE_SIZE;

            if (grassOnly) {
                if (tile === TILE.GRASS) {
                    drawGrassTile(ctx, x, y);
                }
            } else {
                switch (tile) {
                    case TILE.BRICK:
                        drawBrickTile(ctx, x, y);
                        break;
                    case TILE.STEEL:
                        drawSteelTile(ctx, x, y);
                        break;
                    case TILE.WATER:
                        drawWaterTile(ctx, x, y);
                        break;
                }
            }
        }
    }

    // Draw base if alive (only in campaign mode)
    if (gameMap && gameMap.baseAlive && gameMode !== 'endless') {
        drawBaseFlag(ctx);
    }
}

function drawBrickTile(ctx, x, y) {
    ctx.fillStyle = '#b5651d';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // Brick pattern
    ctx.strokeStyle = '#c97a35';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    const half = TILE_SIZE / 2;
    ctx.beginPath();
    ctx.moveTo(x, y + half);
    ctx.lineTo(x + TILE_SIZE, y + half);
    ctx.moveTo(x + half, y);
    ctx.lineTo(x + half, y + half);
    ctx.moveTo(x, y + half);
    ctx.lineTo(x, y + TILE_SIZE);
    ctx.moveTo(x + half, y + half);
    ctx.lineTo(x + half, y + TILE_SIZE);
    ctx.stroke();
}

function drawSteelTile(ctx, x, y) {
    ctx.fillStyle = '#888';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

    // Rivets
    ctx.fillStyle = '#999';
    [[8,8],[24,8],[8,24],[24,24]].forEach(([ox, oy]) => {
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawWaterTile(ctx, x, y) {
    ctx.fillStyle = '#1a5276';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    ctx.strokeStyle = '#2e86c1';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x, y + 8 + i * 10);
        ctx.quadraticCurveTo(x + 8, y + 4 + i * 10, x + 16, y + 8 + i * 10);
        ctx.quadraticCurveTo(x + 24, y + 12 + i * 10, x + 32, y + 8 + i * 10);
        ctx.stroke();
    }
}

let grassSeed = null;
function drawGrassTile(ctx, x, y) {
    if (!grassSeed) {
        grassSeed = {};
    }
    const key = `${x},${y}`;
    if (!grassSeed[key]) {
        grassSeed[key] = Array.from({length: 5}, () => ({
            x: 4 + Math.random() * 24,
            y: 4 + Math.random() * 24
        }));
    }

    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    ctx.fillStyle = '#2d6a2d';
    grassSeed[key].forEach(p => {
        ctx.fillRect(x + p.x, y + p.y, 4, 6);
    });
}

function drawBaseFlag(ctx) {
    const x = BASE.x;
    const y = BASE.y;

    // Base brick platform
    ctx.fillStyle = '#666';
    ctx.fillRect(x, y + BASE.height - 8, BASE.width, 8);
    ctx.fillStyle = '#555';
    ctx.fillRect(x, y + BASE.height - 4, BASE.width, 4);

    // Flag pole
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + BASE.height - 8);
    ctx.lineTo(x + 10, y + 4);
    ctx.stroke();

    // Flag triangle
    const gradient = ctx.createLinearGradient(x + 10, y + 4, x + BASE.width - 6, y + BASE.height / 3 + 10);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 4);
    ctx.lineTo(x + BASE.width - 6, y + BASE.height / 3);
    ctx.lineTo(x + 10, y + BASE.height / 3 + 10);
    ctx.closePath();
    ctx.fill();

    // Star on flag
    ctx.fillStyle = '#ffd700';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', x + BASE.width / 2 - 4, y + BASE.height / 3 + 8);
}

// ===== Game Over =====
function showGameOver(won, timeBonus) {
    const overlay = document.getElementById('overlay');
    const title = document.getElementById('overlayTitle');
    const message = document.getElementById('overlayMessage');
    const nextBtn = document.getElementById('nextLevelBtn');

    if (gameMode === 'endless') {
        Sound.playGameOver();
        title.textContent = '💀 游戏结束';
        message.innerHTML = `无尽模式<br>击杀: ${kills} | 波次: ${endlessWave}<br>最终得分: <strong>${score}</strong>`;
        if (nextBtn) nextBtn.style.display = 'none';
        overlay.style.display = 'flex';
        submitScoreToServer();
        return;
    }

    const levelName = LEVELS[currentLevel - 1] ? LEVELS[currentLevel - 1].name : '';

    if (won) {
        Sound.playWin();
        if (currentLevel >= 30) {
            title.textContent = '🎉 通关！';
            message.innerHTML = `恭喜通过全部 30 关！<br>本关得分: ${score} | 击杀: ${kills}<br>全部通关！你是坦克大师！`;
            if (nextBtn) nextBtn.style.display = 'none';
        } else {
            title.textContent = `🎉 第 ${currentLevel} 关 胜利！`;
            message.innerHTML = `${levelName}<br>击杀: ${kills} | 时间奖励: +${timeBonus}<br>本关得分: <strong>${score}</strong>`;
            if (nextBtn) {
                nextBtn.style.display = 'inline-block';
                nextBtn.textContent = `▶ 下一关 (第 ${currentLevel + 1} 关)`;
            }
        }
    } else {
        Sound.playGameOver();
        let reason = '基地被摧毁！';
        if (!player.alive && !gameMap.baseAlive) {
            reason = '你被击毁，基地也被摧毁！';
        } else if (!player.alive) {
            reason = '你被击毁了！';
        }
        title.textContent = '💀 失败';
        message.innerHTML = `第 ${currentLevel} 关 - ${levelName}<br>${reason}<br>击杀: ${kills} | 得分: <strong>${score}</strong>`;
        if (nextBtn) nextBtn.style.display = 'none';
    }

    overlay.style.display = 'flex';
}

function submitScoreToServer() {
    // Show name input after a short delay
    setTimeout(() => {
        showNameInput();
    }, 500);
}

function showNameInput() {
    document.getElementById('nameModalScore').innerHTML =
        `你的得分: <strong>${score}</strong> | 击杀: ${kills}`;
    document.getElementById('playerNameInput').value = '';
    document.getElementById('nameModal').style.display = 'flex';
}

function submitScore() {
    const name = document.getElementById('playerNameInput').value.trim() || '无名英雄';
    document.getElementById('nameModal').style.display = 'none';

    fetch('/api/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            player_name: name,
            score: score,
            kill_count: kills,
            play_time: Math.floor((Date.now() - gameStartTime) / 1000)
        })
    }).catch(err => console.log('Score submission error:', err));
}

function skipScore() {
    document.getElementById('nameModal').style.display = 'none';
}

// ===== UI Functions =====

function showLevelSelect() {
    const modal = document.getElementById('levelModal');
    const grid = document.getElementById('levelGrid');
    grid.innerHTML = '';

    for (let i = 1; i <= 30; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        const level = LEVELS[i - 1];

        if (i <= unlockedLevel) {
            btn.classList.add('level-unlocked');
            if (i === unlockedLevel) btn.classList.add('level-current');
            btn.onclick = () => { closeLevelSelect(); startGame(i); };
        } else {
            btn.classList.add('level-locked');
            btn.disabled = true;
        }

        btn.innerHTML = `<span class="level-num">${i}</span><span class="level-name">${level ? level.name : ''}</span>`;
        grid.appendChild(btn);
    }

    modal.style.display = 'flex';
}

function closeLevelSelect() {
    document.getElementById('levelModal').style.display = 'none';
}

function showRanking() {
    const modal = document.getElementById('rankingModal');
    const list = document.getElementById('rankingList');
    list.innerHTML = '<tr><td colspan="4">加载中...</td></tr>';
    modal.style.display = 'flex';

    fetch('/api/ranking')
        .then(r => r.json())
        .then(data => {
            list.innerHTML = '';
            if (data.length === 0) {
                list.innerHTML = '<tr><td colspan="4">暂无记录</td></tr>';
                return;
            }
            data.forEach((r, i) => {
                const tr = document.createElement('tr');
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}`;
                tr.innerHTML = `<td>${medal}</td><td>${r.name}</td><td>${r.score}</td><td>${r.kills || '-'}</td>`;
                list.appendChild(tr);
            });
        })
        .catch(() => {
            list.innerHTML = '<tr><td colspan="4">无法加载排行榜</td></tr>';
        });
}

function closeRanking() {
    document.getElementById('rankingModal').style.display = 'none';
}

function showAbout() {
    document.getElementById('aboutModal').style.display = 'flex';
}

function closeAbout() {
    document.getElementById('aboutModal').style.display = 'none';
}

function showMCP() {
    document.getElementById('mcpModal').style.display = 'flex';
    document.getElementById('mcpAdvice').innerHTML = '';
    document.getElementById('mcpStatus').textContent = '点击下方按钮获取战术建议';
}

function closeMCP() {
    document.getElementById('mcpModal').style.display = 'none';
}

function getMCPAdvice() {
    const status = document.getElementById('mcpStatus');
    const advice = document.getElementById('mcpAdvice');
    status.textContent = '🤖 AI 指挥官正在分析战场...';
    advice.innerHTML = '';

    const gameState = {
        hp: player ? player.hp : 0,
        enemyCount: enemies.filter(e => e.alive).length,
        totalKills: kills,
        totalScore: score,
        baseAlive: gameMap ? gameMap.baseAlive : true
    };

    fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameState)
    })
    .then(r => r.json())
    .then(data => {
        status.textContent = '✅ AI 指挥官分析完成';
        advice.innerHTML = data.advice || '暂无建议。';
    })
    .catch(() => {
        status.textContent = '❌ 无法连接 AI 指挥官';
        advice.innerHTML = '战术助手暂时无法使用，请稍后再试。';
    });
}

// ===== Close modals on click outside =====
window.onclick = function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
};
