const BAYER_4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const PARAMS = {
  food: {
    expect: "Однообразная, тяжёлая еда. Мало выбора специй.",
    reality: "Пельмени, блины, каша - вкусные. Продукты часто свежее, чем на Западе.",
    caption: "Еда: стереотип «скучной кухни» не выдержал проверки интервью.",
  },
  transport: {
    expect: "Сложно ориентироваться, мало карт и навигации.",
    reality: "Инфраструктура города современная. Главная трудность - язык, а не транспорт.",
    caption: "Транспорт: ожидали хаос, а получили приятную городскую среду.",
  },
  communication: {
    expect: "Русские холодные и закрытые.",
    reality: "Сначала серьёзны, после знакомства очень открытые и готовы помочь.",
    caption: "Общение: «холодность» оказалась этапом адаптации.",
  },
  weather: {
    expect: "Невыносимый холод без подготовки.",
    reality: "Климат тяжёлый в первые месяцы, но к нему можно привыкнуть.",
    caption: "Погода: ожидания были жёстче, чем долгосрочный опыт.",
  },
  safety: {
    expect: "Опасно, особенно по сравнению с домом.",
    reality: "Несколько респондентов отметили, что чувствуют себя здесь безопаснее.",
    caption: "Безопасность: образ созданный медиа сильно расходится с личным опытом.",
  },
};

const HOTSPOTS = {
  language: "Языковой барьер: главная боль первых месяцев. Базовые фразы и курсы русского снимают половину стресса.",
  climate: "Зима требует правильной обуви и одежды. Респонденты говорят: со временем климат перестаёт докучать в повседневности.",
  etiquette: "Снять куртку в столовой, не ходить в обуви по квартире. Неожиданный культурный код, к которому привыкают.",
  food: "Не хватает острой еды или привычных специй. Решаемо поиском в онлайн-магазинах и адаптацией вкусовых привычек.",
  stereotypes: "Образ из игр и школьной истории (СССР, «коммунизм») сменяется личным опытом после приезда.",
};

(function initDitherBackground() {
  const canvas = document.getElementById("dither-bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d", { alpha: true });
  let w = 0;
  let h = 0;
  let t = 0;
  let raf = 0;
  let running = true;

  const paletteDefault = {
    sand: [215, 192, 161],
    white: [255, 255, 255],
    brown: [132, 110, 77],
    bg: [247, 244, 239],
  };

  const paletteContrast = {
    sand: [220, 220, 220],
    white: [255, 255, 255],
    brown: [0, 0, 0],
    bg: [255, 255, 255],
  };

  function getPalette() {
    return document.documentElement.classList.contains("contrast-mode")
      ? paletteContrast
      : paletteDefault;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function bayerThreshold(x, y, level) {
    const v = BAYER_4[y % 4][x % 4] / 16;
    return level > v ? 1 : 0;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function draw() {
    if (!running) return;
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const scale = 3;
    const ox = Math.sin(t * 0.0004) * 80;
    const oy = Math.cos(t * 0.00035) * 60;

    for (let y = 0; y < h; y += scale) {
      for (let x = 0; x < w; x += scale) {
        const nx = (x + ox) / w;
        const ny = (y + oy) / h;
        const wave =
          Math.sin(nx * 6 + t * 0.001) * 0.15 +
          Math.cos(ny * 5 - t * 0.0008) * 0.15 +
          0.5;
        const level = Math.max(0, Math.min(1, wave));
        const bx = Math.floor(x / scale);
        const by = Math.floor(y / scale);
        const d = bayerThreshold(bx, by, level);

        const palette = getPalette();
        let r, g, b;
        if (d) {
          r = palette.sand[0];
          g = palette.sand[1];
          b = palette.sand[2];
        } else if (level > 0.55) {
          r = palette.brown[0];
          g = palette.brown[1];
          b = palette.brown[2];
        } else {
          r = palette.bg[0];
          g = palette.bg[1];
          b = palette.bg[2];
        }

        for (let dy = 0; dy < scale && y + dy < h; dy++) {
          for (let dx = 0; dx < scale && x + dx < w; dx++) {
            const i = ((y + dy) * w + (x + dx)) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 28;
          }
        }
      }
    }
    ctx.putImageData(img, 0, 0);
    t += 16;
    raf = requestAnimationFrame(draw);
  }

  resize();
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    draw();
  }

  window.addEventListener("resize", resize);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) draw();
    else cancelAnimationFrame(raf);
  });
})();

