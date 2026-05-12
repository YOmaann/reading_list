const SOURCES = {
  "#links": "static/json/links.json",
  "#present": "static/json/books.json",
  "#art": "static/json/art.json",
};

let list;
let progressFill;

function init() {
  list = document.getElementById("book-list");
  progressFill = document.querySelector(
    "#scroll-progress .progress-bar-filled",
  );
  list.addEventListener("scroll", onListScroll, { passive: true });
  render();
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

function linkHTML(i) {
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

async function render() {
  if (progressFill) progressFill.style.width = "0%";
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
  } catch (err) {
    list.innerHTML = `<p>Error loading: ${err.message}</p>`;
  }
}

window.addEventListener("load", init);
window.addEventListener("hashchange", render);
