(() => {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  const initInteractionLocks = () => {
    document.addEventListener("dragstart", (event) => event.preventDefault());
    document.addEventListener("selectstart", (event) => event.preventDefault());
    document.querySelectorAll("a, img, svg").forEach((element) => {
      element.setAttribute("draggable", "false");
    });
  };

  const playIntro = (elements) => {
    const { brand, card, steps } = elements;
    const page = document.querySelector(".page");
    const contentItems = [
      document.querySelector(".verify__badge"),
      document.querySelector(".verify h1"),
      document.querySelector(".verify__lead"),
      document.querySelector(".verify__panel"),
      document.querySelector(".verify__button")
    ].filter(Boolean);

    document.body.classList.remove("is-intro-pending");

    page?.animate(
      [
        { opacity: 0, transform: "scale(0.985)" },
        { opacity: 1, transform: "scale(1)" }
      ],
      { duration: 760, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }
    );

    brand?.animate(
      [
        { opacity: 0, transform: "translate3d(0, 18px, 0) scale(0.96)" },
        { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
      ],
      { duration: 720, delay: 120, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
    );

    card?.animate(
      [
        { opacity: 0, transform: "translate3d(0, 34px, 0) rotateX(16deg) scale(0.94)" },
        { opacity: 1, transform: "translate3d(0, 0, 0) rotateX(0deg) scale(1)" }
      ],
      { duration: 920, delay: 180, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "backwards" }
    );

    contentItems.forEach((item, index) => {
      item.animate(
        [
          { opacity: 0, transform: "translate3d(0, 22px, 0)" },
          { opacity: 1, transform: "translate3d(0, 0, 0)" }
        ],
        {
          duration: 680,
          delay: 390 + index * 80,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards"
        }
      );
    });

    steps?.animate(
      [
        { opacity: 0, transform: "translate3d(0, 22px, 0)" },
        { opacity: 1, transform: "translate3d(0, 0, 0)" }
      ],
      { duration: 680, delay: 860, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" }
    );
  };

  const revealPage = () => {
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    document.dispatchEvent(new CustomEvent("lda:verification-ready"));
  };

  const initLoader = () => {
    const preloader = document.querySelector(".preloader");
    const bar = document.querySelector(".loader-card__bar");
    const percent = document.querySelector(".loader-card__percent");
    const status = document.querySelector(".loader-card__status");
    const terminal = document.querySelector(".loader-card__terminal");

    if (!preloader || !bar || !percent || !status || !terminal) {
      return Promise.resolve();
    }

    const steps = [
      { at: 5, text: "Conectando gateway externo..." },
      { at: 16, text: "Carregando assets /background/Background.png" },
      { at: 29, text: "Montando elementos /verify/card" },
      { at: 43, text: "Inicializando liquid glass layer" },
      { at: 57, text: "Preparando Discord OAuth 2.0" },
      { at: 71, text: "Validando hash cc572978e06e" },
      { at: 86, text: "Sincronizando animacoes 3D" },
      { at: 96, text: "Finalizando ambiente seguro" },
      { at: 100, text: "Pronto. Liberando verificacao externa." }
    ];

    let progress = 0;
    let stepIndex = 0;
    let lastTime = performance.now();

    terminal.innerHTML = "";

    const pushLine = (text) => {
      const line = document.createElement("span");
      line.className = "loader-card__line";
      line.textContent = text;
      terminal.appendChild(line);

      while (terminal.children.length > 4) {
        terminal.firstElementChild?.remove();
      }
    };

    pushLine("Aguardando processo de boot...");

    return new Promise((resolve) => {
      const tick = (time) => {
        const delta = Math.min(time - lastTime, 80);
        lastTime = time;

        const remaining = 100 - progress;
        const speed = progress < 74 ? 0.034 : 0.02;
        progress += Math.max(0.08, remaining * speed) * (delta / 16.67);
        progress = Math.min(progress, 100);

        while (steps[stepIndex] && progress >= steps[stepIndex].at) {
          status.textContent = steps[stepIndex].text;
          pushLine(steps[stepIndex].text);
          stepIndex += 1;
        }

        const roundedProgress = Math.floor(progress);
        bar.style.width = `${progress.toFixed(2)}%`;
        percent.textContent = `${roundedProgress}%`;

        if (progress < 100) {
          requestAnimationFrame(tick);
          return;
        }

        percent.textContent = "100%";
        bar.style.width = "100%";
        status.textContent = "Verificacao pronta";

        window.setTimeout(() => {
          revealPage();
          preloader.classList.add("is-hidden");
          resolve();
        }, 360);
      };

      requestAnimationFrame(tick);
    });
  };

  const initMotion = () => {
    const card = document.querySelector(".verify__card");
    const brand = document.querySelector(".brand");
    const grid = document.querySelector(".page__grid");
    const steps = document.querySelector(".verify__steps");
    const orbOne = document.querySelector(".verify__orb--one");
    const orbTwo = document.querySelector(".verify__orb--two");

    if (!card) {
      return;
    }

    playIntro({ brand, card, steps });

    const canTilt = window.matchMedia("(pointer: fine)").matches;
    if (!canTilt) {
      return;
    }

    const state = {
      pointerX: 0,
      pointerY: 0,
      tiltX: 0,
      tiltY: 0,
      targetTiltX: 0,
      targetTiltY: 0,
      lift: 0,
      targetLift: 0,
      glareX: 50,
      glareY: 8,
      targetGlareX: 50,
      targetGlareY: 8,
      insideCard: false,
      lastMoveAt: performance.now()
    };

    const applyFrame = () => {
      const idleTime = performance.now() - state.lastMoveAt;
      const idleWave = idleTime > 900 ? Math.sin(performance.now() / 1300) : 0;

      state.tiltX = lerp(state.tiltX, state.targetTiltX + idleWave * 1.2, 0.13);
      state.tiltY = lerp(state.tiltY, state.targetTiltY + idleWave * -1.1, 0.13);
      state.lift = lerp(state.lift, state.targetLift, 0.15);
      state.glareX = lerp(state.glareX, state.targetGlareX, 0.16);
      state.glareY = lerp(state.glareY, state.targetGlareY, 0.16);

      card.style.transform = `rotateX(${state.tiltX.toFixed(2)}deg) rotateY(${state.tiltY.toFixed(2)}deg) translate3d(0, ${state.lift.toFixed(2)}px, 0)`;
      card.style.setProperty("--glare-x", `${state.glareX.toFixed(1)}%`);
      card.style.setProperty("--glare-y", `${state.glareY.toFixed(1)}%`);

      if (brand) {
        brand.style.transform = `translate3d(${(state.pointerX * 8).toFixed(2)}px, ${(state.pointerY * 5).toFixed(2)}px, 0)`;
      }

      if (steps) {
        steps.style.transform = `translate3d(${(state.pointerX * -7).toFixed(2)}px, ${(state.pointerY * -4).toFixed(2)}px, 0) translateZ(-24px)`;
      }

      if (grid) {
        grid.style.transform = `perspective(620px) rotateX(62deg) translate3d(${(state.pointerX * 16).toFixed(2)}px, 28%, 0)`;
      }

      if (orbOne) {
        orbOne.style.transform = `translate3d(${(state.pointerX * 18).toFixed(2)}px, ${(state.pointerY * 16).toFixed(2)}px, 0)`;
      }

      if (orbTwo) {
        orbTwo.style.transform = `translate3d(${(state.pointerX * -14).toFixed(2)}px, ${(state.pointerY * -12).toFixed(2)}px, 0)`;
      }

      requestAnimationFrame(applyFrame);
    };

    document.addEventListener("pointermove", (event) => {
      const viewportX = event.clientX / window.innerWidth - 0.5;
      const viewportY = event.clientY / window.innerHeight - 0.5;
      const rect = card.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5);
      const y = clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5);

      state.pointerX = viewportX;
      state.pointerY = viewportY;
      state.targetTiltX = y * 16;
      state.targetTiltY = x * -16;
      state.targetGlareX = clamp((x + 0.5) * 100, 0, 100);
      state.targetGlareY = clamp((y + 0.5) * 100, 0, 100);
      state.insideCard =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      state.targetLift = state.insideCard ? -8 : -2;
      state.lastMoveAt = performance.now();

      card.classList.toggle("is-tilting", state.insideCard);
    });

    document.addEventListener("pointerleave", () => {
      state.pointerX = 0;
      state.pointerY = 0;
      state.targetTiltX = 0;
      state.targetTiltY = 0;
      state.targetLift = 0;
      state.targetGlareX = 50;
      state.targetGlareY = 8;
      card.classList.remove("is-tilting");
    });

    requestAnimationFrame(applyFrame);
  };

  document.addEventListener("DOMContentLoaded", () => {
    initInteractionLocks();
    initLoader().then(initMotion);
  });
})();
