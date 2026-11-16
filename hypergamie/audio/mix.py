# Mischt Stimme + leise Effekte (keine Musik), danach loudnorm + audio-loop.py
import json, subprocess, numpy as np, sys
SR = 44100; DUR = float(sys.argv[1])
def load(f): return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
w = json.load(open('words.json')); wt = lambda i: w[i][1]
vo = load('audio/vo.mp3'); out = np.zeros(int(DUR * SR) + SR); out[:len(vo)] += vo
def add(x, t, g): i = int(t * SR); n = min(len(x), len(out) - i); out[i:i + n] += x[:n] * g
def soft(x, a=0.004, r=0.02): x = x.copy(); na, nr = int(a * SR), int(r * SR); x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr); return x
tt = np.arange(int(0.09 * SR)) / SR; pop = np.sin(2 * np.pi * (700 * tt - 1500 * tt * tt)) * np.exp(-tt * 45) * np.minimum(1, tt / 0.004)
for i in [64, 78, 119, 127, 162, 169, 224, 236]: add(pop, wt(i), 0.12)
add(soft(load('../test-video/audio/sfx_chime.mp3')), wt(52), 0.12)
out = out[:int(DUR * SR)]; s = np.clip(np.stack([out, out], 1), -1, 1)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', 'audio/pre.wav'], input=s.astype(np.float32).tobytes())
