# „… erklärt in Minecraft“ – feste Einstellungen (IMMER verwenden)

Dieses Repo produziert vertikale Kurzvideos im Stil der Referenzvideos (@science.craft82).
**Schreibt der Nutzer nur „[Thema] erklärt in Minecraft“ (oder „mach ein … erklärt in Minecraft“), gelten automatisch ALLE Regeln unten – ohne Rückfrage.**
Nicht nach Länge, Stimme, Sprache, Stil oder Bestätigung fragen. Sofort den Skill `/minecraft-video` ausführen und das fertige Video liefern.

**Vorlage zum Kopieren: `hypergamie/`** (neuester Stand: Pipeline, Kranfahrt, Ton, Sync). Ablauf: Skill `/minecraft-video` (`.claude/skills/minecraft-video/SKILL.md`).
Details und Messwerte: `analyse/video-analyse.md`, `test-video/presets/hook-kranfahrt.json`. Werkzeuge: `test-video/presets/`.

## 1. Format
- 1080×1920, 30 fps, H.264 + AAC, Loudness **exakt −14 LUFS**
- **Sprache: Deutsch**
- **Länge: 1:07–1:15 (67–75 s)**, bei größeren Themen auch länger → ca. 245–255 Wörter
- **Stimme: ElevenLabs „Mark – Casual, Relaxed and Light“** (`1SM7GgM6IMuvQlz2BwM3`), `eleven_multilingual_v2`, language_code `de`, stability 0.5, similarity 0.8, style 0.1, speed ≈1.14–1.17 (anpassen, bis Tempo stimmt). Die natürliche, lebendige Stimmlage ist wichtiger als exakte Messwerte – eine monotone Aufnahme verwerfen.
- **Keine Musik. Kein Whoosh bei der Kranfahrt** (Nutzerwunsch). Nur leiser Pop bei Tooltips, selten Chime (Toast) / Poof (Verschwinden), nie über dem Loop-Übergang

## 2. Script-Aufbau (wie Referenzen)
1. `[Thema], erklärt in Minecraft.`
2. Ort + Zeit (`Griechenland, vor 2000 Jahren.`) → harter Schnitt auf das Ortswort, Establishing-Totale + `[Info]`-Label
3. Hauptfigur(en) + Normalzustand, dann „Dann / Doch / Bis …“ → Eskalation, ein Beat pro Satz
4. Kurze Reveal-Sätze bekommen eigene Kurz-Shots; Fachbegriffe als Tooltip („Das nennt man …“)
5. Auflösung in 1–2 Sätzen
6. `[Autor/Quelle] zeigt: [Kernaussage ≤ 10 Wörter].` → Schild bei Sonnenuntergang (rote Zeile `AUTOR, JAHR`, darunter die Aussage)
7. Der letzte Satz fließt in den Titel; seine letzten 2–4 Wörter laufen schon über dem ersten Bild (Loop)
- Kurze Hauptsätze, Präsens, Figuren mit Rollen-Etikett einführen, Fakten korrekt (Jahreszahlen/Quellen prüfen), sensible Themen verantwortungsvoll und ausgewogen (Mythen klar als übertrieben benennen, nichts Gefährliches zeigen)
- Zahlen im Script ausschreiben („zweitausend“, „neunzehnhundertsiebenundsiebzig“) – im Untertitel als Ziffern (NUM-Tabelle in `drawUI`)

## 3. Sprechtempo, Pausen & saubere Stimme (Pflicht)
| | Ziel (Referenz) |
|---|---|
| Wörter/min | 196–207 |
| Pause nach Komma | Ø 170–225 ms |
| Pause nach Punkt | Ø 200–260 ms (max ~0,45 s) |
| Wortdauer | Ø 250 ms |
- TTS mit Zeitstempeln (`/with-timestamps`, mp3_44100_192) → `audio/ts_raw.json` + `audio/vo_raw.mp3` **beide committen** (nötig, um später mit derselben Stimme zu korrigieren; fehlt `ts_raw.json`: `whisper-zeitstempel.py`)
- Pausen: `pausen-normalisieren.py [TP] [TC] [TW]` (Startwerte 0.24 0.20 0.10). Es schneidet nur an echter Stille, dehnt nur echte Pausen zwischen Wörtern, überblendet jede Naht und repariert TTS-Knackser
- Messen mit Whisper (`tempo-messen.py`); überspringt Whisper einen Satz (Wortzahl deutlich < Script), mit `adelay=300` versetzt nochmal messen
- **Keine Plopps/Knackser, keine Lücken in Wörtern:** `knacks-pruefen.py` auf `vo.mp3` UND auf dem fertigen Video muss „OK“ melden. Den Satzanfang („[Thema], erklärt in Minecraft“) zusätzlich im Spektrogramm ansehen

