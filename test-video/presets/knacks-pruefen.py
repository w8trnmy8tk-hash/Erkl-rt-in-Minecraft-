"""Sucht Knackser/Plopps in einer Tonspur (kurze breitbandige Spikes, doppelte Sprachfetzen an Schnitten).
Aufruf: python3 knacks-pruefen.py <datei.mp3|wav|mp4> [anzahl]
Ausgabe: die auffälligsten Stellen (Zeit s, Score, HF-dB, Pegel-dB). Score > ~5000 = echter Knacks -> beheben.
Normale Sprachlaute (k, t, sch) liegen meist bei 1500–4000."""
import subprocess, numpy as np, sys
SR=44100
def load(f): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-f','s16le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout,np.int16).astype(np.float32)/32768
def hp(a,fc=9000):
    F=np.fft.rfft(a); f=np.fft.rfftfreq(len(a),1/SR); F[f<fc]=0; return np.fft.irfft(F,len(a))
def events(a,n=30):
    h=hp(a); W=88; k=len(h)//W; b=(h[:k*W]**2).reshape(k,W).mean(1)
    full=(a[:k*W]**2).reshape(k,W).mean(1)
    win=np.lib.stride_tricks.sliding_window_view(np.pad(b,15,mode='edge'),31)
    sc=b/(np.median(win,axis=1)+1e-12)
    idx=np.argsort(-sc)[:n]
    return sorted([(round(i*W/SR,3),int(sc[i]),round(10*np.log10(b[i]+1e-12),1),round(10*np.log10(full[i]+1e-12),1)) for i in idx])
ev = events(load(sys.argv[1]), int(sys.argv[2]) if len(sys.argv) > 2 else 10)
for t, sc, hf, lv in ev: print(f"{t:7.3f} s  Score {sc:6d}  HF {hf:6.1f} dB  Pegel {lv:6.1f} dB" + ("   <-- KNACKS" if sc > 5000 else ""))
print("OK: keine Knackser" if max(e[1] for e in ev) <= 5000 else "ACHTUNG: Knacks gefunden")
