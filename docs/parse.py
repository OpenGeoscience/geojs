import re
import os
import json
from subprocess import check_output


def get_class_dict():
    """Return a mapping from classname -> children"""
    lines = check_output(
        ['git', 'grep', '-E', 'inherit\([^,)]+, [^,)]+\)'],
        cwd=os.path.join(
            os.path.abspath(os.path.dirname(__file__)),
            '..',
            'src'
        )
    ).split('\n')

    r = re.compile(
        'inherit\((?P<this>[^,)]+), (?P<super>[^,)]+)\)'
    )
    
    classes = {}
    nodes = []
    for line in lines:
 
        m = r.search(line)
        if m is None:
            continue

        m = m.groupdict()

        if m['super'] not in classes:
            classes[m['super']] = []
 
        classes[m['super']].append(m['this'])
        nodes.append(m['this'])
 
    return classes, nodes


def make_core(classes, nodes):
    pass

print json.dumps(get_class_dict()[0], indent=2)
