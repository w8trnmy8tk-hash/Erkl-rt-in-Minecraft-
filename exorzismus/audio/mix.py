import json, subprocess, numpy as np
SR=44100; w=json.load(open('words.json')); wt=lambda i:w[i][1]
DUR=round((74.03+0.16)*30)/30
def load(p): return np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',p,'-f','s16le','-ac','1','-ar',str(SR),'-'],capture_output=True).stdout,np.int16).astype(np.float32)/32768
vo=load('audio/vo.mp3'); out=np.zeros(int(DUR*SR)+SR,np.float32); out[:len(vo)]+=vo
wh=load('../test-video/audio/sfx_whoosh.mp3'); ch=load('../test-video/audio/sfx_chime.mp3')
t=np.arange(int(0.09*SR))/SR; pop=np.sin(2*np.pi*(900-3000*t)*t)*np.exp(-t*45)
def add(s,at,g): i=int(at*SR); out[i:i+len(s)]+=s[:len(out)-i]*g
add(wh,wt(1)-0.02,0.30)
for i in [56,90,158,194,212]: add(pop,wt(i),0.18)
add(ch,wt(240)-0.05,0.12)
out=out[:int(round(DUR*SR))]
st=np.clip(np.stack([out,out],1)*32767,-32768,32767).astype(np.int16)
subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(SR),'-ac','2','-i','-','-af','loudnorm=I=-14:TP=-1.5:LRA=11,volume=0.9dB','-ar',str(SR),'audio/mix_raw.wav'],input=st.tobytes())
print(DUR)
