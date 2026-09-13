# NEON DESCENT

A playable, original science-fiction action roguelike for mobile landscape. Four procedural stages, a destructible megastructure, limited supplies, dangerous shops, and one life. Original Canvas artwork, procedural character animation, and synthesized audio; no external game assets or runtime dependencies.

## Play

Open **Neon-Descent.html** in a modern browser. All gameplay code, art and sound synthesis are inside the file. Use landscape orientation on a phone. The top-right fullscreen button works where the browser permits it. Alternatively, serve the project directory and open `index.html`; the hosted build includes a web manifest and offline service worker.

## Controls

| Action | Keyboard | Xbox-style controller |
|---|---|---|
| Move / crouch / climb | Arrows or WASD | Left stick / D-pad |
| Jump; hold for higher jump or backpack ability | Space / Z | A |
| Attack / fire / throw carried object | J / X | X |
| Plasma charge | K / C | B / RB |
| Mag-cable | L / V | Y / LB |
| Interact / inspect / buy / equip / lift | E | RT / LT |
| Careful walk | Shift | Left stick click |
| Pause | P / Escape | Start |

Touch buttons provide the same actions. Pause offers control size and opacity. Hold DOWN + charge to place it; DOWN + cable extends it below a ledge. DOWN + USE puts back a held object. DOWN + ATTACK drops a weapon. UP / JUMP vaults a caught ledge. DOWN + JUMP drops through moving platforms.

At shops, USE inspects an item; USE again purchases. ATTACK or leaving with unpaid merchandise steals it and makes merchants hostile for the rest of the run. Every new stage has a validated natural route; optional vaults need a keycard, override, explosives, digging, or an energy relay. Long falls and your own explosions are dangerous. The Null Warden arrives after three minutes.

## Implemented

- 4 × 4 room grid, six room templates, seeded generation, optional upper branches and security vaults, seven stage conditions, before/after traversal checks and connector repair.
- Destructible composite, reinforced metal, glass, reactor blocks, crumbling surfaces, locked doors, power-controlled energy barriers and indestructible boundaries.
- Charges with fuse, bounce, sticky upgrade, chain reactions, debris and blast impulses; consumable climbable cables; permanent ladders; ledge catches; fall damage.
- 25 working items: all 24 items from the brief plus health injectors. See `src/core.js` for descriptions, prices, slots and identifiers. One backpack and one carried weapon at a time; finite firearm ammo/tool durability; recoverable bolts.
- Crawlers, wall skitters, burrow drones, flyers, shock slugs, sentries, armored enforcers, detonation drones, phase creatures and mimic crates; armed Q-9 merchants with persistent wanted behavior.
- Six traps: mines, retractable spikes, electrical floors, plasma turrets, lasers and crushers. Moving platforms, random crates, currency and throwing interactions.
- Animated suit, equipment, robots, machinery, weapons and effects; layered environment; blackout visibility; original Web Audio sounds and ambient tones.
- Death/restart, extraction endpoint, seed replay, pause, touch controls, standard gamepad mapping and fullscreen request.

## Development

`python3 build.py` assembles the source into both standalone HTML entrypoints. No build dependencies are needed for this step.

`npm install` then `npm run dev` starts the optional Vite development server. Vite is only a development dependency; the distributed game runs without it.

`npm test` runs the main physics/system suite. `node tests/traverse.cjs` drives 64 generated stages through the normal player controls with hazards/enemies removed, requiring no resources or health loss. `tests/dom-test.cjs` additionally requires `jsdom` and `@napi-rs/canvas`; it tests the complete HTML boot, rapid pointer taps, rendering and DOM interactions. See `TESTING.md` for the distinction between automated and browser checks.

## Where to tune generation

- `src/core.js`: `C` contains physics, fall threshold, particle limit and pursuit timing. `ROOM_TEMPLATES` and `generate()` define room interiors, connecting shafts, optional rooms, enemy pools, shop categories, loot and hazard placement. `MODIFIERS` controls condition names and the generation branches below apply them.
- `validate()` in the same file physically traverses the designated route using `move()`, with baseline abilities and permanent ladders. Failed stages are repaired and rechecked; an unrepairable stage throws rather than silently shipping.
- Tile size and room-grid dimensions are currently fixed throughout the generator and renderer. Do not change just the dimension constants: update the associated loop bounds and rerun the validation suite.
- `src/game.js`: combat, movement, equipment effects, enemy AI, loot and interactions.
- `src/render.js`: authored tile patterns, procedural sprites, lighting and animated drawing.
- `src/ui.js` / `src/style.css`: touch/keyboard/gamepad controls, menus, HUD and layout.

## First-build limits

This is a playable first build, not feature parity with Spelunky 2. There is one biome and an extraction ending, no boss or metaprogression. Run progress is not saved across reloads. Control position is fixed; size and opacity can be changed. Conveyor belts, fluid simulation, a full music score and shopkeeper cover tactics are not implemented. Enemy behavior is deliberately compact. No APK has been built. Physical Android/gamepad performance, device-specific fullscreen behavior and install prompts still need device testing. WebMCP agent controls are optional and ignored where unsupported.

## Design reference

The route-first, room-template approach was informed by [Darius Kazemi's Spelunky Generator Lessons](https://tinysubversions.com/spelunkyGen/). This game uses its own source, room layouts, graphics, audio, setting and characters.
