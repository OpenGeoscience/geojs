 //////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, continue:true, indent: 2*/

/*global vglModule, ogs, vec4, inherit, $, Uint16Array*/
//////////////////////////////////////////////////////////////////////////////
function ArrayToStr(a) {
  var res = '';
  for (var i=0; i<a.length; ++i) {
    res += a[i]+' ';
  }
  return res;
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Vertex and Edges classes
 */
//////////////////////////////////////////////////////////////////////////////
function Vertex(x,y,idx) {
  this.x = x;
  this.y = y;
  this.idx = idx;
}

function Edge(origin,next,prev,idx) {
  this.idx = idx;
  this.origin = origin;
  this.next = next;
  this.prev = prev;
  this.helper = -1;
  
  this.setPrev = function(p){this.prev = p;};
  this.setNext = function(n){this.next = n;};
  this.setHelper = function(h){this.helper = h};
}

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of shapefile reader
 *
 * This contains code that reads a shapefile and produces vgl geometries
 *
 * @class
 * @returns {vglModule.shapefileReader}
 */
//////////////////////////////////////////////////////////////////////////////
vglModule.shapefileReader = function() {
  'use strict';

  if (!(this instanceof vglModule.shapefileReader)) {
    return new vglModule.shapefileReader();
  }

  var m_that = this;
  var SHP_HEADER_LEN = 8;
  var SHP_NULL = 0;
  var SHP_POINT = 1;
  var SHP_POLYGON = 5;
  var SHP_POLYLINE = 3;
  
  // Various useful math functions
  this.scal = function(a,b) {return a[0]*b[0]+a[1]*b[1];}
  this.norm = function(a) {return Math.sqrt(this.scal(a,a));}
  this.getAngle = function(a,b) {
    if (this.norm(a)== 0.0||this.norm(b)==0) {
      return 0.0;
    }
    var angle = Math.acos(this.scal(a,b)/(this.norm(a)*this.norm(b)));
    var sign = a[0]*b[1]-a[1]*b[0];
    if (sign<0.0) {
      angle = 2*Math.PI - angle;
    }
    return angle;
  }
  this.normalize = function(a) {
    var n = this.norm(a);
    if (n == 0.0) {
      return [0.0,0.0];
    } else {
      return [a[0]/n,a[1]/n];
    }
  }
  

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read int8 binary
   *
   * @param data, offset
   * @return int8
   */
  ////////////////////////////////////////////////////////////////////////////
  this.int8 = function (data, offset) {
      return data.charCodeAt (offset);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read bint32 binary
   *
   * @param data, offset
   * @return bint32
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bint32 = function (data, offset) {
    return (
      ((data.charCodeAt (offset) & 0xff) << 24) +
        ((data.charCodeAt (offset + 1) & 0xff) << 16) +
        ((data.charCodeAt (offset + 2) & 0xff) << 8) +
        (data.charCodeAt (offset + 3) & 0xff)
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read lint32 binary
   *
   * @param data, offset
   * @return lint32
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lint32 = function (data, offset) {
    return (
      ((data.charCodeAt (offset + 3) & 0xff) << 24) +
        ((data.charCodeAt (offset + 2) & 0xff) << 16) +
        ((data.charCodeAt (offset + 1) & 0xff) << 8) +
        (data.charCodeAt (offset) & 0xff)
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read bint16 binary
   *
   * @param data, offset
   * @return bint16
   */
  ////////////////////////////////////////////////////////////////////////////
  this.bint16 = function (data, offset) {
    return (
      ((data.charCodeAt (offset) & 0xff) << 8) +
        (data.charCodeAt (offset + 1) & 0xff)
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read lint16 binary
   *
   * @param data, offset
   * @return lint16
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lint16 = function (data, offset) {
    return (
      ((data.charCodeAt (offset + 1) & 0xff) << 8) +
        (data.charCodeAt (offset) & 0xff)
    );
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read ldbl64 binary
   *
   * @param data, offset
   * @return ldbl64
   */
  ////////////////////////////////////////////////////////////////////////////
  this.ldbl64 = function (data, offset) {
    var b0 = data.charCodeAt (offset) & 0xff;
    var b1 = data.charCodeAt (offset + 1) & 0xff;
    var b2 = data.charCodeAt (offset + 2) & 0xff;
    var b3 = data.charCodeAt (offset + 3) & 0xff;
    var b4 = data.charCodeAt (offset + 4) & 0xff;
    var b5 = data.charCodeAt (offset + 5) & 0xff;
    var b6 = data.charCodeAt (offset + 6) & 0xff;
    var b7 = data.charCodeAt (offset + 7) & 0xff;

    var sign = 1 - 2 * (b7 >> 7);
    var exp = (((b7 & 0x7f) << 4) + ((b6 & 0xf0) >> 4)) - 1023;
    var frac = (b6 & 0x0f) * Math.pow (2, 48) + b5 * Math.pow (2, 40) + b4 *
                 Math.pow (2, 32) + b3 * Math.pow (2, 24) + b2 *
                 Math.pow (2, 16) + b1 * Math.pow (2, 8) + b0;

    return sign * (1 + frac * Math.pow (2, -52)) * Math.pow (2, exp);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read lfloat32 binary
   *
   * @param data, offset
   * @return lfloat32
   */
  ////////////////////////////////////////////////////////////////////////////
  this.lfloat32 = function (data, offset) {
    var b0 = data.charCodeAt (offset) & 0xff;
    var b1 = data.charCodeAt (offset + 1) & 0xff;
    var b2 = data.charCodeAt (offset + 2) & 0xff;
    var b3 = data.charCodeAt (offset + 3) & 0xff;

    var sign = 1 - 2 * (b3 >> 7);
    var exp = (((b3 & 0x7f) << 1) + ((b2 & 0xfe) >> 7)) - 127;
    var frac = (b2 & 0x7f) * Math.pow (2, 16) + b1 * Math.pow (2, 8) + b0;

    return sign * (1 + frac * Math.pow (2, -23)) * Math.pow (2, exp);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Convert binary to string
   *
   * @param data, offset, length
   * @return {string}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.str = function (data, offset, length) {
    var chars = [];
    var index = offset;
    while (index < offset + length) {
      var c = data[index];
      if (c.charCodeAt (0) !== 0)
        chars.push (c);
      else {
        break;
      }
      index ++;
    }
    return chars.join ('');
  };
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Insert a diagonal (i.e. two new edges) between vertices v1 and v2
   *
   * @param edges,vtces,v1,v2
   */
  ////////////////////////////////////////////////////////////////////////////
  this.createDiag = function(edges,vtces,v1,v2) {
    var ev1 = edges.map(function(e1){return e1.origin;}).indexOf(v1);
    // Find all edges who have v2 as origin.
    var ev2=[];
    var idx = edges.map(function(e1){return e1.origin;}).indexOf(v2);
    while(idx != -1) {
      ev2.push(idx);
      idx = edges.map(function(e1){return e1.origin;}).indexOf(v2, idx+1);
    }
    var best = -1;
    // If there is only one edge coming out of v2
    if (ev2.length==1) {
      best = 0;
    } else {
      var dir = [];
      var angles = [];
      for (var i=0; i<ev2.length; ++i) {
        // Compute direction of the edge
        var ev3 = edges.map(function(e1){return e1.idx;}).indexOf(edges[ev2[i]].next);
        var v3 = edges[ev3].origin;
        (vtces[v2].x < vtces[v3].x) ? dir.push('right') : dir.push('left');
        angles.push(this.getAngle([1.0,0.0],[vtces[v3].x-vtces[v2].x,vtces[v3].y-vtces[v2].y]));
      }
      
      // cases end->merge, merge->merge and regular->merge
      if (vtces[v1].type != 'split') {
        var smallest = Math.PI/2.0;
        for (var i=0; i<ev2.length; ++i) {
          if (dir[i] == 'right') {
            if (angles[i]>Math.PI) {angles[i] -= 2.0*Math.PI;}
            if (angles[i] <= smallest) {
              smallest = angles[i];
              best = i;
            }
          }
        }
      } else {
        if (vtces[v2].type == 'merge') {
          for (var i=0; i<ev2.length; ++i) {
            // we want the last inserted edge connected to v2
            if (dir[i] == 'right') {best = i;}
          }
        }
        else {
          if (vtces[v2].type == 'split') {
            var ev2_prev;
            if (v2 != 0) {
              ev2_prev = edges.map(function(e1){return e1.idx;}).indexOf(v2-1);
            } else {
              ev2_prev = edges.map(function(e1){return e1.idx;}).indexOf(vtces.length-1);
            }
            var ev2_next;
            if (v2 != (vtces.length-1)) {
              ev2_next = edges.map(function(e1){return e1.idx;}).indexOf(v2+1);
            } else {
              ev2_next = edges.map(function(e1){return e1.idx;}).indexOf(0);
            }
            var a = vtces[edges[ev2_prev].origin];
            var b = vtces[v2];
            var c = vtces[edges[ev2_next].origin];
            var ab = this.normalize([(b.x-a.x),(b.y-a.y)]);
            var bc = this.normalize([(c.x-b.x),(c.y-b.y)]);
            var n = [(ab[0]+bc[0]),(ab[1]+bc[1])];
            var s = this.scal(n,[vtces[v2].x-vtces[v1].x,vtces[v2].y-vtces[v1].y]);
            if (s < 0.0) {
              var smallest = 3.0*Math.PI/2.0;
              for (var i=0; i<ev2.length; ++i) {
                if ((angles[i] < smallest)&&(angles[i] > Math.PI)) {
                  smallest = angles[i];
                  best = i;
                }
              }
            }
            else {
              var smallest = Math.PI;
              for (var i=0; i<ev2.length; ++i) {
                if (angles[i] < smallest) {
                  smallest = angles[i];
                  best = i;
                }
              }
            }
          }
          if (vtces[v2].type == 'regular') {
            (vtces[v2].interior == 'left') ? best = 0 : best = ev2.length-1;
          }
        }
      }
      if (best == -1) {best = 0;}
    }
    var ev1_prev = edges.map(function(e1){return e1.next;}).indexOf(ev1);
    var ev2_prev = edges.map(function(e1){return e1.next;}).indexOf(ev2[best]);
    var e1 = new Edge(v1,ev2[best],ev1_prev,edges.length);
    var e2 = new Edge(v2,ev1,ev2_prev,edges.length+1);
    edges[ev1_prev].setNext(edges.length);
    edges[ev2_prev].setNext(edges.length+1);
    edges[ev2[best]].setPrev(edges.length);
    edges[ev1].setPrev(edges.length+1);
    edges.push(e1);
    edges.push(e2);
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Find the closest edge on the right on vertex v
   *
   * @param v,vtces,edges,sweep_array
   * @return idx
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getRightEdge = function(v,vtces,edges,sweep_array) {
    var sweep_pos = v.y;
    
    var count = 0;
    var found = 0;
    var right_idx, right_pos,t;
    while (!found) {
      var v1_idx = edges[sweep_array[count]].origin;
      var v2_idx = edges[edges.map(function(e1){return e1.prev;}).indexOf(sweep_array[count])].origin;
      ((vtces[v1_idx].y-vtces[v2_idx].y)==0) ? t = 1.0 : t = (vtces[v1_idx].y-sweep_pos)/(vtces[v1_idx].y-vtces[v2_idx].y);
      
      var edge_pos = t*vtces[v2_idx].x + (1-t)*vtces[v1_idx].x;
      if (edge_pos >= v.x) {
        found = 1;
        right_idx = count;
        right_pos = edge_pos;
      }
      count++;
    }
    
    for (var i=count; i< sweep_array.length; ++i) {
      var v1_idx = edges[sweep_array[i]].origin;
      var v2_idx = edges[edges.map(function(e1){return e1.prev;}).indexOf(sweep_array[i])].origin;
      ((vtces[v1_idx].y-vtces[v2_idx].y)==0) ? t = 1.0 : t = (vtces[v1_idx].y-sweep_pos)/(vtces[v1_idx].y-vtces[v2_idx].y);

      var edge_pos = t*vtces[v2_idx].x + (1-t)*vtces[v1_idx].x;
      if ((edge_pos >= v.x)&&(edge_pos < right_pos)) {
        right_pos = edge_pos;
        right_idx = i;
      }
    }
    return right_idx;
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Push triangle (v0,v1,v2) in vgl
   *
   * @param v0,v1,v2,geom
   */
  ////////////////////////////////////////////////////////////////////////////
  this.addTriangle = function(v0,v1,v2,geom) {
    var indices = new Uint16Array([v0,v1,v2]);
    var vgltriangle = new vglModule.triangles();
    vgltriangle.setIndices(indices);
    geom.addPrimitive(vgltriangle);
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the bounding box of the polygon
   *
   * @param vtces
   * @return BBox (size-4 array)
   */
  ////////////////////////////////////////////////////////////////////////////
  this.getBBox = function(vtces) {
    var xmin = vtces[0].x;
    var xmax = vtces[0].x;
    var ymin = vtces[0].y;
    var ymax = vtces[0].y;
    for (var i=1; i<vtces.length; ++i) {
      if (vtces[i].x < xmin) {xmin = vtces[i].x;}
      if (vtces[i].x > xmax) {xmax = vtces[i].x;}
      if (vtces[i].y < ymin) {ymin = vtces[i].y;}
      if (vtces[i].y > ymax) {ymax = vtces[i].y;}
    }
    return [xmin,xmax,ymin,ymax];
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return 1 if box1 is inside box2
   *
   * @param box1, box2
   */
  ////////////////////////////////////////////////////////////////////////////
  this.isInside = function(box1,box2) {
    var res = 0;
    if ((box1[0]>=box2[0])&&(box1[1]<=box2[1])&&(box1[2]>=box2[2])&&(box1[3]<=box2[3])) {
      res = 1;
    }
    return res;
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Shift indexes when merging two rings
   *
   * @param rings,a,b
   */
  ////////////////////////////////////////////////////////////////////////////
  this.shiftRing = function(rings,a,b) {
    var shift = rings[b][0].length;
    for (var i=0; i<rings[a][0].length; ++i) {
      rings[a][0][i].idx += shift;
      rings[a][1][i].idx += shift;
      rings[a][1][i].next += shift;
      rings[a][1][i].prev += shift;
      rings[a][1][i].origin += shift;
    }
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return 1 if the ring turns Counter-ClockWise
   *
   * @param rings, a
   * @return 0 or 1
   */
  ////////////////////////////////////////////////////////////////////////////
  this.turnCCW = function(rings,a) {
    var v0 = rings[a][0][0];
    var sum = 0;
    for (var i=1; i< rings[a][0].length; ++i) {
      var v1 = rings[a][0][i];
      sum += (v1.x-v0.x)*(v1.y+v0.y);
      v0 = rings[a][0][i];
    }
    if (sum<0) {
      return 1;
    } else {return 0;}
  }
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Rotate the polygon of angle alpha in a counter-clockwise way
   *
   * @param vtces, alpha
   */
  ////////////////////////////////////////////////////////////////////////////
  this.rotate = function(vtces,alpha) {
    var c = Math.cos(alpha);
    var s = Math.sin(alpha);
    for (var i=0; i<vtces.length; ++i) {
      var _x = vtces[i].x*c-vtces[i].y*s;
      var _y = vtces[i].x*s+vtces[i].y*c;
      vtces[i].x = _x;
      vtces[i].y = _y;
    }
  }

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read point data
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readPoint = function(coordinates) {
    var geom = new vglModule.geometryData(),
        vglpoints = new vglModule.points(),
        vglcoords = new vglModule.sourceDataP3fv(),
        indices = new Uint16Array(1),
        x = null,
        y = null,
        z = null,
        i = null;

    geom.addSource(vglcoords);
    for (i = 0; i < 1; i++) {
      indices[i] = i;

      x = coordinates[0];
      y = coordinates[1];
      z = 0.0;
      if (coordinates.length>2) {
        z = coordinates[2];
      }

      vglcoords.pushBack([x,y,z]);
    }

    vglpoints.setIndices(indices);
    geom.addPrimitive(vglpoints);
    geom.setName("aPoint");
    return geom;
  };
  
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Read Polygon
   *
   * @param coordinates
   * @returns {vglModule.geometryData}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readPolygon = function(vtces,edges) {
    var geom = new vglModule.geometryData(),
        vglcoords = new vglModule.sourceDataP3fv();
        

    // Add vtces coordinates to geometry
    geom.addSource(vglcoords);
    for (i = 0; i < vtces.length; i++) {
      vglcoords.pushBack([vtces[i].x,vtces[i].y,0.0]);
    }

    // Slight rotation (to avoid aligned vtces)
    this.rotate(vtces, 0.2);
    
    // Set vtces type {start,end,split,merge,regular}
    for (var i=0; i<vtces.length; ++i) {
      var e_idx = edges.map(function(e1){return e1.idx;}).indexOf(vtces[i].idx);
      var l = vtces[edges[edges[e_idx].prev].origin].idx;
      var r = vtces[edges[edges[e_idx].next].origin].idx;
      var e1 = [vtces[l].x-vtces[i].x, vtces[l].y-vtces[i].y];
      var e2 = [vtces[r].x-vtces[i].x, vtces[r].y-vtces[i].y];
      var angle = this.getAngle(e1,e2);
      if ((vtces[l].y<=vtces[i].y)&&(vtces[r].y<=vtces[i].y)) {
        if (angle < Math.PI) {
          vtces[i].type = 'start';
        } else {vtces[i].type = 'split';}
      } else if ((vtces[l].y>=vtces[i].y)&&(vtces[r].y>=vtces[i].y)) {
        if (angle < Math.PI) {
          vtces[i].type = 'end';
        } else {vtces[i].type = 'merge';}
      } else {
        vtces[i].type = 'regular';
        if (vtces[l].y>vtces[i].y) {
          vtces[i].interior = 'left';
        }
        if (vtces[r].y>vtces[i].y) {
          vtces[i].interior = 'right';
        }
      }
      
    }
    
    // Initializing structures
    // create priority queue based on y axis
    var queue = vtces.slice();
    queue.sort(function(a,b) {
      if (a.y>b.y) {return -1}
      else if (a.y<b.y) {return 1;}
      else if (a.x>b.x) {return -1}
      else {return 1;}
    });
    
    
    var sweep_array = [];
    
    while (queue.length>0) {
      var v = queue.shift();
      switch (v.type) {
        case 'start':
          var e_idx = edges.map(function(e1){return e1.idx;}).indexOf(v.idx);
          edges[e_idx].setHelper(v.idx);
          sweep_array.push(e_idx);
          break;
        case 'end':
          var e_idx = edges.map(function(e1){return e1.idx;}).indexOf(v.idx);
          var prev_e_idx = edges[e_idx].prev;
          var helper_idx = edges[prev_e_idx].helper;
          if (vtces[helper_idx].type == 'merge') {
            this.createDiag(edges,vtces,v.idx,helper_idx);
          }
          var idx_in_sweep = sweep_array.indexOf(prev_e_idx);
          sweep_array.splice(idx_in_sweep,1);
          break;
        case 'split':
          var e_idx = edges.map(function(e1){return e1.idx;}).indexOf(v.idx);
          // search in array to get edge directly right of v
          var right_idx = this.getRightEdge(v,vtces,edges,sweep_array);
          var helper_idx = edges[sweep_array[right_idx]].helper;
          this.createDiag(edges,vtces,v.idx,helper_idx);
          edges[sweep_array[right_idx]].setHelper(v.idx);
          edges[e_idx].setHelper(v.idx);
          sweep_array.push(e_idx);
          break;
        case 'merge':
          var e_idx = edges.map(function(e1){return e1.idx;}).indexOf(v.idx);
          var prev_e_idx = edges[e_idx].prev;
          var helper_idx = edges[prev_e_idx].helper;
          if (vtces[helper_idx].type == 'merge') {
            this.createDiag(edges,vtces,v.idx,helper_idx);
          }
          var idx_in_sweep = sweep_array.indexOf(prev_e_idx);
          sweep_array.splice(idx_in_sweep, 1);
          var right_idx = this.getRightEdge(v,vtces,edges,sweep_array);
          helper_idx = edges[sweep_array[right_idx]].helper;
          if (vtces[helper_idx].type == 'merge') {
            this.createDiag(edges,vtces,v.idx,helper_idx);
          }
          edges[sweep_array[right_idx]].setHelper(v.idx);
          break;
        case 'regular':
          var e_idx = edges.map(function(e1){return e1.idx;}).indexOf(v.idx);
          var t1 = edges[e_idx].prev;
          var t2 = edges[t1].origin;
          var p = vtces[edges[edges[e_idx].prev].origin].idx;
          var n = vtces[edges[edges[e_idx].next].origin].idx;
          if (vtces[p].y > vtces[n].y) {
            var prev_e_idx = edges[e_idx].prev;
            var helper_idx = edges[prev_e_idx].helper;
            if (vtces[helper_idx].type == 'merge') {
              this.createDiag(edges,vtces,v.idx,helper_idx);
            }
            
            var idx_in_sweep = sweep_array.indexOf(prev_e_idx);
            sweep_array.splice(idx_in_sweep, 1);
            
            edges[e_idx].setHelper(v.idx);
            sweep_array.push(e_idx);
          } else {
            var prev_e_idx = edges[e_idx].prev;
            var right_idx = this.getRightEdge(v,vtces,edges,sweep_array);
            helper_idx = edges[sweep_array[right_idx]].helper;
            if (vtces[helper_idx].type == 'merge') {
              this.createDiag(edges,vtces,v.idx,helper_idx);
            }
            edges[sweep_array[right_idx]].setHelper(v.idx);
          }
          break;
      }
    }
    
    
    // Now we have rings of edges creating monotonous polygons that we can split in triangles
    // Create the differents polygons
    var polygons = [];
    var edges_copy = edges.slice();
    while (edges_copy.length > 0) {
      var e0 = edges_copy[0];
      var e1 = edges_copy[edges_copy.map(function(e){return e.idx;}).indexOf(e0.next)];
      var this_poly = [];
      this_poly.push(e0);
      while (e1.idx != e0.idx) {
        this_poly.push(e1);
        edges_copy.splice(edges_copy.map(function(e){return e.idx;}).indexOf(e1.idx),1);
        e1 = edges_copy[edges_copy.map(function(e){return e.idx;}).indexOf(e1.next)];
      }
      edges_copy.splice(edges_copy.map(function(e){return e.idx;}).indexOf(e0.idx),1);
      polygons.push(this_poly);
    }
    
    // Process each polygon
    var start = 0;
    var end = polygons.length;
    var n_triangles = 0;
    for (var i=start; i<end; ++i) {
      var seq = [];
      for (var j=0; j<polygons[i].length; ++j) {
        var v = vtces[polygons[i][j].origin];
        seq.push(v);
      }
      // sort sequence along y axis;
      seq.sort(function(a,b) {
        if (a.y>b.y) {return -1}
        else if (a.y<b.y) {return 1;}
        else if (a.x>b.x) {return -1}
        else {return 1;}
      });
      // tag each vtx according to side
      for (var j=0; j<polygons[i].length; ++j) {
        var v_idx = polygons[i][j].origin;
        var e = polygons[i][polygons[i].map(function(e){return e.origin;}).indexOf(v_idx)];
        var next_e = polygons[i][polygons[i].map(function(e){return e.prev;}).indexOf(e.idx)];
        var next_v = vtces[vtces.map(function(e){return e.idx;}).indexOf(next_e.origin)];
        var prev_e = polygons[i][polygons[i].map(function(e){return e.next;}).indexOf(e.idx)];
        var prev_v = vtces[vtces.map(function(e){return e.idx;}).indexOf(prev_e.origin)];
        if (prev_v.y < vtces[v_idx].y) {
          if (next_v.y > vtces[v_idx].y) {
            vtces[v_idx].side = 'left';
          } else if (next_v.y < vtces[v_idx].y) {
            vtces[v_idx].side = 'both';
          } else {
            vtces[v_idx].side = prev_v.side;
          }
        } else if (prev_v.y > vtces[v_idx].y) {
          if (next_v.y < vtces[v_idx].y) {
            vtces[v_idx].side = 'right';
          } else if (next_v.y > vtces[v_idx].y) {
            vtces[v_idx].side = 'both';
          } else {
            vtces[v_idx].side = prev_v.side;
          }
        }
      }
            
      var stack = [];
      stack.push(seq[0]);
      stack.push(seq[1]);
      for (var j=2; j<seq.length-1; ++j) {
        var v0 = seq[j].idx;
        if (seq[j].side != stack[stack.length-1].side) {
          var v = stack.pop();
          var v1 = v.idx;
          while (stack.length > 0) {
            v = stack.pop();
            var v2 = v.idx;
            this.addTriangle(v0,v1,v2,geom);
            n_triangles++;
            v1 = v2;
          }
          stack.push(seq[j-1]);
          stack.push(seq[j]);
        } else {
          var v = stack.pop();
          var v1 = v.idx;
          while (stack.length > 0) {
            var u = stack[stack.length-1];
            var test_inside = this.getAngle([v.x-seq[j].x,v.y-seq[j].y],[u.x-seq[j].x,u.y-seq[j].y]);
            if (test_inside < Math.PI) {
              v = stack.pop();
              v2 = v.idx;
              this.addTriangle(v0,v1,v2,geom);
              n_triangles++;
              v1 = v2;
            } else {
              break;
            }
          }
          stack.push(v);
          stack.push(seq[j]);
        }
      }
      var v0 = seq[seq.length-1].idx;
      var v = stack.pop();
      var v1 = v.idx;
      while (stack.length>0) {
        v = stack.pop();
        var v2 = v.idx;
        this.addTriangle(v0,v1,v2,geom);
        n_triangles++;
        v1 = v2;
      }
    }
    
   geom.setName("POLY");
   geom.addSource(vglcoords);
   return geom;
 };

 ////////////////////////////////////////////////////////////////////////////
  /**
   * Read Header of Shp file
   *
   * @param data
   * @return {header}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readHeader = function (data) {
    var code = this.bint32(data, 0);
    var length = this.bint32(data, 24);
    var version = this.lint32(data, 28);
    var shapetype = this.lint32(data, 32);

    var xmin = this.ldbl64(data, 36);
    var ymin = this.ldbl64(data, 44);
    var xmax = this.ldbl64(data, 52);
    var ymax = this.ldbl64(data, 60);
    return {
      code: code,
      length: length,
      version: version,
      shapetype: shapetype,
      bounds: new Box (vect (xmin, ymin), vect (xmax, ymax))
    };
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Load SHX File datas
   *
   * @param data
   * @return indices
   */
  ////////////////////////////////////////////////////////////////////////////
  this.loadShx = function (data) {
    var indices = [];
    var appendIndex = function (offset) {
      indices.push (2 * m_that.bint32(data, offset));
      return offset + 8;
    };
    var offset = 100;
    while (offset < data.length) {
      offset = appendIndex (offset);
    }
    return indices;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Load DBF File datas
   *
   * @param data
   * @return {records}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.loadDBF = function (data) {
    var readHeader = function (offset) {
      var name = m_that.str(data, offset, 10);
      var type = m_that.str(data, offset + 11, 1);
      var length = m_that.int8(data, offset + 16);
      return {
        name: name,
        type: type,
        length: length
      };
    };

    // Level of the dBASE file
    var level = m_that.int8(data, 0);
    if (level == 4) {
      throw "Level 7 dBASE not supported";
    }

    // Date of last update
    var year = m_that.int8(data, 1);
    var month = m_that.int8(data, 2);
    var day = m_that.int8(data, 3);

    var num_entries = m_that.lint32(data, 4);
    var header_size = m_that.lint16(data, 8);
    var record_size = m_that.lint16(data, 10);

    var FIELDS_START = 32;
    var HEADER_LENGTH = 32;

    var header_offset = FIELDS_START;
    var headers = [];
    while (header_offset < header_size - 1) {
      headers.push (readHeader(header_offset));
      header_offset += HEADER_LENGTH;
    }

    var records = [];
    var record_offset = header_size;
    while (record_offset < header_size + num_entries * record_size) {
      var declare = m_that.str(data, record_offset, 1);
      if (declare == '*') {
        // Record size in the header include the size of the delete indicator
        record_offset += record_size;
      }
      else {
        // Move offset to the start of the actual data
        record_offset ++;
        var record = {};
        for (var i = 0; i < headers.length; i ++) {
          var header = headers[i];
          var value;
          if (header.type == 'C') {
              value = m_that.str(data, record_offset, header.length).trim ();
          }
          else if (header.type == 'N') {
              value = parseFloat (m_that.str (data, record_offset, header.length));
          }
          record_offset += header.length;
          record[header.name] = value;
        }
        records.push(record);
      }
    }
    return records;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Load SHP File datas
   *
   * @param data, dbf_data, indices
   * @return {layer}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.loadShp = function (data, dbf_data, indices, start, end) {
    var m_sfr = this;
    var features = [];
    var readRing = function (offset, start, end, idx) {
      var _vtces = [];
      var _edges = [];
      var lv, v, e;
      for (var i = start; i < end-1; ++i) {
        var x = m_that.ldbl64(data, offset + 16 * i);
        var y = m_that.ldbl64(data, offset + 16 * i + 8);
        var v = new Vertex(x,y,idx.v);
        _vtces.push(v);
        idx.v += 1;
      }
      
      for (var i=0; i<_vtces.length; ++i) {
        var left = _vtces[(i+_vtces.length-1)%(_vtces.length)].idx;
        var right = _vtces[(i+1)%(_vtces.length)].idx;
        _vtces[i].l = left;
        _vtces[i].r = right;
        // origin, next, prev, idx
        var e = new Edge(_vtces[i].idx, -1, -1, _vtces[i].idx);
        _edges.push(e);
      }
      
      for (var i=0; i<_edges.length; ++i) {
        var prev = _edges[(i+_edges.length-1)%(_edges.length)].idx;
        var next = _edges[(i+1)%(_edges.length)].idx;
        _edges[i].setPrev(prev);
        _edges[i].setNext(next);
      }
      
      return [_vtces,_edges];
    };

    var readRecord = function (offset) {
      var index = m_that.bint32(data, offset);
      var record_length = m_that.bint32(data, offset + 4);
      var record_offset = offset + 8;
      var geom_type = m_that.lint32(data, record_offset);

      if (geom_type == SHP_NULL) {
        console.log ("NULL Shape");
      }
      else if (geom_type == SHP_POINT) {
        var x = m_that.ldbl64(data, record_offset + 4);
        var y = m_that.ldbl64(data, record_offset + 12);

        var coordinates = [];
        coordinates.push([x,y]);
        var geom = m_sfr.readPoint(coordinates);
        features.push(geom);
      }
      else if (geom_type == SHP_POLYGON) {
        var num_parts = m_that.lint32(data, record_offset + 36);
        var num_points = m_that.lint32(data, record_offset + 40);

        var parts_start = record_offset + 44;
        var points_start = record_offset + 44 + 4 * num_parts;

        var idx = {v:0};
        var rings = [];
        for (var i = 0; i < num_parts; i ++) {
          idx.v = 0;
          var start = m_that.lint32(data, parts_start + i * 4);
          var end;
          if (i + 1 < num_parts) {
            end = m_that.lint32(data, parts_start + (i + 1) * 4);
          }
          else {
            end = num_points;
          }
          var ring = readRing (points_start, start, end, idx);
          rings.push(ring);
        }
        
        // Check the BBoxes of rings to check if one part is a hole in an other one
        var boxes = [];
        var inside = [];
        for (var i = 0; i < rings.length; ++i) {
          var box = m_sfr.getBBox(rings[i][0]);
          boxes.push(box);
          inside.push(0);
        }
        for (var i = 0; i < rings.length-1; ++i) {
          for (var j = i+1; j < rings.length; ++j) {
            if ((m_sfr.isInside(boxes[i],boxes[j])==1)&&(m_sfr.turnCCW(rings,i))) {
              m_sfr.shiftRing(rings,i,j);
              rings[j][0] = rings[j][0].concat(rings[i][0]);
              rings[j][1] = rings[j][1].concat(rings[i][1]);
              inside[i] = 1;              
            } else if ((m_sfr.isInside(boxes[j],boxes[i])==1)&&(m_sfr.turnCCW(rings,j))) {
              m_sfr.shiftRing(rings,j,i);
              rings[i][0] = rings[i][0].concat(rings[j][0]);
              rings[i][1] = rings[i][1].concat(rings[j][1]);
              inside[j] = 1;
            }
          }
        }
        
        for (var i = 0; i < rings.length; ++i) {
          if (inside[i]==0) {
            var geom = m_sfr.readPolygon(rings[i][0],rings[i][1]);
            features.push(geom);
          }
        }        

      }
      else {
        throw "Not Implemented: " + geom_type;
      }
    };

    var attr = this.loadDBF(dbf_data);
    if ((start < 0)||(start > indices.length)) {start = 0;}
    if ((end < 0)||(end > indices.length)) {end = indices.length;}
    for (var i = start; i < end; i ++) {
      var offset = indices[i];
      readRecord (offset);
    }
    var layer = [];

    for (var i = 0; i < features.length; i ++) {
      var feature = features[i];
      feature.attr = attr[i];
      layer.push (feature);
    }
    return layer;
  };
  
  ////////////////////////////////////////////////////////////////////////////
  /**
   * Load DBF File datas
   * 
   * @param: files {[File]}, renderer {vglModule.renderer}, viewer {vglModule.viewer}
   * start {int}, end {int}
   */
  ////////////////////////////////////////////////////////////////////////////
  this.readFiles = function(files, renderer, viewer, start, end){
    var m_sfr = this;
   var shpReader = new FileReader();
   var shxReader = new FileReader();
   var dbfReader = new FileReader();
   var shxReader = new FileReader();
   shxReader.onloadend = function() {
      var indices = m_sfr.loadShx(shxReader.result);
      var shpReader = new FileReader();
 
      shpReader.onloadend = function() {
         var shpData = shpReader.result;
  
         var dbfReader = new FileReader();
         dbfReader.onloadend = function() {
            var dbfData = dbfReader.result;
            var layer = m_sfr.loadShp(shpData, dbfData, indices, start, end);
            
            var total_bounds = layer[0].bounds();
            for (var i = 0; i < layer.length; ++i) {
               var mapper = vglModule.mapper();
               mapper.setGeometryData(layer[i]);
               mapper.setColor(getR(i,layer.length),getG(i,layer.length),getB(i,layer.length));
               var b = layer[i].bounds();
               if (b[0]<total_bounds[0]) {
                  total_bounds[0] = b[0];
               }
               if (b[1]>total_bounds[1]) {
                  total_bounds[1] = b[1];
               }
               if (b[2]<total_bounds[2]) {
                  total_bounds[2] = b[2];
               }
               if (b[3]>total_bounds[3]) {
                  total_bounds[3] = b[3];
               }
     
               var material = vglModule.utils.createGeometryMaterial();
     
               var actor = vglModule.actor();
               actor.setMapper(mapper);
               actor.setMaterial(material);
     
               renderer.addActor(actor);
             }
             
             // Setup renderer and then render the scene
            renderer.setBackgroundColor(0.9, 0.9, 0.9, 1.0);
            renderer.resetCamera();
            renderer.camera().setViewAngle(0.35);
            viewer.render();
            
         };
         dbfReader.readAsBinaryString(files[2]);
      };
      shpReader.readAsBinaryString(files[0]);
   };
   shxReader.readAsBinaryString(files[1]);
  }

  return this;
};