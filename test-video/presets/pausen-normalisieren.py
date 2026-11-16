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
out = []; new_words = []; pos = 0  # pos = sample in original
t_out = 0.0
M = int(0.03 * SR)  # Rand, der um Wortgrenzen erhalten bleibt
for i, w in enumerate(words):
    ws, we = int(w[1] * SR), int(w[2] * SR)
    # Wort (plus Vorlauf seit pos) übernehmen
    seg = pcm[pos:we + M]; start_out = (len(np.concatenate(out)) if out else 0) / SR + (ws - pos) / SR
    out.append(seg); new_words.append([w[0], start_out, start_out + (we - ws) / SR]); pos = we + M
    if i + 1 < len(words):
        ns = int(words[i + 1][1] * SR); gap = (ns - we) / SR
        tg = target(w[0], gap)
        avail = ns - M - pos  # Stille zwischen den Rändern
        want = int(tg * SR) - 2 * M
        if avail > want:   # kürzen: Mitte der Stille entfernen
            keep = max(0, want); h = keep // 2
            sil = pcm[pos:ns - M]; fade = np.concatenate([sil[:h], sil[len(sil) - (keep - h):]]) if keep > 0 else sil[:0]
            out.append(fade); pos = ns - M
        elif avail < want and w[0][-1] in '.?!,:;':  # verlängern mit Stille
            out.append(pcm[pos:ns - M]); out.append(np.zeros(want - avail, np.float32)); pos = ns - M
out.append(pcm[pos:])
res = np.concatenate(out)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '192k', 'vo.mp3'], input=res.astype(np.int16).tobytes())
json.dump(new_words, open('words.json', 'w'), ensure_ascii=False)
print('neu', round(len(res) / SR, 2), 's,', len(new_words), 'Wörter,', round(len(new_words) / (new_words[-1][2] - new_words[0][1]) * 60), 'wpm')
