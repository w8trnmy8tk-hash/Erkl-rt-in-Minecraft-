---
name: minecraft-video
description: Erstellt ein komplettes „[Thema], erklärt in Minecraft“-Video (Deutsch, 1:07–1:15, Stimme Mark, ohne Musik, Hook-Kranfahrt, nahtloser Loop) nach den festen Einstellungen in CLAUDE.md. Verwenden, sobald der Nutzer ein neues Minecraft-Erklärvideo verlangt.
---

# Ablauf für ein neues Video (ohne Rückfragen)

Alle Regeln stehen in `CLAUDE.md` – sie sind verbindlich. Vorlage: `narzissmus/`.

1. **Ordner anlegen:** `<thema>/` mit `audio/`; `node_modules` als Symlink auf `../test-video/node_modules`; `render.mjs`, `index.html`, `.gitignore` aus `narzissmus/` kopieren.
2. **Script schreiben** (Aufbau aus CLAUDE.md §2, ca. 245–255 Wörter, Deutsch, Fakten prüfen). Jahreszahlen ggf. ausschreiben, wenn die Stimme sie undeutlich spricht.
3. **Stimme erzeugen:** ElevenLabs Mark (`1SM7GgM6IMuvQlz2BwM3`), `/v1/text-to-speech/<id>/with-timestamps?output_format=mp3_44100_192`, Antwort als `audio/ts_raw.json`, Audio als `audio/vo_raw.mp3`.
4. **Pausen normalisieren:** in `audio/`: `python3 -I ../../test-video/presets/pausen-normalisieren.py` → `vo.mp3` + `words.json`.
5. **Messen:** `HF_HUB_DISABLE_XET=1 python3 -I test-video/presets/tempo-messen.py <thema>/audio/vo.mp3` → muss 196–207 wpm, Komma Ø170–225 ms, Punkt Ø200–260 ms und Länge 67–75 s ergeben. Sonst `speed` anpassen (höher = schneller) und ab 3. wiederholen.
6. **Shotliste** wortbasiert planen (`CUTS = [[wortIndex,'id'], …]`), Ø 2,2–2,7 s pro Shot, Hook nach Preset, Ortsschnitt, Tooltips/Chat an Wörter gekoppelt, letzte 2–4 Wörter über dem Hook-Bild (Loop).
7. **scene.js bauen** auf Basis von `narzissmus/scene.js` (Helfer, Figuren, `heroCam`, UI, Loop-Logik übernehmen; Sets/Shots neu). `SPEECH_END` = hörbares Sprachende messen, `DUR = round((SPEECH_END+0.16)*30)/30`.
8. **Testbilder:** Server `python3 -m http.server 8765` im Repo-Root (im Hintergrund), dann pro Shot ein Frame: `PROJ=<thema> node render.mjs 0 0 test "<frames>"`, ansehen, Kameras/Figuren korrigieren (Gesichter sichtbar, nichts verdeckt, kein Text unter Untertitel).
9. **Voll-Render** in zwei Prozessen parallel (`render.mjs 0 N/2 frames` und `N/2 N frames`).
10. **Ton:** Stimme + leise Effekte (keine Musik, nichts am Loop-Übergang), `loudnorm=I=-14`, dann `python3 -I test-video/presets/audio-loop.py mix_raw.wav mix.wav <DUR>`.
11. **Mux:** `ffmpeg -framerate 30 -i frames/f%04d.png -i audio/mix.wav -frames:v N -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart <thema>-erklaert-in-minecraft.mp4`
12. **Prüfen:** `loop-check.py`, Tempo-Messung am fertigen Video, Kontaktbogen ansehen.
13. **Liefern:** Qualitätstabelle (Länge, Tempo, Pausen, Shotlänge, Loop) + ehrliche Schwächen, committen, pushen, Video senden.
