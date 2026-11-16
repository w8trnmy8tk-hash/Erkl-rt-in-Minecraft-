"""Tonspur fertig machen: Stimme + leise Effekte (KEINE Musik, KEIN Whoosh), exakt -14 LUFS, nahtloser Loop.
Aufruf (Repo-Root): python3 test-video/presets/ton-mischen.py <projekt> <DUR> [--pops 64,78,...] [--chime 52] [--poof 52]
  --pops   Wortindizes, bei denen ein Tooltip erscheint (leiser Pop, weicher Einsatz)
  --chime  Wortindex für den Fortschritts-Toast (selten)
  --poof   Wortindex für ein Verschwinden (selten)
Ergebnis: <projekt>/audio/mix.wav (Länge = DUR, Ende blendet nahtlos in den Anfang)."""
import json, subprocess, sys, re, numpy as np
SR = 44100
proj, DUR = sys.argv[1], float(sys.argv[2]); args = ' '.join(sys.argv[3:])
opt = lambda k: [int(x) for x in re.search(rf'--{k}\s+([\d,]+)', args).group(1).split(',')] if f'--{k}' in args else []
def load(f): return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
def soft(x, a=0.004, r=0.02): x = x.copy(); na, nr = int(a * SR), int(r * SR); x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr); return x
w = json.load(open(f'{proj}/words.json')); wt = lambda i: w[i][1]
vo = load(f'{proj}/audio/vo.mp3'); out = np.zeros(int(DUR * SR) + SR); out[:len(vo)] += vo
def add(x, t, g):
    i = int(t * SR); n = min(len(x), len(out) - i)
    if t + len(x) / SR > DUR - 0.3: print('übersprungen (zu nah am Loop-Übergang):', round(t, 2)); return
    out[i:i + n] += x[:n] * g
tt = np.arange(int(0.09 * SR)) / SR; pop = np.sin(2 * np.pi * (700 * tt - 1500 * tt * tt)) * np.exp(-tt * 45) * np.minimum(1, tt / 0.004)
for i in opt('pops'): add(pop, wt(i), 0.12)
for i in opt('chime'): add(soft(load('test-video/audio/sfx_chime.mp3')), wt(i), 0.12)
for i in opt('poof'): add(soft(load('test-video/audio/sfx_poof.mp3')), wt(i), 0.10)
out = out[:int(DUR * SR)]; s = np.clip(np.stack([out, out], 1), -1, 1)
pre, raw = f'{proj}/audio/pre.wav', f'{proj}/audio/mix_raw.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', pre], input=s.astype(np.float32).tobytes())
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), raw])
lufs = lambda f: float(re.findall(r'I:\s+(-?[\d.]+) LUFS', subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr)[-1])
g = -14 - lufs(raw)  # loudnorm landet oft ~0,7 dB zu leise -> exakt nachziehen
if abs(g) > 0.05: subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-af', f'volume={g:.2f}dB', raw + '.tmp.wav']); subprocess.run(['mv', raw + '.tmp.wav', raw])
subprocess.run(['python3', '-I', 'test-video/presets/audio-loop.py', raw, f'{proj}/audio/mix.wav', str(DUR)])
print('Lautheit:', lufs(f'{proj}/audio/mix.wav'), 'LUFS')
