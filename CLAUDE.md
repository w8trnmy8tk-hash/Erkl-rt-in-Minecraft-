# „… erklärt in Minecraft“ – feste Einstellungen (IMMER verwenden)

Dieses Repo produziert vertikale Kurzvideos im Stil der Referenzvideos (@science.craft82).
**Wenn der Nutzer ein neues Video verlangt („mach ein … erklärt in Minecraft“), gelten automatisch ALLE Regeln unten – ohne Rückfrage.**
Nicht nach Länge, Stimme, Sprache oder Stil fragen. Einfach nach diesen Regeln umsetzen und das fertige Video liefern.

Vorlage zum Kopieren: `narzissmus/` (Endprodukt, erfüllt alle Kriterien). Ablauf siehe Skill `/minecraft-video` (`.claude/skills/minecraft-video/SKILL.md`).
Details und Messwerte: `analyse/video-analyse.md`, `test-video/presets/hook-kranfahrt.json`.

## 1. Format
- 1080×1920, 30 fps, H.264 + AAC, Loudness −14 LUFS
- **Sprache: Deutsch**
- **Länge: 1:07–1:15 (67–75 s)**, bei größeren Themen auch länger → ca. 245–255 Wörter
- **Stimme: ElevenLabs „Mark – Casual, Relaxed and Light“** (`1SM7GgM6IMuvQlz2BwM3`), `eleven_multilingual_v2`, language_code `de`, stability 0.5, similarity 0.8, style 0.1, speed ≈1.14 (anpassen, bis Tempo stimmt)
- **Keine Musik.** Nur leise Effekte (Whoosh zur Kranfahrt, Pop bei Tooltips, Poof/Chime selten), nie über dem Loop-Übergang

## 2. Script-Aufbau (wie Referenzen)
1. `[Thema], erklärt in Minecraft.`
2. Ort + Zeit (`Griechenland, vor 2000 Jahren.`) → harter Schnitt auf das Ortswort, Establishing-Totale + `[Info]`-Label
3. Hauptfigur(en) + Normalzustand, dann „Dann / Doch / Bis …“ → Eskalation, ein Beat pro Satz
4. Kurze Reveal-Sätze bekommen eigene Kurz-Shots; Fachbegriffe als Tooltip („Das nennt man …“)
5. Auflösung in 1–2 Sätzen
6. `[Autor/Quelle] zeigt: [Kernaussage ≤ 10 Wörter].` → Schild bei Sonnenuntergang (rote Zeile `AUTOR, JAHR`, darunter die Aussage)
7. Der letzte Satz fließt in den Titel; seine letzten 2–4 Wörter laufen schon über dem ersten Bild (Loop)
- Kurze Hauptsätze, Präsens, Figuren mit Rollen-Etikett einführen, Fakten korrekt, sensible Themen verantwortungsvoll (z. B. Gefahren klar benennen, nichts Gefährliches zeigen)

## 3. Sprechtempo & Pausen (gemessen an den Referenzen – Pflicht)
| | Ziel (Referenz) |
|---|---|
| Wörter/min | 196–207 |
| Pause nach Komma | Ø 170–225 ms |
| Pause nach Punkt | Ø 200–260 ms (max ~0,45 s) |
| Wortdauer | Ø 250 ms |
Vorgehen: TTS mit Zeitstempeln (`/with-timestamps`, mp3_44100_192) → `test-video/presets/pausen-normalisieren.py [TP] [TC] [TW]` (arbeitet an der echten Stille, repariert TTS-Knackser; Startwerte 0.24 / 0.20 / 0.10 = akustische Stille nach Punkt / Komma / sonst) → mit Whisper nachmessen. **`ts_raw.json` und `vo_raw.mp3` aufheben** (für spätere Korrekturen mit derselben Stimme). Nach dem Normalisieren Knacks-Prüfung: keine doppelten Sprachfetzen, keine Lücken in Wörtern. Speed so lange anpassen, bis Tempo UND Länge passen.

