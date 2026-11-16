import json, subprocess, numpy as np, sys
SR = 44100
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
pcm = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', 'vo_raw.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32)
def target(w, gap):
    if w[-1] in '.?!': return 0.11
    if w[-1] in ',:;': return 0.09
    return min(gap, 0.06)
out = []; src = []; new_words = []; pos = 0  # src: Startsample jedes Stücks im Original (None = eingefügte Stille)  # pos = sample in original
t_out = 0.0
M = int(0.03 * SR)  # Rand, der um Wortgrenzen erhalten bleibt
for i, w in enumerate(words):
    ws, we = int(w[1] * SR), int(w[2] * SR)
    # Wort (plus Vorlauf seit pos) übernehmen
    seg = pcm[pos:we + M]; start_out = (len(np.concatenate(out)) if out else 0) / SR + (ws - pos) / SR
    out.append(seg); src.append(pos); new_words.append([w[0], start_out, start_out + (we - ws) / SR]); pos = we + M
    if i + 1 < len(words):
        ns = int(words[i + 1][1] * SR); gap = (ns - we) / SR
        tg = target(w[0], gap)
        avail = ns - M - pos  # Stille zwischen den Rändern
        want = int(tg * SR) - 2 * M
        quiet = lambda x: 20 * np.log10(np.sqrt(np.mean((pcm[max(0, x - 265):x + 265] / 32768) ** 2)) + 1e-9) < -40  # ±6 ms um den Schnitt
        keep = max(0, want); h = keep // 2
        if avail > want and avail > 0 and quiet(pos + h) and quiet(ns - M - (keep - h)):   # kürzen: Mitte der Stille entfernen (Schnitt nur in Stille, nie rückwärts)
            out.append(pcm[pos:pos + h]); src.append(pos); b0 = ns - M - (keep - h); out.append(pcm[b0:ns - M]); src.append(b0); pos = ns - M
        elif avail < want and w[0][-1] in '.?!,:;':  # verlängern mit Stille
            out.append(pcm[pos:ns - M]); src.append(pos); out.append(np.zeros(want - avail, np.float32)); src.append(None); pos = ns - M
out.append(pcm[pos:]); src.append(pos)
res = np.concatenate(out)
# Schnittstellen ohne Klick: längen-erhaltende Überblendung (6 ms) mit dem Originalmaterial vor dem nächsten Stück
L = int(0.006 * SR); fo = np.cos(np.linspace(0, np.pi / 2, L)) ** 2; fi = 1 - fo; j = 0
for k in range(len(out) - 1):
    j += len(out[k]); a, b = src[k], src[k + 1]
    if a is not None and b is not None and a + len(out[k]) == b: continue  # lückenlos
    n = min(L, j, len(out[k]))
    if n < 8: continue
    f_o, f_i = fo[L - n:] if n < L else fo, fi[L - n:] if n < L else fi
    take = lambda x0: np.pad(pcm[max(0, x0):max(0, x0 + n)], (0, n - len(pcm[max(0, x0):max(0, x0 + n)])))
    tail = take(a + len(out[k]) - n) if a is not None else np.zeros(n, np.float32)
    lead = take(b - n) if b is not None else np.zeros(n, np.float32)
    res[j - n:j] = tail * f_o + lead * f_i
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '192k', 'vo.mp3'], input=res.astype(np.int16).tobytes())
json.dump(new_words, open('words.json', 'w'), ensure_ascii=False)
print('neu', round(len(res) / SR, 2), 's,', len(new_words), 'Wörter,', round(len(new_words) / (new_words[-1][2] - new_words[0][1]) * 60), 'wpm')
