#!/usr/bin/env python3

import datetime
import json
import os
import sys
import tarfile

import numpy
import requests
import scipy.spatial

DataFiles = {
    # See https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/readme.txt
    'stations': 'ghcnd-stations.txt',
    'data': 'ghcnd_all.tar.gz',
}


def average(list):
    """
    Compute the average of a list of numbers.

    :param list: a list of numbers.
    :return: the average.
    """
    return float(sum(list)) / len(list)


def calc_bins(binsize, binfunc, all_dates, stations):
    """
    Calculate binned data for all stations.  Only bins that have three or more
    stations with data are generated.  A station must have data on every day to
    be used.

    :param binsize: one of 'year' or 'month'.
    :param binfunc: a function to aggregate the station data.  Typically one of
        min, max, sum, average.
    :param all_dates: a dictionary where the keys are (y, m, d) and the values
        are the entry offset in station data.  All dates with matching year or
        matching year and month (depending on binsize) are used for calculating
        a bin.
    :param stations: a dictionary of stations.  Each station has a 'data' array
        of data values and a 'start' value specifying the offset of the first
        data item in reference to the add_dates entry offsets.
    :return: a dictionary of bins.  The keys are a string of the bin date, and
        the contents include `datekeys` with a list of the dates used and
        `data` with a dictionary of station keys and computed values.
    """
    bins = {}
    for y, m, d in all_dates:
        if binsize == 'year':
            key = '%d' % y
        elif binsize == 'month':
            key = '%d%d' % (y, m)
        else:
            raise Exception('Invalid binsize')
        bins.setdefault(key, {'datekeys': []})
        bins[key]['datekeys'].append((y, m, d))
    for binkey in sorted(bins):
        data = {}
        first = True
        for datekey in bins[binkey]['datekeys']:
            pos = all_dates[datekey]
            for stationkey in stations:
                if not first and stationkey not in data:
                    continue
                station = stations[stationkey]
                value = None
                if pos >= station['start'] and pos - station['start'] < len(station['data']):
                    value = station['data'][pos - station['start']]
                if value is None:
                    if not first:
                        del data[stationkey]
                    continue
                data.setdefault(stationkey, [])
                data[stationkey].append(value)
            first = False
        print('bin %s %d' % (binkey, len(data)))
        if len(data) < 3:
            del bins[binkey]
            continue
        for key in data:
            data[key] = binfunc(data[key])
        bins[binkey]['data'] = data
    return bins


def calc_meshes(bins, stations, edge=None, full=False):
    """
    Calculate meshes for all bins.

    :param bins: the output of calc_bins.
    :param stations: a dictionary of stations.  Each station has a 'x', 'y',
        and 'name' entry, and may have a 'z' entry as well.
    :param edge: remove elements from a mesh if their longest side exceeds this
        length.
    :param full: if True, include station key, name, and z value in the node
        information.
    :return: a dictionary of meshes.  The keys are the bin keys, and the value
        is a dictionary with 'elements' and 'nodes'.
    """
    meshes = {}
    for binkey in sorted(bins):
        nodes = []
        for s in sorted(bins[binkey]['data']):
            node = {
                'v': bins[binkey]['data'][s],
                'x': stations[s]['x'],
                'y': stations[s]['y'],
            }
            if full and stations[s].get('name'):
                node['name'] = stations[s]['name']
            if full is True:
                node['key'] = s
                if 'z' in stations[s]:
                    node['z'] = stations[s]['z']
            nodes.append(node)
        coor = [(n['x'], n['y']) for n in nodes]
        if len(nodes) == 3:
            elements = [[0, 1, 2]]
        else:
            try:
                elements = scipy.spatial.Delaunay(
                    numpy.array(coor), qhull_options='QJ').simplices.tolist()
            except Exception:
                continue
        if edge:
            reduced = []
            for el in elements:
                dist = max(
                    (nodes[el[0]]['x'] - nodes[el[1]]['x']) ** 2 +
                    (nodes[el[0]]['y'] - nodes[el[1]]['y']) ** 2,
                    (nodes[el[1]]['x'] - nodes[el[2]]['x']) ** 2 +
                    (nodes[el[1]]['y'] - nodes[el[2]]['y']) ** 2,
                    (nodes[el[2]]['x'] - nodes[el[0]]['x']) ** 2 +
                    (nodes[el[2]]['y'] - nodes[el[0]]['y']) ** 2)
                if dist < edge * edge:
                    reduced.append(el)
            if not len(reduced):
                continue
            elements = reduced
        meshes[binkey] = {'elements': elements, 'nodes': nodes}
    return meshes