## 4. Hook (Preset „Kranfahrt“ – nie ändern)
- 0 s bis „erklärt“: Two-Shot auf Augenhöhe, zwei Figuren links/rechts mit farbigen Nametags, langsamer Push-in
- **Kranfahrt exakt synchron zum Wort „erklärt“ (Pflicht, für Auge und Ohr):** Startzeit NIE aus Zeitstempeln übernehmen (ElevenLabs/Whisper liegen dort oft 50–150 ms daneben), sondern den hörbaren Einsatz messen: `python3 -I test-video/presets/erklaert-onset.py <projekt>/audio/vo.mp3 <projekt>/words.json --fix` → setzt Wort 1 auf den gemessenen Einsatz (Untertitel ebenfalls synchron). In `scene.js`: `WHIP0 = wt(1) - 1/30` (1 Frame Vorlauf gleicht den sanften Anlauf aus). Am fertigen Video prüfen: erste sichtbare Kamerabewegung ≤ 1 Frame neben dem hörbaren „erklärt“.
- Ab dem Wort „erklärt“: **EINE durchgehende Kranfahrt nach hinten + oben + zur Seite (links)**, Dauer 0,57 s, smootherstep, leichter Bogen nach oben, Bildwinkel 56°→46° – **kein Schnitt, kein Motion Blur, keine Effekte**
- Endet in einer hohen, weiten, seitlichen Totale; Kamera treibt langsam weiter, Figuren klein im Bild
- Erster harter Schnitt erst auf das Ortswort
- Code: `heroCam()` in `narzissmus/scene.js`

## 5. Schnitt
- Nur harte Schnitte, jeweils ~0,07 s vor dem ersten Wort des Satzes/Beats (Timeline wortbasiert: `CUTS = [[wortIndex, 'shot'], …]`)
- **Ø Shotlänge 2,2–2,7 s** (bei 74 s ≈ 28–33 Shots)
- Jeder Shot hat eine langsame Kamerabewegung (Push-in/Drift); Kamera nie in/hinter Figuren, Gesichter immer sichtbar (3/4-Ansicht statt Profil)

## 6. Look
- **Kein Bloom, keine Tiefenunschärfe, keine Vignette, keine Partikel-Deko, kein Motion Blur**
- Weiche Schatten (PCFSoft), ACES-Tonemapping, Tag = warme Sonne, Gefahr/Nacht = kühles Licht + warme Lichtquellen
- Eigene Pixeltexturen und Voxel-Figuren (keine Mojang-Assets/-Fonts); Untertitel-Font Montserrat 800, Pixel-Font Pixelify Sans

## 7. UI-Ebene (Positionen wie Referenz)
- Untertitel: ein Wort zur Zeit, Montserrat ExtraBold 72 px, weiß, dezenter Schatten, Mitte (top 905 px), 2-Frame-Fade grau→weiß; Zahlen als Ziffern
- Nametags über Figuren (Pixel-Font); **Rot = Antagonist**, Gold = Held, Cyan = Verbündete
- Tooltip (Item-Stil, dunkel-lila Rahmen) bei **~16 % Höhe (top 310 px)**
- Chat / `[Info]` / System- und Todesmeldungen links bei **~29 % (top 560 px)**
- Status-Effekt oben rechts (top 170 px), Fortschritts-Toast oben rechts
- **Untertitel nie über Bildschirm-/Schildtext legen** (keine Text-Nahaufnahmen im Untertitelband)

## 8. Nahtloser Loop (Bild + Ton) – Pflicht
- Letzter Shot = Hook-Bild, gleiche Kamerafahrt zeitlich davor (`heroCam(t − DUR)`), alle Animationen mit `t − DUR`
- Videolänge so wählen, dass Stille am Übergang ≈ Satzpause (DUR = hörbares Sprachende + ~0,16 s, auf Frames gerundet)
- Kein Fade-out; Tonspur mit `test-video/presets/audio-loop.py` nahtlos machen
- Prüfen: `python3 test-video/presets/loop-check.py video.mp4` (Bild ohne Untertitel ≈ normaler Frame-Wechsel, kein Sample-Sprung)

## 9. Technik / Pipeline
- three.js (r169) Szene in `<projekt>/scene.js`, `index.html` mit UI-Overlay, Render via Playwright: `PROJ=<ordner> node render.mjs <von> <bis> frames` (lokaler Server: `python3 -m http.server 8765` im Repo-Root)
- Vor dem Voll-Render: pro Shot ein Testbild rendern und ansehen, Fehler beheben
- Zwei Render-Prozesse parallel; danach ffmpeg-Mux, `loop-check.py`, Whisper-Tempomessung
- Nach Fertigstellung: Qualitätstabelle (Länge, Tempo, Pausen, Shotlänge, Loop) an den Nutzer melden, committen, pushen, Video senden
