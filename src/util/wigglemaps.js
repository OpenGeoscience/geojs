//////////////////////////////////////////////////////////////////////////////
/*
 * Includes several support classes adapted from wigglemaps.
 *
 * https://github.com/dotskapes/wigglemaps
 *
 * Copyright 2013 Preston and Krejci (dotSkapes Virtual Lab)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//////////////////////////////////////////////////////////////////////////////

/* jshint ignore: start */
(function () {
    'use strict';

    var RangeNode = function (elem, start, end, current) {
        this.data = elem[current];
        this.left = null;
        this.right = null;
        if (start != current)
            this.left = new RangeNode (elem, start, current - 1, parseInt ((start + (current - 1)) / 2, 10));
        if (end != current)
            this.right = new RangeNode (elem, current + 1, end, parseInt ((end + (current + 1)) / 2, 10));
        this.subtree = [];
        for (var i = start; i <= end; i ++) {
            this.subtree.push (elem[i]);
        }
        this.subtree.sort (function (a, b) {
            return a.y - b.y;
        });

        var xrange = function (b) {
            return (b.x_in (elem[start]) && b.x_in (elem[end]));
        };

        this.yrange = function (b, start, end) {
            return (b.y_in (this.subtree[start]) && b.y_in (this.subtree[end]));
        };

        this.subquery = function (result, box, start, end, current) {
            if (this.yrange (box, start, end)) {
                for (var i = start; i <= end; i ++) {
                    result.push (this.subtree[i]);
                }
                return;
            }
            if (box.y_in (this.subtree[current]))
                result.push (this.subtree[current]);
            if (box.y_left (this.subtree[current])){
                if (current != end)
                    this.subquery (result, box, current + 1, end, parseInt ((end + (current + 1)) / 2, 10));
            }
            else if (box.x_right (this.subtree[current])) {
                if (current != start)
                    this.subquery (result, box, start, current - 1, parseInt ((start + (current - 1)) / 2, 10));
            }
            else {
                if (current != end)
                    this.subquery (result, box, current + 1, end, parseInt ((end + (current + 1)) / 2, 10));
                if (current != start)
                    this.subquery (result, box, start, current - 1, parseInt ((start + (current - 1)) / 2, 10));
            }
        };
        
        this.search = function (result, box) {
            if (xrange (box)) {
                this.subquery (result, box, 0, this.subtree.length - 1, parseInt ((this.subtree.length - 1) / 2, 10));
                return;
            }
            else {
                if (box.contains (this.data))
                    result.push (this.data);
                if (box.x_left (this.data)) {
                    if (this.right)
                        this.right.search (result, box);
                }
                else if (box.x_right (this.data)) {
                    if (this.left)
                        this.left.search (result, box);
                }
                else {
                    if (this.left)
                        this.left.search (result, box);
                    if (this.right)
                        this.right.search (result, box);
                }
            }
        };
    };

    var RangeTree = function (elem) {
        elem.sort (function (a, b) {
            return a.x - b.x;
        });
        if (elem.length > 0)
            this.root = new RangeNode (elem, 0, elem.length - 1, parseInt ((elem.length - 1) / 2, 10));
        else
            this.root = null;

        this.search = function (_box) {
            if (!this.root)
                return [];
            //var box = new Box (min, max);
            var box = _box.clone ();
            var result = [];
            this.root.search (result, box);
            return result;
        };
    };

    var Box = function (v1, v2) {
        this.min = v1.clone ();
        this.max = v2.clone ();
        this.contains = function (p) {
            return (v1.x <= p.x) && (v2.x >= p.x) && (v1.y <= p.y) && (v2.y >= p.y);
        };

        this.x_in = function (p) {
            return (v1.x <= p.x) && (v2.x >= p.x);
        };

        this.x_left = function (p) {
            return (v1.x >= p.x);
        };

        this.x_right = function (p) {
            return (v2.x <= p.x);
        };

        this.y_in = function (p) {
            return (v1.y <= p.y) && (v2.y >= p.y);
        };

        this.y_left = function (p) {
            return (v1.y >= p.y);
        };

        this.y_right = function (p) {
            return (v2.y <= p.y);
        };

        this.area = function () {
            return (this.max.x - this.min.x) * (this.max.y - this.min.y);
        };

        this.height = function () {
            return this.max.y - this.min.y;
        };

        this.width = function () {
            return this.max.x - this.min.x;
        };
        
        this.vertex = function (index) {
            switch (index) {
            case 0:
                return this.min.clone ();
            case 1:
                return new vect (this.max.x, this.min.y);
            case 2:
                return this.max.clone ();
            case 3:
                return new vect (this.min.x, this.max.y);
            default:
                throw "Index out of bounds: " + index ;
            }
        };

        this.intersects = function (box) {
            for (var i = 0; i < 4; i ++) {
                for (var j = 0; j < 4; j ++) {
                    if (vect.intersects (this.vertex (i), this.vertex ((i + 1) % 4),
                                         box.vertex (j), box.vertex ((j + 1) % 4)))
                        return true;
                }
            }
            if (this.contains (box.min) &&
                this.contains (box.max) &&
                this.contains (new vect (box.min.x, box.max.y)) &&
                this.contains (new vect (box.max.x, box.min.y)))
                return true;
            if (box.contains (this.min) &&
                box.contains (this.max) &&
                box.contains (new vect (this.min.x, this.max.y)) &&
                box.contains (new vect (this.max.x, this.min.y)))
                return true;
            return false;
        };

        this.union = function (b) {
            this.min.x = Math.min (this.min.x, b.min.x);
            this.min.y = Math.min (this.min.y, b.min.y);

            this.max.x = Math.max (this.max.x, b.max.x);
            this.max.y = Math.max (this.max.y, b.max.y);
        };

        this.centroid = function () {
            return new vect ((this.max.x + this.min.x) / 2, (this.max.y + this.min.y) / 2);
        };

        this.clone = function () {
            return new Box (v1, v2);
        };
    };

    // A basic vector type. Supports standard 2D vector operations
    var Vector2D = function (x, y) {
        this.x = x;
        this.y = y;

        this.add = function (v) {
            this.x += v.x;
            this.y += v.y;
            return this;
        };
        this.sub = function (v) {
            this.x -= v.x;
            this.y -= v.y;
            return this;
        };
        this.scale = function (s) {
            this.x *= s;
            this.y *= s;
            return this;
        };
        this.length = function () {
            return Math.sqrt (this.x * this.x + this.y * this.y);
        };
        this.normalize = function () {
            var scale = this.length ();
            if (scale === 0)
                return this;
            this.x /= scale;
            this.y /= scale;
            return this;
        };
        this.div = function (v) {
            this.x /= v.x;
            this.y /= v.y;
            return this;
        };
        this.floor = function () {
            this.x = Math.floor (this.x);
            this.y = Math.floor (this.y);
            return this;
        };
        this.zero = function (tol) {
            tol = tol || 0;
            return (this.length() <= tol);
        };
        this.dot = function (v) {
            return (this.x * v.x) + (this.y * v.y);
        };
        this.cross = function (v) {
            return (this.x * v.y) - (this.y * v.x);
        };
        this.rotate = function (omega) {
            var cos = Math.cos (omega);
            var sin = Math.sin (omega);
            xp = cos * this.x - sin * this.y;
            yp = sin * this.x + cos * this.y;
            this.x = xp;
            this.y = yp;
            return this;
        };
        this.clone = function () {
            return new Vector2D (this.x, this.y); 
        };

        this.array = function () {
            return [this.x, this.y];
        };
    };

    // A shortcut for the vector constructor
    function vect (x, y) {
        return new Vector2D (x, y);
    }

    // Shorthand operations for vectors for operations that make new vectors

    vect.scale = function (v, s) {
        return v.clone ().scale (s);
    };

    vect.add = function (v1, v2) {
        return v1.clone ().add (v2);
    };

    vect.sub = function (v1, v2) {
        return v1.clone ().sub (v2);
    };

    vect.dist = function (v1, v2) {
        return v1.clone ().sub (v2).length ();
    };

    vect.dir = function (v1, v2) {
        return v1.clone ().sub (v2).normalize ();
    };

    vect.dot = function (v1, v2) {
        return (v1.x * v2.x) + (v1.y * v2.y);
    };

    vect.cross = function (v1, v2) {
        return (v1.x * v2.y) - (v1.y * v2.x);
    };

    vect.left = function (a, b, c, tol) {
        if (!tol)
            tol = 0;
        var v1 = vect.sub (b, a);
        var v2 = vect.sub (c, a);
        return (vect.cross (v1, v2) >= -tol);
    };

    vect.intersects = function (a, b, c, d, tol) {
        if (!tol)
            tol = 0;
        return (vect.left (a, b, c, tol) != vect.left (a, b, d, tol) &&
                vect.left (c, d, b, tol) != vect.left (c, d, a, tol));
    };

    vect.intersect2dt = function (a, b, c, d) {
        var denom = a.x * (d.y - c.y) +
            b.x * (c.y - d.y) +
            d.x * (b.y - a.y) +
            c.x * (a.y - b.y);

        if (denom === 0)
            return Infinity;
        
        var num_s = a.x * (d.y - c.y) +
            c.x * (a.y - d.y) +
            d.x * (c.y - a.y);
        var s = num_s / denom;

        var num_t = -(a.x * (c.y - b.y) +
                      b.x * (a.y - c.y) +
                      c.x * (b.y - a.y));
        var t = num_t / denom;
        
        return t;
    };

    vect.intersect2dpos = function (a, b, c, d) {
        var denom = a.x * (d.y - c.y) +
            b.x * (c.y - d.y) +
            d.x * (b.y - a.y) +
            c.x * (a.y - b.y);

        if (denom === 0)
            return Infinity;
        
        var num_s = a.x * (d.y - c.y) +
            c.x * (a.y - d.y) +
            d.x * (c.y - a.y);
        var s = num_s / denom;

        /*var num_t = -(a.x * (c.y - b.y) +
                      b.x * (a.y - c.y) +
                      c.x * (b.y - a.y));
        var t = num_t / denom;*/
        
        var dir = vect.sub (b, a);
        dir.scale (s);
        return vect.add (a, dir);
    };

    vect.rotate = function (v, omega) {
        var cos = Math.cos (omega);
        var sin = Math.sin (omega);
        xp = cos * v.x - sin * v.y;
        yp = sin * v.x + cos * v.y;
        var c = new vect (xp, yp);
        return c;
    };

    vect.normalize = function (v) {
        return v.clone ().normalize ();
    };

    // Export to geo.util module
    geo.util.RangeTree = RangeTree;
    geo.util.Box = Box;
    geo.util.vect = vect;
}());
/* jshint ignore: end */
