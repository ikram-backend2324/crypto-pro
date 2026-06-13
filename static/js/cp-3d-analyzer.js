/* ──────────────────────────────────────────────────────────
   Analyzer page — Strength Fortress (3D) + Entropy Spectrum (3D)
   ────────────────────────────────────────────────────────── */
(function () {
  if (!window.CP3D || !window.THREE) return;
  const { THREE, COLORS, makeRenderer, makeScene, makeCamera, attachResize, addLights } = window.CP3D;

  // Map strength to color
  function strengthColor(label) {
    switch (label) {
      case 'Strong':    return 0x4ade80;
      case 'Moderate':  return 0xfde047;
      case 'Weak':      return 0xfbbf24;
      case 'Very Weak': return 0xf87171;
      default:          return COLORS.accent;
    }
  }

  // ── Strength Fortress ───────────────────────────────────
  // A central "key core" surrounded by N protective rings.
  // Score 0-100 controls ring count, color, animation speed, and the height of the protective spires.
  window.CP3D.initStrengthFortress = function (container, data) {
    if (!container) return;
    const score = Math.max(0, Math.min(100, data.strength_score || 0));
    const color = strengthColor(data.strength_label);

    const scene = makeScene();
    const camera = makeCamera(container, 50);
    camera.position.set(0, 4, 11);
    camera.lookAt(0, 0, 0);
    const renderer = makeRenderer(container);
    addLights(scene);

    // Ground disk
    const groundGeo = new THREE.CircleGeometry(6, 64);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0d1326,
      metalness: 0.5,
      roughness: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.5;
    scene.add(ground);

    // Hex grid lines on ground (decorative)
    const gridGeo = new THREE.RingGeometry(0.5, 5.6, 6, 8);
    const gridMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.18 });
    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -1.49;
    scene.add(grid);

    // Central key core: a glowing octahedron
    const coreGeo = new THREE.OctahedronGeometry(1.2, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      metalness: 0.9,
      roughness: 0.15,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    scene.add(core);

    // Protective spires — count scales with score
    const spireCount = Math.max(4, Math.round(4 + score / 8)); // 4 .. 16
    const spireHeight = 0.8 + (score / 100) * 2.6;
    const spireMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.3,
      metalness: 0.7,
      roughness: 0.3,
    });
    const spires = [];
    for (let i = 0; i < spireCount; i++) {
      const ang = (i / spireCount) * Math.PI * 2;
      const r = 3.6;
      const geo = new THREE.ConeGeometry(0.18, spireHeight, 6);
      const m = new THREE.Mesh(geo, spireMat);
      m.position.set(Math.cos(ang) * r, -1.5 + spireHeight / 2, Math.sin(ang) * r);
      scene.add(m);
      spires.push(m);
    }

    // Energy ring(s) — number depends on strength
    const ringCount = score >= 80 ? 3 : score >= 55 ? 2 : 1;
    const rings = [];
    for (let i = 0; i < ringCount; i++) {
      const radius = 2.2 + i * 0.6;
      const torusGeo = new THREE.TorusGeometry(radius, 0.04, 8, 80);
      const torusMat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.6 - i * 0.12 });
      const tor = new THREE.Mesh(torusGeo, torusMat);
      tor.rotation.x = Math.PI / 2 + i * 0.1;
      scene.add(tor);
      rings.push(tor);
    }

    // Floating "bit" particles around the core (denser if score is high)
    const particleCount = 60 + Math.round(score * 1.5);
    const positions = new Float32Array(particleCount * 3);
    const seeds = [];
    for (let i = 0; i < particleCount; i++) {
      const r = 1.6 + Math.random() * 2.5;
      const t = Math.random() * Math.PI * 2;
      const p = (Math.random() - 0.5) * Math.PI * 0.7;
      positions[i * 3]     = r * Math.cos(p) * Math.cos(t);
      positions[i * 3 + 1] = r * Math.sin(p);
      positions[i * 3 + 2] = r * Math.cos(p) * Math.sin(t);
      seeds.push({ r, t, p, speed: 0.2 + Math.random() * 0.6 });
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: color,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    const resize = attachResize(container, renderer, camera);

    let mx = 0, my = 0;
    container.addEventListener('mousemove', (e) => {
      const r = container.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    const speedMul = 0.4 + (score / 100) * 1.2;
    let raf;
    function loop() {
      const t = clock.getElapsedTime();
      core.rotation.x = t * 0.4 * speedMul;
      core.rotation.y = t * 0.6 * speedMul;
      core.position.y = Math.sin(t * 1.5) * 0.15;
      rings.forEach((r, i) => {
        r.rotation.z = t * (0.3 + i * 0.1) * speedMul * (i % 2 === 0 ? 1 : -1);
      });
      grid.rotation.z = t * 0.05;

      // particles orbit
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const s = seeds[i];
        s.t += 0.003 * s.speed * speedMul;
        pos[i * 3]     = s.r * Math.cos(s.p) * Math.cos(s.t);
        pos[i * 3 + 1] = s.r * Math.sin(s.p) + Math.sin(t * 0.6 + i) * 0.1;
        pos[i * 3 + 2] = s.r * Math.cos(s.p) * Math.sin(s.t);
      }
      particles.geometry.attributes.position.needsUpdate = true;

      camera.position.x += (mx * 1.8 - camera.position.x) * 0.05;
      camera.position.y += (4 + -my * 1.0 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    loop();
    resize();
    return { stop: () => { cancelAnimationFrame(raf); renderer.dispose(); } };
  };

  // ── Entropy Spectrum ────────────────────────────────────
  // 3D bar chart of character frequencies; height = pct, color = freq rank.
  window.CP3D.initEntropySpectrum = function (container, freqs) {
    if (!container || !freqs || freqs.length === 0) return;
    const N = freqs.length;
    const maxPct = freqs.reduce((m, f) => Math.max(m, f.pct), 0);

    const scene = makeScene();
    const camera = makeCamera(container, 45);
    camera.position.set(0, 4.5, 11);
    camera.lookAt(0, 0.5, 0);
    const renderer = makeRenderer(container);
    addLights(scene);

    // Base plate
    const baseGeo = new THREE.BoxGeometry(N * 0.7 + 1, 0.05, 1.6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0d1326, metalness: 0.6, roughness: 0.5 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    scene.add(base);

    // Bars
    const palette = [0x6c8bff, 0x7aa7ff, 0x22e0d6, 0x34d399, 0xfde047, 0xfbbf24, 0xfb923c, 0xf87171, 0xf472b6, 0xc084fc];
    const bars = [];
    const targetHeights = [];
    for (let i = 0; i < N; i++) {
      const f = freqs[i];
      const h = Math.max(0.05, (f.pct / Math.max(maxPct, 1)) * 4);
      const w = 0.5;
      const barGeo = new THREE.BoxGeometry(w, 1, w);
      const c = palette[i % palette.length];
      const barMat = new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 0.35,
        metalness: 0.65,
        roughness: 0.25,
      });
      const bar = new THREE.Mesh(barGeo, barMat);
      const x = (i - (N - 1) / 2) * 0.7;
      bar.position.set(x, 0.025, 0);
      bar.scale.y = 0.01;
      scene.add(bar);
      bars.push(bar);
      targetHeights.push(h);
    }

    // Floor reflections / glow plane behind
    const glowGeo = new THREE.PlaneGeometry(N * 0.7 + 2, 4);
    const glowMat = new THREE.MeshBasicMaterial({ color: COLORS.accent, transparent: true, opacity: 0.06 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.set(0, 2, -0.9);
    scene.add(glow);

    const resize = attachResize(container, renderer, camera);

    let mx = 0;
    container.addEventListener('mousemove', (e) => {
      const r = container.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    });

    const clock = new THREE.Clock();
    let raf;
    function loop() {
      const t = clock.getElapsedTime();
      // Animate bars growing into place + breathing
      bars.forEach((bar, i) => {
        const target = targetHeights[i];
        const grown = Math.min(1, t * 0.8);
        const breath = 1 + Math.sin(t * 1.5 + i * 0.5) * 0.04;
        bar.scale.y = target * grown * breath;
        bar.position.y = (bar.scale.y) / 2;
      });

      base.rotation.y += 0.003;
      bars.forEach(b => { b.rotation.y = base.rotation.y; });

      base.rotation.y += (mx * 0.4 - base.rotation.y) * 0.002;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    loop();
    resize();
    return { stop: () => { cancelAnimationFrame(raf); renderer.dispose(); } };
  };

})();