def compact_meshes(meshes, stations, full=False):
    """
    Given a dictionary of meshes, reformulate it so that there is a single
    node array and individual meshes are compacted.

    :param meshes: the output of calc_meshes.
    :param stations: a dictionary of stations.  Each station has a 'x', 'y',
        and 'name' entry, and may have a 'z' entry as well.
    :param full: if True, include station key, name, and z value in the node
        information.
    :return: a dictionary of meshes.  There are top level entries of `nodes`,
        `nodekeys`, and `bins`.  In `bins`, the keys are the bin keys, and the
        value is a dictionary with 'elements' and 'values'.
    """
    newmesh = {'nodekeys': ['x', 'y'], 'bins': {}}
    nodemap = {}
    if full:
        newmesh['nodekeys'].extend(['z', 'key', 'name'] if full is True else ['name'])
    for binkey in sorted(meshes):
        elements = []
        values = []
        for elem in meshes[binkey]['elements']:
            for binnode in elem:
                stationkey = meshes[binkey]['nodes'][binnode]['key']
                n = nodemap.setdefault(stationkey, len(nodemap))
                elements.append(n)
                if len(values) <= n:
                    values += [None] * (n + 1 - len(values))
                values[n] = meshes[binkey]['nodes'][binnode]['v']
        newmesh['bins'][binkey] = {'elements': elements, 'values': values}
    newmesh['nodes'] = nodes = [None] * len(nodemap)
    for stationkey, n in nodemap.items():
        station = stations[stationkey]
        nodes[n] = [station.get(key) for key in newmesh['nodekeys']]
    return newmesh


def download_data():
    """
    Download data files to the local directory.
    """
    base_url = 'https://www1.ncdc.noaa.gov/pub/data/ghcn/daily'
    for name in DataFiles:
        filename = DataFiles[name]
        print('Getting %s' % name)
        rptr = requests.get(base_url + '/' + filename, stream=True)
        recv = 0
        with open(filename, 'wb') as fptr:
            for chunk in rptr.iter_content(chunk_size=65536):
                if chunk:
                    fptr.write(chunk)
                    recv += len(chunk)
                    sys.stdout.write('%s %d\r' % (name, recv))
                    sys.stdout.flush()
        print('Got %s, size %d' % (name, os.path.getsize(filename)))


def fill_dates(all_dates):
    """
    Generate a set of expected dates and assigned them an index value.  By
    pregenerating this in most-recent-first order, the amount of memory used
    for station data is lower.

    :param all_date: a dictionary to populate.
    """
    now = datetime.datetime.now()
    y, m, d = now.year, now.month, now.day
    while y >= 1813:
        all_dates[(y, m, d)] = len(all_dates)
        if d > 1:
            d -= 1
        else:
            m -= 1
            if not m:
                y -= 1
                m = 12
            d = 31 if m in (1, 3, 5, 7, 8, 10, 12) else (
                30 if m != 2 else 28 + (0 if (
                    y % 4 or (not y % 100 and y % 400)) else 1))


def parse_stations(bounds=None):
    """
    Read the list of stations, each with a location and name.

    :param bounds: optional bounds to limit which stations are included.  This
        is an array of xmin, ymax, xmax, ymin.
    :returns: a dictionary of stations.
    """
    stations = {}
    with open(DataFiles['stations']) as fptr:
        for line in fptr:
            try:
                station = {
                    'y': float(line[12:20].strip()),
                    'x': float(line[21:30].strip()),
                    'z': float(line[31:37].strip()),
                    'name': line[41:71].strip(),
                }
                if station['z'] < -999:
                    del station['z']
                if (bounds and (
                        station['x'] < min(bounds[0], bounds[2]) or
                        station['x'] > max(bounds[0], bounds[2]) or
                        station['y'] < min(bounds[1], bounds[3]) or
                        station['y'] > max(bounds[1], bounds[3]))):
                    continue
                stations[line[:11].strip()] = station
            except Exception:
                pass
    return stations


