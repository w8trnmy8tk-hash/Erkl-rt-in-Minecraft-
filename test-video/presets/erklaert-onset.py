"""Hörbarer Beginn des Worts „erklärt“ (Start der Kranfahrt) – aus dem Signal gemessen, nicht aus Zeitstempeln.
Zeitstempel (ElevenLabs/Whisper) liegen hier oft 50–150 ms daneben; die Kamera muss aber exakt mit dem Wort losfahren.
Methode: längste Stille (< -45 dB) im Fenster [wt(1) - 0.35 s, wt(1) + 0.05 s] = Pause nach dem Titelwort;
deren Ende = Einsatz von „erklärt“. Ergebnis auf ganze Frames (30 fps) abgerundet, damit die Fahrt nie zu spät startet.
Aufruf: python3 erklaert-onset.py <projekt>/audio/vo.mp3 <projekt>/words.json [--fix] [--word=N]
  --word=N: Index von „erklärt“ in words.json (Standard 1; bei Titel aus zwei Wörtern 2)
  --fix schreibt den gemessenen Wert als Startzeit von Wort 1 in words.json (Untertitel „erklärt“ dann ebenfalls synchron)
"""
import sys, json, subprocess, math, numpy as np
SR = 44100; H = 88  # 2 ms
mp3, wj = sys.argv[1], sys.argv[2]
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
WI = next((int(x.split('=')[1]) for x in sys.argv if x.startswith('--word=')), 1)  # Index von „erklärt“ (2 bei zweiwortigem Titel)
w = json.load(open(wj)); t1 = w[WI][1]
lo, hi = max(0.0, t1 - 0.35), t1 + 0.05
fr = range(int(lo * SR), int(hi * SR), H)
db = np.array([20 * np.log10(np.sqrt(np.mean(a[i:i + 2 * H] ** 2)) + 1e-9) for i in fr])
quiet = db < -45; best = (0, 0); i = 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        if j - i >= best[1] - best[0]: best = (i, j)
        i = j
    else: i += 1
onset = lo + (best[1] * H + H) / SR
onset_f = math.floor(onset * 30) / 30
print(f'Zeitstempel wt(1) = {t1:.3f} s | hörbarer Einsatz „erklärt“ = {onset:.3f} s | WHIP0 = {onset_f:.4f} s (Frame {round(onset_f * 30)}) | Abweichung {1000 * (t1 - onset):+.0f} ms')
if '--fix' in sys.argv:
    w[WI][1] = round(onset, 4); json.dump(w, open(wj, 'w'), ensure_ascii=False); print('words.json: Wort 1 auf hörbaren Einsatz gesetzt')
