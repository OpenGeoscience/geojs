#!/usr/bin/env python3

import argparse
import os
import re
import sys


def readSource(source):
    base_dir = os.path.abspath(os.path.dirname(source))
    data = open(source).read()
    parts = re.split('(\\$[-.\\w]+)', data)
    for idx, chunk in enumerate(parts):
        if chunk.startswith('$') and len(chunk) > 1:
            filepath = os.path.abspath(os.path.join(base_dir, chunk[1:] + '.glsl'))
            if not filepath.startswith(base_dir + os.sep):
                raise ValueError('Invalid include path: ' + chunk)
            parts[idx] = readSource(filepath)
    return ''.join(parts)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Preprocess glsl files to handle includes in the same way '
        'as shader-loader.  The output of this can sent to glslangValidator.')
    parser.add_argument('source', help='Source file')
    args = parser.parse_args()
    data = readSource(args.source)
    sys.stdout.write(data)