def read_data(stations, param, limit=None):  # noqa
    """
    Read parameter data from the tar file.

    :param station: dictionary of known stations.
    :param param: the name of the parameter to read.
    :param limit: if set, stop reading data once this many stations with the
        specified parameter are read.
    :returns: the dictionary of dates with data.
    """
    numread = 0
    all_dates = {}
    fill_dates(all_dates)
    with tarfile.open(DataFiles['data']) as tptr:
        for mod in tptr:
            station = mod.name.split('/')[-1].split('.')[0]
            if station not in stations:
                continue
            try:
                lines = tptr.extractfile(mod).readlines()
                lines = [line.decode() for line in lines]
            except Exception:
                del stations[station]
                continue
            if limit and numread >= limit:
                break
            lines = [line for line in lines if line[17:21] == param]
            data = []
            for line in lines:
                try:
                    year = int(line[11:15])
                    month = int(line[15:17])
                    dim = 31 if month in (1, 3, 5, 7, 8, 10, 12) else (
                        30 if month != 2 else 28 + (0 if (
                            year % 4 or (not year % 100 and year % 400)) else 1))
                    values = [int(line[21 + i * 8: 26 + i * 8]) for i in range(dim)]
                    for day in range(dim):
                        if values[day] > -9000 and values[day] < 9000:
                            key = (year, month, day + 1)
                            all_dates.setdefault(key, len(all_dates))
                            if len(data) < all_dates[key] + 1:
                                data += [None] * (all_dates[key] + 1 - len(data))
                            data[all_dates[key]] = values[day]

                except Exception:
                    pass
            start = next((i for i, entry in enumerate(data) if entry is not None), None)
            if not len(data) or start is None:
                del stations[station]
                continue
            stations[station]['start'] = start
            stations[station]['data'] = data[start:]
            numread += 1
            if not numread % 100:
                print('%d/%d %s %d %d %d %d %r %r' % (
                    numread, len(stations), station,
                    len([item for item in data if item is not None]),
                    len(data),
                    sum([len(s['data']) for s in stations.values() if 'data' in s]),
                    len(all_dates), min(all_dates), max(all_dates)))
    for station in list(stations):
        if 'data' not in stations[station]:
            del stations[station]
    return all_dates


if __name__ == '__main__':  # noqa
    binsize = 'year'
    binfunc = 'sum'
    bounds = None
    compact = False
    dest = 'noaa_tin.json'
    download = False
    edge = None
    full = False
    limit = None
    param = None
    help = False
    for arg in sys.argv[1:]:
        if arg.startswith('--bounds='):
            bounds = [float(val) for val in arg.split('=', 1)[1].split(',')]
        elif arg == '--compact':
            compact = True
        elif arg == '--download':
            download = True
        elif arg in ('--sum', '--min', '--max', '--average'):
            binfunc = arg[2:]
        elif arg in ('--year', '--month'):
            binsize = arg[2:]
        elif arg.startswith('--edge='):
            edge = float(arg.split('=', 1)[1])
        elif arg == '--full':
            full = True
        elif arg.startswith('--limit='):
            limit = int(arg.split('=', 1)[1])
        elif arg == '--name':
            full = 'name'
        elif arg.startswith('--out='):
            dest = arg.split('=', 1)[1]
        elif not arg.startswith('-') and not param:
            param = arg
        else:
            help = True
    if help:
        print("""Make a TIN from NOAA weather data.

Syntax: fetch_noaa.py [--download] (parameter) [--out=(output file)]
    [--year|--month] [--sum|--min|--max|--average] [--full|--name] [--compact]
    [--limit=(num)] [--edge=(distance)] [--bounds=(left,top,right,bottom)]

Common parameters are PRCP, SNOW, SNWD, TMAX, TMIN.
--bounds limits which stations are used.
--compact outputs denser json with less labels.
--download downloads new data files.
--edge skips generating elements if any edge would be longer than the specified
 distance.
--full includes station information in output nodes.  --name just includes the
 station name.
--limit only parses the specified number of stations that have the parameter.
--out specified the output filename.  Default is noaa_tin.json.
--year and --month determine the output bin size.
--sum, --min, --max, --average determine how values are aggregated in each bin.

The example in geojs was generated with
  fetch_noaa.py PRCP --edge=10 --out=noaa_prcp.json --bounds=-180,72,-50,17
    --name --compact
Add --download to fetch new data.
""")
        sys.exit(0)
    if download:
        download_data()
    stations = parse_stations(bounds)
    print('%d stations' % len(stations))
    param = param or 'PRCP'
    all_dates = read_data(stations, param, limit)
    bins = calc_bins(binsize, getattr(__builtins__, binfunc), all_dates, stations)
    meshes = calc_meshes(bins, stations, edge, True if compact else full)
    if compact:
        meshes = compact_meshes(meshes, stations, full)
    json = json.dumps(meshes, separators=(',', ':'), sort_keys=True).replace('},', '},\n')
    if compact:
        json = json.replace('],[', '],\n[')
    open(dest, 'w').write(json)
