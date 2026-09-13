# Verification record

- 1,024 generated stage checks (256 seeds × 4 stage numbers): physical traversal passes before and after optional generation, with repairs applied where necessary.
- 64 separate control-driven descents: baseline player controller, no enemies/traps, no bombs/cables/upgrades used, no fall damage. This demonstrates navigation, not guaranteed survival against enemies.
- 35 system checks cover movement, equipment, each weapon type, destruction, reactor chains, traps, merchants, theft, keycards, fall damage, restart, pursuit and stage completion. Machine-readable results are in `tests/results.json` and `tests/traversal-results.json`.
- Whole-HTML DOM/Canvas checks: startup, instant touch taps, pause/resume, high-refresh input retention, renderer branches and canvas resizing at 873×393, 1280×720, 720×480, 1024×440 and 393×873. Canvas resizing is not a substitute for native device layout testing.
- Live browser checks performed through the supervised game preview: title/start, visible world and HUD, touch cable deployment (4 → 3), pause and refresh. No application startup error was reported in that check. Fullscreen was requested but the cloud browser did not enter fullscreen; device fullscreen remains unverified.
- Physical controllers and Android hardware were unavailable. Gamepad bindings are implemented, but physical-device verification remains outstanding.
- The current browser did not expose WebMCP registration. Its optional tool definitions are tested in the offline DOM harness; live WebMCP validation is unavailable.

The tests found and led to fixes for startup ordering, taps lost between frames, blast damage incorrectly reduced by frontal armor, and the traversal controller failing to vault caught ledges.
