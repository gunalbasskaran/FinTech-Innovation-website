/* =============================================
   game.js — Escape Run: Endless Runner Engine
   ============================================= */

(() => {
  'use strict';

  /* ---------- Canvas & Context ---------- */
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  /* ---------- Responsive Canvas ---------- */
  const BASE_W = 900;
  const BASE_H = 400;
  let scale = 1;

  function resizeCanvas() {
    const wrapper = document.getElementById('gameWrapper');
    const wrapperW = wrapper.clientWidth;
    scale = wrapperW / BASE_W;
    canvas.width = BASE_W;
    canvas.height = BASE_H;
    canvas.style.width = wrapperW + 'px';
    canvas.style.height = (BASE_H * scale) + 'px';
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  /* ---------- Game State ---------- */
  const STATE = {
    IDLE: 0,
    RUNNING: 1,
    PAUSED: 2,
    GAME_OVER: 3
  };

  let gameState = STATE.IDLE;
  let score = 0;
  let coins = 0;
  let lives = 3;
  let baseSpeed = 4;
  let gameSpeed = 4;
  let speedMultiplier = 1;
  let frameCount = 0;
  let groundY = BASE_H - 60;
  let animationId = null;
  let lastTime = 0;
  let accumulator = 0;
  const FIXED_DT = 1000 / 60;

  /* ---------- Colors ---------- */
  const COLORS = {
    sky: '#0d0d18',
    stars: '#ffffff',
    mountain1: '#15122a',
    mountain2: '#1a1530',
    ground: '#1e1a10',
    groundLine: '#2a2418',
    groundAccent: '#332a18',
    player: '#f0a030',
    playerOutline: '#c07810',
    playerSlide: '#d89028',
    obstacle: '#8B4513',
    obstacleDark: '#5C2E0A',
    obstacleSpike: '#A0522D',
    barrier: '#6a3a2a',
    barrierStripe: '#8B4513',
    coin: '#FFD700',
    coinShine: '#FFF8DC',
    particle: '#f0a030',
    text: '#eaeaf0'
  };

  /* ---------- Player ---------- */
  const player = {
    x: 100,
    y: groundY,
    width: 36,
    height: 52,
    velocityY: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    slideDuration: 30,
    jumpForce: -13.5,
    gravity: 0.65,
    normalHeight: 52,
    slideHeight: 26,
    invincible: 0,
    runFrame: 0,
    runTimer: 0
  };

  /* ---------- Arrays ---------- */
  let obstacles = [];
  let coinItems = [];
  let particles = [];
  let backgroundStars = [];
  let mountains1 = [];
  let mountains2 = [];
  let groundLines = [];

  /* ---------- Initialize Background ---------- */
  function initBackground() {
    backgroundStars = [];
    for (let i = 0; i < 60; i++) {
      backgroundStars.push({
        x: Math.random() * BASE_W,
        y: Math.random() * (groundY - 40),
        size: 0.5 + Math.random() * 1.5,
        twinkle: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.5
      });
    }

    mountains1 = [];
    for (let i = 0; i < 8; i++) {
      mountains1.push({
        x: i * 160 - 80,
        width: 120 + Math.random() * 100,
        height: 60 + Math.random() * 80
      });
    }

    mountains2 = [];
    for (let i = 0; i < 10; i++) {
      mountains2.push({
        x: i * 120 - 60,
        width: 80 + Math.random() * 80,
        height: 40 + Math.random() * 50
      });
    }

    groundLines = [];
    for (let i = 0; i < 20; i++) {
      groundLines.push({
        x: i * 60 + Math.random() * 30,
        width: 15 + Math.random() * 40
      });
    }
  }

  /* ---------- Spawning ---------- */
  let spawnTimer = 0;
  let minSpawnInterval = 70;
  let maxSpawnInterval = 130;
  let nextSpawn = 100;

  function spawnObstacle() {
    const type = Math.random();
    let obs;

    if (type < 0.45) {
      // Ground obstacle — crate
      const h = 30 + Math.random() * 25;
      obs = {
        type: 'ground',
        x: BASE_W + 20,
        y: groundY - h,
        width: 28 + Math.random() * 15,
        height: h,
        passed: false
      };
    } else if (type < 0.75) {
      // Ground obstacle — spikes
      obs = {
        type: 'spike',
        x: BASE_W + 20,
        y: groundY - 30,
        width: 35,
        height: 30,
        passed: false
      };
    } else {
      // Overhead barrier
      obs = {
        type: 'barrier',
        x: BASE_W + 20,
        y: groundY - player.normalHeight - 20,
        width: 70 + Math.random() * 40,
        height: 22,
        passed: false
      };
    }

    obstacles.push(obs);

    // Optionally spawn a coin near the obstacle
    if (Math.random() < 0.6) {
      const coinOffsetX = 20 + Math.random() * 60;
      let coinY;
      if (obs.type === 'barrier') {
        coinY = groundY - 10; // Coin on ground near barrier (safe to grab while sliding)
      } else {
        coinY = groundY - 70 - Math.random() * 40; // Coin in air (grab while jumping)
      }
      coinItems.push({
        x: obs.x + coinOffsetX,
        y: coinY,
        size: 10,
        collected: false,
        bobOffset: Math.random() * Math.PI * 2
      });
    }
  }

  /* ---------- Particles ---------- */
  function emitParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 1) * 4,
        life: 20 + Math.random() * 20,
        maxLife: 40,
        size: 2 + Math.random() * 3,
        color: color || COLORS.particle
      });
    }
  }

  /* ---------- Collision Detection ---------- */
  function checkCollision(a, b) {
    const padding = 4;
    return (
      a.x + padding < b.x + b.width - padding &&
      a.x + a.width - padding > b.x + padding &&
      a.y + padding < b.y + b.height - padding &&
      a.y + a.height - padding > b.y + padding
    );
  }

  /* ---------- Drawing Functions ---------- */
  function drawBackground() {
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#050510');
    skyGrad.addColorStop(0.5, '#0d0d20');
    skyGrad.addColorStop(1, '#1a1530');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, BASE_W, groundY);

    // Stars
    backgroundStars.forEach(star => {
      const alpha = 0.3 + Math.sin(star.twinkle + frameCount * 0.02) * 0.3;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Far mountains
    ctx.fillStyle = COLORS.mountain1;
    mountains1.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.x, groundY);
      ctx.lineTo(m.x + m.width / 2, groundY - m.height);
      ctx.lineTo(m.x + m.width, groundY);
      ctx.closePath();
      ctx.fill();
    });

    // Near mountains
    ctx.fillStyle = COLORS.mountain2;
    mountains2.forEach(m => {
      ctx.beginPath();
      ctx.moveTo(m.x, groundY);
      ctx.lineTo(m.x + m.width / 2, groundY - m.height);
      ctx.lineTo(m.x + m.width, groundY);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawGround() {
    // Main ground
    const gGrad = ctx.createLinearGradient(0, groundY, 0, BASE_H);
    gGrad.addColorStop(0, COLORS.groundAccent);
    gGrad.addColorStop(0.3, COLORS.ground);
    gGrad.addColorStop(1, '#0a0808');
    ctx.fillStyle = gGrad;
    ctx.fillRect(0, groundY, BASE_W, BASE_H - groundY);

    // Ground top line
    ctx.strokeStyle = COLORS.groundLine;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(BASE_W, groundY);
    ctx.stroke();

    // Ground texture lines
    ctx.strokeStyle = 'rgba(60,50,30,0.3)';
    ctx.lineWidth = 1;
    groundLines.forEach(gl => {
      ctx.beginPath();
      ctx.moveTo(gl.x, groundY + 15);
      ctx.lineTo(gl.x + gl.width, groundY + 15);
      ctx.stroke();
    });
  }

  function drawPlayer() {
    const p = player;
    const currentH = p.isSliding ? p.slideHeight : p.normalHeight;
    const drawY = p.isSliding ? groundY - p.slideHeight : p.y - currentH;

    // Invincibility flash
    if (p.invincible > 0 && Math.floor(p.invincible / 3) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    ctx.save();

    if (p.isSliding) {
      // Sliding pose — horizontal body
      // Body
      ctx.fillStyle = COLORS.player;
      roundRect(ctx, p.x - 5, drawY + 4, p.width + 10, currentH - 4, 6);
      ctx.fill();

      // Head
      ctx.fillStyle = COLORS.playerOutline;
      ctx.beginPath();
      ctx.arc(p.x + p.width + 2, drawY + currentH / 2, 10, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x + p.width + 5, drawY + currentH / 2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(p.x + p.width + 6, drawY + currentH / 2 - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();

    } else {
      // Running pose
      const bobY = Math.sin(p.runFrame * 0.3) * 2;

      // Body
      ctx.fillStyle = COLORS.player;
      roundRect(ctx, p.x, drawY + bobY + 14, p.width, currentH - 20, 5);
      ctx.fill();

      // Head
      ctx.fillStyle = COLORS.playerOutline;
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2, drawY + bobY + 12, 13, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2 + 4, drawY + bobY + 10, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(p.x + p.width / 2 + 5, drawY + bobY + 10, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Legs (animated)
      ctx.strokeStyle = COLORS.playerOutline;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      const legAngle = Math.sin(p.runFrame * 0.3) * 0.4;

      // Left leg
      ctx.beginPath();
      ctx.moveTo(p.x + 10, drawY + currentH - 6 + bobY);
      ctx.lineTo(p.x + 10 - Math.sin(legAngle) * 12, drawY + currentH + bobY);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(p.x + p.width - 10, drawY + currentH - 6 + bobY);
      ctx.lineTo(p.x + p.width - 10 + Math.sin(legAngle) * 12, drawY + currentH + bobY);
      ctx.stroke();

      // Arms
      const armAngle = Math.sin(p.runFrame * 0.3) * 0.5;
      ctx.lineWidth = 3;

      // Left arm
      ctx.beginPath();
      ctx.moveTo(p.x + 4, drawY + bobY + 22);
      ctx.lineTo(p.x - 6 + Math.sin(armAngle) * 8, drawY + bobY + 35);
      ctx.stroke();

      // Right arm
      ctx.beginPath();
      ctx.moveTo(p.x + p.width - 4, drawY + bobY + 22);
      ctx.lineTo(p.x + p.width + 6 - Math.sin(armAngle) * 8, drawY + bobY + 35);
      ctx.stroke();
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    // Dust particles when running on ground
    if (!p.isJumping && !p.isSliding && frameCount % 4 === 0) {
      emitParticles(p.x, groundY, 1, 'rgba(160,140,100,0.5)');
    }
  }

  function drawObstacles() {
    obstacles.forEach(obs => {
      if (obs.type === 'ground') {
        // Wooden crate
        ctx.fillStyle = COLORS.obstacle;
        roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 3);
        ctx.fill();

        ctx.strokeStyle = COLORS.obstacleDark;
        ctx.lineWidth = 1.5;
        roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 3);
        ctx.stroke();

        // Cross lines (crate detail)
        ctx.strokeStyle = COLORS.obstacleDark;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(obs.x + 3, obs.y + 3);
        ctx.lineTo(obs.x + obs.width - 3, obs.y + obs.height - 3);
        ctx.moveTo(obs.x + obs.width - 3, obs.y + 3);
        ctx.lineTo(obs.x + 3, obs.y + obs.height - 3);
        ctx.stroke();

      } else if (obs.type === 'spike') {
        // Spikes
        ctx.fillStyle = COLORS.obstacleSpike;
        const spikeCount = 3;
        const spikeW = obs.width / spikeCount;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(obs.x + i * spikeW, obs.y + obs.height);
          ctx.lineTo(obs.x + i * spikeW + spikeW / 2, obs.y);
          ctx.lineTo(obs.x + (i + 1) * spikeW, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = COLORS.obstacleDark;
        ctx.lineWidth = 1;
        for (let i = 0; i < spikeCount; i++) {
          ctx.beginPath();
          ctx.moveTo(obs.x + i * spikeW, obs.y + obs.height);
          ctx.lineTo(obs.x + i * spikeW + spikeW / 2, obs.y);
          ctx.lineTo(obs.x + (i + 1) * spikeW, obs.y + obs.height);
          ctx.closePath();
          ctx.stroke();
        }

      } else if (obs.type === 'barrier') {
        // Overhead barrier
        ctx.fillStyle = COLORS.barrier;
        roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 3);
        ctx.fill();

        // Warning stripes
        ctx.save();
        ctx.beginPath();
        roundRect(ctx, obs.x, obs.y, obs.width, obs.height, 3);
        ctx.clip();
        ctx.fillStyle = COLORS.barrierStripe;
        for (let i = 0; i < obs.width + obs.height; i += 12) {
          ctx.beginPath();
          ctx.moveTo(obs.x + i, obs.y);
          ctx.lineTo(obs.x + i + 6, obs.y);
          ctx.lineTo(obs.x + i - obs.height + 6, obs.y + obs.height);
          ctx.lineTo(obs.x + i - obs.height, obs.y + obs.height);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Support pillars
        ctx.fillStyle = COLORS.barrier;
        ctx.fillRect(obs.x + 2, obs.y + obs.height, 5, groundY - obs.y - obs.height);
        ctx.fillRect(obs.x + obs.width - 7, obs.y + obs.height, 5, groundY - obs.y - obs.height);
      }
    });
  }

  function drawCoins() {
    coinItems.forEach(c => {
      if (c.collected) return;

      const bob = Math.sin(frameCount * 0.08 + c.bobOffset) * 4;

      // Glow
      ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, c.size + 6, 0, Math.PI * 2);
      ctx.fill();

      // Coin body
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(c.x, c.y + bob, c.size, 0, Math.PI * 2);
      ctx.fill();

      // Shine
      ctx.fillStyle = COLORS.coinShine;
      ctx.beginPath();
      ctx.arc(c.x - 2, c.y + bob - 2, c.size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Dollar sign
      ctx.fillStyle = '#B8860B';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', c.x, c.y + bob + 1);
    });
  }

  function drawParticles() {
    particles.forEach(p => {
      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  // Utility: rounded rect
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /* ---------- Update Functions ---------- */
  function updatePlayer() {
    const p = player;

    // Gravity
    if (p.isJumping) {
      p.velocityY += p.gravity;
      p.y += p.velocityY;

      if (p.y >= groundY) {
        p.y = groundY;
        p.velocityY = 0;
        p.isJumping = false;
      }
    }

    // Slide timer
    if (p.isSliding) {
      p.slideTimer--;
      if (p.slideTimer <= 0) {
        p.isSliding = false;
        p.height = p.normalHeight;
      }
    }

    // Run animation
    p.runTimer++;
    if (p.runTimer >= 3) {
      p.runTimer = 0;
      p.runFrame++;
    }

    // Invincibility countdown
    if (p.invincible > 0) p.invincible--;
  }

  function updateObstacles() {
    // Move obstacles
    obstacles.forEach(obs => {
      obs.x -= gameSpeed;
    });

    // Remove offscreen
    obstacles = obstacles.filter(obs => obs.x + obs.width > -50);

    // Check collisions
    const p = player;
    const pBox = {
      x: p.x,
      y: p.isSliding ? groundY - p.slideHeight : p.y - (p.isSliding ? p.slideHeight : p.normalHeight),
      width: p.width,
      height: p.isSliding ? p.slideHeight : p.normalHeight
    };

    obstacles.forEach(obs => {
      if (obs.passed) return;

      if (checkCollision(pBox, obs)) {
        if (p.invincible <= 0) {
          lives--;
          updateHUD();
          emitParticles(p.x + p.width / 2, pBox.y + pBox.height / 2, 15, '#ff4444');

          if (lives <= 0) {
            gameOver();
            return;
          }

          p.invincible = 90; // ~1.5 sec invincibility
          obs.passed = true;
        }
      }

      // Score for passing obstacles
      if (!obs.passed && obs.x + obs.width < p.x) {
        obs.passed = true;
        score += 10;
      }
    });
  }

  function updateCoins() {
    const p = player;
    const pBox = {
      x: p.x,
      y: p.isSliding ? groundY - p.slideHeight : p.y - p.normalHeight,
      width: p.isSliding ? p.width + 10 : p.width,
      height: p.isSliding ? p.slideHeight : p.normalHeight
    };

    coinItems.forEach(c => {
      if (c.collected) return;
      c.x -= gameSpeed;

      const dist = Math.hypot(c.x - (pBox.x + pBox.width / 2), c.y - (pBox.y + pBox.height / 2));
      if (dist < c.size + 20) {
        c.collected = true;
        coins++;
        score += 25;
        emitParticles(c.x, c.y, 8, COLORS.coin);
        updateHUD();
      }
    });

    coinItems = coinItems.filter(c => !c.collected && c.x > -30);
  }

  function updateParticles() {
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.life--;
    });
    particles = particles.filter(p => p.life > 0);
  }

  function updateBackground() {
    // Parallax stars
    backgroundStars.forEach(star => {
      star.x -= star.speed * (gameSpeed / baseSpeed) * 0.3;
      if (star.x < -5) star.x = BASE_W + 5;
    });

    // Far mountains
    mountains1.forEach(m => {
      m.x -= gameSpeed * 0.15;
      if (m.x + m.width < -20) m.x = BASE_W + Math.random() * 100;
    });

    // Near mountains
    mountains2.forEach(m => {
      m.x -= gameSpeed * 0.35;
      if (m.x + m.width < -20) m.x = BASE_W + Math.random() * 80;
    });

    // Ground lines
    groundLines.forEach(gl => {
      gl.x -= gameSpeed;
      if (gl.x + gl.width < 0) {
        gl.x = BASE_W + Math.random() * 30;
        gl.width = 15 + Math.random() * 40;
      }
    });
  }

  function updateSpeed() {
    // Progressive speed increase
    if (frameCount % 300 === 0 && frameCount > 0) {
      speedMultiplier += 0.08;
      if (speedMultiplier > 3) speedMultiplier = 3;
      gameSpeed = baseSpeed * speedMultiplier;
    }
  }

  function updateSpawner() {
    spawnTimer++;
    if (spawnTimer >= nextSpawn) {
      spawnTimer = 0;
      const range = maxSpawnInterval - minSpawnInterval;
      const speedFactor = Math.max(0.4, 1 - (speedMultiplier - 1) * 0.3);
      nextSpawn = minSpawnInterval * speedFactor + Math.random() * range * speedFactor;
      spawnObstacle();
    }
  }

  /* ---------- HUD ---------- */
  function updateHUD() {
    const hudScore = document.getElementById('hudScore');
    const hudCoins = document.getElementById('hudCoins');
    const hudLives = document.getElementById('hudLives');
    const hudSpeed = document.getElementById('hudSpeed');

    if (hudScore) hudScore.textContent = score;
    if (hudCoins) hudCoins.textContent = coins;
    if (hudLives) hudLives.textContent = lives;
    if (hudSpeed) hudSpeed.textContent = speedMultiplier.toFixed(1) + 'x';
  }

  /* ---------- Game Loop ---------- */
  function gameLoop(timestamp) {
    if (gameState !== STATE.RUNNING) return;

    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    accumulator += delta;

    // Fixed timestep updates
    while (accumulator >= FIXED_DT) {
      frameCount++;
      score++;

      updatePlayer();
      updateObstacles();
      updateCoins();
      updateParticles();
      updateBackground();
      updateSpeed();
      updateSpawner();

      if (frameCount % 10 === 0) updateHUD();

      accumulator -= FIXED_DT;
    }

    // Render
    draw();

    animationId = requestAnimationFrame(gameLoop);
  }

  function draw() {
    ctx.clearRect(0, 0, BASE_W, BASE_H);

    drawBackground();
    drawGround();
    drawObstacles();
    drawCoins();
    drawPlayer();
    drawParticles();

    // Paused overlay (drawn on canvas)
    if (gameState === STATE.PAUSED) {
      ctx.fillStyle = 'rgba(10,10,15,0.7)';
      ctx.fillRect(0, 0, BASE_W, BASE_H);
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 36px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', BASE_W / 2, BASE_H / 2 - 15);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#9a9ab0';
      ctx.fillText('Press P to resume', BASE_W / 2, BASE_H / 2 + 20);
    }
  }

  /* ---------- Game State Management ---------- */
  function resetGame() {
    score = 0;
    coins = 0;
    lives = 3;
    gameSpeed = baseSpeed;
    speedMultiplier = 1;
    frameCount = 0;
    spawnTimer = 0;
    nextSpawn = 100;
    lastTime = 0;
    accumulator = 0;

    player.y = groundY;
    player.velocityY = 0;
    player.isJumping = false;
    player.isSliding = false;
    player.slideTimer = 0;
    player.invincible = 0;
    player.runFrame = 0;
    player.runTimer = 0;
    player.height = player.normalHeight;

    obstacles = [];
    coinItems = [];
    particles = [];

    initBackground();
    updateHUD();
  }

  window.startGame = function () {
    resetGame();
    gameState = STATE.RUNNING;
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    animationId = requestAnimationFrame(gameLoop);
  };

  window.restartGame = function () {
    resetGame();
    gameState = STATE.RUNNING;
    document.getElementById('gameOverOverlay').classList.add('hidden');
    animationId = requestAnimationFrame(gameLoop);
  };

  function gameOver() {
    gameState = STATE.GAME_OVER;
    if (animationId) cancelAnimationFrame(animationId);

    document.getElementById('finalScore').textContent = score;

    let msg = 'Great effort! Keep practicing.';
    if (score > 5000) msg = 'Legendary run! You are a true escape artist!';
    else if (score > 2000) msg = 'Incredible! You survived the ancient ruins!';
    else if (score > 1000) msg = 'Amazing run! The temple fears you!';
    else if (score > 500) msg = 'Great run! You\'re getting the hang of it!';

    document.getElementById('gameOverMsg').textContent = msg;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
  }

  function togglePause() {
    if (gameState === STATE.RUNNING) {
      gameState = STATE.PAUSED;
      if (animationId) cancelAnimationFrame(animationId);
      draw();
    } else if (gameState === STATE.PAUSED) {
      gameState = STATE.RUNNING;
      lastTime = 0;
      accumulator = 0;
      animationId = requestAnimationFrame(gameLoop);
    }
  }

  /* ---------- Input Handling ---------- */
  function jump() {
    if (gameState !== STATE.RUNNING) return;
    if (!player.isJumping && !player.isSliding) {
      player.isJumping = true;
      player.velocityY = player.jumpForce;
      emitParticles(player.x + player.width / 2, groundY, 5, 'rgba(160,140,100,0.6)');
    }
  }

  function slide() {
    if (gameState !== STATE.RUNNING) return;
    if (!player.isJumping && !player.isSliding) {
      player.isSliding = true;
      player.slideTimer = player.slideDuration;
      player.height = player.slideHeight;
    }
  }

  // Keyboard
  document.addEventListener('keydown', (e) => {
    switch (e.code) {
      case 'Space':
      case 'ArrowUp':
      case 'KeyW':
        e.preventDefault();
        if (gameState === STATE.IDLE) {
          window.startGame();
        } else {
          jump();
        }
        break;
      case 'ArrowDown':
      case 'KeyS':
        e.preventDefault();
        slide();
        break;
      case 'KeyP':
      case 'Escape':
        e.preventDefault();
        togglePause();
        break;
    }
  });

  // Canvas click to start/jump
  canvas.addEventListener('click', () => {
    if (gameState === STATE.IDLE) {
      window.startGame();
    } else if (gameState === STATE.RUNNING) {
      jump();
    }
  });

  // Mobile controls
  const btnJump = document.getElementById('btnJump');
  const btnSlide = document.getElementById('btnSlide');
  const btnPause = document.getElementById('btnPause');

  if (btnJump) {
    btnJump.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (gameState === STATE.IDLE) window.startGame();
      else jump();
    });
  }

  if (btnSlide) {
    btnSlide.addEventListener('touchstart', (e) => {
      e.preventDefault();
      slide();
    });
  }

  if (btnPause) {
    btnPause.addEventListener('touchstart', (e) => {
      e.preventDefault();
      togglePause();
    });
  }

  // Touch swipe on canvas
  let touchStartY = 0;
  canvas.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    if (gameState === STATE.IDLE) window.startGame();
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    if (diff > 30) jump();
    else if (diff < -30) slide();
    else if (gameState === STATE.RUNNING) jump();
  }, { passive: true });

  /* ---------- Initial Render ---------- */
  initBackground();
  draw();
  updateHUD();

})();
