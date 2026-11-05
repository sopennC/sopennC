// Builds assets/header-{dark,light}.svg. Text is outlined to paths, so the header
// looks the same on every device and needs no web fonts. Run: npm i && npm run build
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const load = (p) => opentype.loadSync(require.resolve(p));
const mono = load('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff');

// ---- edit the content here ----------------------------------------------
const TITLE = 'sopennC, engineer at Avito. A Claude Code session is running.';
const CWD = '~/avito';
const COMMAND = 'claude --dangerously-skip-permissions';
const PROMPT = "explain like i'm a 5 year old autist";
const ELAPSED = '3h 41m';
// `still` is what shows when animation is off; `aura` makes the name flare up.
const STATES = [
  { verb: 'Cooking', stat: '↓ 412k tokens', still: true },
  { verb: 'Aura farming', stat: '+1000 aura', aura: true },
  { verb: 'Locking in', stat: '↓ 415k tokens' },
  { verb: 'Thinking', stat: '↓ 416k tokens' },
];
const THEMES = {
  dark: {
    text: '#d7dbe0', muted: '#7d8590', accent: '#d97757', sheen: '#ffffff',
    hot: ['#ffe2c6', '#ef9a72', '#d97757', '#a8452a'], deep: '#3a1d15',
  },
  light: {
    text: '#2b3138', muted: '#6e7781', accent: '#b8532f', sheen: '#ffd9c4',
    hot: ['#e58a63', '#c9623c', '#b8532f', '#7d3218'], deep: '#efd2c4',
  },
};
// -------------------------------------------------------------------------

const WIDTH = 850;
const MONO_SIZE = 24;
const LINE = 40;
const CHAR = mono.getAdvanceWidth('0', MONO_SIZE);
const TOP = 34; // room for the glow above the name

const outline = (font, str, x, y, size) => font.getPath(str, x, y, size).toPathData(2);

// Block letters in the style of a CLI splash screen, drawn from rectangles.
const BLOCKS = {
  S: ['███████╗', '██╔════╝', '███████╗', '╚════██║', '███████║', '╚══════╝'],
  O: [' ██████╗ ', '██╔═══██╗', '██║   ██║', '██║   ██║', '╚██████╔╝', ' ╚═════╝ '],
  P: ['██████╗ ', '██╔══██╗', '██████╔╝', '██╔═══╝ ', '██║     ', '╚═╝     '],
  E: ['███████╗', '██╔════╝', '█████╗  ', '██╔══╝  ', '███████╗', '╚══════╝'],
  N: ['███╗   ██╗', '████╗  ██║', '██╔██╗ ██║', '██║╚██╗██║', '██║ ╚████║', '╚═╝  ╚═══╝'],
  C: [' ██████╗', '██╔════╝', '██║     ', '██║     ', '╚██████╗', ' ╚═════╝'],
};
const BANDS = 3; // horizontal slices per text row
const BUCKETS = 10; // cells switch on in this many random batches

