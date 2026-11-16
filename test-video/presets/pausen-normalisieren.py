"""Pausen normalisieren (im Ordner <projekt>/audio ausführen): vo_raw.mp3 + ts_raw.json -> vo.mp3 + words.json

Arbeitet an der ECHTEN Stille im Signal (Energie), nicht blind an Zeitstempeln:
  - je Wortgrenze wird der längste stille Abschnitt gesucht; nur dort wird gekürzt bzw. Stille eingefügt
  - jede Schnittstelle wird überblendet (kein Klick), nie wird Audio doppelt/rückwärts verwendet
  - einzelne Knackser aus der TTS (sehr kurze breitbandige Spikes) werden vorher automatisch repariert
Ziele (akustische Stille): nach Punkt TP, nach Komma TC, sonst höchstens TW.
Aufruf: python3 pausen-normalisieren.py [TP] [TC] [TW]   (Default 0.17 / 0.12 / 0.07 – mit tempo-messen.py nachprüfen)
"""
import json, subprocess, sys, numpy as np
SR = 44100
TP = float(sys.argv[1]) if len(sys.argv) > 1 else 0.17
TC = float(sys.argv[2]) if len(sys.argv) > 2 else 0.12
TW = float(sys.argv[3]) if len(sys.argv) > 3 else 0.07
SIL_DB = -50

# ---------- Wörter aus ts_raw.json ----------
d = json.load(open('ts_raw.json')); a = d['alignment']
c, s, e = a['characters'], a['character_start_times_seconds'], a['character_end_times_seconds']
words = []; cur = ''; st = 0; last = 0
for ch, x, y in zip(c, s, e):
    if ch in ' \n':
        if cur: words.append([cur, st, last]); cur = ''
        continue
    if not cur: st = x
    cur += ch; last = y
if cur: words.append([cur, st, last])
pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', 'vo_raw.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768

# ---------- Knackser reparieren ----------
def declick(x, thr=5000):
    F = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    hp = np.fft.irfft(np.where(f >= 9000, F, 0), len(x)); lp = np.fft.irfft(np.where(f < 6000, F, 0), len(x))
    W = 88; k = len(x) // W; b = (hp[:k * W] ** 2).reshape(k, W).mean(1)
    med = np.median(np.lib.stride_tricks.sliding_window_view(np.pad(b, 15, mode='edge'), 31), axis=1) + 1e-12
    y = x.copy(); n = 0
    for i in np.where(b / med > thr)[0]:
        c0 = i * W + W // 2; L = 132  # ±3 ms durch tiefpassgefilterte Version ersetzen, weich überblendet
        lo, hi = max(0, c0 - L), min(len(x), c0 + L); win = np.sin(np.linspace(0, np.pi, hi - lo)) ** 2
        y[lo:hi] = x[lo:hi] * (1 - win) + lp[lo:hi] * win; n += 1
    return y, n
pcm, nclick = declick(pcm)

# ---------- Stille finden ----------
H = 220  # 5 ms
env = np.array([np.sqrt(np.mean(pcm[i:i + 2 * H] ** 2)) for i in range(0, len(pcm) - 2 * H, H)])
sil = 20 * np.log10(env + 1e-9) < SIL_DB
def silent_run(t0, t1):
    """längster stiller Abschnitt (Samples) im Zeitfenster"""
    f0, f1 = max(0, int(t0 * SR / H)), min(len(sil), int(t1 * SR / H)); best = None; i = f0
    while i < f1:
        if sil[i]:
            j = i
            while j < len(sil) and sil[j]: j += 1
            while i > 0 and sil[i - 1]: i -= 1  # ganze Stille, nicht am Fensteranfang abgeschnitten
            if best is None or j - i > best[1] - best[0]: best = (i, j)
            i = max(j, i + 1)
        else: i += 1
    if best is None: return None
    a0, b0 = best[0] * H + H, best[1] * H + H  # Fenstermitte
    return (a0, b0) if b0 - a0 >= int(0.015 * SR) else None

# ---------- Schnitte planen ----------
edits = []  # (Position im Original, Delta in Samples: <0 entfernen, >0 Stille einfügen)
for i in range(len(words) - 1):
    w, nx = words[i], words[i + 1]
    lo = max(w[2] - 0.12, (w[1] + w[2]) / 2); hi = min(nx[1] + 0.12, (nx[1] + nx[2]) / 2)
    r = silent_run(lo, hi)
    if r is None: continue
    P = r[1] - r[0]; T = int((TP if w[0][-1] in '.?!' else TC if w[0][-1] in ',:;' else min(P / SR, TW)) * SR)
    mid = (r[0] + r[1]) // 2
    if P > T: edits.append((mid - (P - T) // 2, -(P - T)))
    elif P < T and w[0][-1] in '.?!,:;' and (P >= int(0.07 * SR) or w[2] - 0.04 <= mid / SR <= nx[1] + 0.01):
        edits.append((mid, T - P))  # nur echte Pausen dehnen – kurze Lücke nur, wenn sie zwischen den Wörtern liegt (nicht im Verschlusslaut k/t/p eines Worts)

# ---------- Ausführen (mit Überblendung an jeder Naht) ----------
L = int(0.006 * SR)
pieces = []; pos = 0; mapping = []; delta = 0
for x, dl in sorted(edits):
    if x < pos: continue
    pieces.append(pcm[pos:x])
    if dl < 0: pos = x - dl
    else: pieces.append(np.zeros(dl, np.float32)); pos = x
    delta += dl; mapping.append((x, delta))
pieces.append(pcm[pos:])
res = np.concatenate(pieces); j = 0
for k in range(len(pieces) - 1):  # Naht in Stille: weich aus- und einblenden
    j += len(pieces[k]); n = min(L, j, len(res) - j)
    if n > 1: res[j - n:j] *= np.cos(np.linspace(0, np.pi / 2, n)) ** 2; res[j:j + n] *= np.sin(np.linspace(0, np.pi / 2, n)) ** 2
res, nclick2 = declick(res); nclick += nclick2  # zweiter Durchgang auf dem Ergebnis
def f(t):
    smp = t * SR; dd = 0
    for x, dl in mapping:
        if smp >= x: dd = dl
    return (smp + dd) / SR
new_words = [[w[0], round(f(w[1]), 4), round(f(w[2]), 4)] for w in words]
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '192k', 'vo.mp3'], input=(np.clip(res, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(new_words, open('words.json', 'w'), ensure_ascii=False)
print('neu', round(len(res) / SR, 2), 's,', len(new_words), 'Wörter,', round(len(new_words) / (new_words[-1][2] - new_words[0][1]) * 60), 'wpm |', len(edits), 'Pausen angepasst,', nclick, 'Knackser repariert')
