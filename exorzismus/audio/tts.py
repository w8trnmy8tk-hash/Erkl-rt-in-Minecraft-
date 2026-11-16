import json,sys,base64,urllib.request
sp=float(sys.argv[1]); txt=open('script.txt').read().strip()
req={"text":txt,"model_id":"eleven_multilingual_v2","language_code":"de","voice_settings":{"stability":0.5,"similarity_boost":0.8,"style":0.1,"speed":sp}}
json.dump(req,open('req.json','w'),ensure_ascii=False)
r=urllib.request.Request('https://api.elevenlabs.io/v1/text-to-speech/1SM7GgM6IMuvQlz2BwM3/with-timestamps?output_format=mp3_44100_192',data=json.dumps(req).encode(),headers={'xi-api-key':'dummy','Content-Type':'application/json'})
d=json.load(urllib.request.urlopen(r,timeout=300)); json.dump(d,open('ts_raw.json','w'))
open('vo_raw.mp3','wb').write(base64.b64decode(d['audio_base64'])); print('ok')
