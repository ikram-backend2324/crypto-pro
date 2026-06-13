/* Crypto Pro — 3D Algorithm Comparator
   3D column tower chart for comparing algorithms across multiple metrics. */
(function () {
  if (!window.CP3D) return;
  const CP3D = window.CP3D;
  const THREE = CP3D.THREE;

  CP3D.initComparator3D = function (container, data) {
    if (!container || !data || !data.names || !data.datasets) return;

    const names = data.names;            // ["AES-256", "RSA-2048", ...]
    const metrics = data.datasets;       // [{ label, data: [..] }, ...]
    if (!names.length || !metrics.length) return;

    const renderer = CP3D.makeRenderer(container);
    const scene = CP3D.makeScene();
    const camera = CP3D.makeCamera(container, 50);

    const W = container.clientWidth;
    const H = container.clientHeight;
    camera.position.set(7, 6, 9);
    camera.lookAt(0, 1.5, 0);

    CP3D.addLights(scene);

    // Base disk
    const baseGeo = new THREE.CylinderGeometry(6.5, 6.5, 0.15, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0d1226, metalness: 0.4, roughness: 0.6,
      emissive: 0x1a2152, emissiveIntensity: 0.25
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.1;
    scene.add(base);

    // Grid rings on base
    for (let r = 1.5; r <= 5.5; r += 1.5) {
      const ringGeo = new THREE.RingGeometry(r, r + 0.02, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x6c8bff, transparent: true, opacity: 0.18, side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0;
      scene.add(ring);
    }

    const palette = [0x6c8bff, 0x22e0d6, 0xc084fc, 0xff7ab8, 0xffb84d, 0x4ade80];
    const group = new THREE.Group();

    const algoCount = names.length;
    const metricCount = metrics.length;

    // Layout: each algorithm sits at an angle around the disk, bars stack outward radially
    const radius = 3.0;
    names.forEach((name, ai) => {
      const angle = (ai / algoCount) * Math.PI * 2;
      const cx = Math.cos(angle) * radius;
      const cz = Math.sin(angle) * radius;

      metrics.forEach((metric, mi) => {
        const v = Number(metric.data[ai] || 0);
        const h = Math.max(0.05, (v / 100) * 4.2);
        const color = palette[mi % palette.length];

        const barGeo = new THREE.BoxGeometry(0.55, h, 0.55);
        const barMat = new THREE.MeshStandardMaterial({
          color, metalness: 0.5, roughness: 0.25,
          emissive: color, emissiveIntensity: 0.35,
          transparent: true, opacity: 0.92
        });
        const bar = new THREE.Mesh(barGeo, barMat);

        // Offset bars side-by-side perpendicular to the radius direction
        const tangentX = -Math.sin(angle);
        const tangentZ = Math.cos(angle);
        const offset = (mi - (metricCount - 1) / 2) * 0.65;
        bar.position.set(
          cx + tangentX * offset,
          h / 2,
          cz + tangentZ * offset
        );
        bar.userData = { targetH: h, startTime: performance.now() + mi * 80 + ai * 40 };
        bar.scale.y = 0.001;
        group.add(bar);

        // Glow column above each bar
        const glowGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);
        const glowMat = new THREE.MeshBasicMaterial({
          color, transparent: true, opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(bar.position.x, h + 0.4, bar.position.z);
        group.add(glow);
      });
    });

    scene.add(group);

    // Central core
    const coreGeo = new THREE.IcosahedronGeometry(0.5, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0x6c8bff, emissiveIntensity: 0.8,
      metalness: 0.7, roughness: 0.2
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 1.5;
    scene.add(core);

    // Mouse interaction
    let mx = 0, mz = 0, tx = 0, tz = 0;
    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      tz = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    function animate(t) {
      requestAnimationFrame(animate);
      const now = performance.now();

      // Bar grow-in animation
      group.children.forEach((m) => {
        if (m.userData && m.userData.targetH != null) {
          const dt = now - m.userData.startTime;
          if (dt > 0 && m.scale.y < 1) {
            const p = Math.min(1, dt / 700);
            m.scale.y = 0.001 + p * (1 - 0.001);
          }
        }
      });

      group.rotation.y += 0.0035;
      core.rotation.x += 0.01;
      core.rotation.y += 0.012;
      core.position.y = 1.5 + Math.sin(t * 0.002) * 0.15;

      mx += (tx - mx) * 0.05;
      mz += (tz - mz) * 0.05;
      camera.position.x = 7 + mx * 1.2;
      camera.position.z = 9 - mz * 0.5;
      camera.lookAt(0, 1.5, 0);

      renderer.render(scene, camera);
    }
    animate(0);

    CP3D.attachResize(container, renderer, camera);
  };
})();
