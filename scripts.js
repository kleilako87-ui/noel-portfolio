/*
  scripts.js
  Handles background animations, page transitions, easter eggs, and UI interactions.
*/

const isRobloxPage = window.location.pathname.toLowerCase().endsWith("roblox.html");

const defaultSettings = {
  particleCount: 90,
  maxVelocity: 0.9,
  repelDistance: 160,
  linkDistance: 110,
  linkWidth: 1.1,
  linkOpacity: 0.22,
  particleSize: 2.2,
  particleGlow: 0.35,
};

const secretSequence = ["n", "o", "e", "l"];
let secretIndex = 0;
let clickCounter = 0;
let lastClickTime = 0;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fadeOutAndNavigate(url) {
  const page = document.getElementById("page");
  if (!page) {
    window.location.href = url;
    return;
  }
  page.classList.add("page-exit");
  setTimeout(() => {
    window.location.href = url;
  }, 460);
}

function fadeInBody() {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
}

function showOverlay(text) {
  const overlay = document.getElementById("loadingOverlay");
  if (!overlay) return;
  const label = overlay.querySelector(".loader__label");
  if (label) label.textContent = text;
  overlay.classList.add("active");
}

function sanitizeMouse(event) {
  if (event.touches && event.touches.length) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  return { x: event.clientX, y: event.clientY };
}

class Particle {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 1.1;
    this.vy = (Math.random() - 0.5) * 1.1;
    this.alpha = 0.6 + Math.random() * 0.3;
  }

  update(bounds, mouse) {
    if (mouse) {
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < defaultSettings.repelDistance) {
        const strength = (defaultSettings.repelDistance - dist) / defaultSettings.repelDistance;
        this.vx += (dx / dist) * strength * 0.25;
        this.vy += (dy / dist) * strength * 0.25;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < -30 || this.x > bounds.width + 30) this.vx *= -1;
    if (this.y < -30 || this.y > bounds.height + 30) this.vy *= -1;

    this.vx = Math.max(Math.min(this.vx, defaultSettings.maxVelocity), -defaultSettings.maxVelocity);
    this.vy = Math.max(Math.min(this.vy, defaultSettings.maxVelocity), -defaultSettings.maxVelocity);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = defaultSettings.particleGlow * 16;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class ParticleSystem {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = options;
    this.particles = [];
    this.mouse = null;
    this.animationFrame = null;
    this.resizeObserver = null;
    this.frameId = 0;
    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.animate();

    window.addEventListener("resize", this.resize.bind(this));
    this.canvas.addEventListener("mousemove", (event) => {
      this.mouse = sanitizeMouse(event);
    });
    this.canvas.addEventListener("mouseleave", () => {
      this.mouse = null;
    });
    this.canvas.addEventListener("touchmove", (event) => {
      this.mouse = sanitizeMouse(event);
    });
    this.canvas.addEventListener("touchend", () => {
      this.mouse = null;
    });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = Math.round(rect.width * window.devicePixelRatio);
    this.canvas.height = Math.round(rect.height * window.devicePixelRatio);
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.bounds = {
      width: rect.width,
      height: rect.height,
    };
  }

  createParticles() {
    const count = this.options.count || defaultSettings.particleCount;
    this.particles = Array.from({ length: count }, () => {
      const x = Math.random() * this.bounds.width;
      const y = Math.random() * this.bounds.height;
      const radius = defaultSettings.particleSize + Math.random() * 1.2;
      const hue = 200 + Math.random() * 80;
      const color = `hsla(${hue}, 92%, 63%, 1)`;
      return new Particle(x, y, radius, color);
    });
  }

  drawLinks() {
    const { ctx } = this;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(120, 245, 255, ${defaultSettings.linkOpacity})`;
    ctx.lineWidth = defaultSettings.linkWidth;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      for (let j = i + 1; j < this.particles.length; j++) {
        const q = this.particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < defaultSettings.linkDistance) {
          ctx.globalAlpha = (1 - dist / defaultSettings.linkDistance) * 0.25;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  animate = () => {
    const { ctx, bounds } = this;
    ctx.clearRect(0, 0, bounds.width, bounds.height);

    const gradient = ctx.createLinearGradient(0, 0, bounds.width, bounds.height);
    gradient.addColorStop(0, "rgba(6, 9, 18, 0.9)");
    gradient.addColorStop(0.5, "rgba(2, 2, 12, 0.55)");
    gradient.addColorStop(1, "rgba(10, 12, 18, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, bounds.width, bounds.height);

    this.drawLinks();

    for (const particle of this.particles) {
      particle.update(bounds, this.mouse);
      particle.draw(ctx);
    }

    if (this.options.rotation) {
      const t = (Date.now() / 10000) % (Math.PI * 2);
      const offsetX = Math.cos(t) * 5;
      const offsetY = Math.sin(t) * 4;
      ctx.translate(offsetX, offsetY);
    }

    this.frameId = requestAnimationFrame(this.animate);
  };

  destroy() {
    cancelAnimationFrame(this.frameId);
    window.removeEventListener("resize", this.resize.bind(this));
  }
}

function createCursorGlow() {
  const glow = document.createElement("div");
  glow.classList.add("cursor-glow");
  document.body.appendChild(glow);

  window.addEventListener("pointermove", (event) => {
    glow.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
  });
}

function setupPageInteractions() {
  const robloxButton = document.getElementById("robloxButton");
  const webDevButton = document.getElementById("webDevButton");
  const modal = document.getElementById("modal");
  const closeModal = document.getElementById("modalClose");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const secretPanel = document.getElementById("secretPanel");
  const secretClose = document.getElementById("secretClose");

  if (robloxButton) {
    robloxButton.addEventListener("click", () => {
      fadeOutAndNavigate(robloxButton.dataset.link);
    });
  }

  if (webDevButton && modal) {
    webDevButton.addEventListener("click", () => {
      modal.classList.add("active");
    });

    const close = () => {
      modal.classList.remove("active");
    };

    closeModal?.addEventListener("click", close);
    modalBackdrop?.addEventListener("click", close);

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  secretClose?.addEventListener("click", () => {
    secretPanel?.classList.remove("active");
  });

  document.addEventListener("click", (event) => {
    const now = Date.now();
    if (now - lastClickTime > 1600) {
      clickCounter = 0;
    }

    lastClickTime = now;
    clickCounter += 1;

    if (clickCounter === 7) {
      openSecret();
      clickCounter = 0;
    }
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === secretSequence[secretIndex]) {
      secretIndex += 1;
      if (secretIndex >= secretSequence.length) {
        openSecret();
        secretIndex = 0;
      }
    } else {
      secretIndex = key === secretSequence[0] ? 1 : 0;
    }
  });

  function openSecret() {
    if (!secretPanel) return;
    secretPanel.classList.add("active");
    setTimeout(() => {
      secretPanel.classList.remove("active");
    }, 7200);
  }

  const returnButtons = document.querySelectorAll(".back-button");
  returnButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      fadeOutAndNavigate("index.html");
    });
  });
}

function init() {
  showOverlay("Booting interface...");
  createCursorGlow();

  const canvas = document.getElementById("bgCanvas");
  const settings = {
    count: isRobloxPage ? 110 : 92,
    rotation: isRobloxPage,
  };

  const particleSystem = new ParticleSystem(canvas, settings);

  setupPageInteractions();

  window.addEventListener("beforeunload", () => {
    particleSystem.destroy();
  });

  setTimeout(() => {
    fadeInBody();
  }, 550);
}

document.addEventListener("DOMContentLoaded", init);
