# run this script and pipe to hurricanes.json; upload to CI server and change
# hash in scripts/datastore.js

import datetime
import json
import sys
import time

import pandas

basins = {
    'NA': 'North Atlantic',
    'EP': 'Eastern North Pacific',
    'WP': 'Western North Pacific',
    'NI': 'North Indian',
    'SI': 'South Indian',
    'SP': 'Southern Pacific',
    'SA': 'South Atlantic',
}

url = 'https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/access/csv/ibtracs.since1980.list.v04r01.csv'  # noqa

lastlog = time.time()
storms = {}
df = pandas.read_csv(url, keep_default_na=False)
for row in df.itertuples():
    try:
        sid = row.SID
        name = row.NAME.title()
        basin = basins[row.BASIN]
        dist2land = float(row.DIST2LAND)
        lon = float(row.LON)
        lat = float(row.LAT)
        pressure = float(row.WMO_PRES)
        wind = float(row.WMO_WIND)
        when = int(datetime.datetime.strptime(
            row.ISO_TIME, '%Y-%m-%d %H:%M:%S').timestamp() * 1000)
    except Exception:
        continue
    if wind <= 0 or pressure <= 0:
        continue
    if sid not in storms:
        storms[sid] = {
            'name': name, 'basin': basin, 'land': False,
            'dist2land': [],
            'longitude': [],
            'latitude': [],
            'pressure': [],
            'wind': [],
            'time': [],
        }
    storms[sid]['land'] = storms[sid]['land'] or dist2land <= 0
    storms[sid]['dist2land'].append(dist2land)
    storms[sid]['longitude'].append(lon)
    storms[sid]['latitude'].append(lat)
    storms[sid]['pressure'].append(pressure)
    storms[sid]['wind'].append(wind)
    storms[sid]['time'].append(when)
    if time.time() - lastlog > 10:
        sys.stderr.write(f'{len(storms)}\n')
        lastlog = time.time()
sys.stderr.write(f'{len(storms)}\n')
results = [storm for storm in storms.values() if len(storm['time']) > 1]
sys.stderr.write(f'{len(results)}\n')
sys.stderr.write(f'NA {len([r for r in results if r["basin"] == "North Atlantic"])}\n')
print(json.dumps(results))
