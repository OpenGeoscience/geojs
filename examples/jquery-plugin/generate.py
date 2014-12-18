import json
import random

colors = json.loads(open('css-color-names.json').read()).keys()
center = {
    "x": -100,
    "y": 40
}
std = 10
corr = 0.3

N = 250


def makePoint(*arg):
    n1 = random.gauss(0, 10)
    n2 = random.gauss(0, 8)
    return {
        "color": random.choice(colors),
        "position": {
            "x": center["x"] + corr * n1 + (1 - corr) * n2,
            "y": center["y"] + corr * n2 + (1 - corr) * n1
        },
        "exp": random.expovariate(1./10),
        "unif": random.random()
    }

A = map(makePoint, xrange(N))

open('data.json', 'w').write(json.dumps(A))
