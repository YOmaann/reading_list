const SOURCES = {
  "#links": "static/json/links.json",
  "#present": "static/json/books.json",
  "#art": "static/json/art.json",
  "#audio": "static/json/guitar.json",
};

const descriptions = {};

const IMAGE_URL_RE = /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i;
const preloadedImages = new Map();

function preloadImage(url) {
  if (preloadedImages.has(url)) return;
  const img = new Image();
  img.decoding = "async";
  img.fetchPriority = "low";
  img.src = url;
  preloadedImages.set(url, img);
}

let list;
let progressFill;

const BG_KEY = "bg-annotated";

function applyBg(annotated) {
  document.body.classList.toggle("bg-annotated", annotated);
}

function initBgToggle() {
  applyBg(localStorage.getItem(BG_KEY) === "1");
  const btn = document.getElementById("bg-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const next = !document.body.classList.contains("bg-annotated");
    applyBg(next);
    localStorage.setItem(BG_KEY, next ? "1" : "0");
  });
}

function init() {
  list = document.getElementById("book-list");
  progressFill = document.querySelector(
    "#scroll-progress .progress-bar-filled",
  );
  list.addEventListener("scroll", onListScroll, { passive: true });
  initBgToggle();
  initWindowClose();
  initNavToggle();

  loadDescriptions();
  render();
}

function initNavToggle() {
  const nav = document.querySelector(".terminal-menu");
  const toggle = nav?.querySelector(".nav-toggle");
  if (!nav || !toggle) return;
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "menu ✕" : "menu ⋯";
  };
  toggle.addEventListener("click", () =>
    setOpen(!nav.classList.contains("is-open")),
  );
  nav.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => setOpen(false)),
  );
}

async function loadDescriptions() {
  const res = await fetch("static/json/descriptions.json");
  if (!res.ok) return;
  Object.assign(descriptions, await res.json());
  if (descriptions[location.hash]) render();
}

function initWindowClose() {
  const gui = document.querySelector(".window-gui");
  if (!gui) return;
  gui
    .querySelector(".window-controls-gui .dot-close")
    ?.addEventListener("click", () => {
      gui.querySelector(".content").innerHTML = "";
      gui.classList.remove("is-open");
    });
}

let scrollTicking = false;
function onListScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    const max = list.scrollHeight - list.clientHeight;
    const pct = max > 0 ? (list.scrollTop / max) * 100 : 0;
    progressFill.style.width = `${pct}%`;
    scrollTicking = false;
  });
}

function descriptionHTML(desc) {
  return `<div class="window-description"><p>${desc}</p></div>`;
}
// window manager for links section, art tiles, and book cards for now
function toggleWindow(e) {
  e.preventDefault();
  const link = e.currentTarget;
  if (!link) return;
  const url = link.getAttribute("href");
  const gui = document.querySelector(".window-gui");
  if (!gui) return;
  const titleContent = link.getAttribute("window-title");
  const title = gui.querySelector(".title");
  if (title) {
    title.textContent = titleContent ? titleContent : "Untitled";
  }
  const content = gui.querySelector(".content");
  if (!content) return;
  const isImage = IMAGE_URL_RE.test(url);
  content.innerHTML = isImage
    ? `<img src="${url}" alt="" class="window-image" />`
    : `<iframe src="${url}" frameborder="0" class="window-iframe"></iframe>`;
  gui.classList.add("is-open");
  //   const win = window.open(url, "_blank", "noopener");
  //   if (win) win.focus();
}

function linkHTML(i) {
  if (i.window == true)
    return `<span><a href="${i.url}" target="_blank" rel="noopener" class="window-link" onclick = "toggleWindow(event)" window-title="${i.windowTitle}">${i.name}</a></span>`;
  return `<span><a href="${i.url}" target="_blank" rel="noopener">${i.name}</a></span>`;
}

function artHTML(i) {
  return `
    <figure class="art-tile">
      <img src="${encodeURI(i.url)}" alt="${i.name}" loading="lazy" decoding="async" />
      <figcaption>${i.name}</figcaption>
    </figure>
  `;
}

function audioHTML(i) {
  const align = i.id % 2 ? "left" : "right";
  const links = i.links
    ? i.links.map((l) => {
        if (l.window == true)
          return `<a href="${l.url}" target="_blank" rel="noopener" class="window-link" onclick = "toggleWindow(event)" window-title="${l.windowTitle}">${l.name}</a>`;
        return `<a href="${l.url}" target="_blank" rel="noopener">${l.name}</a>`;
      })
    : [];
  const terminalMedia = `<div class="terminal-media-${align}">
        <div class="terminal-avatorholder">
        <img src="${i.url}" alt="${i.name}" loading="lazy" decoding="async" />
        </div>
        </div>`;
  return `
    <div class="terminal-media">
        ${align === "left" ? terminalMedia : ""}
        <div class="terminal-media-body">
            <div class="terminal-media-heading${i.bonus ? " is-bonus" : ""}">${i.name}</div>
            <div class="terminal-media-content">${i.description}</div>
            <div class="terminal-media-links">${links.join(" | ")}</div>
        </div>
        ${align === "right" ? terminalMedia : ""}
    </div>
  `;
}

function bookcardHTML(i) {
  const body = [
    i.author && `by ${i.author}`,
    i.status && `<em>${i.status}</em>`,
    i.note,
    i.url && `<a href="${i.url}" target="_blank" rel="noopener">${i.url}</a>`,
  ]
    .filter(Boolean)
    .join("<br>");

  return `
    <div class="terminal-card">
      <header>${i.title}</header>
      <div>${body}</div>
      <blockquote>
      <p>
        ${i.quote}
      </p>
      </blockquote>
    </div>
  `;
}

function updateActiveNav() {
  const hash = location.hash;
  document.querySelectorAll(".terminal-menu a").forEach((a) => {
    a.classList.toggle("is-active", a.getAttribute("href") === hash);
  });
}

async function render() {
  if (progressFill) progressFill.style.width = "0%";
  updateActiveNav();
  const url = SOURCES[location.hash];
  if (!url) {
    list.innerHTML = "<p>Pick a section above.</p>";
    return;
  }
  list.innerHTML = "<p>Wait sir ji :))</p>";
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = await res.json();
    const renderItem =
      location.hash === "#links"
        ? linkHTML
        : location.hash === "#art"
          ? artHTML
          : location.hash == "#present"
            ? bookcardHTML
            : audioHTML;
    list.classList.toggle("is-art", location.hash === "#art");

    const description = descriptions[location.hash];
    list.innerHTML =
      (description ? descriptionHTML(description) : "") +
      items.map(renderItem).join("") +
      `<p class="end-smile">~ that's all :) ~</p>`;

    if (location.hash === "#links") {
      for (const i of items) {
        if (i.window === true && IMAGE_URL_RE.test(i.url)) preloadImage(i.url);
      }
    }
  } catch (err) {
    list.innerHTML = `<p>Error loading: ${err.message}</p>`;
  }
}

window.addEventListener("load", init);
window.addEventListener("hashchange", render);
