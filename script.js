const input = document.querySelector('input');
const gamesContainer = document.querySelector('#games');

const featuredCol1 = document.querySelector('#featured-col-1');
const featuredRow1 = document.querySelector('#featured-row-1');
const featuredRow2 = document.querySelector('#featured-row-2');
const featuredCol2 = document.querySelector('#featured-col-2');

function createGameLink(game, { withPlayButton = false } = {}) {
  const a = document.createElement('a');
  a.href = `games/${game.directory}/`;

  const img = document.createElement('img');
  img.src = `games/${game.directory}/${game.image}`;
  img.alt = game.name;

  a.appendChild(img);

  if (withPlayButton) {
    const playButton = document.createElement('div');
    playButton.className = 'play-button';
    playButton.innerHTML = '<i class="fa-solid fa-play"></i>';
    a.appendChild(playButton);
  }

  return a;
}

function renderFeatured(games) {
  if (!featuredCol1 || !featuredRow1 || !featuredRow2 || !featuredCol2) return;

  featuredCol1.replaceChildren();
  featuredRow1.replaceChildren();
  featuredRow2.replaceChildren();
  featuredCol2.replaceChildren();

  // Prefer some recognizable/popular titles if present, otherwise fall back to the first games.
  const preferred = [
    'eaglercraft',
    'vex7',
    'vex6',
    'slope',
    'drivemad',
    'retrobowl',
    'motox3m',
    'motox3m2',
    '1v1lol',
    '2048',
  ];

  const byDirectory = new Map(games.map((g) => [g.directory, g]));
  const featured = [];
  for (const dir of preferred) {
    const g = byDirectory.get(dir);
    if (g && !featured.some((x) => x.directory === g.directory)) featured.push(g);
    if (featured.length >= 6) break;
  }

  if (featured.length < 6) {
    for (const g of games) {
      if (!featured.some((x) => x.directory === g.directory)) featured.push(g);
      if (featured.length >= 6) break;
    }
  }

  const [a, b, c, d, e, f] = featured;
  if (a) featuredCol1.appendChild(createGameLink(a, { withPlayButton: true }));
  if (b) featuredCol1.appendChild(createGameLink(b, { withPlayButton: true }));
  if (c) featuredRow1.appendChild(createGameLink(c, { withPlayButton: true }));
  if (d) featuredRow2.appendChild(createGameLink(d, { withPlayButton: true }));
  if (e) featuredCol2.appendChild(createGameLink(e, { withPlayButton: true }));
  if (f) featuredCol2.appendChild(createGameLink(f, { withPlayButton: true }));
}

function renderGamesGrid(games) {
  if (!gamesContainer) return;
  gamesContainer.replaceChildren();

  // Sort for stable UI.
  const sorted = [...games].sort((a, b) => a.name.localeCompare(b.name));
  for (const game of sorted) {
    gamesContainer.appendChild(createGameLink(game));
  }
}

function wireSearch() {
  if (!input || !gamesContainer) return;

  input.addEventListener('input', () => {
    const searchTerm = input.value.toLowerCase();
    const links = gamesContainer.querySelectorAll('a');
    links.forEach((link) => {
      const img = link.querySelector('img');
      const matches = (img?.alt || '').toLowerCase().includes(searchTerm);
      link.style.display = matches ? '' : 'none';
    });
  });
}

async function init() {
  wireSearch();

  try {
    const res = await fetch('games/games.json', { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to load games.json (${res.status})`);
    const games = await res.json();

    renderFeatured(games);
    renderGamesGrid(games);
  } catch (err) {
    console.error(err);
  }
}

init();