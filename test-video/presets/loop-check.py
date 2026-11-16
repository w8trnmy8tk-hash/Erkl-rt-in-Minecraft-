"""Prüft, ob ein Video nahtlos loopt (Ende -> Anfang), für Bild UND Ton.
Aufruf: python3 loop-check.py video.mp4
Bild: Unterschied letztes->erstes Frame im Vergleich zu normalen Frame-Wechseln (Faktor <= ~1.5 = unsichtbar).
Ton: Sprung im Pegel/Sample am Übergang, Stille-Länge am Ende/Anfang (Ziel: zusammen ~0,2–0,3 s wie eine Satzpause)."""
import sys, subprocess, numpy as np
f = sys.argv[1]
def frames(sel):
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-vf', f"{sel},scale=270:480,format=gray", '-f', 'rawvideo', '-'], capture_output=True).stdout
    return np.frombuffer(out, np.uint8).reshape(-1, 480, 270).astype(np.float32)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
head = frames("select='lt(n\\,6)'"); tail = subprocess.run(['ffmpeg', '-v', 'error', '-sseof', '-0.25', '-i', f, '-vf', 'scale=270:480,format=gray', '-f', 'rawvideo', '-'], capture_output=True).stdout
tail = np.frombuffer(tail, np.uint8).reshape(-1, 480, 270).astype(np.float32)
normal = np.mean([np.abs(head[i + 1] - head[i]).mean() for i in range(len(head) - 1)] + [np.abs(tail[i + 1] - tail[i]).mean() for i in range(len(tail) - 1)])
seam = np.abs(head[0] - tail[-1]).mean()
print(f'BILD  Übergang {seam:.2f} vs. normaler Frame-Wechsel {normal:.2f}  -> Faktor {seam / max(normal, 1e-6):.1f}  ({"OK" if seam <= 1.6 * normal + 0.5 else "SICHTBAR"})')
SR = 44100
a = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout, np.int16).astype(np.float32) / 32768
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
def silence(x, rev=False):
    x = x[::-1] if rev else x; w = int(0.01 * SR); n = 0
    while (n + 1) * w < len(x) and rms(x[n * w:(n + 1) * w]) < -45: n += 1
    return n * 0.01
jump = abs(a[-1] - a[0]); end_rms, start_rms = rms(a[-int(0.03 * SR):]), rms(a[:int(0.03 * SR)])
gap = silence(a, True) + silence(a)
print(f'TON   Sample-Sprung {jump:.4f} ({"OK" if jump < 0.02 else "KLICK"}) | Pegel Ende {end_rms:.0f} dB / Anfang {start_rms:.0f} dB | Stille am Übergang {gap:.2f} s ({"OK" if 0.12 <= gap <= 0.45 else "zu lang/kurz"})')
