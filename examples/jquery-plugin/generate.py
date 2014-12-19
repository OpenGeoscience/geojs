import json
import random

css = json.loads(open('css-color-names.json').read())
colors = css.keys()
hexvalues = css.values()
center = {
    "x": -100,
    "y": 40
}
std = 10
corr = 0.3

N = 250
fruits = [
    'apple',
    'orange',
    'grape',
    'kiwi',
    'lime',
    'lemon',
    'watermelon',
    'grapefruit',
    'mango',
    'pomegranate'
]


def makePoint(*arg):
    n1 = random.gauss(0, 10)
    n2 = random.gauss(0, 8)
    return {
        "color": random.choice(colors),
        "hex": random.choice(hexvalues),
        "position": {
            "x": center["x"] + corr * n1 + (1 - corr) * n2,
            "y": center["y"] + corr * n2 + (1 - corr) * n1
        },
        "exp": random.expovariate(1./10),
        "unif": random.random(),
        "fruits": random.choice(fruits)
    }

A = map(makePoint, xrange(N))

open('data.json', 'w').write(json.dumps(A))
