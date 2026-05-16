const SOURCES = {
  "#links": "static/json/links.json",
  "#present": "static/json/books.json",
  "#art": "static/json/art.json",
};

const IMAGE_URL_RE = /\.(jpe?g|png|gif|webp|svg|bmp|avif)$/i;
const preloadedImages = new Map();

function preloadImage(url) {
  if (preloadedImages.has(url)) return;
  const img = new Image();
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
  render();
}

function initWindowClose() {
  const gui = document.querySelector(".window-gui");
  if (!gui) return;
  gui.querySelector(".window-controls-gui .dot-close")?.addEventListener(
    "click",
    () => {
      gui.querySelector(".content").innerHTML = "";
      gui.classList.remove("is-open");
    },
  );
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
      <img src="${encodeURI(i.url)}" alt="${i.name}" />
      <figcaption>${i.name}</figcaption>
    </figure>
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
    a.classList.toggle("is-active", `#${a.id}` === hash);
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
          : bookcardHTML;
    list.classList.toggle("is-art", location.hash === "#art");
    list.innerHTML =
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
