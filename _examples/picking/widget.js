(function () {
  'use strict';

  function smoothFunction(n, sigma) {
    var p = [], q = [];
    var i, j, dx, ss = sigma * sigma * 2 * n * n;
    var c = 1 / (2 * sigma * Math.PI);
    var rnd = d3.random.normal();

    // preallocate
    p.length = n;
    q.length = n;

    for (i = 0; i < n; i += 1) {
      p[i] = rnd() / 50;
    }

    for (i = 0; i < n; i += 1) {
      q[i] = 0;
      for (j = 0; j < n; j += 1) {
        dx = j - i;
        q[i] += c * p[j] * Math.exp(-dx * dx / ss);
      }
    }
    return q;
  }

  /**
   * Create a differential random path in R^2.
   *
   * @param {int} n Number of points
   * @param {float} sigma Smoothness of the line (>0)
   */
  function randomPath(n, sigma, cx, cy) {
    var x = smoothFunction(n, sigma);
    var y = smoothFunction(n, sigma);

    return x.map(function (d, i) {
      return {
        x: cx + (d - 0.5) * 15,
        y: cy + (y[i] - 0.5) * 10
      };
    });
  }

  window.randomPath = randomPath;
})();