## 4. Hook (Preset „Kranfahrt“)
- 0 s bis „erklärt“: Two-Shot auf Augenhöhe, zwei Figuren links/rechts mit farbigen Nametags, langsamer Push-in
- **Kranfahrt exakt synchron zum hörbaren Wort „erklärt“ (Pflicht, für Auge und Ohr):** Startzeit NIE aus Zeitstempeln übernehmen (liegen oft 50–150 ms daneben). `erklaert-onset.py <projekt>/audio/vo.mp3 <projekt>/words.json --fix` misst den hörbaren Einsatz und setzt Wort 1 darauf. In `scene.js`: `WHIP0 = wt(1) - 1/30` (1 Frame Vorlauf gleicht den sanften Anlauf aus). Am fertigen Video prüfen: erste sichtbare Kamerabewegung ≤ 1 Frame neben dem hörbaren „erklärt“
- Ab „erklärt“: **EINE durchgehende Kranfahrt nach hinten + oben + zur Seite (links)**, Dauer 0,57 s, smootherstep, leichter Bogen nach oben, Bildwinkel 56°→46° – **kein Schnitt, kein Motion Blur, keine Effekte, kein Sound**
- **Nicht zu weit weg (Nutzerwunsch):** Ende relativ zu den Figuren bei (0,0,0) ≈ `p1 = (−5.2, 8.2, 10.0)`, Ziel `(0.6, 1.6, −6.0)`; Figuren bleiben in der Totale gut erkennbar, Kamera treibt langsam weiter
- Erster harter Schnitt erst auf das Ortswort
- Code: `heroCam()` in `hypergamie/scene.js`

## 5. Schnitt
- Nur harte Schnitte, jeweils ~0,07 s vor dem ersten Wort des Satzes/Beats (Timeline wortbasiert: `CUTS = [[wortIndex, 'shot'], …]`)
- **Ø Shotlänge 2,2–2,7 s** (bei 74 s ≈ 28–33 Shots)
- Jeder Shot hat eine langsame Kamerabewegung (Push-in/Drift); Kamera nie in/hinter Figuren, Gesichter immer sichtbar (3/4-Ansicht statt Profil, Figur schaut zur Kamera – auch bei Toren/Gittern: Kamera auf die Gesichtsseite)

## 6. Look
- **Kein Bloom, keine Tiefenunschärfe, keine Vignette, keine Partikel-Deko, kein Motion Blur**
- Weiche Schatten (PCFSoft), ACES-Tonemapping, Tag = warme Sonne, Gefahr/Nacht = kühles Licht + warme Lichtquellen
- Eigene Pixeltexturen und Voxel-Figuren (keine Mojang-Assets/-Fonts); Untertitel-Font Montserrat 800, Pixel-Font Pixelify Sans
- Pixel-Font kann kein „§“ und „B“ sieht wie „8“ aus → in Tooltips/Labels Abkürzungen wie „BGB“, „§“ vermeiden

## 7. UI-Ebene (Positionen wie Referenz)
- Untertitel: ein Wort zur Zeit, Montserrat ExtraBold 72 px, weiß, dezenter Schatten, Mitte (top 905 px), 2-Frame-Fade grau→weiß; Zahlen als Ziffern
- Nametags über Figuren (Pixel-Font); **Rot = Antagonist**, Gold = Held, Cyan = Verbündete
- Tooltip (Item-Stil, dunkel-lila Rahmen) bei **~16 % Höhe (top 310 px)**
- Chat / `[Info]` / System- und Todesmeldungen links bei **~29 % (top 560 px)**
- Status-Effekt oben rechts (top 170 px), Fortschritts-Toast oben rechts
- **Untertitel nie über Bildschirm-/Schildtext legen:** Schild-Shot so kadrieren, dass das Schild in der oberen Bildhälfte steht (Kamera-Ziel tief, z. B. y≈0.5)

## 8. Nahtloser Loop (Bild + Ton) – Pflicht
- Letzter Shot = Hook-Bild, gleiche Kamerafahrt zeitlich davor (`heroCam(t − DUR)`), alle Animationen mit `t − DUR`
- Videolänge so wählen, dass Stille am Übergang ≈ Satzpause (DUR = hörbares Sprachende + ~0,16 s, auf Frames gerundet)
- Kein Fade-out; `ton-mischen.py` macht die Tonspur nahtlos (über `audio-loop.py`)
- Prüfen: `python3 test-video/presets/loop-check.py video.mp4` (Bild ≈ normaler Frame-Wechsel, kein Sample-Sprung)

## 9. Technik / Pipeline
- Frischer Container: `cd test-video && npm ci` (three.js + Fonts), `pip install faster-whisper`; ElevenLabs läuft über den Proxy (Header `xi-api-key: dummy`)
- three.js (r169) Szene in `<projekt>/scene.js`, `index.html` mit UI-Overlay, Render via Playwright: `PROJ=<ordner> node render.mjs <von> <bis> frames` (Server: `python3 -m http.server 8765` im Repo-Root, im Hintergrund mit langem Timeout)
- Vor dem Voll-Render: pro Shot ein Testbild rendern (Kontaktbogen) und ansehen, Fehler beheben
- Zwei Render-Prozesse parallel (~12–35 min); danach `ton-mischen.py`, ffmpeg-Mux, `loop-check.py`, `knacks-pruefen.py`, Whisper-Tempomessung, Kranfahrt-Sync prüfen
- Nach Fertigstellung: Qualitätstabelle (Länge, Tempo, Pausen, Shotlänge, Loop, Lautheit, Sync) + ehrliche Schwächen melden, committen, pushen, Video senden
