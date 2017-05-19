/*
markercluster plugin:

Copyright 2012 David Leaver

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Leaflet utilities:

Copyright (c) 2010-2015, Vladimir Agafonkin
Copyright (c) 2010-2011, CloudMade
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are
permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this list of
      conditions and the following disclaimer.

   2. Redistributions in binary form must reproduce the above copyright notice, this list
      of conditions and the following disclaimer in the documentation and/or other
      materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/**
 * Code taken from https://github.com/Leaflet/Leaflet.markercluster
 * to support faster hierarchical clustering of features.
 * @copyright 2012, David Leaver
 */

var $ = require('jquery');
var L = {};
L.Util = {
    // return unique ID of an object
    stamp: function (obj) {
        obj._leaflet_id = obj._leaflet_id || ++L.Util.lastId;
        return obj._leaflet_id;
    },
    lastId: 0
};

/**
 * @class
 * @alias geo.util.DistanceGrid
 */
var DistanceGrid = function (cellSize) {
    this._cellSize = cellSize;
    this._sqCellSize = cellSize * cellSize;
    this._grid = {};
    this._objectPoint = {};
};

DistanceGrid.prototype = {

    addObject: function (obj, point) {
        var x = this._getCoord(point.x),
            y = this._getCoord(point.y),
            grid = this._grid,
            row = grid[y] = grid[y] || {},
            cell = row[x] = row[x] || [],
            stamp = L.Util.stamp(obj);

        point.obj = obj;
        this._objectPoint[stamp] = point;

        cell.push(obj);
    },

    updateObject: function (obj, point) {
        this.removeObject(obj);
        this.addObject(obj, point);
    },

    //Returns true if the object was found
    removeObject: function (obj, point) {
        var x = this._getCoord(point.x),
            y = this._getCoord(point.y),
            grid = this._grid,
            row = grid[y] = grid[y] || {},
            cell = row[x] = row[x] || [],
            i, len;

        delete this._objectPoint[L.Util.stamp(obj)];

        for (i = 0, len = cell.length; i < len; i++) {
            if (cell[i] === obj) {

                cell.splice(i, 1);

                if (len === 1) {
                    delete row[x];
                }

                return true;
            }
        }

    },

    eachObject: function (fn, context) {
        var i, j, k, len, row, cell, removed,
            grid = this._grid;

        for (i in grid) {
            row = grid[i];

            for (j in row) {
                cell = row[j];

                for (k = 0, len = cell.length; k < len; k++) {
                    removed = fn.call(context, cell[k]);
                    if (removed) {
                        k--;
                        len--;
                    }
                }
            }
        }
    },

    getNearObject: function (point) {
        var x = this._getCoord(point.x),
            y = this._getCoord(point.y),
            i, j, k, row, cell, len, obj, dist,
            objectPoint = this._objectPoint,
            closestDistSq = this._sqCellSize,
            closest = null;

        for (i = y - 1; i <= y + 1; i++) {
            row = this._grid[i];
            if (row) {

                for (j = x - 1; j <= x + 1; j++) {
                    cell = row[j];
                    if (cell) {

                        for (k = 0, len = cell.length; k < len; k++) {
                            obj = cell[k];
                            dist = this._sqDist(
                                objectPoint[L.Util.stamp(obj)],
                                point
                            );
                            if (dist < closestDistSq) {
                                closestDistSq = dist;
                                closest = obj;
                            }
                        }
                    }
                }
            }
        }
        return closest;
    },

    /* return the point coordinates contained in the structure */
    contents: function () {
        return $.map(this._objectPoint, function (val) { return val; });
    },

    _getCoord: function (x) {
        return Math.floor(x / this._cellSize);
    },

    _sqDist: function (p, p2) {
        var dx = p2.x - p.x,
            dy = p2.y - p.y;
        return dx * dx + dy * dy;
    }
};

module.exports = DistanceGrid;
