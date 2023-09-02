import os

import PIL.Image

list = """
8: 04 01 2017 09:23:23.812:WARN [web-server]: 404: /base/dist/data/tiles/8/75/94.png
8: 04 01 2017 09:23:23.837:WARN [web-server]: 404: /base/dist/data/tiles/9/150/188.png
8: 04 01 2017 09:23:23.845:WARN [web-server]: 404: /base/dist/data/tiles/9/151/188.png
8: 04 01 2017 09:23:23.854:WARN [web-server]: 404: /base/dist/data/tiles/10/302/376.png
8: 04 01 2017 09:23:23.859:WARN [web-server]: 404: /base/dist/data/tiles/10/301/377.png
8: 04 01 2017 09:23:24.016:WARN [web-server]: 404: /base/dist/data/tiles/10/302/377.png
8: 04 01 2017 09:23:24.019:WARN [web-server]: 404: /base/dist/data/tiles/11/603/753.png
8: 04 01 2017 09:23:24.022:WARN [web-server]: 404: /base/dist/data/tiles/11/604/753.png
8: 04 01 2017 09:23:24.025:WARN [web-server]: 404: /base/dist/data/tiles/11/603/752.png
8: 04 01 2017 09:23:24.027:WARN [web-server]: 404: /base/dist/data/tiles/11/603/754.png
8: 04 01 2017 09:23:24.030:WARN [web-server]: 404: /base/dist/data/tiles/11/604/752.png
8: 04 01 2017 09:23:24.144:WARN [web-server]: 404: /base/dist/data/tiles/11/604/754.png
8: 04 01 2017 09:23:24.146:WARN [web-server]: 404: /base/dist/data/tiles/11/602/753.png
8: 04 01 2017 09:23:24.149:WARN [web-server]: 404: /base/dist/data/tiles/11/605/753.png
8: 04 01 2017 09:23:24.151:WARN [web-server]: 404: /base/dist/data/tiles/11/602/752.png
8: 04 01 2017 09:23:24.168:WARN [web-server]: 404: /base/dist/data/tiles/11/602/754.png
8: 04 01 2017 09:23:24.173:WARN [web-server]: 404: /base/dist/data/tiles/11/605/752.png
8: 04 01 2017 09:23:24.193:WARN [web-server]: 404: /base/dist/data/tiles/11/605/754.png
8: 04 01 2017 09:23:27.017:WARN [web-server]: 404: /base/dist/data/tiles/6/18/23.png
8: 04 01 2017 09:23:27.025:WARN [web-server]: 404: /base/dist/data/tiles/7/37/47.png
: Error: ENOENT, no such file or directory 'dist/data/tiles/10/301/376.png'
"""

for line in list.split('\n'):
    parts = line.split('dist/data/tiles')
    if len(parts) < 2:
        continue
    tile = parts[1].strip("'").strip()
    url = 'https://tile.openstreetmap.org' + tile
    # url = 'https://stamen-tiles-a.a.ssl.fastly.net/toner-lite ' + tile
    path = 'dist/data/tiles' + tile
    try:
        os.makedirs(os.path.dirname(path))
    except Exception:
        pass
    print(tile)
    os.system('curl -s -o ' + path + ' ' + url)
    PIL.Image.open(path)
os.chdir('dist/data/tiles')
os.unlink('../tiles.tgz')
os.system('tar -zcvf ../tiles.tgz *')
os.chdir('../../..')
