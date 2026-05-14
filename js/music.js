function slideIfOverflow(el, text) {
  const PX_PER_SEC = 17;
  const check = () => {
    el.classList.remove("is-overflow");
    el.textContent = text;
    if (el.scrollWidth > el.parentElement.clientWidth) {
      el.innerHTML = `<i></i><i></i>`;
      el.children[0].textContent = text;
      el.children[1].textContent = text;
      const oneCopyWidth = el.scrollWidth / 2;
      el.style.setProperty(
        "--marquee-duration",
        `${oneCopyWidth / PX_PER_SEC}s`,
      );
      el.classList.add("is-overflow");
    } else {
      el.style.removeProperty("--marquee-duration");
    }
  };
  const run = () => requestAnimationFrame(check);
  const schedule = () => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
  };
  if (document.querySelector(".window.pre-show")) {
    window.addEventListener("windows-shown", schedule, { once: true });
  } else {
    schedule();
  }
}

function setSlidingText(container, text) {
  container.innerHTML = "";
  const span = document.createElement("span");
  container.appendChild(span);
  slideIfOverflow(span, text);
}

window.addEventListener("load", async () => {
  const playlists = await fetch("static/json/playlist.json").then((res) =>
    res.json(),
  );

  const pl =
    playlists.playlists[Math.floor(Math.random() * playlists.playlists.length)];
  const tracks = await fetch(`static/json/${pl.file}`)
    .then((res) => res.json())
    .then((data) => data.tracks);

  const title = document.getElementById("music-title");
  const artist = document.getElementById("music-artist");
  const image = document.getElementById("music-image");
  const playlist = document.getElementById("music-playlist");
  const progressFill = document.getElementById("music-progress-filled");
  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");

  playlist.href = `https://open.spotify.com/playlist/${pl.id}`;
  playlist.target = "_blank";
  playlist.rel = "noopener noreferrer";
  setSlidingText(playlist, pl.name);

  let currentIndex = Math.floor(Math.random() * tracks.length);
  let isPlaying = false;

  function updatePlayButton() {
    if (isPlaying) {
      playBtn.textContent = "⏸";
      playBtn.setAttribute("aria-label", "Pause");
      playBtn.classList.add("playing");
    } else {
      playBtn.textContent = "▶";
      playBtn.setAttribute("aria-label", "Play");
      playBtn.classList.remove("playing");
    }
  }

  function preloadImage(url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
  }

  function loadTrack(index) {
    currentIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const myIndex = currentIndex;
    const track = tracks[currentIndex];

    setSlidingText(title, track.name);
    setSlidingText(artist, track.artists.map((a) => a.name).join(", "));

    progressFill.style.animation = "none";
    void progressFill.offsetWidth;
    progressFill.style.animation = "";
    progressFill.style.animationDuration = `${track.duration_ms / 1000}s`;
    progressFill.style.animationPlayState = isPlaying ? "running" : "paused";

    const coverUrl = track.album.cover_art[0].url;
    preloadImage(coverUrl)
      .then(() => {
        if (currentIndex === myIndex) {
          image.style.backgroundImage = `url(${coverUrl})`;
        }
      })
      .catch(() => {});

    const nextIdx = (currentIndex + 1) % tracks.length;
    const prevIdx = (currentIndex - 1 + tracks.length) % tracks.length;
    preloadImage(tracks[nextIdx].album.cover_art[0].url).catch(() => {});
    preloadImage(tracks[prevIdx].album.cover_art[0].url).catch(() => {});
  }

  playBtn.addEventListener("click", () => {
    isPlaying = !isPlaying;
    progressFill.style.animationPlayState = isPlaying ? "running" : "paused";
    updatePlayButton();
  });

  prevBtn.addEventListener("click", () => loadTrack(currentIndex - 1));
  nextBtn.addEventListener("click", () => loadTrack(currentIndex + 1));

  progressFill.addEventListener("animationend", () => {
    loadTrack(currentIndex + 1);
  });

  isPlaying = true;
  updatePlayButton();
  loadTrack(currentIndex);
});
