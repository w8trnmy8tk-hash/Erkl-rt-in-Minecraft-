# Notfall: Zeitstempel (ts_raw.json) aus einer vorhandenen TTS-Aufnahme per Whisper erzeugen, falls ts_raw.json fehlt.
# Aufruf (im Ordner <projekt>/audio): python3 whisper-zeitstempel.py vo_raw.mp3 script.txt ts_raw.json
# Wortgrenzen einer vorhandenen TTS-Aufnahme per Whisper -> ts_raw.json im ElevenLabs-Format
import json, re, subprocess, difflib, numpy as np, sys
from faster_whisper import WhisperModel
mp3, script, outp = sys.argv[1:4]
a = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',mp3,'-f','s16le','-ac','1','-ar','16000','-'],capture_output=True).stdout,np.int16).astype(np.float32)/32768
m = WhisperModel('medium', device='cpu', compute_type='int8', cpu_threads=4)
segs, _ = m.transcribe(a, language='de', word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
ww = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
toks = open(script).read().split()
norm = lambda s: re.sub(r'[^a-zäöüß0-9]', '', s.lower())
NUM = {'2000': 'zweitausend', '1977': 'neunzehnhundertsiebenundsiebzig', '20': 'zwanzig', '%': 'prozent'}
wn = [norm(NUM.get(re.sub(r'[^0-9%]','',w) if re.sub(r'[^0-9%]','',w) in NUM else '', w) if re.sub(r'[^0-9%]','',w) in NUM else w) for w,_,_ in ww]
tn = [norm(t) for t in toks]
sm = difflib.SequenceMatcher(None, tn, wn, autojunk=False)
st = [None]*len(toks); en = [None]*len(toks)
for blk in sm.get_matching_blocks():
    for k in range(blk.size): st[blk.a+k] = ww[blk.b+k][1]; en[blk.a+k] = ww[blk.b+k][2]
miss = [toks[i] for i in range(len(toks)) if st[i] is None]; print('ohne Treffer:', len(miss), miss)
# Lücken interpolieren
for i in range(len(toks)):
    if st[i] is None:
        j = i
        while j < len(toks) and st[j] is None: j += 1
        a0 = en[i-1] if i > 0 else 0.0; b0 = st[j] if j < len(toks) else a0 + 0.5*(j-i)
        n = j - i
        for k in range(n): st[i+k] = a0 + (b0-a0)*k/n; en[i+k] = a0 + (b0-a0)*(k+1)/n
chars, cs, ce = [], [], []
for i, t in enumerate(toks):
    d = (en[i]-st[i])/len(t)
    for k, ch in enumerate(t): chars.append(ch); cs.append(st[i]+k*d); ce.append(st[i]+(k+1)*d)
    if i+1 < len(toks): chars.append(' '); cs.append(en[i]); ce.append(st[i+1])
json.dump({'alignment': {'characters': chars, 'character_start_times_seconds': cs, 'character_end_times_seconds': ce}}, open(outp,'w'), ensure_ascii=False)
print('ok', len(toks), 'Wörter')
