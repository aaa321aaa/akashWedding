# আকাশ ❤️ অনামিকা — রাজকীয় বাঙালি হিন্দু বিবাহ

**AKASH ❤️ ANAMIKA — The Royal Bengali Hindu Wedding Experience**

A cinematic, fully interactive 3D wedding invitation built with **HTML5, CSS3, vanilla JavaScript (ES modules), Three.js r160 and GSAP 3 + ScrollTrigger**. Every visible word on the page is Bengali Unicode. All 3D models are procedural (built in code), so the project needs no external model or image files.

---

## Running it locally

ES modules do not load from `file://`, so serve the folder over HTTP. Any static server works:

```bash
# Node.js
npx serve .
# or
npx http-server -p 8080 .

# Python 3
python -m http.server 8080
```

Then open `http://localhost:8080/` in a current version of Chrome, Edge, Safari or Firefox.

> Internet access is needed: Three.js loads from jsDelivr, GSAP from cdnjs, and the fonts from Google Fonts.
> For a fully offline copy, download those files, put them under `assets/`, and update the `importmap` and `<script>` tags in `index.html`.

### Deploying

The project is a plain static site. Upload the whole folder to Netlify, Vercel, GitHub Pages, Cloudflare Pages or any web host. There is no build step.

---

## The experience, scene by scene

| # | Scene | What happens |
|---|---|---|
| 1 | **Palace entrance** (প্রবেশদ্বার) | A procedural 3D Rajbari: carved gold doors, pillars, domes, jharokha windows, velvet curtains, marigold toran, diyas and a lotus pond. The camera slowly approaches the doors. |
| 2 | **Door opening** (প্রবেশ করুন) | Both doors swing open on their hinges with a GSAP timeline. Golden light pours out, hundreds of petals and a flight of butterflies fly toward the camera, and the camera passes through the doorway into the palace hall. |
| 3 | **3D invitation** (নিমন্ত্রণপত্র খুলুন) | A floating maroon-velvet card with gold edges and a gold seal. On click: the card turns to face you, the seal breaks in two, the cover opens on its hinge, the inner card slides forward, and the names appear while butterflies circle them. |
| 4 | **Mandap** (শুভ বিবাহ) | A Bengali chhadnatala: four gold pillars, banana plants, mangal ghat, yagna fire, piri seats, velvet canopy, marigold garlands, a chandelier and diyas. The camera orbits slowly. |
| 5 | **Two families** (শুভ পরিণয়ের শুভক্ষণে) | A lotus pond with floating diyas between two pavilions, plus two tilting 3D family cards. |
| 6 | **New chapter** (একটি নতুন সম্পর্কের সূচনা) | A royal garden with a flower arch, fountain, blossom trees and string lights. The text reveals word by word. |
| 7 | **Ceremony schedule** (অনুষ্ঠান সূচি) | Three separate 3D environments: a yellow marigold wall for gaye holud, a grand royal mandap for the wedding (light, falling petals, butterflies and a gold frame), and a champagne-gold banquet hall with banana-leaf plates for the bouvat. A glowing timeline fills as you scroll. |
| 8 | **Final blessing** (আশীর্বাদ) | A sunset garden with a lotus lake and a distant Rajbari. As you keep scrolling, the camera pulls back to reveal the whole garden. |

**Throughout:** 3D butterflies (two wings each, flapping, curved flight paths, mouse-responsive, gold sparkle trails), falling rose and marigold petals, gold dust, flickering diya flames, swaying chandeliers and lanterns, and lotuses that bloom when clicked.

---

## Project structure

