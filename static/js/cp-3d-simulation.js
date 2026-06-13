/* Crypto Pro — 3D Algorithm Simulations
   Per-algorithm cryptographic operation visualizations. */
(function () {
  if (!window.CP3D) return;
  const CP3D = window.CP3D;
  const THREE = CP3D.THREE;

  function setupScene(container) {
    const renderer = CP3D.makeRenderer(container);
    const scene = CP3D.makeScene();
    const camera = CP3D.makeCamera(container, 50);
    camera.position.set(0, 2, 7);
    camera.lookAt(0, 0, 0);
    CP3D.addLights(scene);
    CP3D.attachResize(container, renderer, camera);
    return { renderer, scene, camera };
  }

  // --- RSA: prime factorization, two primes orbiting a composite ---
  function rsaSim(container) {
    const { renderer, scene, camera } = setupScene(container);
    const group = new THREE.Group();

    // composite N
    const nGeo = new THREE.IcosahedronGeometry(1.1, 2);
    const nMat = new THREE.MeshStandardMaterial({
      color: 0x6c8bff, emissive: 0x6c8bff, emissiveIntensity: 0.5,
      metalness: 0.6, roughness: 0.25, wireframe: false
    });
    const n = new THREE.Mesh(nGeo, nMat);
    group.add(n);

    // wireframe shell
    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4, 1),
      new THREE.MeshBasicMaterial({ color: 0x22e0d6, wireframe: true, transparent: true, opacity: 0.35 })
    );
    group.add(shell);

    // two primes orbiting
    const p1 = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0xc084fc, emissiveIntensity: 0.8 })
    );
    const p2 = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x22e0d6, emissive: 0x22e0d6, emissiveIntensity: 0.8 })
    );
    group.add(p1, p2);

    // orbit rings
    [2.2, 2.7].forEach((r, i) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.012, 8, 64),
        new THREE.MeshBasicMaterial({ color: i ? 0x22e0d6 : 0xc084fc, transparent: true, opacity: 0.4 })
      );
      ring.rotation.x = Math.PI / 2;
      if (i) ring.rotation.z = Math.PI / 3;
      group.add(ring);
    });

    // particle trail
    const pcount = 200;
    const pgeo = new THREE.BufferGeometry();
    const pos = new Float32Array(pcount * 3);
    for (let i = 0; i < pcount; i++) {
      const r = 2 + Math.random() * 2;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI;
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph);
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(pgeo, new THREE.PointsMaterial({
      color: 0x6c8bff, size: 0.04, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending
    }));
    group.add(particles);

    scene.add(group);

    function animate(t) {
      requestAnimationFrame(animate);
      n.rotation.x += 0.008;
      n.rotation.y += 0.012;
      shell.rotation.x -= 0.005;
      shell.rotation.y -= 0.007;
      const ts = t * 0.001;
      p1.position.set(Math.cos(ts) * 2.2, Math.sin(ts * 0.7) * 0.4, Math.sin(ts) * 2.2);
      p2.position.set(Math.cos(ts * 1.3 + 2) * 2.7, Math.sin(ts * 0.9 + 1) * 0.4, Math.sin(ts * 1.3 + 2) * 2.7);
      particles.rotation.y += 0.001;
      group.rotation.y += 0.002;
      renderer.render(scene, camera);
    }
    animate(0);
  }

  // --- AES: 4x4 byte state matrix with rounds ---
  function aesSim(container) {
    const { renderer, scene, camera } = setupScene(container);
    camera.position.set(0, 4, 6.5);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    const cubes = [];
    const palette = [0x6c8bff, 0x22e0d6, 0xc084fc, 0xff7ab8];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const c = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.7, 0.7),
          new THREE.MeshStandardMaterial({
            color: palette[(i + j) % palette.length],
            emissive: palette[(i + j) % palette.length],
            emissiveIntensity: 0.4,
            metalness: 0.6,
            roughness: 0.3
          })
        );
        c.position.set((i - 1.5) * 0.95, 0, (j - 1.5) * 0.95);
        c.userData = { ix: i, jy: j, phase: (i + j) * 0.4 };
        cubes.push(c);
        group.add(c);
      }
    }

    // ground glow
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 6),
      new THREE.MeshBasicMaterial({ color: 0x6c8bff, transparent: true, opacity: 0.08 })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = -0.6;
    group.add(glow);

    scene.add(group);

    function animate(t) {
      requestAnimationFrame(animate);
      const ts = t * 0.001;
      cubes.forEach((c) => {
        c.position.y = Math.sin(ts * 1.5 + c.userData.phase) * 0.45;
        c.rotation.x = ts * 0.5 + c.userData.phase;
        c.rotation.y = ts * 0.7 + c.userData.phase;
        const s = 0.85 + Math.sin(ts * 2 + c.userData.phase) * 0.15;
        c.scale.setScalar(s);
      });
      group.rotation.y += 0.004;
      renderer.render(scene, camera);
    }
    animate(0);
  }

  // --- ECC: elliptic curve points on a curved surface ---
  function eccSim(container) {
    const { renderer, scene, camera } = setupScene(container);
    camera.position.set(0, 3, 6);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();

    // curve surface (parametric-like via plane warp)
    const planeGeo = new THREE.PlaneGeometry(6, 4, 60, 40);
    const pos = planeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = Math.sin(x * 0.8) * 0.4 + Math.cos(y * 0.6) * 0.3;
      pos.setZ(i, z);
    }
    planeGeo.computeVertexNormals();
    const surface = new THREE.Mesh(
      planeGeo,
      new THREE.MeshStandardMaterial({
        color: 0x6c8bff, emissive: 0x6c8bff, emissiveIntensity: 0.2,
        metalness: 0.5, roughness: 0.4, wireframe: true,
        transparent: true, opacity: 0.55
      })
    );
    surface.rotation.x = -Math.PI / 2.2;
    group.add(surface);

    // points P, Q, R (P + Q = R on curve)
    const colors = [0xc084fc, 0x22e0d6, 0xffb84d];
    const pts = colors.map((c) => new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 24, 24),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.9 })
    ));
    pts.forEach((p) => group.add(p));

    // connecting lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    const lines = new THREE.Line(lineGeo, lineMat);
    group.add(lines);

    scene.add(group);

    function animate(t) {
      requestAnimationFrame(animate);
      const ts = t * 0.0008;
      const path = (phase) => {
        const x = Math.cos(ts + phase) * 2.2;
        const yy = Math.sin(ts * 0.7 + phase) * 1.4;
        const z = Math.sin(x * 0.8) * 0.4 + Math.cos(yy * 0.6) * 0.3;
        return new THREE.Vector3(x, z + 0.15, yy);
      };
      const P = path(0);
      const Q = path(2);
      const R = path(4);
      pts[0].position.copy(P);
      pts[1].position.copy(Q);
      pts[2].position.copy(R);

      const arr = lineGeo.attributes.position.array;
      arr[0] = P.x; arr[1] = P.y; arr[2] = P.z;
      arr[3] = Q.x; arr[4] = Q.y; arr[5] = Q.z;
      arr[6] = R.x; arr[7] = R.y; arr[8] = R.z;
      lineGeo.attributes.position.needsUpdate = true;

      group.rotation.y += 0.002;
      renderer.render(scene, camera);
    }
    animate(0);
  }

  // --- ChaCha20: stream cipher quarter-round visualization ---
  function chachaSim(container) {
    const { renderer, scene, camera } = setupScene(container);
    camera.position.set(0, 1, 7);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();

    // 4 columns of flowing particles
    const colCount = 4;
    const perCol = 60;
    const cols = [];
    for (let c = 0; c < colCount; c++) {
      const color = [0x6c8bff, 0x22e0d6, 0xc084fc, 0xff7ab8][c];
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(perCol * 3);
      const off = new Float32Array(perCol);
      for (let i = 0; i < perCol; i++) {
        pos[i * 3] = (c - 1.5) * 1.5;
        pos[i * 3 + 1] = (i / perCol) * 5 - 2.5;
        pos[i * 3 + 2] = 0;
        off[i] = Math.random();
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pts = new THREE.Points(geo, new THREE.PointsMaterial({
        color, size: 0.1, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending
      }));
      pts.userData = { offsets: off, baseX: (c - 1.5) * 1.5, color: c };
      cols.push(pts);
      group.add(pts);
    }

    // connecting torus rings between columns
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.04, 8, 32),
        new THREE.MeshStandardMaterial({
          color: 0xffffff, emissive: 0x6c8bff, emissiveIntensity: 0.7,
          metalness: 0.6, roughness: 0.3
        })
      );
      ring.position.y = (i - 1) * 1.6;
      ring.rotation.x = Math.PI / 2;
      ring.userData = { iy: i };
      group.add(ring);
    }

    scene.add(group);

    function animate(t) {
      requestAnimationFrame(animate);
      const ts = t * 0.001;
      cols.forEach((col) => {
        const arr = col.geometry.attributes.position.array;
        const offs = col.userData.offsets;
        for (let i = 0; i < perCol; i++) {
          const yBase = ((i / perCol) * 5 - 2.5 + ts * 0.6 + offs[i]) % 5 - 2.5;
          arr[i * 3 + 1] = yBase;
          arr[i * 3] = col.userData.baseX + Math.sin(ts * 2 + yBase + col.userData.color) * 0.15;
          arr[i * 3 + 2] = Math.cos(ts * 2 + yBase + col.userData.color) * 0.15;
        }
        col.geometry.attributes.position.needsUpdate = true;
      });
      group.children.forEach((m) => {
        if (m.userData && m.userData.iy != null) {
          m.rotation.z = ts * (1 + m.userData.iy * 0.3);
        }
      });
      group.rotation.y = Math.sin(ts * 0.4) * 0.3;
      renderer.render(scene, camera);
    }
    animate(0);
  }

  // --- 3DES / generic block cipher: chain of rotating blocks ---
  function blockChainSim(container) {
    const { renderer, scene, camera } = setupScene(container);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 0, 0);

    const group = new THREE.Group();
    const blocks = [];
    const palette = [0x6c8bff, 0x22e0d6, 0xc084fc, 0xff7ab8, 0xffb84d];

    for (let i = 0; i < 5; i++) {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({
          color: palette[i], emissive: palette[i], emissiveIntensity: 0.35,
          metalness: 0.6, roughness: 0.3
        })
      );
      b.position.x = (i - 2) * 1.5;
      b.userData = { ix: i };
      blocks.push(b);
      group.add(b);

      // wireframe overlay
      const wire = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 1.05, 1.05),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.2 })
      );
      wire.position.x = b.position.x;
      wire.userData = { ix: i, isWire: true };
      blocks.push(wire);
      group.add(wire);
    }

    // connecting arrows
    for (let i = 0; i < 4; i++) {
      const ar = new THREE.Mesh(
        new THREE.ConeGeometry(0.1, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5 })
      );
      ar.rotation.z = -Math.PI / 2;
      ar.position.x = (i - 1.5) * 1.5;
      group.add(ar);
    }

    scene.add(group);

    function animate(t) {
      requestAnimationFrame(animate);
      const ts = t * 0.001;
      blocks.forEach((b) => {
        const phase = b.userData.ix * 0.6;
        b.rotation.y = ts * 0.8 + phase;
        b.rotation.x = ts * 0.4 + phase;
        b.position.y = Math.sin(ts * 2 + phase) * 0.15;
      });
      group.rotation.y = Math.sin(ts * 0.3) * 0.4;
      renderer.render(scene, camera);
    }
    animate(0);
  }

  // --- Default / generic crypto operation ---
  function genericSim(container) {
    const { renderer, scene, camera } = setupScene(container);

    const torus = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.2, 0.35, 128, 16),
      new THREE.MeshStandardMaterial({
        color: 0x6c8bff, emissive: 0x6c8bff, emissiveIntensity: 0.4,
        metalness: 0.7, roughness: 0.2
      })
    );
    scene.add(torus);

    const wire = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1.5, 0.05, 64, 8),
      new THREE.MeshBasicMaterial({ color: 0x22e0d6, wireframe: true, transparent: true, opacity: 0.4 })
    );
    scene.add(wire);

    function animate(t) {
      requestAnimationFrame(animate);
      torus.rotation.x = t * 0.0006;
      torus.rotation.y = t * 0.0009;
      wire.rotation.x = -t * 0.0004;
      wire.rotation.y = -t * 0.0007;
      renderer.render(scene, camera);
    }
    animate(0);
  }

  CP3D.initAlgorithmSimulation = function (container, algorithm) {
    if (!container) return;
    const algo = (algorithm || '').toUpperCase();
    if (algo.includes('RSA')) return rsaSim(container);
    if (algo.includes('AES')) return aesSim(container);
    if (algo.includes('ECC') || algo.includes('ECDSA') || algo.includes('ED25519')) return eccSim(container);
    if (algo.includes('CHACHA') || algo.includes('SALSA')) return chachaSim(container);
    if (algo.includes('3DES') || algo.includes('DES') || algo.includes('BLOWFISH') || algo.includes('TWOFISH')) return blockChainSim(container);
    return genericSim(container);
  };
})();