function seeded(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function blockName() {
  const rows = [0, 1, 2, 3, 4, 5].map((r) => [...'SOPENNC'].map((l) => BLOCKS[l][r]).join(''));
  const cw = WIDTH / rows[0].length;
  const ch = cw * 2;
  const pitch = ch / BANDS;
  const rect = (x, y, w, h) => `M${x.toFixed(2)} ${y.toFixed(2)}h${w.toFixed(2)}v${h.toFixed(2)}h${(-w).toFixed(2)}z`;
  // Solid on top; the slits between slices widen towards the bottom.
  const gap = (k) => Math.max(0, k - 5) * 0.46;
  const random = seeded(7);

  const buckets = Array.from({ length: BUCKETS }, () => '');
  let solid = '';
  let extrude = '';
  rows.forEach((row, r) => {
    [...row].forEach((g, i) => {
      if (g !== '█') return; // the figlet shadow glyphs are replaced by a solid extrusion
      const x = i * cw;
      const y = TOP + r * ch;
      let cell = '';
      for (let n = 0; n < BANDS; n++) {
        const k = r * BANDS + n;
        cell += rect(x, y + n * pitch, cw + 0.3, pitch - gap(k) + (gap(k) ? 0 : 0.3));
      }
      buckets[Math.floor(random() * BUCKETS)] += cell;
      solid += cell;
      for (let s = 1; s <= 3; s++) extrude += rect(x + (s * cw * 0.55) / 3, y + (s * ch * 0.3) / 3, cw + 0.3, ch + 0.3);
    });
  });

  return {
    solid,
    bottom: TOP + 6 * ch,
    gradient: (c) => {
      const stops = c.hot.map((h, i) => `<stop offset="${(i / (c.hot.length - 1)).toFixed(2)}" stop-color="${h}"/>`).join('');
      return `<linearGradient id="hot" gradientUnits="userSpaceOnUse" x1="0" y1="${TOP}" x2="0" y2="${(TOP + 6 * ch).toFixed(1)}">${stops}</linearGradient>`;
    },
    markup: (c) => {
      const under = `<path class="show" fill="${c.deep}" style="animation-delay:.72s" d="${extrude}"/>`;
      const cells = buckets
        .map((d, i) => `<path class="show" fill="url(#hot)" style="animation-delay:${(0.08 + i * 0.065).toFixed(2)}s" d="${d}"/>`)
        .join('\n');
      // The batches only exist for the boot-up; one merged path then covers their seams.
      return `${under}\n${cells}\n<use href="#n" fill="url(#hot)" class="show" style="animation-delay:.76s"/>`;
    },
  };
}

// timeline, seconds
const commandStart = 0.85;
const commandTime = 0.9;
const promptStart = commandStart + commandTime + 0.25;
const promptTime = 0.8;
const spinnerStart = promptStart + promptTime + 0.25;
const verbTime = 2.5;
const verbCycle = verbTime * STATES.length;
const starTime = 0.2;
const STAR_FRAMES = [0, 4, 6, 8, 6, 4]; // arm count; 0 draws a dot
const starCycle = starTime * STAR_FRAMES.length;

// A negative delay puts each frame at its place in a loop that runs from page load.
const loopDelay = (at, cycle) => ((at % cycle) - cycle).toFixed(2);

function star(cx, cy, arms) {
  if (arms === 0) return `<circle cx="${cx}" cy="${cy}" r="2.6"/>`;
  const inner = 2.2;
  const outer = 9.5;
  const d = [];
  for (let i = 0; i < arms; i++) {
    const a = (Math.PI * 2 * i) / arms + Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    d.push(
      `M${(cx + inner * c).toFixed(2)} ${(cy - inner * s).toFixed(2)}L${(cx + outer * c).toFixed(2)} ${(cy - outer * s).toFixed(2)}`,
    );
  }
  return `<path d="${d.join('')}"/>`;
}

function build(c, name) {
  const commandY = name.bottom + 50;
  const promptY = commandY + LINE;
  const spinnerY = promptY + LINE + 8;
  const HEIGHT = Math.ceil(spinnerY + 34);
  const auraIndex = STATES.findIndex((s) => s.aura);
  const flareDelay = loopDelay(spinnerStart + auraIndex * verbTime, verbCycle);

  const parts = [];
  const path = (fill, d, attrs = '') => parts.push(`<path fill="${fill}" ${attrs}d="${d}"/>`);

  // the aura: blurred copies of the name, faded out at the image edges
  const box = `filterUnits="userSpaceOnUse" x="-120" y="-120" width="${WIDTH + 240}" height="${HEIGHT + 240}"`;
  parts.push(
    `<defs>
<path id="n" d="${name.solid}"/>
${name.gradient(c)}
<filter id="far" ${box}><feGaussianBlur stdDeviation="24"/></filter>
<filter id="near" ${box}><feGaussianBlur stdDeviation="7"/></filter>
<linearGradient id="ex"><stop offset="0" stop-color="#000"/><stop offset=".06" stop-color="#fff"/><stop offset=".94" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<linearGradient id="ey" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".08" stop-color="#fff"/></linearGradient>
<mask id="mx" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ex)"/></mask>
<mask id="my" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="url(#ey)"/></mask>
<linearGradient id="sheen"><stop offset="0" stop-color="${c.sheen}" stop-opacity="0"/><stop offset=".5" stop-color="${c.sheen}" stop-opacity=".85"/><stop offset="1" stop-color="${c.sheen}" stop-opacity="0"/></linearGradient>
<clipPath id="clip"><use href="#n"/></clipPath>
</defs>
<g mask="url(#mx)"><g mask="url(#my)" fill="${c.accent}">
<g class="far" opacity=".3" filter="url(#far)"><use href="#n"/></g>
<g class="near" opacity="0" filter="url(#near)"><use href="#n"/></g>
</g></g>`,
  );

  parts.push(name.markup(c));
  parts.push(`<g clip-path="url(#clip)"><rect class="sweep" x="-300" y="0" width="240" height="${HEIGHT}" fill="url(#sheen)"/></g>`);

  // ~/avito $ claude ...
  const cwdDelay = `style="animation-delay:${commandStart.toFixed(2)}s" `;
  path(c.muted, outline(mono, CWD, 0, commandY, MONO_SIZE), `class="show" ${cwdDelay}`);
  const dollarX = CHAR * (CWD.length + 1);
  path(c.accent, outline(mono, '$', dollarX, commandY, MONO_SIZE), `class="show" ${cwdDelay}`);
  path(c.text, outline(mono, COMMAND, dollarX + CHAR * 2, commandY, MONO_SIZE), `class="type-a" `);

  // > the prompt
  path(c.accent, outline(mono, '>', 0, promptY, MONO_SIZE), `class="show" style="animation-delay:${promptStart.toFixed(2)}s" `);
  path(c.text, outline(mono, PROMPT, CHAR * 2, promptY, MONO_SIZE), `class="type-b" `);

  // spinner line
  const starMarkup = STAR_FRAMES.map((arms, i) => {
    const still = arms === 8;
    return `<g class="star" opacity="${still ? 1 : 0}" style="animation-delay:${loopDelay(i * starTime, starCycle)}s">${star(CHAR / 2, spinnerY - 8, arms)}</g>`;
  }).join('');

  const textX = CHAR * 2;
  const verbMarkup = STATES.map((s, i) => {
    const verb = `${s.verb}…`;
    const stats = `(${ELAPSED} · ${s.stat} · esc to interrupt)`;
    const statsX = textX + CHAR * (verb.length + 1);
    return `<g class="verb" opacity="${s.still ? 1 : 0}" style="animation-delay:${loopDelay(spinnerStart + i * verbTime, verbCycle)}s"><path fill="${c.accent}" d="${outline(mono, verb, textX, spinnerY, MONO_SIZE)}"/><path fill="${c.muted}" d="${outline(mono, stats, statsX, spinnerY, MONO_SIZE)}"/></g>`;
  }).join('\n');

  parts.push(
    `<g class="show" style="animation-delay:${spinnerStart.toFixed(2)}s"><g fill="${c.accent}" stroke="${c.accent}" stroke-width="2.6" stroke-linecap="round">${starMarkup}</g>\n${verbMarkup}</g>`,
  );

  const window = (n) => `0%,${(100 / n).toFixed(2)}%{opacity:1}${(100 / n + 0.01).toFixed(2)}%,100%{opacity:0}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-labelledby="t">
<title id="t">${TITLE}</title>
<style>
@keyframes type{from{clip-path:inset(-4px 100% -8px 0)}to{clip-path:inset(-4px 0 -8px 0)}}
@keyframes show{from{opacity:0}to{opacity:1}}
@keyframes verb{${window(STATES.length)}}
@keyframes star{${window(STAR_FRAMES.length)}}
@keyframes far{0%{opacity:.3}7%{opacity:.95}20%{opacity:.75}32%{opacity:.3}66%{opacity:.42}100%{opacity:.3}}
@keyframes near{0%{opacity:0}7%{opacity:.7}20%{opacity:.45}30%{opacity:0}100%{opacity:0}}
@keyframes sweep{0%,3%{transform:translateX(0)}19%,100%{transform:translateX(${WIDTH + 400}px)}}
.type-a{animation:type ${commandTime}s steps(${COMMAND.length}) ${commandStart}s backwards}
.type-b{animation:type ${promptTime}s steps(${PROMPT.length}) ${promptStart.toFixed(2)}s backwards}
.show{animation:show .01s linear backwards}
.verb{animation:verb ${verbCycle.toFixed(1)}s linear infinite}
.star{animation:star ${starCycle.toFixed(1)}s linear infinite}
.far{animation:far ${verbCycle.toFixed(1)}s steps(9) ${flareDelay}s infinite}
.near{animation:near ${verbCycle.toFixed(1)}s steps(9) ${flareDelay}s infinite}
.sweep{animation:sweep ${verbCycle.toFixed(1)}s linear ${flareDelay}s infinite}
@media (prefers-reduced-motion:reduce){.type-a,.type-b,.show,.verb,.star,.far,.near,.sweep{animation:none}}
</style>
${parts.join('\n')}
</svg>
`;
}

const write = (file, svg) => {
  writeFileSync(new URL(`../assets/${file}`, import.meta.url), svg);
  console.log(`${file}  ${(svg.length / 1024).toFixed(1)} KB`);
};

const name = blockName();
for (const [theme, palette] of Object.entries(THEMES)) write(`header-${theme}.svg`, build(palette, name));