(function initCompare() {
  const slider = document.getElementById("compare-slider");
  const expectEl = document.getElementById("compare-expect");
  const handle = document.getElementById("compare-handle");
  const caption = document.getElementById("compare-caption");
  const tabs = document.querySelectorAll(".param-tab");
  const researchLeft = document.getElementById("research-art-left");
  const researchRight = document.getElementById("research-art-right");
  let current = "food";

  const RESEARCH_ART = {
    food: { left: "images/eda2.png", right: "images/pngwing.com 14.png" },
    transport: { left: "", right: "images/pngwing.com 5.png" },
    communication: { left: "images/pngwing.com 6.png", right: "images/pngwing.com 6(2).png" },
    weather: { left: "images/pngwing.com 8.png", right: "images/pngwing.com 12.png" },
    safety: { left: "", right: "images/pngwing.com 7.png" },
  };

  function setResearchArt(param) {
    const art = RESEARCH_ART[param];
    if (!art) return;
    if (researchLeft) {
      researchLeft.src = art.left || "";
      researchLeft.style.display = art.left ? "" : "none";
      researchLeft.dataset.scrollFx = "sway";
    }
    if (researchRight) {
      researchRight.src = art.right || "";
      researchRight.style.display = art.right ? "" : "none";
      researchRight.dataset.scrollFx = "sway";
    }
  }

  function updateCompare(param, value) {
    const data = PARAMS[param];
    if (!data) return;
    expectEl.textContent = data.expect;
    document.getElementById("compare-reality").textContent = data.reality;
    caption.textContent = data.caption;
    const pct = value + "%";
    expectEl.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
    if (handle) handle.style.left = pct;
  }

  slider?.addEventListener("input", (e) => {
    updateCompare(current, Number(e.target.value));
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        t.classList.remove("active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("active");
      tab.setAttribute("aria-selected", "true");
      current = tab.dataset.param;
      setResearchArt(current);
      updateCompare(current, Number(slider.value));
    });
  });

  setResearchArt("food");
  updateCompare("food", 50);
})();

(function initHotspots() {
  const detail = document.getElementById("hotspot-text");
  const buttons = document.querySelectorAll(".hotspot");

  function show(key) {
    if (detail && HOTSPOTS[key]) detail.textContent = HOTSPOTS[key];
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      show(btn.dataset.hotspot);
    });
    btn.addEventListener("mouseenter", () => show(btn.dataset.hotspot));
  });

  show("language");
})();

(function initScroll() {
  const reveals = document.querySelectorAll(".reveal");
  const navLinks = document.querySelectorAll(".main-nav a[data-section]");
  const sections = document.querySelectorAll("[data-section]");
  const progressFill = document.querySelector(".header-progress-fill");
  const progressBar = document.querySelector(".header-progress");
  const backTop = document.getElementById("back-top");

  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add("visible");
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => revealObs.observe(el));

  const sectionObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const id = e.target.dataset.section;
        navLinks.forEach((a) => {
          a.classList.toggle("active", a.dataset.section === id);
        });
      });
    },
    { threshold: 0.35 }
  );
  sections.forEach((s) => sectionObs.observe(s));

  function onScroll() {
    const doc = document.documentElement;
    const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
    if (progressFill) progressFill.style.width = pct + "%";
    if (progressBar) progressBar.setAttribute("aria-valuenow", Math.round(pct));
    backTop?.classList.toggle("visible", doc.scrollTop > 400);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

(function initCounters() {
  const cards = document.querySelectorAll(".stat-card[data-count]");
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const card = e.target;
        if (card.dataset.animated) return;
        card.dataset.animated = "1";
        const target = Number(card.dataset.count);
        const suffix = card.dataset.suffix ?? "";
        const valueEl = card.querySelector(".stat-value");
        const duration = 1200;
        const start = performance.now();

        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          const n = Math.round(target * eased);
          valueEl.textContent = n + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    },
    { threshold: 0.5 }
  );
  cards.forEach((c) => obs.observe(c));
})();

(function initTips() {
  const deck = document.getElementById("tips-deck");
  if (!deck) return;
  deck.querySelectorAll(".tip-card").forEach((card) => {
    card.addEventListener("click", () => {
      const was = card.classList.contains("expanded");
      deck.querySelectorAll(".tip-card").forEach((c) => c.classList.remove("expanded"));
      if (!was) card.classList.add("expanded");
    });
  });
})();

(function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });
  document.querySelectorAll(".main-nav a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });
})();

(function initTilt() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll("[data-tilt]").forEach((panel) => {
    panel.addEventListener("mousemove", (e) => {
      const r = panel.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      panel.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
    });
    panel.addEventListener("mouseleave", () => {
      panel.style.transform = "";
    });
  });
})();

