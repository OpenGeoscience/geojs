#!/usr/bin/env python3

import argparse
import os
import re
import sys


def readSource(source):
    data = open(source).read()
    parts = re.split('(\\$[-.\\w]+)', data)
    for idx, chunk in enumerate(parts):
        if chunk.startswith('$') and len(chunk) > 1:
            parts[idx] = readSource(os.path.join(os.path.dirname(source), chunk[1:] + '.glsl'))
    return ''.join(parts)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Preprocess glsl files to handle includes in the same way '
        'as shader-loader.  The output of this can sent to glslangValidator.')
    parser.add_argument('source', help='Source file')
    args = parser.parse_args()
    data = readSource(args.source)
    sys.stdout.write(data)