```
akash-anamika-wedding/
├── index.html              Page markup, all Bengali content, import map
├── css/
│   ├── typography.css      Bengali fonts, sizes, gold text
│   ├── style.css           Layout, panels, cards, buttons, fallback styles
│   ├── animations.css      CSS keyframes, reduced-motion overrides
│   └── responsive.css      Tablet and mobile adjustments
├── js/
│   ├── main.js             Startup, loader, scene assembly, WebGL fallback
│   ├── three-scene.js      Renderer, camera rig, sky shader, lights, quality tiers
│   ├── textures.js         Canvas-drawn textures (alpana, carving, wings, petals…)
│   ├── decor.js            Materials and reusable props, static-geometry merging
│   ├── palace.js           Palace facade, hinged doors, palace hall
│   ├── invitation.js       3D invitation card and its opening animation
│   ├── mandap.js           Bengali wedding mandap (normal and grand versions)
│   ├── environments.js     Courtyard, family pond, garden, haldi, wedding, bouvat, finale
│   ├── butterflies.js      3D butterfly system
│   ├── particles.js        Petals (ambient and burst), gold dust, sparkles
│   ├── animations.js       GSAP timelines, scroll-driven camera, text reveals
│   ├── interactions.js     Card tilt, lotus raycasting, click sparkles
│   └── music.js            Optional instrumental music
├── assets/
│   ├── audio/              ← put wedding-instrumental.mp3 here (optional)
│   ├── images/  models/  textures/
└── README.md
```

---

## Music

- Soft music starts when the visitor clicks **প্রবেশ করুন** (a user action, so browsers allow it). The music button (bottom left) turns it off or on again.
- If `assets/audio/wedding-instrumental.mp3` exists, it plays on a loop with fade-in and fade-out.
- Otherwise the site plays a soft instrumental generated in the browser with Web Audio: a tanpura-style drone, a shehnai/flute-style melody in a Bhupali-like pentatonic scale, and temple-bell accents. No audio file is needed for this.
- To use your own track, add a royalty-free or licensed MP3 with exactly that filename.

---

## Performance and accessibility

- **Quality tiers** (`high` / `medium` / `low`) are chosen from device type, memory and CPU cores. They control pixel ratio, shadows, and the number of butterflies, petals and particles.
- **Static-geometry merging:** each environment's non-animated meshes are merged per material, so a frame needs only a few hundred draw calls.
- **Distance culling:** scenes far from the camera are hidden.
- **Object pooling** for petal bursts and sparkles. Typed arrays are updated in place with no per-frame allocation in hot loops.
- The render loop pauses when the tab is hidden. Resizing and orientation changes are handled.
- **`prefers-reduced-motion`:** shorter timelines, no camera sway or orbit, fewer particles, slower butterflies, and CSS animations turned off.
- **WebGL fallback:** without WebGL the site shows a styled 2D version with all the same Bengali content.
- **Bengali text** is revealed word by word, never letter by letter, so conjuncts (যুক্তাক্ষর) never break.
- Scroll stays fully in the visitor's control. Camera moves follow the scroll position, and the side navigation (desktop) jumps between scenes.

---

## Editing the content

All wedding details are plain Bengali text in `index.html`. The 3D invitation cover text is drawn in `js/invitation.js` (`coverFrontTexture`). If you change a name, update it in both files.

Wedding details used (unchanged from the brief):

- **বর:** আকাশ ঘোষ — পিতা: শ্রী মুকুল ঘোষ, মাতা: শ্রীমতী মমতা রাণী ঘোষ
- **কনে:** অনামিকা ঘোষ — পিতা: শ্রী অজিত ঘোষ, মাতা: শ্রীমতী সঙ্গীতা রাণী ঘোষ
- **গায়ে হলুদ:** ১২ ডিসেম্বর ২০২৬, শনিবার
- **শুভ বিবাহ:** ১৩ ডিসেম্বর ২০২৬, রবিবার — সন্ধ্যা ৫:১৪:৫০ গতে রাত্রি ১২:২৯:০৭ মধ্যে
- **প্রীতিভোজ (বৌভাত):** ১৫ ডিসেম্বর ২০২৬, মঙ্গলবার — দুপুর ১ ঘটিকা

No venue or address is included, because none was provided.
