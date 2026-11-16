import sys, json, subprocess, numpy as np, statistics as st
from faster_whisper import WhisperModel
m = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4)
a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',sys.argv[1],'-f','s16le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.int16).astype(np.float32)/32768
segs,_ = m.transcribe(a, language='de', word_timestamps=True)
w = [(x.start, x.end, x.word) for s in segs for x in s.words]
g_c=[];g_p=[]
for p,q in zip(w,w[1:]):
    gap=q[0]-p[1]; t=p[2].strip()
    if t[-1] in '.?!': g_p.append(gap)
    elif t[-1] in ',:;': g_c.append(gap)
dur=w[-1][1]-w[0][0]
print(f"NEU: {len(w)} W, {dur:.1f}s, {len(w)/dur*60:.0f} wpm | nach Komma Ø{st.mean(g_c)*1000:.0f}ms (max {max(g_c)*1000:.0f}) | nach Punkt Ø{st.mean(g_p)*1000:.0f}ms (max {max(g_p)*1000:.0f}) | Wortdauer Ø{st.mean([x[1]-x[0] for x in w])*1000:.0f}ms")
print(' '.join(x[2].strip() for x in w))