(function initCursor() {
  const halo = document.getElementById("cursor-dither");
  if (!halo || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let mx = 0;
  let my = 0;
  let cx = 0;
  let cy = 0;

  document.addEventListener("mousemove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    halo.classList.add("active");
  });

  function loop() {
    cx += (mx - cx) * 0.12;
    cy += (my - cy) * 0.12;
    halo.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  }
  loop();
})();

document.getElementById("back-top")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

(function initSources() {
  const modal = document.getElementById("sources-modal");
  const titleEl = document.getElementById("sources-modal-title");
  const bodyEl = document.getElementById("sources-modal-body");
  const footEl = modal?.querySelector(".modal-foot");
  if (!modal || !titleEl || !bodyEl) return;

  const FILES = {
    info: { title: "Источники информации", file: "Источники информации.txt" },
    images: { title: "Источники изображений", file: "Источники изображений.txt" },
  };

  const SOURCES_EMBEDDED = {
    info: `1. Гончарова Е.И. Образ России в представлении иностранных студентов // Русский язык за рубежом. - 2023. - № 2. - С. 45–52.
Ссылка: https://www.elibrary.ru/item.asp?id=54233167
2. Дагаева К.И. Роль стереотипов в интерпретации образа России в инокультуре // Вестник РУДН. Культурология. - 2024. - Т. 18, № 1. - С. 112–126.
Ссылка: https://doi.org/10.22363/2312-8011-2024-18-1-112-126 (DOI рабочий)
3. Pavlovskaya A. :Pavlovskaya A.V. Western Stereotypes of Russia: Historical Roots and Modern Transformations // Russia in the Global World. - 2021. - No. 3. - P. 88–102.
Ссылка: https://istina.msu.ru/publications/article/379876543/`,
    images: `Рисунок 1 [Логотип) /Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 18.05.2025).

Рисунок 2 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 18.05.2025).

Рисунок 3 [Логотип] /Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru  (дата обращения: 18.05.2025).

Рисунок 4 [Логотип] /Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru  (дата обращения: 23.06.2025).

Рисунок 5 [Логотип] /Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 23.06.2025).

Рисунок 6 [Логотип] /Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 23.06.2025).

Рисунок 7 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 14.05.2025).

Рисунок 8 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 15.05.2025).

Рисунок 9 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 14.05.2025).

Рисунок 10 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 14.05.2025).

Рисунок 11 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru  (дата обращения: 28.05.2025).

Рисунок 12 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru  (дата обращения: 14.05.2025).

Рисунок 13 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 14.05.2025).

Рисунок 14 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 27.05.2025).

Рисунок 15 [Логотип] / Взято с открытого источника. – Режим доступа: https://www.pngwing.com/ru (дата обращения: 27.05.2025).

Инфографика 1 [Таблица] / Сгенерировано в Qwen. - Режим доступа: https://chat.qwen.ai/ (дата обращения: 16.05.2025)

Инфографика 2 [Карта] / Сгенерировано в Qwen. - Режим доступа: https://chat.qwen.ai/ (дата обращения: 16.05.2025)`,
  };

  function renderList(lines) {
    const ul = document.createElement("ul");
    lines.forEach((line) => {
      const li = document.createElement("li");
      const urlMatch = line.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        const a = document.createElement("a");
        a.href = urlMatch[0];
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = urlMatch[0];
        const before = line.replace(urlMatch[0], "").trim();
        if (before) {
          const span = document.createElement("span");
          span.textContent = before + " ";
          li.appendChild(span);
        }
        li.appendChild(a);
        const after = line.slice(line.indexOf(urlMatch[0]) + urlMatch[0].length).trim();
        if (after) {
          const tail = document.createElement("span");
          tail.textContent = " " + after;
          li.appendChild(tail);
        }
      } else {
        li.textContent = line;
      }
      ul.appendChild(li);
    });
    return ul;
  }

  function renderSources(kind, txt) {
    const meta = FILES[kind];
    const lines = txt
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    bodyEl.innerHTML = "";
    const wrap = document.createElement("div");

    const h = document.createElement("h4");
    h.textContent = meta.title;
    wrap.appendChild(h);
    wrap.appendChild(renderList(lines));

    if (kind === "info") {
      const lit = document.createElement("h4");
      lit.textContent = "Литература";
      wrap.appendChild(lit);
      const litList = document.createElement("ul");
      lines
        .filter((line) => /^\d+\./.test(line))
        .forEach((line) => {
          const li = document.createElement("li");
          li.textContent = line;
          litList.appendChild(li);
        });
      wrap.appendChild(litList);
    }

    bodyEl.appendChild(wrap);

  }

  async function loadSourcesText(kind) {
    const meta = FILES[kind];
    const isFileProtocol = location.protocol === "file:";

    if (!isFileProtocol) {
      try {
        const res = await fetch(encodeURI(meta.file), { cache: "no-store" });
        if (res.ok) return await res.text();
      } catch {}
    }

    return SOURCES_EMBEDDED[kind] || "";
  }

  async function open(kind) {
    const meta = FILES[kind];
    if (!meta) return;
    titleEl.textContent = meta.title;
    bodyEl.innerHTML = "<p>Загрузка...</p>";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const txt = await loadSourcesText(kind);
    if (!txt.trim()) {
      bodyEl.innerHTML = "<p>Не удалось загрузить список источников.</p>";
      return;
    }
    renderSources(kind, txt);
  }

  function close() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.querySelectorAll("[data-sources-open]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn.dataset.sourcesOpen));
  });

  modal.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", close);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });
})();

