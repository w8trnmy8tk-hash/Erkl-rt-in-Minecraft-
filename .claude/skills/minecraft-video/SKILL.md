---
name: minecraft-video
description: Erstellt ein komplettes „[Thema], erklärt in Minecraft“-Video (Deutsch, 1:08–1:15, RPM-optimiert, Stimme Mark, ohne Musik/Whoosh, Hook-Kranfahrt synchron auf „erklärt“, nahtloser Loop) nach den festen Einstellungen in CLAUDE.md. Verwenden, sobald der Nutzer nur „… erklärt in Minecraft“ schreibt oder ein neues Minecraft-Erklärvideo verlangt.
---

# Ablauf für ein neues Video (ohne Rückfragen)

Alle Regeln stehen in `CLAUDE.md` – sie sind verbindlich. **Vorlage: `hypergamie/`.** Werkzeuge in `test-video/presets/`. Befehle vom Repo-Root aus, außer anders angegeben.

0. **Umgebung (frischer Container):** `ls test-video/node_modules || (cd test-video && npm ci)`; `python3 -c "import faster_whisper" || pip install -q faster-whisper`; Server im Hintergrund: `python3 -m http.server 8765` (Repo-Root, langer Timeout).
1. **Ordner anlegen:** `<thema>/audio/`; `ln -s ../test-video/node_modules <thema>/node_modules`; `render.mjs`, `index.html`, `.gitignore` aus `hypergamie/` kopieren (`.gitignore` darf `audio/ts_raw.json` NICHT ignorieren).
2. **Thema prüfen + Script schreiben** (CLAUDE.md §2 und §10: werbefreundliches Thema, offene Frage in Satz 2–3, Spannung bei ~30/60 s, Wendung, Fachbegriff gesprochen; ca. 245–255 Wörter, Deutsch, Fakten/Jahreszahlen/Quellen prüfen) → `audio/script.txt`. Zahlen ausschreiben.
3. **Stimme erzeugen:** `audio/req.json` = `{"text":…, "model_id":"eleven_multilingual_v2", "language_code":"de", "voice_settings":{"stability":0.5,"similarity_boost":0.8,"style":0.1,"speed":1.17}}`, dann
   `curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/1SM7GgM6IMuvQlz2BwM3/with-timestamps?output_format=mp3_44100_192" -H "Content-Type: application/json" -H "xi-api-key: dummy" --data-binary @req.json -o ts_raw.json` und `audio_base64` → `vo_raw.mp3`.
4. **Pausen normalisieren:** in `<thema>/audio/`: `python3 -I ../../test-video/presets/pausen-normalisieren.py 0.24 0.20 0.10` → `vo.mp3` + `words.json`.
5. **Messen:** `HF_HUB_DISABLE_XET=1 python3 -I test-video/presets/tempo-messen.py <thema>/audio/vo.mp3` → 196–207 wpm, Komma Ø170–225 ms, Punkt Ø200–260 ms, 67–75 s. Pausen über TP/TC nachjustieren; Tempo grob über `speed` (dann ab 3.). Whisper-Aussetzer → mit `ffmpeg -af adelay=300` versetzt nochmal messen.
   **Knacks-Prüfung:** `python3 -I test-video/presets/knacks-pruefen.py <thema>/audio/vo.mp3` muss „OK“ melden.
6. **Kranfahrt-Sync:** `cp <thema>/audio/words.json <thema>/words.json`; `python3 -I test-video/presets/erklaert-onset.py <thema>/audio/vo.mp3 <thema>/words.json --fix`.
7. **Shotliste** wortbasiert (`CUTS = [[wortIndex,'id'], …]`), Ø 2,2–2,7 s pro Shot, Hook nach Preset, Ortsschnitt, Tooltips/Chat an Wörter gekoppelt, letzte 2–4 Wörter über dem Hook-Bild (Loop).
8. **scene.js bauen** auf Basis von `hypergamie/scene.js` (Helfer, Figuren, `heroCam` mit naher Endposition, `WHIP0 = wt(1) - 1/30`, UI inkl. Toast, Loop-Logik übernehmen). **Sets, Star-Objekt, Figuren-Skins und Mimik komplett neu** (CLAUDE.md §6) – keine Kulisse aus früheren Videos. `SPEECH_END` = hörbares Sprachende (letzter Frame > −45 dB) messen, `DUR = round((SPEECH_END+0.16)*30)/30`.
9. **Testbilder:** pro Shot ein Frame (gegen Shot-Ende, damit Tooltips sichtbar sind): `PROJ=<thema> node render.mjs 0 0 test "<frames>"`, Kontaktbogen mit ffmpeg `tile` ansehen, korrigieren (Gesichter sichtbar, nichts verdeckt, kein Text unter dem Untertitel, Schild oben im Bild). **Kontaktbogen neben die letzten zwei Videos legen:** wiederholt sich ein Ort/Raum/eine Figur → umbauen.
10. **Voll-Render** in zwei Prozessen parallel (`render.mjs 0 N/2 frames` und `N/2 N frames`), auf Fertigstellung warten (Hintergrund-Schleife, nicht pollen).
11. **Ton:** `python3 test-video/presets/ton-mischen.py <thema> <DUR> --pops <Tooltip-Wortindizes> [--chime i] [--poof i]` → `audio/mix.wav` (−14 LUFS, nahtlos, kein Whoosh, keine Musik).
12. **Mux:** `ffmpeg -framerate 30 -i frames/f%04d.png -i audio/mix.wav -frames:v N -c:v libx264 -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart <thema>-erklaert-in-minecraft.mp4`
13. **Prüfen:** `loop-check.py`, `knacks-pruefen.py` am Video, Lautheit (ebur128), Tempo-Messung, Sync (erste sichtbare Kamerabewegung ≤ 1 Frame neben hörbarem „erklärt“), Kontaktbogen ansehen.
13b. **Cover:** `<thema>/cover.png` (1080×1920) rendern – Star-Objekt groß, Hauptfigur mit Mimik, 2–3 Wörter Titel oben (CLAUDE.md §10).
14. **Liefern:** Cover + Upload-Hinweise (Titel, Hashtags, KI-Label, §10), Qualitätstabelle (Länge, Tempo, Pausen, Shotlänge, Loop, Lautheit, Sync) + ehrliche Schwächen, committen (inkl. `ts_raw.json`, `vo_raw.mp3`), pushen, Video senden.
