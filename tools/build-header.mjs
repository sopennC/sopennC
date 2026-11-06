// Builds assets/header-{dark,light}.svg. Text is outlined to paths, so the header
// looks the same on every device and needs no web fonts. Run: npm i && npm run build
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import { Resvg } from '@resvg/resvg-js';

const require = createRequire(import.meta.url);
const load = (p) => opentype.loadSync(require.resolve(p));
const mono = load('@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff');
const symbols = load('@fontsource/noto-sans-symbols-2/files/noto-sans-symbols-2-symbols-400-normal.woff');

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
    text: '#d7dbe0', muted: '#7d8590', accent: '#d77757', shimmer: '#eb9f7f', sheen: '#ffffff',
    hot: ['#ffe2c6', '#ef9a72', '#d77757', '#a8452a'], deep: '#3a1d15',
  },
  light: {
    text: '#2b3138', muted: '#6e7781', accent: '#d77757', shimmer: '#f59575', sheen: '#ffd9c4',
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
const EXTRUDE = 8; // offset copies that make up the solid shadow

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
      extrude += rect(x, y, cw + 0.3, ch + 0.3);
    });
  });
  const copies = Array.from({ length: EXTRUDE }, (_, s) => {
    const f = (s + 1) / EXTRUDE;
    return `<use href="#e" x="${(f * cw * 0.55).toFixed(2)}" y="${(f * ch * 0.3).toFixed(2)}"/>`;
  }).join('');

  return {
    solid,
    bottom: TOP + 6 * ch,
    gradient: (c) => {
      const stops = c.hot.map((h, i) => `<stop offset="${(i / (c.hot.length - 1)).toFixed(2)}" stop-color="${h}"/>`).join('');
      return `<path id="e" d="${extrude}"/>\n<linearGradient id="hot" gradientUnits="userSpaceOnUse" x1="0" y1="${TOP}" x2="0" y2="${(TOP + 6 * ch).toFixed(1)}">${stops}</linearGradient>`;
    },
    markup: (c) => {
      const under = `<g class="show" fill="${c.deep}" style="animation-delay:.72s">${copies}</g>`;
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
// The spinner matches Claude Code: these glyphs forward then back, 120 ms a frame.
const SPINNER = ['·', '✢', '✳', '✶', '✻', '✽'];
const STAR_STILL = 4; // the glyph shown when animation is off
const STAR_SIZE = 27;
const starFrames = [...SPINNER.keys(), ...[...SPINNER.keys()].reverse()];
const starTime = 0.12;
const starCycle = starTime * starFrames.length;
// The verb's highlight also matches: three characters wide, one character per 50 ms,
// starting 10 characters before the word and ending 10 after it.
const SHIMMER_STEP = 0.05;
const SHIMMER_MARGIN = 10;

// A negative delay puts each frame at its place in a loop that runs from page load.
const loopDelay = (at, cycle) => ((at % cycle) - cycle).toFixed(2);

// Each glyph is centred on the same point, so nothing shifts or crosses the image edge.
function spinnerGlyph(ch, cx, cy) {
  const font = ch === '·' ? mono : symbols;
  const box = font.getPath(ch, 0, 0, STAR_SIZE).getBoundingBox();
  const x = cx - (box.x1 + box.x2) / 2;
  const y = cy - (box.y1 + box.y2) / 2;
  return font.getPath(ch, x, y, STAR_SIZE).toPathData(2);
}

// The glow is rendered once here and embedded as a small PNG. A live SVG blur would be
// recomputed by the viewer's browser on every animation frame.
function bakedGlow(c, name, height, blur, scale) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" width="${WIDTH}" height="${height}">
<defs>
<filter id="b" filterUnits="userSpaceOnUse" x="-120" y="-120" width="${WIDTH + 240}" height="${height + 240}"><feGaussianBlur stdDeviation="${blur}"/></filter>
<linearGradient id="ex"><stop offset="0" stop-color="#000"/><stop offset=".06" stop-color="#fff"/><stop offset=".94" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<linearGradient id="ey" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset=".08" stop-color="#fff"/></linearGradient>
<mask id="mx" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${height}"><rect width="${WIDTH}" height="${height}" fill="url(#ex)"/></mask>
<mask id="my" maskUnits="userSpaceOnUse" x="0" y="0" width="${WIDTH}" height="${height}"><rect width="${WIDTH}" height="${height}" fill="url(#ey)"/></mask>
</defs>
<g mask="url(#mx)"><g mask="url(#my)"><path filter="url(#b)" fill="${c.accent}" d="${name.solid}"/></g></g>
</svg>`;
  const png = new Resvg(svg, { fitTo: { mode: 'zoom', value: scale } }).render().asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
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

  // the aura: pre-blurred copies of the name, faded out at the image edges
  parts.push(
    `<defs>
<path id="n" d="${name.solid}"/>
${name.gradient(c)}
<linearGradient id="sheen"><stop offset="0" stop-color="${c.sheen}" stop-opacity="0"/><stop offset=".5" stop-color="${c.sheen}" stop-opacity=".85"/><stop offset="1" stop-color="${c.sheen}" stop-opacity="0"/></linearGradient>
<clipPath id="clip"><use href="#n"/></clipPath>
</defs>
<image class="far" opacity=".3" width="${WIDTH}" height="${HEIGHT}" href="${bakedGlow(c, name, HEIGHT, 24, 0.25)}"/>
<image class="near" opacity="0" width="${WIDTH}" height="${HEIGHT}" href="${bakedGlow(c, name, HEIGHT, 7, 0.34)}"/>`,
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
  const glyphs = SPINNER.map((ch, i) => `<path id="s${i}" d="${spinnerGlyph(ch, 11, spinnerY - 8.5)}"/>`).join('');
  let stillShown = false;
  const starMarkup = starFrames
    .map((glyph, i) => {
      const still = glyph === STAR_STILL && !stillShown;
      if (still) stillShown = true;
      return `<use href="#s${glyph}" class="star" opacity="${still ? 1 : 0}" style="animation-delay:${loopDelay(i * starTime, starCycle)}s"/>`;
    })
    .join('');

  const textX = CHAR * 2;
  const clips = [];
  const verbMarkup = STATES.map((s, i) => {
    const verb = `${s.verb}…`;
    const stats = `(${ELAPSED} · ${s.stat} · esc to interrupt)`;
    const statsX = textX + CHAR * (verb.length + 1);
    const verbPath = outline(mono, verb, textX, spinnerY, MONO_SIZE);
    clips.push(`<clipPath id="v${i}"><path d="${verbPath}"/></clipPath>`);
    const steps = verb.length + 2 * SHIMMER_MARGIN;
    const startX = textX - (SHIMMER_MARGIN + 1) * CHAR;
    const shimmer = `<g clip-path="url(#v${i})"><rect class="shim" x="${startX.toFixed(2)}" y="${(spinnerY - 26).toFixed(2)}" width="${(CHAR * 3).toFixed(2)}" height="34" fill="${c.shimmer}" style="--d:${(steps * CHAR).toFixed(2)}px;animation-duration:${(steps * SHIMMER_STEP).toFixed(2)}s;animation-timing-function:steps(${steps})"/></g>`;
    return `<g class="verb" opacity="${s.still ? 1 : 0}" style="animation-delay:${loopDelay(spinnerStart + i * verbTime, verbCycle)}s"><path fill="${c.accent}" d="${verbPath}"/>${shimmer}<path fill="${c.muted}" d="${outline(mono, stats, statsX, spinnerY, MONO_SIZE)}"/></g>`;
  }).join('\n');

  parts.push(
    `<defs>${glyphs}${clips.join('')}</defs>\n<g class="show" style="animation-delay:${spinnerStart.toFixed(2)}s"><g fill="${c.accent}">${starMarkup}</g>\n${verbMarkup}</g>`,
  );

  const window = (n) => `0%,${(100 / n).toFixed(2)}%{opacity:1}${(100 / n + 0.01).toFixed(2)}%,100%{opacity:0}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-labelledby="t">
<title id="t">${TITLE}</title>
<style>
@keyframes type{from{clip-path:inset(-4px 100% -8px 0)}to{clip-path:inset(-4px 0 -8px 0)}}
@keyframes show{from{opacity:0}to{opacity:1}}
@keyframes verb{${window(STATES.length)}}
@keyframes star{${window(starFrames.length)}}
@keyframes shim{from{transform:translateX(0)}to{transform:translateX(var(--d))}}
@keyframes far{0%{opacity:.3}7%{opacity:.95}20%{opacity:.75}32%{opacity:.3}66%{opacity:.42}100%{opacity:.3}}
@keyframes near{0%{opacity:0}7%{opacity:.7}20%{opacity:.45}30%{opacity:0}100%{opacity:0}}
@keyframes sweep{0%,3%{transform:translateX(0)}19%,100%{transform:translateX(${WIDTH + 400}px)}}
.type-a{animation:type ${commandTime}s steps(${COMMAND.length}) ${commandStart}s backwards}
.type-b{animation:type ${promptTime}s steps(${PROMPT.length}) ${promptStart.toFixed(2)}s backwards}
.show{animation:show .01s linear backwards}
.verb{animation:verb ${verbCycle.toFixed(1)}s linear infinite}
.star{animation:star ${starCycle.toFixed(2)}s linear infinite}
.shim{animation:shim 1s linear infinite}
.far{animation:far ${verbCycle.toFixed(1)}s steps(9) ${flareDelay}s infinite}
.near{animation:near ${verbCycle.toFixed(1)}s steps(9) ${flareDelay}s infinite}
.sweep{animation:sweep ${verbCycle.toFixed(1)}s linear ${flareDelay}s infinite}
@media (prefers-reduced-motion:reduce){.type-a,.type-b,.show,.verb,.star,.shim,.far,.near,.sweep{animation:none}}
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
