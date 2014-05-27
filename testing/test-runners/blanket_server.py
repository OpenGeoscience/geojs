#!/usr/bin/env python

import sys
import os
import time
import json
import collections

import xml.etree.cElementTree as ET

if sys.version_info[0] == 2:
    import SocketServer
    import SimpleHTTPServer
    import BaseHTTPServer
elif sys.version_info[0] == 3:
    import socketserver as SocketServer
    from http import server as SimpleHTTPServer
    BaseHTTPServer = SimpleHTTPServer
else:
    raise Exception("Unsupported python version")


class Aggregator(object):
    COVROOT = os.path.curdir
    COVFILE = os.path.join(COVROOT, 'cov.json')
    OUTFILE = os.path.join(COVROOT, 'coverage.xml')

    def read_cov(self):
        '''
        read the current coverage file
        '''
        if not os.path.isfile(self.COVFILE):
            return {}
        else:
            return json.loads(open(self.COVFILE, 'r').read())

    def write_cov(self, cov):
        '''
        write the coverage information to a file
        '''
        s = json.dumps(cov, indent=4)
        open(self.COVFILE, 'w').write(s)
        return s

    def reset(self):
        '''
        delete the coverage information
        '''
        if os.path.isfile(self.COVFILE):
            os.remove(self.COVFILE)
        if os.path.isfile(self.OUTFILE):
            os.remove(self.OUTFILE)
        return '{}'

    def append(self, coverage):
        '''
        append data to the coverage
        '''

        total = self.read_cov()
        for _file, counts in coverage['files'].iteritems():
            f = total.get(_file, {})
            total[_file] = f

            for line, count in counts.iteritems():
                f[line] = f.get(line, 0) + (count or 0)
        return self.write_cov(total)

    def stats(self, cov):
        stats = {
            'totalSloc': 0,
            'totalHits': 0,
            'files': {}
        }
        for _file, lines in cov.iteritems():
            hits, sloc = 0, 0
            for lineNum, hit in lines.iteritems():
                sloc += 1
                hits += hit and 1

            stats['totalSloc'] += sloc
            stats['totalHits'] += hits
            stats['files'][_file] = {
                'sloc': sloc,
                'hits': hits
            }
        return stats

    @classmethod
    def _percent(cls, num, den):
        den = den or 1  # prevent divide by zero
        return float(num) / float(den)

    def output(self, fname=None):
        cov = self.read_cov()
        stats = self.stats(cov)
        totalPct = self._percent(stats['totalHits'], stats['totalSloc'])

        print 'Total coverage: %i / %i (%.2f%%)' % (
            stats['totalHits'],
            stats['totalSloc'],
            totalPct * 100
        )

        coverageEl = ET.Element('coverage', {
            'branch-rate': '0',
            'line-rate': str(totalPct),
            'version': '3.6',
            'timestamp': str(int(time.time()))
        })
        packagesEl = ET.SubElement(coverageEl, 'packages')
        packageEl = ET.SubElement(packagesEl, 'package', {
            'branch-rate': '0',
            'complexity': '0',
            'line-rate': str(totalPct),
            'name': ''
        })
        classesEl = ET.SubElement(packageEl, 'classes')

        for _file, data in cov.iteritems():
            lineRate = self._percent(
                stats['files'][_file]['hits'],
                stats['files'][_file]['sloc']
            )
            classEl = ET.SubElement(classesEl, 'class', {
                'branch-rate': '0',
                'complexity': '0',
                'line-rate': str(lineRate),
                'filename': _file,
                'name': _file
            })
            linesEl = ET.SubElement(classEl, 'lines')
            ET.SubElement(classEl, 'methods')
            for lineNum, hit in data.iteritems():
                ET.SubElement(linesEl, 'line', {
                    'number': str(lineNum),
                    'hits': str(hit)
                })

        tree = ET.ElementTree(coverageEl)
        out_fname = fname
        if out_fname is None:
            out_fname = self.OUTFILE
        open(out_fname, 'w').write(ET.tostring(tree.getroot()))
        return json.dumps(cov, indent=4)


class Handler(BaseHTTPServer.BaseHTTPRequestHandler):
    agg = Aggregator()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, OPTIONS'
        )
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def do_GET(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, OPTIONS'
        )
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-type", "application/json")
        self.end_headers()

        self.wfile.write(self.agg.output())

    def do_PUT(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header(
            'Access-Control-Allow-Methods',
            'GET, POST, PUT, OPTIONS'
        )
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-type", "application/json")
        self.end_headers()

        l = int(self.headers['Content-Length'])
        print 'received %i bytes' % l

        s = self.rfile.read(l)
        try:
            obj = json.loads(s)
        except ValueError as e:
            print '--' + s + '--'
            raise e
        self.wfile.write(
            self.agg.append(obj)
        )


def serve(host='localhost', port=6116):
    server = SocketServer.TCPServer(
        (host, int(port)),
        Handler
    )
    try:
        server.serve_forever()
    finally:
        server.server_close()

if __name__ == '__main__':
    if len(sys.argv[1:]) == 1 and sys.argv[1] == 'reset':
        Aggregator().reset()
    elif len(sys.argv[1:]) == 2 and sys.argv[1] == 'report':
        print Aggregator().output(sys.argv[2])
    else:
        serve(*sys.argv[1:])
