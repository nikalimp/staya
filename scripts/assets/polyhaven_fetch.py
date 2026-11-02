# Скачивает glTF 1k с Poly Haven (CC0) в ./<id>/ и пишет meta.json (название, авторы) для титров
import json, os, sys, urllib.request
H = {'User-Agent': 'staya-site-builder'}
get = lambda u: urllib.request.urlopen(urllib.request.Request(u, headers=H), timeout=120)
res = sys.argv[1]; ids = sys.argv[2:]
meta = json.load(open('meta.json')) if os.path.exists('meta.json') else {}
for i in ids:
    info = json.load(get('https://api.polyhaven.com/info/' + i)); f = json.load(get('https://api.polyhaven.com/files/' + i))
    g = f['gltf'][res]['gltf']; os.makedirs(i, exist_ok=True)
    def dl(url, path):
        p = os.path.join(i, path); os.makedirs(os.path.dirname(p) or '.', exist_ok=True)
        if not os.path.exists(p): open(p, 'wb').write(get(url).read())
    dl(g['url'], os.path.basename(g['url']))
    for path, v in g.get('include', {}).items(): dl(v['url'], path)
    meta[i] = {'name': info['name'], 'authors': list(info['authors'].keys()), 'url': 'https://polyhaven.com/a/' + i}
    print('ok', i, flush=True)
json.dump(meta, open('meta.json', 'w'), ensure_ascii=False, indent=1)
