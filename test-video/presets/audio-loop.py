"""Macht eine Tonspur nahtlos loopbar: exakte Länge (= Video), KEIN Fade-out ins Digital-Stille,
und 15 ms gleich-laute Überblendung des Endes in den Anfang -> kein Klick, kein Pegelsprung beim Wiederholen.
Aufruf: python3 audio-loop.py in.wav out.wav DAUER_SEKUNDEN"""
import sys, subprocess, numpy as np
src, dst, dur = sys.argv[1], sys.argv[2], float(sys.argv[3]); SR = 44100
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-f', 's16le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32).reshape(-1, 2)
n = int(round(dur * SR)); a = a[:n] if len(a) >= n else np.vstack([a, np.zeros((n - len(a), 2), np.float32)])
x = int(0.015 * SR); k = np.linspace(0, np.pi / 2, x)[:, None]
a[-x:] = a[-x:] * np.cos(k) + a[:x] * np.sin(k)   # Ende läuft gleichlaut in den Anfang über
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', dst], input=np.clip(a, -32768, 32767).astype(np.int16).tobytes())
print('nahtlos:', dst, f'{n / SR:.3f} s')