(function initCountryRutubePreview() {
  const chips = document.querySelectorAll(".country-chip");
  if (!chips.length) return;

  const preview = document.createElement("div");
  preview.className = "country-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.innerHTML = `
    <div class="country-preview-frame">
      <iframe title="Rutube preview" loading="lazy" referrerpolicy="no-referrer" allow="autoplay; fullscreen"></iframe>
    </div>
  `;
  document.body.appendChild(preview);
  const frame = preview.querySelector("iframe");

  function hide() {
    preview.classList.remove("open");
    preview.setAttribute("aria-hidden", "true");
    if (frame) frame.src = "about:blank";
  }

  chips.forEach((chip) => {
    chip.addEventListener("mouseenter", () => {
      const embed = chip.dataset.rutubeEmbed;
      if (!embed || !frame) return;
      frame.src = `https://rutube.ru/play/embed/${embed}?autoplay=1&mute=1`;

      const r = chip.getBoundingClientRect();
      const w = 360;
      const h = 210;
      const top = Math.max(12, r.top - h - 12);
      const left = Math.min(window.innerWidth - w - 12, Math.max(12, r.left));
      preview.style.top = `${top + window.scrollY}px`;
      preview.style.left = `${left + window.scrollX}px`;

      preview.classList.add("open");
      preview.setAttribute("aria-hidden", "false");
    });
    chip.addEventListener("mouseleave", hide);
    chip.addEventListener("blur", hide);
  });
})();

(function initSideArtFx() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = window.matchMedia("(max-width: 900px)").matches;
  if (reduce || small) return;

  const arts = Array.from(document.querySelectorAll(".side-art"));
  if (!arts.length) return;

  let raf = 0;
  function tick() {
    raf = 0;
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const t = y * 0.002;

    arts.forEach((el, idx) => {
      const fx = el.dataset.scrollFx || "sway";
      if (fx === "none") {
        el.style.transform = "";
        return;
      }

      const base = (idx % 7) * 0.35;
      const sway = Math.sin(t + base) * 6;
      const floatY = Math.cos(t * 0.7 + base) * 8;
      const parallax = (y % 800) / 800;
      const drift = (parallax - 0.5) * 18;

      el.style.transform = `translate3d(0, ${floatY + drift}px, 0) rotate(${sway * 0.45}deg)`;
    });
  }

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(tick);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    const nowSmall = window.matchMedia("(max-width: 900px)").matches;
    if (nowSmall) arts.forEach((el) => (el.style.transform = ""));
  });
  tick();
})();

(function initContrastMode() {
  const btn = document.getElementById("contrast-toggle");
  if (!btn) return;

  function apply(on) {
    document.documentElement.classList.toggle("contrast-mode", on);
    localStorage.setItem("contrast-mode", on ? "1" : "0");
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      on ? "Выключить контрастный режим" : "Включить контрастный режим"
    );
    btn.title = on ? "Обычный режим" : "Контрастный режим";
  }

  apply(document.documentElement.classList.contains("contrast-mode"));

  btn.addEventListener("click", () => {
    apply(!document.documentElement.classList.contains("contrast-mode"));
  });
})();

document.querySelectorAll(".figure-frame img, .map-figure img").forEach((img) => {
  img.addEventListener("error", () => {
    img.closest(".figure-frame, .map-figure")?.classList.add("placeholder");
  });
  if (!img.complete || img.naturalWidth === 0) {
    if (img.complete) img.dispatchEvent(new Event("error"));
  }
});
