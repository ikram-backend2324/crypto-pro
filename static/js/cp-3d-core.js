/* ──────────────────────────────────────────────────────────
   CryptoPro 3D Visualizations
   Built on top of three.js (loaded via CDN in base.html)
   ────────────────────────────────────────────────────────── */

(function () {
  if (!window.THREE) {
    console.warn('[CryptoPro 3D] three.js not loaded');
    return;
  }
  const THREE = window.THREE;

  // ── Helpers ────────────────────────────────────────────
  const COLORS = {
    accent:  0x6c8bff,
    accent2: 0x22e0d6,
    accent3: 0xc084fc,
    green:   0x34d399,
    amber:   0xfbbf24,
    red:     0xf87171,
    bg:      0x05070d,
  };

  function getSize(container) {
    // clientWidth/Height is more reliable than getBoundingClientRect during transitions
    let w = container.clientWidth || container.offsetWidth;
    let h = container.clientHeight || container.offsetHeight;
    // Fallback minimums — if a parent is mid-transition or display:none somewhere,
    // we still want a real canvas so it shows up when layout settles.
    if (!w || w < 8) w = 320;
    if (!h || h < 8) h = 320;
    return { w, h };
  }

  function makeRenderer(container, opts = {}) {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const { w, h } = getSize(container);
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);
    // ensure the canvas fills the container regardless of internal buffer size
    const c = renderer.domElement;
    c.style.width = '100%';
    c.style.height = '100%';
    c.style.display = 'block';
    container.appendChild(c);
    container.classList.add('has-canvas');
    return renderer;
  }

  function makeScene() {
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(COLORS.bg, 10, 60);
    return scene;
  }

  function makeCamera(container, fov = 55) {
    const { w, h } = getSize(container);
    const aspect = Math.max(w / Math.max(h, 1), 0.01);
    const camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 200);
    camera.position.set(0, 0, 10);
    return camera;
  }

  function attachResize(container, renderer, camera) {
    let resizeObserver;
    const update = () => {
      const { w, h } = getSize(container);
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(update);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', update);
    }
    // also catch initial layout settling
    setTimeout(update, 60);
    setTimeout(update, 300);
    return update;
  }

  function addLights(scene) {
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const key = new THREE.PointLight(COLORS.accent, 1.8, 60);
    key.position.set(8, 8, 12);
    scene.add(key);

    const fill = new THREE.PointLight(COLORS.accent2, 1.3, 60);
    fill.position.set(-10, -4, 8);
    scene.add(fill);

    const rim = new THREE.PointLight(COLORS.accent3, 0.9, 60);
    rim.position.set(0, -10, -6);
    scene.add(rim);
  }

  // Expose helpers
  window.CP3D = { THREE, COLORS, getSize, makeRenderer, makeScene, makeCamera, attachResize, addLights };

  // ── 1) HERO SCENE ─────────────────────────────────────
  window.CP3D.initHero = function (container) {
    if (!container) return;
    const scene = makeScene();
    const camera = makeCamera(container, 50);
    camera.position.set(0, 0, 12);
    const renderer = makeRenderer(container);
    addLights(scene);

    // Central crypto core: icosahedron wireframe + inner solid
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    const innerGeo = new THREE.IcosahedronGeometry(2.6, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: COLORS.accent,
      emissive: COLORS.accent,
      emissiveIntensity: 0.35,
      metalness: 0.7,
      roughness: 0.25,
      transparent: true,
      opacity: 0.85,
      flatShading: true,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(inner);

    const wireGeo = new THREE.IcosahedronGeometry(3.4, 1);
    const wireMat = new THREE.MeshBasicMaterial({
      color: COLORS.accent2,
      wireframe: true,
      transparent: true,
      opacity: 0.5,
    });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    coreGroup.add(wire);

    const outerGeo = new THREE.TorusGeometry(4.4, 0.05, 8, 64);
    const outerMat = new THREE.MeshBasicMaterial({ color: COLORS.accent3, transparent: true, opacity: 0.6 });
    const ring1 = new THREE.Mesh(outerGeo, outerMat);
    const ring2 = ring1.clone(); ring2.rotation.x = Math.PI / 2;
    const ring3 = ring1.clone(); ring3.rotation.y = Math.PI / 2;
    coreGroup.add(ring1, ring2, ring3);

    // Orbital particles (key fragments)
    const particleCount = 220;
    const positions = new Float32Array(particleCount * 3);
    const seeds = [];
    for (let i = 0; i < particleCount; i++) {
      const r = 5 + Math.random() * 3.5;
      const t = Math.random() * Math.PI * 2;
      const p = Math.random() * Math.PI;
      positions[i * 3]     = r * Math.sin(p) * Math.cos(t);
      positions[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
      positions[i * 3 + 2] = r * Math.cos(p);
      seeds.push({ r, t, p, speed: 0.1 + Math.random() * 0.3 });
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pMat = new THREE.PointsMaterial({
      color: COLORS.accent2,
      size: 0.085,
      transparent: true,
      opacity: 0.85,
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
    let raf;
    function loop() {
      const t = clock.getElapsedTime();
      coreGroup.rotation.x += 0.003;
      coreGroup.rotation.y += 0.005;
      ring1.rotation.z = t * 0.3;
      ring2.rotation.z = -t * 0.25;
      ring3.rotation.x = t * 0.2;

      // Move particles in orbit
      const pos = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const s = seeds[i];
        s.t += 0.002 * s.speed;
        pos[i * 3]     = s.r * Math.sin(s.p) * Math.cos(s.t);
        pos[i * 3 + 1] = s.r * Math.sin(s.p) * Math.sin(s.t);
        pos[i * 3 + 2] = s.r * Math.cos(s.p);
      }
      particles.geometry.attributes.position.needsUpdate = true;

      camera.position.x += (mx * 1.4 - camera.position.x) * 0.05;
      camera.position.y += (-my * 0.8 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    loop();
    resize();
    return { stop: () => { cancelAnimationFrame(raf); renderer.dispose(); } };
  };

})();
