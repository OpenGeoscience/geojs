if (typeof ogs === "undefined") {
    var ogs = {};
}

ogs.namespace = function(ns_string) {
    "use strict";
    var parts = ns_string.split("."), parent = ogs, i;
    if (parts[0] === "ogs") {
        parts = parts.slice(1);
    }
    for (i = 0; i < parts.length; i += 1) {
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

var vgl = ogs.namespace("gl");

function inherit(C, P) {
    "use strict";
    var F = function() {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.uber = P.prototype;
    C.prototype.constructor = C;
}

Object.size = function(obj) {
    "use strict";
    var size = 0, key = null;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            size++;
        }
    }
    return size;
};

vgl.GL = {
    ColorBufferBit: 16384,
    DepthBufferBit: 256
};

var m_globalModifiedTime = 0;

vgl.timestamp = function() {
    "use strict";
    if (!(this instanceof vgl.timestamp)) {
        return new vgl.timestamp();
    }
    var m_modifiedTime = 0;
    this.modified = function() {
        ++m_globalModifiedTime;
        m_modifiedTime = m_globalModifiedTime;
    };
    this.getMTime = function() {
        return m_modifiedTime;
    };
};

vgl.object = function() {
    "use strict";
    if (!(this instanceof vgl.object)) {
        return new vgl.object();
    }
    var m_modifiedTime = vgl.timestamp();
    m_modifiedTime.modified();
    this.modified = function() {
        m_modifiedTime.modified();
    };
    this.getMTime = function() {
        return m_modifiedTime.getMTime();
    };
    return this;
};

vgl.event = function() {
    "use strict";
    if (!(this instanceof vgl.event)) {
        return new vgl.event();
    }
    vgl.object.call(this);
    return this;
};

inherit(vgl.event, vgl.object);

vgl.event.keyPress = "vgl.event.keyPress";

vgl.event.mousePress = "vgl.event.mousePress";

vgl.event.mouseRelease = "vgl.event.mouseRelease";

vgl.event.contextMenu = "vgl.event.contextMenu";

vgl.event.configure = "vgl.event.configure";

vgl.event.enable = "vgl.event.enable";

vgl.event.mouseWheel = "vgl.event.mouseWheel";

vgl.event.keyRelease = "vgl.event.keyRelease";

vgl.event.middleButtonPress = "vgl.event.middleButtonPress";

vgl.event.startInteraction = "vgl.event.startInteraction";

vgl.event.enter = "vgl.event.enter";

vgl.event.rightButtonPress = "vgl.event.rightButtonPress";

vgl.event.middleButtonRelease = "vgl.event.middleButtonRelease";

vgl.event.char = "vgl.event.char";

vgl.event.disable = "vgl.event.disable";

vgl.event.endInteraction = "vgl.event.endInteraction";

vgl.event.mouseMove = "vgl.event.mouseMove";

vgl.event.mouseOut = "vgl.event.mouseOut";

vgl.event.expose = "vgl.event.expose";

vgl.event.timer = "vgl.event.timer";

vgl.event.leftButtonPress = "vgl.event.leftButtonPress";

vgl.event.leave = "vgl.event.leave";

vgl.event.rightButtonRelease = "vgl.event.rightButtonRelease";

vgl.event.leftButtonRelease = "vgl.event.leftButtonRelease";

vgl.event.click = "vgl.event.click";

vgl.event.dblClick = "vgl.event.dblClick";

vgl.boundingObject = function() {
    "use strict";
    if (!(this instanceof vgl.boundingObject)) {
        return new vgl.boundingObject();
    }
    vgl.object.call(this);
    var m_bounds = [ 0, 0, 0, 0, 0, 0 ], m_computeBoundsTimestamp = vgl.timestamp(), m_boundsDirtyTimestamp = vgl.timestamp();
    m_computeBoundsTimestamp.modified();
    m_boundsDirtyTimestamp.modified();
    this.bounds = function() {
        return m_bounds;
    };
    this.hasValidBounds = function(bounds) {
        if (bounds[0] == Number.MAX_VALUE || bounds[1] == -Number.MAX_VALUE || bounds[2] == Number.MAX_VALUE || bounds[3] == -Number.MAX_VALUE || bounds[4] == Number.MAX_VALUE || bounds[5] == -Number.MAX_VALUE) {
            return false;
        }
        return true;
    };
    this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
        if (!this.hasValidBounds([ minX, maxX, minY, maxY, minZ, maxZ ])) {
            return;
        }
        m_bounds[0] = minX;
        m_bounds[1] = maxX;
        m_bounds[2] = minY;
        m_bounds[3] = maxY;
        m_bounds[4] = minZ;
        m_bounds[5] = maxZ;
        this.modified();
        m_computeBoundsTimestamp.modified();
        return true;
    };
    this.resetBounds = function() {
        m_bounds[0] = Number.MAX_VALUE;
        m_bounds[1] = -Number.MAX_VALUE;
        m_bounds[2] = Number.MAX_VALUE;
        m_bounds[3] = -Number.MAX_VALUE;
        m_bounds[4] = Number.MAX_VALUE;
        m_bounds[5] = -Number.MAX_VALUE;
        this.modified();
    };
    this.computeBounds = function() {};
    this.computeBoundsTimestamp = function() {
        return m_computeBoundsTimestamp;
    };
    this.boundsDirtyTimestamp = function() {
        return m_boundsDirtyTimestamp;
    };
    this.resetBounds();
    return this;
};

vgl.boundingObject.ReferenceFrame = {
    Relative: 0,
    Absolute: 1
};

inherit(vgl.boundingObject, vgl.object);

vgl.node = function() {
    "use strict";
    if (!(this instanceof vgl.node)) {
        return new vgl.node();
    }
    vgl.boundingObject.call(this);
    var m_parent = null, m_material = null, m_visible = true, m_overlay = false;
    this.accept = function(visitor) {
        visitor.visit(this);
    };
    this.material = function() {
        return m_material;
    };
    this.setMaterial = function(material) {
        if (material !== m_material) {
            m_material = material;
            this.modified();
            return true;
        }
        return false;
    };
    this.visible = function() {
        return m_visible;
    };
    this.setVisible = function(flag) {
        if (flag !== m_visible) {
            m_visible = flag;
            this.modified();
            return true;
        }
        return false;
    };
    this.parent = function() {
        return m_parent;
    };
    this.setParent = function(parent) {
        if (parent !== m_parent) {
            if (m_parent !== null) {
                m_parent.removeChild(this);
            }
            m_parent = parent;
            this.modified();
            return true;
        }
        return false;
    };
    this.overlay = function() {
        return m_overlay;
    };
    this.setOverlay = function(flag) {
        if (m_overlay !== flag) {
            m_overlay = flag;
            this.modified();
            return true;
        }
        return false;
    };
    this.ascend = function(visitor) {};
    this.traverse = function(visitor) {};
    this.boundsModified = function() {
        this.boundsDirtyTimestamp().modified();
        if (m_parent !== null) {
            m_parent.boundsModified();
        }
    };
    return this;
};

inherit(vgl.node, vgl.boundingObject);

vgl.groupNode = function() {
    "use strict";
    if (!(this instanceof vgl.groupNode)) {
        return new vgl.groupNode();
    }
    vgl.node.call(this);
    var m_children = [];
    this.b_setVisible = this.setVisible;
    this.setVisible = function(flag) {
        var i;
        if (this.b_setVisible(flag) !== true) {
            return false;
        }
        for (i = 0; i < m_children.length; ++i) {
            m_children[i].setVisible(flag);
        }
        return true;
    };
    this.addChild = function(childNode) {
        if (childNode instanceof vgl.node) {
            if (m_children.indexOf(childNode) === -1) {
                childNode.setParent(this);
                m_children.push(childNode);
                this.boundsDirtyTimestamp().modified();
                return true;
            }
            return false;
        }
        return false;
    };
    this.removeChild = function(childNode) {
        if (childNode.parent() === this) {
            var index = m_children.indexOf(childNode);
            m_children.splice(index, 1);
            this.boundsDirtyTimestamp().modified();
            return true;
        }
    };
    this.removeChildren = function() {
        var i;
        for (i = 0; i < m_children.length; ++i) {
            this.removeChild(m_children[i]);
        }
        this.modified();
    };
    this.children = function() {
        return m_children;
    };
    this.hasChild = function(node) {
        var i = 0, child = false;
        for (i = 0; i < m_children.length; i++) {
            if (m_children[i] === node) {
                child = true;
                break;
            }
        }
        return child;
    };
    this.accept = function(visitor) {
        visitor.visit(this);
    };
    this.traverse = function(visitor) {
        switch (visitor.type()) {
          case visitor.UpdateVisitor:
            this.traverseChildrenAndUpdateBounds(visitor);
            break;

          case visitor.CullVisitor:
            this.traverseChildren(visitor);
            break;

          default:
            break;
        }
    };
    this.traverseChildrenAndUpdateBounds = function(visitor) {
        var i;
        if (this.m_parent && this.boundsDirtyTimestamp().getMTime() > this.computeBoundsTimestamp().getMTime()) {
            this.m_parent.boundsDirtyTimestamp.modified();
        }
        this.computeBounds();
        if (visitor.mode() === visitor.TraverseAllChildren) {
            for (i = 0; i < m_children.length(); ++i) {
                m_children[i].accept(visitor);
                this.updateBounds(m_children[i]);
            }
        }
        this.computeBoundsTimestamp().modified();
    };
    this.traverseChildren = function(visitor) {
        var i;
        if (visitor.mode() === vgl.vesVisitor.TraverseAllChildren) {
            for (i = 0; i < m_children.length(); ++i) {
                m_children[i].accept(visitor);
            }
        }
    };
    this.computeBounds = function() {
        var i = 0;
        if (this.computeBoundsTimestamp().getMTime() > this.boundsDirtyTimestamp().getMTime()) {
            return;
        }
        for (i = 0; i < m_children.length; ++i) {
            this.updateBounds(m_children[i]);
        }
    };
    this.updateBounds = function(child) {
        if (child.overlay()) {
            return;
        }
        child.computeBounds();
        var bounds = this.bounds(), childBounds = child.bounds(), istep = 0, jstep = 0, i;
        for (i = 0; i < 3; ++i) {
            istep = i * 2;
            jstep = i * 2 + 1;
            if (childBounds[istep] < bounds[istep]) {
                bounds[istep] = childBounds[istep];
            }
            if (childBounds[jstep] > bounds[jstep]) {
                bounds[jstep] = childBounds[jstep];
            }
        }
        this.setBounds(bounds[0], bounds[1], bounds[2], bounds[3], bounds[4], bounds[5]);
    };
    return this;
};

inherit(vgl.groupNode, vgl.node);

vgl.actor = function() {
    "use strict";
    if (!(this instanceof vgl.actor)) {
        return new vgl.actor();
    }
    vgl.node.call(this);
    var m_transformMatrix = mat4.create(), m_referenceFrame = vgl.boundingObject.ReferenceFrame.Relative, m_mapper = null;
    this.matrix = function() {
        return m_transformMatrix;
    };
    this.setMatrix = function(tmatrix) {
        if (tmatrix !== m_transformMatrix) {
            m_transformMatrix = tmatrix;
            this.modified();
        }
    };
    this.referenceFrame = function() {
        return m_referenceFrame;
    };
    this.setReferenceFrame = function(referenceFrame) {
        if (referenceFrame !== m_referenceFrame) {
            m_referenceFrame = referenceFrame;
            this.modified();
            return true;
        }
        return false;
    };
    this.mapper = function() {
        return m_mapper;
    };
    this.setMapper = function(mapper) {
        if (mapper !== m_mapper) {
            m_mapper = mapper;
            this.boundsModified();
        }
    };
    this.accept = function(visitor) {};
    this.ascend = function(visitor) {};
    this.computeLocalToWorldMatrix = function(matrix, visitor) {};
    this.computeWorldToLocalMatrix = function(matrix, visitor) {};
    this.computeBounds = function() {
        if (m_mapper === null || m_mapper === undefined) {
            this.resetBounds();
            return;
        }
        var computeBoundsTimestamp = this.computeBoundsTimestamp(), mapperBounds, minPt, maxPt, actorMatrix, newBounds;
        if (this.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime() || m_mapper.boundsDirtyTimestamp().getMTime() > computeBoundsTimestamp.getMTime()) {
            m_mapper.computeBounds();
            mapperBounds = m_mapper.bounds();
            minPt = [ mapperBounds[0], mapperBounds[2], mapperBounds[4] ];
            maxPt = [ mapperBounds[1], mapperBounds[3], mapperBounds[5] ];
            vec3.transformMat4(minPt, minPt, m_transformMatrix);
            vec3.transformMat4(maxPt, maxPt, m_transformMatrix);
            newBounds = [ minPt[0] > maxPt[0] ? maxPt[0] : minPt[0], minPt[0] > maxPt[0] ? minPt[0] : maxPt[0], minPt[1] > maxPt[1] ? maxPt[1] : minPt[1], minPt[1] > maxPt[1] ? minPt[1] : maxPt[1], minPt[2] > maxPt[2] ? maxPt[2] : minPt[2], minPt[2] > maxPt[2] ? minPt[2] : maxPt[2] ];
            this.setBounds(newBounds[0], newBounds[1], newBounds[2], newBounds[3], newBounds[4], newBounds[5]);
            computeBoundsTimestamp.modified();
        }
    };
    return this;
};

inherit(vgl.actor, vgl.node);

vgl.freezeObject = function(obj) {
    "use strict";
    var freezedObject = Object.freeze(obj);
    if (typeof freezedObject === "undefined") {
        freezedObject = function(o) {
            return o;
        };
    }
    return freezedObject;
};

vgl.defaultValue = function(a, b) {
    "use strict";
    if (typeof a !== "undefined") {
        return a;
    }
    return b;
};

vgl.defaultValue.EMPTY_OBJECT = vgl.freezeObject({});

vgl.geojsonReader = function() {
    "use strict";
    if (!(this instanceof vgl.geojsonReader)) {
        return new vgl.geojsonReader();
    }
    var m_scalarFormat = "none", m_scalarRange = null;
    this.readScalars = function(coordinates, geom, size_estimate, idx) {
        var array = null, s = null, r = null, g = null, b = null;
        if (this.m_scalarFormat === "values" && coordinates.length === 4) {
            s = coordinates[3];
            array = geom.sourceData(vgl.vertexAttributeKeys.Scalar);
            if (!array) {
                array = new vgl.sourceDataSf();
                if (this.m_scalarRange) {
                    array.setScalarRange(this.m_scalarRange[0], this.m_scalarRange[1]);
                }
                if (size_estimate !== undefined) {
                    array.data().length = size_estimate;
                }
                geom.addSource(array);
            }
            if (size_estimate === undefined) {
                array.pushBack(s);
            } else {
                array.insertAt(idx, s);
            }
        } else if (this.m_scalarFormat === "rgb" && coordinates.length === 6) {
            array = geom.sourceData(vgl.vertexAttributeKeys.Color);
            if (!array) {
                array = new vgl.sourceDataC3fv();
                if (size_estimate !== undefined) {
                    array.length = size_estimate * 3;
                }
                geom.addSource(array);
            }
            r = coordinates[3];
            g = coordinates[4];
            b = coordinates[5];
            if (size_estimate === undefined) {
                array.pushBack([ r, g, b ]);
            } else {
                array.insertAt(idx, [ r, g, b ]);
            }
        }
    };
    this.readPoint = function(coordinates) {
        var geom = new vgl.geometryData(), vglpoints = new vgl.points(), vglcoords = new vgl.sourceDataP3fv(), indices = new Uint16Array(1), x = null, y = null, z = null, i = null;
        geom.addSource(vglcoords);
        for (i = 0; i < 1; i++) {
            indices[i] = i;
            x = coordinates[0];
            y = coordinates[1];
            z = 0;
            if (coordinates.length > 2) {
                z = coordinates[2];
            }
            vglcoords.pushBack([ x, y, z ]);
            this.readScalars(coordinates, geom);
        }
        vglpoints.setIndices(indices);
        geom.addPrimitive(vglpoints);
        geom.setName("aPoint");
        return geom;
    };
    this.readMultiPoint = function(coordinates) {
        var geom = new vgl.geometryData(), vglpoints = new vgl.points(), vglcoords = new vgl.sourceDataP3fv(), indices = new Uint16Array(coordinates.length), pntcnt = 0, estpntcnt = coordinates.length, x = null, y = null, z = null, i;
        vglcoords.data().length = estpntcnt * 3;
        for (i = 0; i < coordinates.length; i++) {
            indices[i] = i;
            x = coordinates[i][0];
            y = coordinates[i][1];
            z = 0;
            if (coordinates[i].length > 2) {
                z = coordinates[i][2];
            }
            vglcoords.insertAt(pntcnt, [ x, y, z ]);
            this.readScalars(coordinates[i], geom, estpntcnt, pntcnt);
            pntcnt++;
        }
        vglpoints.setIndices(indices);
        geom.addPrimitive(vglpoints);
        geom.addSource(vglcoords);
        geom.setName("manyPoints");
        return geom;
    };
    this.readLineString = function(coordinates) {
        var geom = new vgl.geometryData(), vglline = new vgl.lineStrip(), vglcoords = new vgl.sourceDataP3fv(), indices = [], i = null, x = null, y = null, z = null;
        vglline.setIndicesPerPrimitive(coordinates.length);
        for (i = 0; i < coordinates.length; i++) {
            indices.push(i);
            x = coordinates[i][0];
            y = coordinates[i][1];
            z = 0;
            if (coordinates[i].length > 2) {
                z = coordinates[i][2];
            }
            vglcoords.pushBack([ x, y, z ]);
            this.readScalars(coordinates[i], geom);
        }
        vglline.setIndices(indices);
        geom.addPrimitive(vglline);
        geom.addSource(vglcoords);
        geom.setName("aLineString");
        return geom;
    };
    this.readMultiLineString = function(coordinates) {
        var geom = new vgl.geometryData(), vglcoords = new vgl.sourceDataP3fv(), pntcnt = 0, estpntcnt = coordinates.length * 2, i = null, j = null, x = null, y = null, z = null, indices = null, vglline = null, thisLineLength = null;
        vglcoords.data().length = estpntcnt * 3;
        for (j = 0; j < coordinates.length; j++) {
            indices = [];
            vglline = new vgl.lineStrip();
            thisLineLength = coordinates[j].length;
            vglline.setIndicesPerPrimitive(thisLineLength);
            for (i = 0; i < thisLineLength; i++) {
                indices.push(pntcnt);
                x = coordinates[j][i][0];
                y = coordinates[j][i][1];
                z = 0;
                if (coordinates[j][i].length > 2) {
                    z = coordinates[j][i][2];
                }
                vglcoords.insertAt(pntcnt, [ x, y, z ]);
                this.readScalars(coordinates[j][i], geom, estpntcnt * 2, pntcnt);
                pntcnt++;
            }
            vglline.setIndices(indices);
            geom.addPrimitive(vglline);
        }
        geom.setName("aMultiLineString");
        geom.addSource(vglcoords);
        return geom;
    };
    this.readPolygon = function(coordinates) {
        var geom = new vgl.geometryData(), vglcoords = new vgl.sourceDataP3fv(), x = null, y = null, z = null, thisPolyLength = coordinates[0].length, vl = 1, i = null, indices = null, vgltriangle = null;
        for (i = 0; i < thisPolyLength; i++) {
            x = coordinates[0][i][0];
            y = coordinates[0][i][1];
            z = 0;
            if (coordinates[0][i].length > 2) {
                z = coordinates[0][i][2];
            }
            vglcoords.pushBack([ x, y, z ]);
            this.readScalars(coordinates[0][i], geom);
            if (i > 1) {
                indices = new Uint16Array([ 0, vl, i ]);
                vgltriangle = new vgl.triangles();
                vgltriangle.setIndices(indices);
                geom.addPrimitive(vgltriangle);
                vl = i;
            }
        }
        geom.setName("POLY");
        geom.addSource(vglcoords);
        return geom;
    };
    this.readMultiPolygon = function(coordinates) {
        var geom = new vgl.geometryData(), vglcoords = new vgl.sourceDataP3fv(), ccount = 0, numPolys = coordinates.length, pntcnt = 0, estpntcnt = numPolys * 3, vgltriangle = new vgl.triangles(), indexes = [], i = null, j = null, x = null, y = null, z = null, thisPolyLength = null, vf = null, vl = null, flip = null, flipped = false, tcount = 0;
        vglcoords.data().length = numPolys * 3;
        for (j = 0; j < numPolys; j++) {
            thisPolyLength = coordinates[j][0].length;
            vf = ccount;
            vl = ccount + 1;
            flip = [ false, false, false ];
            for (i = 0; i < thisPolyLength; i++) {
                x = coordinates[j][0][i][0];
                y = coordinates[j][0][i][1];
                z = 0;
                if (coordinates[j][0][i].length > 2) {
                    z = coordinates[j][0][i][2];
                }
                flipped = false;
                if (x > 180) {
                    flipped = true;
                    x = x - 360;
                }
                if (i === 0) {
                    flip[0] = flipped;
                } else {
                    flip[1 + (i - 1) % 2] = flipped;
                }
                vglcoords.insertAt(pntcnt, [ x, y, z ]);
                this.readScalars(coordinates[j][0][i], geom, estpntcnt, pntcnt);
                pntcnt++;
                if (i > 1) {
                    if (flip[0] === flip[1] && flip[1] === flip[2]) {
                        indexes[tcount * 3 + 0] = vf;
                        indexes[tcount * 3 + 1] = vl;
                        indexes[tcount * 3 + 2] = ccount;
                        tcount++;
                    }
                    vl = ccount;
                }
                ccount++;
            }
        }
        vgltriangle.setIndices(indexes);
        geom.addPrimitive(vgltriangle);
        geom.setName("aMultiPoly");
        geom.addSource(vglcoords);
        return geom;
    };
    this.readGJObjectInt = function(object) {
        if (!object.hasOwnProperty("type")) {
            return null;
        }
        if (object.properties && object.properties.ScalarFormat && object.properties.ScalarFormat === "values") {
            this.m_scalarFormat = "values";
            if (object.properties.ScalarRange) {
                this.m_scalarRange = object.properties.ScalarRange;
            }
        }
        if (object.properties && object.properties.ScalarFormat && object.properties.ScalarFormat === "rgb") {
            this.m_scalarFormat = "rgb";
        }
        var ret, type = object.type, next = null, nextset = null, i = null;
        switch (type) {
          case "Point":
            ret = this.readPoint(object.coordinates);
            break;

          case "MultiPoint":
            ret = this.readMultiPoint(object.coordinates);
            break;

          case "LineString":
            ret = this.readLineString(object.coordinates);
            break;

          case "MultiLineString":
            ret = this.readMultiLineString(object.coordinates);
            break;

          case "Polygon":
            ret = this.readPolygon(object.coordinates);
            break;

          case "MultiPolygon":
            ret = this.readMultiPolygon(object.coordinates);
            break;

          case "GeometryCollection":
            nextset = [];
            for (i = 0; i < object.geometries.length; i++) {
                next = this.readGJObject(object.geometries[i]);
                nextset.push(next);
            }
            ret = nextset;
            break;

          case "Feature":
            next = this.readGJObject(object.geometry);
            ret = next;
            break;

          case "FeatureCollection":
            nextset = [];
            for (i = 0; i < object.features.length; i++) {
                next = this.readGJObject(object.features[i]);
                nextset.push(next);
            }
            ret = nextset;
            break;

          default:
            console.log("Don't understand type " + type);
            ret = null;
            break;
        }
        return ret;
    };
    this.readGJObject = function(object) {
        var ret;
        ret = this.readGJObjectInt(object);
        return ret;
    };
    this.linearizeGeoms = function(geoms, geom) {
        var i = null;
        if (Object.prototype.toString.call(geom) === "[object Array]") {
            for (i = 0; i < geom.length; i++) {
                this.linearizeGeoms(geoms, geom[i]);
            }
        } else {
            geoms.push(geom);
        }
    };
    this.readGeomObject = function(object) {
        var geom, geoms = [];
        geom = this.readGJObject(object);
        this.linearizeGeoms(geoms, geom);
        return geoms;
    };
    this.getPrimitives = function(buffer) {
        if (!buffer) {
            return [];
        }
        var obj = JSON.parse(buffer), geom = this.readGJObject(obj), geoms = [];
        this.m_scalarFormat = "none";
        this.m_scalarRange = null;
        this.linearizeGeoms(geoms, geom);
        return {
            geoms: geoms,
            scalarFormat: this.m_scalarFormat,
            scalarRange: this.m_scalarRange
        };
    };
    return this;
};

vgl.data = function() {
    "use strict";
    if (!(this instanceof vgl.data)) {
        return new vgl.data();
    }
    this.type = function() {};
};

vgl.data.raster = 0;

vgl.data.point = 1;

vgl.data.lineString = 2;

vgl.data.polygon = 3;

vgl.data.geometry = 10;

var vertexAttributeKeys = {
    Position: 0,
    Normal: 1,
    TextureCoordinate: 2,
    Color: 3,
    Scalar: 4
};

vgl.primitive = function() {
    "use strict";
    if (!(this instanceof vgl.primitive)) {
        return new vgl.primitive();
    }
    var m_indicesPerPrimitive = 0, m_primitiveType = 0, m_indicesValueType = 0, m_indices = null;
    this.indices = function() {
        return m_indices;
    };
    this.createIndices = function(type) {
        m_indices = new Uint16Array();
    };
    this.numberOfIndices = function() {
        return m_indices.length;
    };
    this.sizeInBytes = function() {
        return m_indices.length * Uint16Array.BYTES_PER_ELEMENT;
    };
    this.primitiveType = function() {
        return m_primitiveType;
    };
    this.setPrimitiveType = function(type) {
        m_primitiveType = type;
    };
    this.indicesPerPrimitive = function() {
        return m_indicesPerPrimitive;
    };
    this.setIndicesPerPrimitive = function(count) {
        m_indicesPerPrimitive = count;
    };
    this.indicesValueType = function() {
        return m_indicesValueType;
    };
    this.setIndicesValueType = function(type) {
        m_indicesValueType = type;
    };
    this.setIndices = function(indicesArray) {
        m_indices = new Uint16Array(indicesArray);
    };
    return this;
};

vgl.triangleStrip = function() {
    "use strict";
    if (!(this instanceof vgl.triangleStrip)) {
        return new vgl.triangleStrip();
    }
    vgl.primitive.call(this);
    this.setPrimitiveType(gl.TRIANGLE_STRIP);
    this.setIndicesValueType(gl.UNSIGNED_SHORT);
    this.setIndicesPerPrimitive(3);
    return this;
};

inherit(vgl.triangleStrip, vgl.primitive);

vgl.triangles = function() {
    "use strict";
    if (!(this instanceof vgl.triangles)) {
        return new vgl.triangles();
    }
    vgl.primitive.call(this);
    this.setPrimitiveType(gl.TRIANGLES);
    this.setIndicesValueType(gl.UNSIGNED_SHORT);
    this.setIndicesPerPrimitive(3);
    return this;
};

inherit(vgl.triangles, vgl.primitive);

vgl.lines = function() {
    "use strict";
    if (!(this instanceof vgl.lines)) {
        return new vgl.lines();
    }
    vgl.primitive.call(this);
    this.setPrimitiveType(gl.LINES);
    this.setIndicesValueType(gl.UNSIGNED_SHORT);
    this.setIndicesPerPrimitive(2);
    return this;
};

inherit(vgl.lines, vgl.primitive);

vgl.lineStrip = function() {
    "use strict";
    if (!(this instanceof vgl.lineStrip)) {
        return new vgl.lineStrip();
    }
    vgl.primitive.call(this);
    this.setPrimitiveType(gl.LINE_STRIP);
    this.setIndicesValueType(gl.UNSIGNED_SHORT);
    this.setIndicesPerPrimitive(2);
    return this;
};

inherit(vgl.lineStrip, vgl.primitive);

vgl.points = function() {
    "use strict";
    if (!(this instanceof vgl.points)) {
        return new vgl.points();
    }
    vgl.primitive.call(this);
    this.setPrimitiveType(gl.POINTS);
    this.setIndicesValueType(gl.UNSIGNED_SHORT);
    this.setIndicesPerPrimitive(1);
    return this;
};

inherit(vgl.points, vgl.primitive);

vgl.vertexDataP3f = function() {
    "use strict";
    if (!(this instanceof vgl.vertexDataP3f)) {
        return new vgl.vertexDataP3f();
    }
    this.m_position = [];
    return this;
};

vgl.vertexDataP3N3f = function() {
    "use strict";
    if (!(this instanceof vgl.vertexDataP3N3f)) {
        return new vgl.vertexDataP3N3f();
    }
    this.m_position = [];
    this.m_normal = [];
    return this;
};

vgl.vertexDataP3T3f = function() {
    "use strict";
    if (!(this instanceof vgl.vertexDataP3T3f)) {
        return new vgl.vertexDataP3T3f();
    }
    this.m_position = [];
    this.m_texCoordinate = [];
    return this;
};

vgl.sourceData = function() {
    "use strict";
    if (!(this instanceof vgl.sourceData)) {
        return new vgl.sourceData();
    }
    var m_attributesMap = {}, m_data = [], vglAttributeData = function() {
        this.m_numberOfComponents = 0;
        this.m_dataType = 0;
        this.m_dataTypeSize = 0;
        this.m_normalized = false;
        this.m_stride = 0;
        this.m_offset = 0;
    };
    this.data = function() {
        return m_data;
    };
    this.getData = function() {
        return data();
    };
    this.setData = function(data) {
        if (!(data instanceof Array)) {
            console.log("[error] Requires array");
            return;
        }
        m_data = data.slice(0);
    };
    this.addAttribute = function(key, dataType, sizeOfDataType, offset, stride, noOfComponents, normalized) {
        if (!m_attributesMap.hasOwnProperty(key)) {
            var newAttr = new vglAttributeData();
            newAttr.m_dataType = dataType;
            newAttr.m_dataTypeSize = sizeOfDataType;
            newAttr.m_offset = offset;
            newAttr.m_stride = stride;
            newAttr.m_numberOfComponents = noOfComponents;
            newAttr.m_normalized = normalized;
            m_attributesMap[key] = newAttr;
        }
    };
    this.sizeOfArray = function() {
        return Object.size(m_data);
    };
    this.lengthOfArray = function() {
        return m_data.length;
    };
    this.sizeInBytes = function() {
        var sizeInBytes = 0, keys = this.keys(), i;
        for (i = 0; i < keys.length(); ++i) {
            sizeInBytes += this.numberOfComponents(keys[i]) * this.sizeOfAttributeDataType(keys[i]);
        }
        sizeInBytes *= this.sizeOfArray();
        return sizeInBytes;
    };
    this.hasKey = function(key) {
        return m_attributesMap.hasOwnProperty(key);
    };
    this.keys = function() {
        return Object.keys(m_attributesMap);
    };
    this.numberOfAttributes = function() {
        return Object.size(m_attributesMap);
    };
    this.attributeNumberOfComponents = function(key) {
        if (m_attributesMap.hasOwnProperty(key)) {
            return m_attributesMap[key].m_numberOfComponents;
        }
        return 0;
    };
    this.normalized = function(key) {
        if (m_attributesMap.hasOwnProperty(key)) {
            return m_attributesMap[key].m_normalized;
        }
        return false;
    };
    this.sizeOfAttributeDataType = function(key) {
        if (m_attributesMap.hasOwnProperty(key)) {
            return m_attributesMap[key].m_dataTypeSize;
        }
        return 0;
    };
    this.attributeDataType = function(key) {
        if (m_attributesMap.hasOwnProperty(key)) {
            return m_attributesMap[key].m_dataType;
        }
        return undefined;
    };
    this.attributeOffset = function(key) {
        if (m_attributesMap.hasOwnProperty(key)) {
            return m_attributesMap[key].m_offset;
        }
        return 0;
    };
    this.attributeStride = function(key) {
        if (m_attributesMap.hasOwnProperty(key)) {
            return m_attributesMap[key].m_stride;
        }
        return 0;
    };
    this.pushBack = function(vertexData) {};
    this.insert = function(data) {
        var i;
        if (!data.length) {
            m_data[m_data.length] = data;
        } else {
            for (i = 0; i < data.length; i++) {
                m_data[m_data.length] = data[i];
            }
        }
    };
    this.insertAt = function(index, data) {
        var i;
        if (!data.length) {
            m_data[index] = data;
        } else {
            for (i = 0; i < data.length; i++) {
                m_data[index * data.length + i] = data[i];
            }
        }
    };
    return this;
};

vgl.sourceDataP3T3f = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataP3T3f)) {
        return new vgl.sourceDataP3T3f();
    }
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 6 * 4, 3, false);
    this.addAttribute(vgl.vertexAttributeKeys.TextureCoordinate, gl.FLOAT, 4, 12, 6 * 4, 3, false);
    this.pushBack = function(value) {
        this.insert(value.m_position);
        this.insert(value.m_texCoordinate);
    };
    return this;
};

inherit(vgl.sourceDataP3T3f, vgl.sourceData);

vgl.sourceDataP3N3f = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataP3N3f)) {
        return new vgl.sourceDataP3N3f();
    }
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 6 * 4, 3, false);
    this.addAttribute(vgl.vertexAttributeKeys.Normal, gl.FLOAT, 4, 12, 6 * 4, 3, false);
    this.pushBack = function(value) {
        this.insert(value.m_position);
        this.insert(value.m_normal);
    };
    return this;
};

inherit(vgl.sourceDataP3N3f, vgl.sourceData);

vgl.sourceDataP3fv = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataP3fv)) {
        return new vgl.sourceDataP3fv();
    }
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.Position, gl.FLOAT, 4, 0, 3 * 4, 3, false);
    this.pushBack = function(value) {
        this.insert(value);
    };
    return this;
};

inherit(vgl.sourceDataP3fv, vgl.sourceData);

vgl.sourceDataT2fv = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataT2fv)) {
        return new vgl.sourceDataT2fv();
    }
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.TextureCoordinate, gl.FLOAT, 4, 0, 2 * 4, 2, false);
    this.pushBack = function(value) {
        this.insert(value);
    };
    return this;
};

inherit(vgl.sourceDataT2fv, vgl.sourceData);

vgl.sourceDataC3fv = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataC3fv)) {
        return new vgl.sourceDataC3fv();
    }
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.Color, gl.FLOAT, 4, 0, 3 * 4, 3, false);
    this.pushBack = function(value) {
        this.insert(value);
    };
    return this;
};

inherit(vgl.sourceDataC3fv, vgl.sourceData);

vgl.sourceDataSf = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataSf)) {
        return new vgl.sourceDataSf();
    }
    var m_min = null, m_max = null, m_fixedmin = null, m_fixedmax = null;
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.Scalar, gl.FLOAT, 4, 0, 4, 1, false);
    this.pushBack = function(value) {
        if (m_max === null || value > m_max) {
            m_max = value;
        }
        if (m_min === null || value < m_min) {
            m_min = value;
        }
        this.data()[this.data().length] = value;
    };
    this.insertAt = function(index, value) {
        if (m_max === null || value > m_max) {
            m_max = value;
        }
        if (m_min === null || value < m_min) {
            m_min = value;
        }
        this.data()[index] = value;
    };
    this.scalarRange = function() {
        if (m_fixedmin === null || m_fixedmax === null) {
            return [ m_min, m_max ];
        }
        return [ m_fixedmin, m_fixedmax ];
    };
    this.setScalarRange = function(min, max) {
        m_fixedmin = min;
        m_fixedmax = max;
    };
    return this;
};

inherit(vgl.sourceDataSf, vgl.sourceData);

vgl.sourceDataDf = function() {
    "use strict";
    if (!(this instanceof vgl.sourceDataDf)) {
        return new vgl.sourceDataDf();
    }
    var m_min = null, m_max = null, m_fixedmin = null, m_fixedmax = null;
    vgl.sourceData.call(this);
    this.addAttribute(vgl.vertexAttributeKeys.Scalar, gl.FLOAT, 4, 0, 4, 1, false);
    this.pushBack = function(value) {
        this.data()[this.data().length] = value;
    };
    this.insertAt = function(index, value) {
        this.data()[index] = value;
    };
    return this;
};

inherit(vgl.sourceDataDf, vgl.sourceData);

vgl.geometryData = function() {
    "use strict";
    if (!(this instanceof vgl.geometryData)) {
        return vgl.geometryData();
    }
    vgl.data.call(this);
    var m_name = "", m_primitives = [], m_sources = [], m_bounds = [ 0, 0, 0, 0, 0, 0 ], m_computeBoundsTimestamp = vgl.timestamp(), m_boundsDirtyTimestamp = vgl.timestamp();
    this.type = function() {
        return vgl.data.geometry;
    };
    this.name = function() {
        return m_name;
    };
    this.setName = function(name) {
        m_name = name;
    };
    this.addSource = function(source) {
        if (m_sources.indexOf(source) === -1) {
            m_sources.push(source);
            if (source.hasKey(vgl.vertexAttributeKeys.Position)) {
                m_boundsDirtyTimestamp.modified();
            }
            return true;
        }
        return false;
    };
    this.source = function(index) {
        if (index < m_sources.length) {
            return m_sources[index];
        }
        return 0;
    };
    this.numberOfSources = function() {
        return m_sources.length;
    };
    this.sourceData = function(key) {
        var i;
        for (i = 0; i < m_sources.length; ++i) {
            if (m_sources[i].hasKey(key)) {
                return m_sources[i];
            }
        }
        return null;
    };
    this.addPrimitive = function(primitive) {
        m_primitives.push(primitive);
        return true;
    };
    this.primitive = function(index) {
        if (index < m_primitives.length) {
            return m_primitives[index];
        }
        return null;
    };
    this.numberOfPrimitives = function() {
        return m_primitives.length;
    };
    this.bounds = function() {
        if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
            this.computeBounds();
        }
        return m_bounds;
    };
    this.resetBounds = function() {
        m_bounds[0] = 0;
        m_bounds[1] = 0;
        m_bounds[2] = 0;
        m_bounds[3] = 0;
        m_bounds[4] = 0;
        m_bounds[5] = 0;
    };
    this.setBounds = function(minX, maxX, minY, maxY, minZ, maxZ) {
        m_bounds[0] = minX;
        m_bounds[1] = maxX;
        m_bounds[2] = minY;
        m_bounds[3] = maxY;
        m_bounds[4] = minZ;
        m_bounds[5] = maxZ;
        m_computeBoundsTimestamp.modified();
        return true;
    };
    this.computeBounds = function() {
        if (m_boundsDirtyTimestamp.getMTime() > m_computeBoundsTimestamp.getMTime()) {
            var attr = vgl.vertexAttributeKeys.Position, sourceData = this.sourceData(attr), data = sourceData.data(), numberOfComponents = sourceData.attributeNumberOfComponents(attr), stride = sourceData.attributeStride(attr), offset = sourceData.attributeOffset(attr), sizeOfDataType = sourceData.sizeOfAttributeDataType(attr), count = data.length, ib = 0, jb = 0, value = null, vertexIndex, j;
            stride /= sizeOfDataType;
            offset /= sizeOfDataType;
            this.resetBounds();
            for (vertexIndex = offset; vertexIndex < count; vertexIndex += stride) {
                for (j = 0; j < numberOfComponents; ++j) {
                    value = data[vertexIndex + j];
                    ib = j * 2;
                    jb = j * 2 + 1;
                    if (vertexIndex === offset) {
                        m_bounds[ib] = value;
                        m_bounds[jb] = value;
                    } else {
                        if (value > m_bounds[jb]) {
                            m_bounds[jb] = value;
                        }
                        if (value < m_bounds[ib]) {
                            m_bounds[ib] = value;
                        }
                    }
                }
            }
            m_computeBoundsTimestamp.modified();
        }
    };
    this.findClosestVertex = function(point) {
        var attr = vgl.vertexAttributeKeys.Position, sourceData = this.sourceData(attr), sizeOfDataType = sourceData.sizeOfAttributeDataType(attr), numberOfComponents = sourceData.attributeNumberOfComponents(attr), data = sourceData.data(), stride = sourceData.attributeStride(attr) / sizeOfDataType, offset = sourceData.attributeOffset(attr) / sizeOfDataType, minDist = Number.MAX_VALUE, minIndex = null, vi, vPos, dx, dy, dz, dist, i;
        if (numberOfComponents !== 3) {
            console.log("[warning] Find closest vertex assumes three" + "component vertex ");
        }
        if (!point.z) {
            point = {
                x: point.x,
                y: point.y,
                z: 0
            };
        }
        for (vi = offset, i = 0; vi < data.length; vi += stride, i++) {
            vPos = [ data[vi], data[vi + 1], data[vi + 2] ];
            dx = vPos[0] - point.x;
            dy = vPos[1] - point.y;
            dz = vPos[2] - point.z;
            dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < minDist) {
                minDist = dist;
                minIndex = i;
            }
        }
        return minIndex;
    };
    this.getPosition = function(index) {
        var attr = vgl.vertexAttributeKeys.Position, sourceData = this.sourceData(attr), sizeOfDataType = sourceData.sizeOfAttributeDataType(attr), numberOfComponents = sourceData.attributeNumberOfComponents(attr), data = sourceData.data(), stride = sourceData.attributeStride(attr) / sizeOfDataType, offset = sourceData.attributeOffset(attr) / sizeOfDataType;
        if (numberOfComponents !== 3) {
            console.log("[warning] getPosition assumes three component data");
        }
        return [ data[offset + index * stride], data[offset + index * stride + 1], data[offset + index * stride + 2] ];
    };
    this.getScalar = function(index) {
        var attr = vgl.vertexAttributeKeys.Scalar, sourceData = this.sourceData(attr), numberOfComponents, sizeOfDataType, data, stride, offset;
        if (!sourceData) {
            return null;
        }
        numberOfComponents = sourceData.attributeNumberOfComponents(attr);
        sizeOfDataType = sourceData.sizeOfAttributeDataType(attr);
        data = sourceData.data();
        stride = sourceData.attributeStride(attr) / sizeOfDataType;
        offset = sourceData.attributeOffset(attr) / sizeOfDataType;
        if (index * stride + offset >= data.length) {
            console.log("access out of bounds in getScalar");
        }
        return data[index * stride + offset];
    };
    return this;
};

inherit(vgl.geometryData, vgl.data);

vgl.mapper = function() {
    "use strict";
    if (!(this instanceof vgl.mapper)) {
        return new vgl.mapper();
    }
    vgl.boundingObject.call(this);
    var m_dirty = true, m_color = [ 0, 1, 1 ], m_geomData = null, m_buffers = [], m_bufferVertexAttributeMap = {}, m_glCompileTimestamp = vgl.timestamp();
    function deleteVertexBufferObjects() {
        var i;
        for (i = 0; i < m_buffers.length; ++i) {
            gl.deleteBuffer(m_buffers[i]);
        }
    }
    function createVertexBufferObjects() {
        if (m_geomData) {
            var numberOfSources = m_geomData.numberOfSources(), i, j, k, bufferId = null, keys, ks, numberOfPrimitives;
            for (i = 0; i < numberOfSources; ++i) {
                bufferId = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(m_geomData.source(i).data()), gl.STATIC_DRAW);
                keys = m_geomData.source(i).keys();
                ks = [];
                for (j = 0; j < keys.length; ++j) {
                    ks.push(keys[j]);
                }
                m_bufferVertexAttributeMap[i] = ks;
                m_buffers[i] = bufferId;
            }
            numberOfPrimitives = m_geomData.numberOfPrimitives();
            for (k = 0; k < numberOfPrimitives; ++k) {
                bufferId = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferId);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m_geomData.primitive(k).indices(), gl.STATIC_DRAW);
                m_buffers[i++] = bufferId;
            }
            m_glCompileTimestamp.modified();
        }
    }
    function cleanUpDrawObjects() {
        m_bufferVertexAttributeMap = {};
        m_buffers = [];
    }
    function setupDrawObjects() {
        deleteVertexBufferObjects();
        cleanUpDrawObjects();
        createVertexBufferObjects();
        m_dirty = false;
    }
    this.computeBounds = function() {
        if (m_geomData === null || typeof m_geomData === "undefined") {
            this.resetBounds();
            return;
        }
        var computeBoundsTimestamp = this.computeBoundsTimestamp(), boundsDirtyTimestamp = this.boundsDirtyTimestamp(), geomBounds = null;
        if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {
            geomBounds = m_geomData.bounds();
            this.setBounds(geomBounds[0], geomBounds[1], geomBounds[2], geomBounds[3], geomBounds[4], geomBounds[5]);
            computeBoundsTimestamp.modified();
        }
    };
    this.color = function() {
        return m_color;
    };
    this.setColor = function(r, g, b) {
        m_color[0] = r;
        m_color[1] = g;
        m_color[2] = b;
        this.modified();
    };
    this.geometryData = function() {
        return m_geomData;
    };
    this.setGeometryData = function(geom) {
        if (m_geomData !== geom) {
            m_geomData = geom;
            this.modified();
            this.boundsDirtyTimestamp().modified();
        }
    };
    this.render = function(renderState) {
        if (this.getMTime() > m_glCompileTimestamp.getMTime()) {
            setupDrawObjects(renderState);
        }
        gl.vertexAttrib3fv(vgl.vertexAttributeKeys.Color, this.color());
        var bufferIndex = 0, j = 0, i, noOfPrimitives = null, primitive = null;
        for (i in m_bufferVertexAttributeMap) {
            if (m_bufferVertexAttributeMap.hasOwnProperty(i)) {
                gl.bindBuffer(gl.ARRAY_BUFFER, m_buffers[bufferIndex]);
                for (j = 0; j < m_bufferVertexAttributeMap[i].length; ++j) {
                    renderState.m_material.bindVertexData(renderState, m_bufferVertexAttributeMap[i][j]);
                }
                ++bufferIndex;
            }
        }
        noOfPrimitives = m_geomData.numberOfPrimitives();
        for (j = 0; j < noOfPrimitives; ++j) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, m_buffers[bufferIndex++]);
            primitive = m_geomData.primitive(j);
            gl.drawElements(primitive.primitiveType(), primitive.numberOfIndices(), primitive.indicesValueType(), 0);
        }
    };
    return this;
};

inherit(vgl.mapper, vgl.boundingObject);

vgl.groupMapper = function() {
    "use strict";
    if (!(this instanceof vgl.groupMapper)) {
        return new vgl.groupMapper();
    }
    vgl.mapper.call(this);
    var m_createMappersTimestamp = vgl.timestamp(), m_mappers = [], m_geomDataArray = [];
    this.geometryData = function(index) {
        if (index !== undefined && index < m_geomDataArray.length) {
            return m_geomDataArray[index];
        }
        if (m_geomDataArray.length > 0) {
            return m_geomDataArray[0];
        }
        return null;
    };
    this.setGeometryData = function(geom) {
        if (m_geomDataArray.length === 1) {
            if (m_geomDataArray[0] === geom) {
                return;
            }
        }
        m_geomDataArray = [];
        m_geomDataArray.push(geom);
        this.modified();
    };
    this.geometryDataArray = function() {
        return m_geomDataArray;
    };
    this.setGeometryDataArray = function(geoms) {
        if (geoms instanceof Array) {
            if (m_geomDataArray !== geoms) {
                m_geomDataArray = [];
                m_geomDataArray = geoms;
                this.modified();
                return true;
            }
        } else {
            console.log("[error] Requies array of geometry data");
        }
        return false;
    };
    this.computeBounds = function() {
        if (m_geomDataArray === null || m_geomDataArray === undefined) {
            this.resetBounds();
            return;
        }
        var computeBoundsTimestamp = this.computeBoundsTimestamp(), boundsDirtyTimestamp = this.boundsDirtyTimestamp(), m_bounds = this.bounds(), geomBounds = null, i = null;
        if (boundsDirtyTimestamp.getMTime() > computeBoundsTimestamp.getMTime()) {
            for (i = 0; i < m_geomDataArray.length; ++i) {
                geomBounds = m_geomDataArray[i].bounds();
                if (m_bounds[0] > geomBounds[0]) {
                    m_bounds[0] = geomBounds[0];
                }
                if (m_bounds[1] < geomBounds[1]) {
                    m_bounds[1] = geomBounds[1];
                }
                if (m_bounds[2] > geomBounds[2]) {
                    m_bounds[2] = geomBounds[2];
                }
                if (m_bounds[3] < geomBounds[3]) {
                    m_bounds[3] = geomBounds[3];
                }
                if (m_bounds[4] > geomBounds[4]) {
                    m_bounds[4] = geomBounds[4];
                }
                if (m_bounds[5] < geomBounds[5]) {
                    m_bounds[5] = geomBounds[5];
                }
            }
            this.modified();
            computeBoundsTimestamp.modified();
        }
    };
    this.render = function(renderState) {
        var i = null;
        if (this.getMTime() > m_createMappersTimestamp.getMTime()) {
            for (i = 0; i < m_geomDataArray.length; ++i) {
                m_mappers.push(vgl.mapper());
                m_mappers[i].setGeometryData(m_geomDataArray[i]);
            }
            m_createMappersTimestamp.modified();
        }
        for (i = 0; i < m_mappers.length; ++i) {
            m_mappers[i].render(renderState);
        }
    };
    return this;
};

inherit(vgl.groupMapper, vgl.mapper);

vgl.materialAttributeType = {
    Undefined: 0,
    ShaderProgram: 1,
    Texture: 2,
    Blend: 3,
    Depth: 4
};

vgl.materialAttribute = function(type) {
    "use strict";
    if (!(this instanceof vgl.materialAttribute)) {
        return new vgl.materialAttribute();
    }
    vgl.object.call(this);
    var m_type = type, m_enabled = true;
    this.type = function() {
        return m_type;
    };
    this.enabled = function() {
        return m_enabled;
    };
    this.setup = function(renderState) {
        return false;
    };
    this.bind = function(renderState) {
        return false;
    };
    this.undoBind = function(renderState) {
        return false;
    };
    this.setupVertexData = function(renderState, key) {
        return false;
    };
    this.bindVertexData = function(renderState, key) {
        return false;
    };
    this.undoBindVertexData = function(renderState, key) {
        return false;
    };
    return this;
};

inherit(vgl.materialAttribute, vgl.object);

vgl.blendFunction = function(source, destination) {
    "use strict";
    if (!(this instanceof vgl.blendFunction)) {
        return new vgl.blendFunction(source, destination);
    }
    var m_source = source, m_destination = destination;
    this.apply = function(renderState) {
        gl.blendFuncSeparate(m_source, m_destination, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    };
    return this;
};

vgl.blend = function() {
    "use strict";
    if (!(this instanceof vgl.blend)) {
        return new vgl.blend();
    }
    vgl.materialAttribute.call(this, vgl.materialAttributeType.Blend);
    var m_wasEnabled = false, m_blendFunction = vgl.blendFunction(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    this.bind = function(renderState) {
        m_wasEnabled = gl.isEnabled(gl.BLEND);
        if (this.enabled()) {
            gl.enable(gl.BLEND);
            m_blendFunction.apply(renderState);
        } else {
            gl.disable(gl.BLEND);
        }
        return true;
    };
    this.undoBind = function(renderState) {
        if (m_wasEnabled) {
            gl.enable(gl.BLEND);
        } else {
            gl.disable(gl.BLEND);
        }
        return true;
    };
    return this;
};

inherit(vgl.blend, vgl.materialAttribute);

vgl.material = function() {
    "use strict";
    if (!(this instanceof vgl.material)) {
        return new vgl.material();
    }
    vgl.object.call(this);
    var m_shaderProgram = new vgl.shaderProgram(), m_binNumber = 100, m_textureAttributes = {}, m_attributes = {};
    this.binNumber = function() {
        return m_binNumber;
    };
    this.setBinNumber = function(binNo) {
        m_binNumber = binNo;
        this.modified();
    };
    this.exists = function(attr) {
        if (attr.type() === vgl.materialAttribute.Texture) {
            return m_textureAttributes.hasOwnProperty(attr);
        }
        return m_attributes.hasOwnProperty(attr);
    };
    this.uniform = function(name) {
        if (m_shaderProgram) {
            return m_shaderProgram.uniform(name);
        }
        return null;
    };
    this.attribute = function(name) {
        if (m_attributes.hasOwnProperty(name)) {
            return m_attributes[name];
        }
        if (m_textureAttributes.hasOwnProperty(name)) {
            return m_textureAttributes[name];
        }
        return null;
    };
    this.setAttribute = function(attr) {
        if (attr.type() === vgl.materialAttributeType.Texture && m_textureAttributes[attr.textureUnit()] !== attr) {
            m_textureAttributes[attr.textureUnit()] = attr;
            this.modified();
            return true;
        }
        if (m_attributes[attr.type()] === attr) {
            return false;
        }
        if (attr.type() === vgl.materialAttributeType.ShaderProgram) {
            m_shaderProgram = attr;
        }
        m_attributes[attr.type()] = attr;
        this.modified();
        return true;
    };
    this.addAttribute = function(attr) {
        if (this.exists(attr)) {
            return false;
        }
        if (attr.type() === vgl.materialAttributeType.Texture) {
            m_textureAttributes[attr.textureUnit()] = attr;
            this.modified();
            return true;
        }
        if (attr.type() === vgl.materialAttributeType.ShaderProgram) {
            m_shaderProgram = attr;
        }
        m_attributes[attr.type()] = attr;
        this.modified();
        return true;
    };
    this.shaderProgram = function() {
        return m_shaderProgram;
    };
    this.render = function(renderState) {
        this.bind(renderState);
    };
    this.remove = function(renderState) {
        this.undoBind(renderState);
    };
    this.bind = function(renderState) {
        var key = null;
        for (key in m_attributes) {
            if (m_attributes.hasOwnProperty(key)) {
                m_attributes[key].bind(renderState);
            }
        }
        for (key in m_textureAttributes) {
            if (m_textureAttributes.hasOwnProperty(key)) {
                m_textureAttributes[key].bind(renderState);
            }
        }
    };
    this.undoBind = function(renderState) {
        var key = null;
        for (key in m_attributes) {
            if (m_attributes.hasOwnProperty(key)) {
                m_attributes[key].undoBind(renderState);
            }
        }
        for (key in m_textureAttributes) {
            if (m_textureAttributes.hasOwnProperty(key)) {
                m_textureAttributes[key].undoBind(renderState);
            }
        }
    };
    this.bindVertexData = function(renderState, key) {
        var i = null;
        for (i in m_attributes) {
            if (m_attributes.hasOwnProperty(i)) {
                m_attributes[i].bindVertexData(renderState, key);
            }
        }
    };
    this.undoBindVertexData = function(renderState, key) {
        var i = null;
        for (i in m_attributes) {
            if (m_attributes.hasOwnProperty(i)) {
                m_attributes.undoBindVertexData(renderState, key);
            }
        }
    };
    return this;
};

vgl.material.RenderBin = {
    Base: 0,
    Default: 100,
    Opaque: 100,
    Transparent: 1e3,
    Overlay: 1e4
};

inherit(vgl.material, vgl.object);

vgl.renderState = function() {
    "use strict";
    this.m_modelViewMatrix = mat4.create();
    this.m_normalMatrix = mat4.create();
    this.m_projectionMatrix = null;
    this.m_material = null;
    this.m_mapper = null;
};

vgl.renderer = function() {
    "use strict";
    if (!(this instanceof vgl.renderer)) {
        return new vgl.renderer();
    }
    vgl.object.call(this);
    var m_sceneRoot = new vgl.groupNode(), m_camera = new vgl.camera(), m_nearClippingPlaneTolerance = null, m_x = 0, m_y = 0, m_width = 0, m_height = 0, m_resizable = true, m_resetScene = true, m_layer = 0, m_resetClippingRange = true;
    m_camera.addChild(m_sceneRoot);
    this.width = function() {
        return m_width;
    };
    this.height = function() {
        return m_height;
    };
    this.layer = function() {
        return m_layer;
    };
    this.setLayer = function(layerNo) {
        m_layer = layerNo;
        this.modified();
    };
    this.isResizable = function() {
        return m_resizable;
    };
    this.setResizable = function(r) {
        m_resizable = r;
    };
    this.backgroundColor = function() {
        return m_camera.clearColor();
    };
    this.setBackgroundColor = function(r, g, b, a) {
        m_camera.setClearColor(r, g, b, a);
        this.modified();
    };
    this.sceneRoot = function() {
        return m_sceneRoot;
    };
    this.camera = function() {
        return m_camera;
    };
    this.render = function() {
        var i, renSt, children, actor = null, sortedActors = [], mvMatrixInv = mat4.create(), clearColor = null;
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        if (m_camera.clearMask() & vgl.GL.ColorBufferBit) {
            clearColor = m_camera.clearColor();
            gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);
        }
        if (m_camera.clearMask() & vgl.GL.DepthBufferBit) {
            gl.clearDepth(m_camera.clearDepth());
        }
        gl.clear(m_camera.clearMask());
        gl.viewport(m_x, m_y, m_width, m_height);
        renSt = new vgl.renderState();
        children = m_sceneRoot.children();
        if (children.length > 0 && m_resetScene) {
            this.resetCamera();
            m_resetScene = false;
        }
        for (i = 0; i < children.length; ++i) {
            actor = children[i];
            actor.computeBounds();
            if (!actor.visible()) {
                continue;
            }
            sortedActors.push([ actor.material().binNumber(), actor ]);
        }
        sortedActors.sort(function(a, b) {
            return a[0] - b[0];
        });
        for (i = 0; i < sortedActors.length; ++i) {
            actor = sortedActors[i][1];
            if (actor.referenceFrame() === vgl.boundingObject.ReferenceFrame.Relative) {
                mat4.multiply(renSt.m_modelViewMatrix, m_camera.viewMatrix(), actor.matrix());
                renSt.m_projectionMatrix = m_camera.projectionMatrix();
            } else {
                renSt.m_modelViewMatrix = actor.matrix();
                renSt.m_projectionMatrix = mat4.create();
                mat4.ortho(renSt.m_projectionMatrix, 0, m_width, 0, m_height, -1, 1);
            }
            mat4.invert(mvMatrixInv, renSt.m_modelViewMatrix);
            mat4.transpose(renSt.m_normalMatrix, mvMatrixInv);
            renSt.m_material = actor.material();
            renSt.m_mapper = actor.mapper();
            renSt.m_material.render(renSt);
            renSt.m_mapper.render(renSt);
            renSt.m_material.remove(renSt);
        }
    };
    this.resetCamera = function() {
        m_camera.computeBounds();
        var vn = m_camera.directionOfProjection(), visibleBounds = m_camera.bounds(), center = [ (visibleBounds[0] + visibleBounds[1]) / 2, (visibleBounds[2] + visibleBounds[3]) / 2, (visibleBounds[4] + visibleBounds[5]) / 2 ], diagonals = [ visibleBounds[1] - visibleBounds[0], visibleBounds[3] - visibleBounds[2], visibleBounds[5] - visibleBounds[4] ], radius = 0, aspect = m_camera.viewAspect(), angle = m_camera.viewAngle(), distance = null, vup = null;
        if (diagonals[0] > diagonals[1]) {
            if (diagonals[0] > diagonals[2]) {
                radius = diagonals[0] / 2;
            } else {
                radius = diagonals[2] / 2;
            }
        } else {
            if (diagonals[1] > diagonals[2]) {
                radius = diagonals[1] / 2;
            } else {
                radius = diagonals[2] / 2;
            }
        }
        if (aspect >= 1) {
            angle = 2 * Math.atan(Math.tan(angle * .5) / aspect);
        } else {
            angle = 2 * Math.atan(Math.tan(angle * .5) * aspect);
        }
        distance = radius / Math.sin(angle * .5);
        vup = m_camera.viewUpDirection();
        if (Math.abs(vec3.dot(vup, vn)) > .999) {
            m_camera.setViewUpDirection(-vup[2], vup[0], vup[1]);
        }
        m_camera.setFocalPoint(center[0], center[1], center[2]);
        m_camera.setPosition(center[0] + distance * -vn[0], center[1] + distance * -vn[1], center[2] + distance * -vn[2]);
        this.resetCameraClippingRange(visibleBounds);
    };
    this.hasValidBounds = function(bounds) {
        if (bounds[0] == Number.MAX_VALUE || bounds[1] == -Number.MAX_VALUE || bounds[2] == Number.MAX_VALUE || bounds[3] == -Number.MAX_VALUE || bounds[4] == Number.MAX_VALUE || bounds[5] == -Number.MAX_VALUE) {
            return false;
        }
        return true;
    };
    this.resetCameraClippingRange = function(bounds) {
        if (typeof bounds === "undefined") {
            m_camera.computeBounds();
            bounds = m_camera.bounds();
        }
        if (!this.hasValidBounds(bounds)) {
            return;
        }
        var vn = m_camera.viewPlaneNormal(), position = m_camera.position(), a = -vn[0], b = -vn[1], c = -vn[2], d = -(a * position[0] + b * position[1] + c * position[2]), range = vec2.create(), dist = null, i = null, j = null, k = null;
        if (!m_resetClippingRange) {
            return;
        }
        range[0] = a * bounds[0] + b * bounds[2] + c * bounds[4] + d;
        range[1] = 1e-18;
        for (k = 0; k < 2; k++) {
            for (j = 0; j < 2; j++) {
                for (i = 0; i < 2; i++) {
                    dist = a * bounds[i] + b * bounds[2 + j] + c * bounds[4 + k] + d;
                    range[0] = dist < range[0] ? dist : range[0];
                    range[1] = dist > range[1] ? dist : range[1];
                }
            }
        }
        if (range[0] < 0) {
            range[0] = 0;
        }
        range[0] = .99 * range[0] - (range[1] - range[0]) * .5;
        range[1] = 1.01 * range[1] + (range[1] - range[0]) * .5;
        range[0] = range[0] >= range[1] ? .01 * range[1] : range[0];
        if (!m_nearClippingPlaneTolerance) {
            m_nearClippingPlaneTolerance = .01;
            if (gl !== null && gl.getParameter(gl.DEPTH_BITS) > 16) {
                m_nearClippingPlaneTolerance = .001;
            }
        }
        if (range[0] < m_nearClippingPlaneTolerance * range[1]) {
            range[0] = m_nearClippingPlaneTolerance * range[1];
        }
        m_camera.setClippingRange(range[0], range[1]);
    };
    this.resize = function(width, height) {
        this.positionAndResize(m_x, m_y, width, height);
    };
    this.positionAndResize = function(x, y, width, height) {
        if (x < 0 || y < 0 || width < 0 || height < 0) {
            console.log("[error] Invalid position and resize values", x, y, width, height);
        }
        if (m_resizable) {
            m_width = width;
            m_height = height;
            m_camera.setViewAspect(m_width / m_height);
            this.modified();
        }
    };
    this.addActor = function(actor) {
        if (actor instanceof vgl.actor) {
            m_sceneRoot.addChild(actor);
            this.modified();
            return true;
        }
        return false;
    };
    this.hasActor = function(actor) {
        return m_sceneRoot.hasChild(actor);
    };
    this.addActors = function(actors) {
        var i = null;
        if (actors instanceof Array) {
            for (i = 0; i < actors.length; ++i) {
                m_sceneRoot.addChild(actors[i]);
            }
            this.modified();
        }
    };
    this.removeActor = function(actor) {
        if (m_sceneRoot.children().indexOf(actor) !== -1) {
            m_sceneRoot.removeChild(actor);
            this.modified();
            return true;
        }
        return false;
    };
    this.removeActors = function(actors) {
        if (!(actors instanceof Array)) {
            return false;
        }
        var i;
        for (i = 0; i < actors.length; ++i) {
            m_sceneRoot.removeChild(actors[i]);
        }
        this.modified();
        return true;
    };
    this.removeAllActors = function() {
        return m_sceneRoot.removeChildren();
    };
    this.worldToDisplay = function(worldPt, viewMatrix, projectionMatrix, width, height) {
        var viewProjectionMatrix = mat4.create(), winX = null, winY = null, winZ = null, winW = null, clipPt = null;
        mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
        clipPt = vec4.create();
        vec4.transformMat4(clipPt, worldPt, viewProjectionMatrix);
        if (clipPt[3] !== 0) {
            clipPt[0] = clipPt[0] / clipPt[3];
            clipPt[1] = clipPt[1] / clipPt[3];
            clipPt[2] = clipPt[2] / clipPt[3];
            clipPt[3] = 1;
        }
        winX = (clipPt[0] + 1) / 2 * width;
        winY = (1 - clipPt[1]) / 2 * height;
        winZ = clipPt[2];
        winW = clipPt[3];
        return vec4.fromValues(winX, winY, winZ, winW);
    };
    this.displayToWorld = function(displayPt, viewMatrix, projectionMatrix, width, height) {
        var x = 2 * displayPt[0] / width - 1, y = -(2 * displayPt[1] / height) + 1, z = displayPt[2], viewProjectionInverse = mat4.create(), worldPt = null;
        mat4.multiply(viewProjectionInverse, projectionMatrix, viewMatrix);
        mat4.invert(viewProjectionInverse, viewProjectionInverse);
        worldPt = vec4.fromValues(x, y, z, 1);
        vec4.transformMat4(worldPt, worldPt, viewProjectionInverse);
        if (worldPt[3] !== 0) {
            worldPt[0] = worldPt[0] / worldPt[3];
            worldPt[1] = worldPt[1] / worldPt[3];
            worldPt[2] = worldPt[2] / worldPt[3];
            worldPt[3] = 1;
        }
        return worldPt;
    };
    this.focusDisplayPoint = function() {
        var focalPoint = m_camera.focalPoint(), focusWorldPt = vec4.fromValues(focalPoint[0], focalPoint[1], focalPoint[2], 1);
        return this.worldToDisplay(focusWorldPt, m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);
    };
    this.resetScene = function() {
        return m_resetScene;
    };
    this.setResetScene = function(reset) {
        if (m_resetScene !== reset) {
            m_resetScene = reset;
            this.modified();
        }
    };
    this.resetClippingRange = function() {
        return m_resetClippingRange;
    };
    this.setResetClippingRange = function(reset) {
        if (m_resetClippingRange !== reset) {
            m_resetClippingRange = reset;
            this.modified();
        }
    };
    return this;
};

inherit(vgl.renderer, vgl.object);

var gl = null;

vgl.renderWindow = function(canvas) {
    "use strict";
    if (!(this instanceof vgl.renderWindow)) {
        return new vgl.renderWindow(canvas);
    }
    vgl.object.call(this);
    var m_x = 0, m_y = 0, m_width = 400, m_height = 400, m_canvas = canvas, m_activeRender = null, m_renderers = [];
    this.windowSize = function() {
        return [ m_width, m_height ];
    };
    this.setWindowSize = function(width, height) {
        if (m_width !== width || m_height !== height) {
            m_width = width;
            m_height = height;
            this.modified();
            return true;
        }
        return false;
    };
    this.windowPosition = function() {
        return [ m_x, m_y ];
    };
    this.setWindowPosition = function(x, y) {
        if (m_x !== x || m_y !== y) {
            m_x = x;
            m_y = y;
            this.modified();
            return true;
        }
        return false;
    };
    this.renderers = function() {
        return m_renderers;
    };
    this.activeRenderer = function() {
        return m_activeRender;
    };
    this.addRenderer = function(ren) {
        if (this.hasRenderer(ren) === false) {
            m_renderers.push(ren);
            if (m_activeRender === null) {
                m_activeRender = ren;
            }
            if (ren.layer() !== 0) {
                ren.camera().setClearMask(vgl.GL.DepthBufferBit);
            }
            this.modified();
            return true;
        }
        return false;
    };
    this.removeRenderer = function(ren) {
        var index = m_renderers.indexOf(ren);
        if (index !== -1) {
            if (m_activeRender === ren) {
                m_activeRender = null;
            }
            m_renderers.splice(index, 1);
            this.modified();
            return true;
        }
        return false;
    };
    this.getRenderer = function(index) {
        if (index < m_renderers.length) {
            return m_renderers[index];
        }
        console.log("[WARNING] Out of index array");
        return null;
    };
    this.hasRenderer = function(ren) {
        var i;
        for (i = 0; i < m_renderers.length; ++i) {
            if (ren === m_renderers[i]) {
                return true;
            }
        }
        return false;
    };
    this.resize = function(width, height) {
        this.positionAndResize(m_x, m_y, width, height);
        this.modified();
    };
    this.positionAndResize = function(x, y, width, height) {
        m_x = x;
        m_y = y;
        m_width = width;
        m_height = height;
        var i;
        for (i = 0; i < m_renderers.length; ++i) {
            m_renderers[i].positionAndResize(m_x, m_y, m_width, m_height);
        }
        this.modified();
    };
    this.createWindow = function() {
        gl = null;
        try {
            gl = m_canvas.getContext("webgl") || m_canvas.getContext("experimental-webgl");
            var i;
            for (i = 0; i < m_renderers.length; ++i) {
                if (m_renderers[i].width() > m_width || m_renderers[i].width() === 0 || m_renderers[i].height() > m_height || m_renderers[i].height() === 0) {
                    m_renderers[i].resize(m_x, m_y, m_width, m_height);
                }
            }
            return true;
        } catch (e) {}
        if (!gl) {
            console("[ERROR] Unable to initialize WebGL. Your browser may not support it.");
        }
        return false;
    };
    this.deleteWindow = function() {};
    this.render = function() {
        var i;
        m_renderers.sort(function(a, b) {
            return a.layer() - b.layer();
        });
        for (i = 0; i < m_renderers.length; ++i) {
            m_renderers[i].render();
        }
    };
    this.focusDisplayPoint = function() {
        return m_activeRender.focusDisplayPoint();
    };
    this.displayToWorld = function(x, y, focusDisplayPoint, ren) {
        ren = ren === undefined ? ren = m_activeRender : ren;
        var camera = ren.camera();
        if (!focusDisplayPoint) {
            focusDisplayPoint = ren.focusDisplayPoint();
        }
        return ren.displayToWorld(vec4.fromValues(x, y, focusDisplayPoint[2], 1), camera.viewMatrix(), camera.projectionMatrix(), m_width, m_height);
    };
    this.worldToDisplay = function(x, y, z, ren) {
        ren = ren === undefined ? ren = m_activeRender : ren;
        var camera = ren.camera();
        return ren.worldToDisplay(vec4.fromValues(x, y, z, 1), camera.viewMatrix(), camera.projectionMatrix(), m_width, m_height);
    };
    return this;
};

inherit(vgl.renderWindow, vgl.object);

vgl.camera = function() {
    "use strict";
    if (!(this instanceof vgl.camera)) {
        return new vgl.camera();
    }
    vgl.groupNode.call(this);
    var m_viewAngle = Math.PI * 30 / 180, m_position = vec4.fromValues(0, 0, 1, 1), m_focalPoint = vec4.fromValues(0, 0, 0, 1), m_centerOfRotation = vec3.fromValues(0, 0, 0), m_viewUp = vec4.fromValues(0, 1, 0, 0), m_rightDir = vec4.fromValues(1, 0, 0, 0), m_near = .01, m_far = 1e4, m_viewAspect = 1, m_directionOfProjection = vec4.fromValues(0, 0, -1, 0), m_viewPlaneNormal = vec4.fromValues(0, 0, 1, 0), m_viewMatrix = mat4.create(), m_projectionMatrix = mat4.create(), m_computeModelViewMatrixTime = vgl.timestamp(), m_computeProjectMatrixTime = vgl.timestamp(), m_left = -1, m_right = 1, m_top = +1, m_bottom = -1, m_enableTranslation = true, m_enableRotation = true, m_enableScale = true, m_enableParallelProjection = false, m_clearColor = [ 1, 1, 1, 1 ], m_clearDepth = 1, m_clearMask = vgl.GL.ColorBufferBit | vgl.GL.DepthBufferBit;
    this.viewAngle = function() {
        return m_viewAngle;
    };
    this.setViewAngleDegrees = function(a) {
        m_viewAngle = Math.PI * a / 180;
        this.modified();
    };
    this.setViewAngle = function(a) {
        if (m_enableScale) {
            m_viewAngle = a;
            this.modified();
        }
    };
    this.position = function() {
        return m_position;
    };
    this.setPosition = function(x, y, z) {
        if (m_enableTranslation) {
            m_position = vec4.fromValues(x, y, z, 1);
            this.modified();
        }
    };
    this.focalPoint = function() {
        return m_focalPoint;
    };
    this.setFocalPoint = function(x, y, z) {
        if (m_enableRotation && m_enableTranslation) {
            m_focalPoint = vec4.fromValues(x, y, z, 1);
            this.modified();
        }
    };
    this.viewUpDirection = function() {
        return m_viewUp;
    };
    this.setViewUpDirection = function(x, y, z) {
        m_viewUp = vec4.fromValues(x, y, z, 0);
        this.modified();
    };
    this.centerOfRotation = function() {
        return m_centerOfRotation;
    };
    this.setCenterOfRotation = function(centerOfRotation) {
        m_centerOfRotation = centerOfRotation;
        this.modified();
    };
    this.clippingRange = function() {
        return [ m_near, m_far ];
    };
    this.setClippingRange = function(near, far) {
        m_near = near;
        m_far = far;
        this.modified();
    };
    this.viewAspect = function() {
        return m_viewAspect;
    };
    this.setViewAspect = function(aspect) {
        m_viewAspect = aspect;
        this.modified();
    };
    this.enableScale = function(flag) {
        return m_enableScale;
    };
    this.setEnableScale = function(flag) {
        if (flag !== m_enableScale) {
            m_enableScale = flag;
            this.modified();
            return true;
        }
        return m_enableScale;
    };
    this.enableRotation = function(f) {
        return m_enableRotation;
    };
    this.setEnableRotation = function(flag) {
        if (flag !== m_enableRotation) {
            m_enableRotation = flag;
            this.modified();
            return true;
        }
        return m_enableRotation;
    };
    this.enableTranslation = function(flag) {
        return m_enableTranslation;
    };
    this.setEnableTranslation = function(flag) {
        if (flag !== m_enableTranslation) {
            m_enableTranslation = flag;
            this.modified();
            return true;
        }
        return m_enableTranslation;
    };
    this.isEnabledParallelProjection = function() {
        return m_enableParallelProjection;
    };
    this.enableParallelProjection = function(flag) {
        if (flag !== m_enableParallelProjection) {
            m_enableParallelProjection = flag;
            this.modified();
            return true;
        }
        return m_enableParallelProjection;
    };
    this.setEnnableParallelProjection = function(flag) {
        return enableParallelProjection();
    };
    this.setParallelProjection = function(left, right, top, bottom) {
        m_left = left;
        m_right = right;
        m_top = top;
        m_bottom = bottom;
        this.modified();
    };
    this.directionOfProjection = function() {
        this.computeDirectionOfProjection();
        return m_directionOfProjection;
    };
    this.viewPlaneNormal = function() {
        this.computeViewPlaneNormal();
        return m_viewPlaneNormal;
    };
    this.viewMatrix = function() {
        return this.computeViewMatrix();
    };
    this.projectionMatrix = function() {
        return this.computeProjectionMatrix();
    };
    this.clearMask = function() {
        return m_clearMask;
    };
    this.setClearMask = function(mask) {
        m_clearMask = mask;
        this.modified();
    };
    this.clearColor = function() {
        return m_clearColor;
    };
    this.setClearColor = function(r, g, b, a) {
        m_clearColor[0] = r;
        m_clearColor[1] = g;
        m_clearColor[2] = b;
        m_clearColor[3] = a;
        this.modified();
    };
    this.clearDepth = function() {
        return m_clearDepth;
    };
    this.setClearDepth = function(depth) {
        m_clearDepth = depth;
        this.modified();
    };
    this.computeDirectionOfProjection = function() {
        vec3.subtract(m_directionOfProjection, m_focalPoint, m_position);
        vec3.normalize(m_directionOfProjection, m_directionOfProjection);
        this.modified();
    };
    this.computeViewPlaneNormal = function() {
        m_viewPlaneNormal[0] = -m_directionOfProjection[0];
        m_viewPlaneNormal[1] = -m_directionOfProjection[1];
        m_viewPlaneNormal[2] = -m_directionOfProjection[2];
    };
    this.zoom = function(d, dir) {
        if (d === 0) {
            return;
        }
        if (!m_enableTranslation) {
            return;
        }
        d = d * vec3.distance(m_focalPoint, m_position);
        if (!dir) {
            dir = m_directionOfProjection;
            m_position[0] = m_focalPoint[0] - d * dir[0];
            m_position[1] = m_focalPoint[1] - d * dir[1];
            m_position[2] = m_focalPoint[2] - d * dir[2];
        } else {
            m_position[0] = m_position[0] + d * dir[0];
            m_position[1] = m_position[1] + d * dir[1];
            m_position[2] = m_position[2] + d * dir[2];
        }
        this.modified();
    };
    this.pan = function(dx, dy, dz) {
        if (!m_enableTranslation) {
            return;
        }
        m_position[0] += dx;
        m_position[1] += dy;
        m_position[2] += dz;
        m_focalPoint[0] += dx;
        m_focalPoint[1] += dy;
        m_focalPoint[2] += dz;
        this.modified();
    };
    this.computeOrthogonalAxes = function() {
        this.computeDirectionOfProjection();
        vec3.cross(m_rightDir, m_directionOfProjection, m_viewUp);
        vec3.normalize(m_rightDir, m_rightDir);
        this.modified();
    };
    this.rotate = function(dx, dy) {
        if (!m_enableRotation) {
            return;
        }
        dx = .5 * dx * (Math.PI / 180);
        dy = .5 * dy * (Math.PI / 180);
        var mat = mat4.create(), inverseCenterOfRotation = new vec3.create();
        mat4.identity(mat);
        inverseCenterOfRotation[0] = -m_centerOfRotation[0];
        inverseCenterOfRotation[1] = -m_centerOfRotation[1];
        inverseCenterOfRotation[2] = -m_centerOfRotation[2];
        mat4.translate(mat, mat, m_centerOfRotation);
        mat4.rotate(mat, mat, dx, m_viewUp);
        mat4.rotate(mat, mat, dy, m_rightDir);
        mat4.translate(mat, mat, inverseCenterOfRotation);
        vec4.transformMat4(m_position, m_position, mat);
        vec4.transformMat4(m_focalPoint, m_focalPoint, mat);
        vec4.transformMat4(m_viewUp, m_viewUp, mat);
        vec4.normalize(m_viewUp, m_viewUp);
        this.computeOrthogonalAxes();
        this.modified();
    };
    this.computeViewMatrix = function() {
        if (m_computeModelViewMatrixTime.getMTime() < this.getMTime()) {
            mat4.lookAt(m_viewMatrix, m_position, m_focalPoint, m_viewUp);
            m_computeModelViewMatrixTime.modified();
        }
        return m_viewMatrix;
    };
    this.computeProjectionMatrix = function() {
        if (m_computeProjectMatrixTime.getMTime() < this.getMTime()) {
            if (!m_enableParallelProjection) {
                mat4.perspective(m_projectionMatrix, m_viewAngle, m_viewAspect, m_near, m_far);
            } else {
                console.log("paralle projection");
                mat4.ortho(m_projectionMatrix, m_left, m_right, m_bottom, m_top, m_near, m_far);
            }
            m_computeProjectMatrixTime.modified();
        }
        return m_projectionMatrix;
    };
    this.computeDirectionOfProjection();
    return this;
};

inherit(vgl.camera, vgl.groupNode);

vgl.interactorStyle = function() {
    "use strict";
    if (!(this instanceof vgl.interactorStyle)) {
        return new vgl.interactorStyle();
    }
    vgl.object.call(this);
    var m_that = this, m_viewer = null;
    this.viewer = function() {
        return m_viewer;
    };
    this.setViewer = function(viewer) {
        if (viewer !== m_viewer) {
            m_viewer = viewer;
            $(m_viewer).on(vgl.event.mousePress, m_that.handleMouseDown);
            $(m_viewer).on(vgl.event.mouseRelease, m_that.handleMouseUp);
            $(m_viewer).on(vgl.event.mouseMove, m_that.handleMouseMove);
            $(m_viewer).on(vgl.event.mouseOut, m_that.handleMouseOut);
            $(m_viewer).on(vgl.event.mouseWheel, m_that.handleMouseWheel);
            $(m_viewer).on(vgl.event.keyPress, m_that.handleKeyPress);
            $(m_viewer).on(vgl.event.mouseContextMenu, m_that.handleContextMenu);
            $(m_viewer).on(vgl.event.click, m_that.handleClick);
            $(m_viewer).on(vgl.event.dblClick, m_that.handleDoubleClick);
            this.modified();
        }
    };
    this.handleMouseDown = function(event) {
        return true;
    };
    this.handleMouseUp = function(event) {
        return true;
    };
    this.handleMouseMove = function(event) {
        return true;
    };
    this.handleMouseOut = function(event) {
        return true;
    };
    this.handleMouseWheel = function(event) {
        return true;
    };
    this.handleClick = function(event) {
        return true;
    };
    this.handleDoubleClick = function(event) {
        return true;
    };
    this.handleKeyPress = function(event) {
        return true;
    };
    this.handleContextMenu = function(event) {
        return true;
    };
    this.reset = function() {
        return true;
    };
    return this;
};

inherit(vgl.interactorStyle, vgl.object);

vgl.trackballInteractorStyle = function() {
    "use strict";
    if (!(this instanceof vgl.trackballInteractorStyle)) {
        return new vgl.trackballInteractorStyle();
    }
    vgl.interactorStyle.call(this);
    var m_that = this, m_leftMouseBtnDown = false, m_rightMouseBtnDown = false, m_midMouseBtnDown = false, m_outsideCanvas, m_currPos = {
        x: 0,
        y: 0
    }, m_lastPos = {
        x: 0,
        y: 0
    };
    this.handleMouseMove = function(event) {
        var canvas = m_that.viewer().canvas(), width = m_that.viewer().renderWindow().windowSize()[0], height = m_that.viewer().renderWindow().windowSize()[1], ren = m_that.viewer().renderWindow().activeRenderer(), cam = ren.camera(), coords = m_that.viewer().relMouseCoords(event), fp, fdp, fwp, dp1, dp2, wp1, wp2, coords, dx, dy, dz, coords, m_zTrans;
        m_outsideCanvas = false;
        m_currPos = {
            x: 0,
            y: 0
        };
        if (coords.x < 0 || coords.x > width) {
            m_currPos.x = 0;
            m_outsideCanvas = true;
        } else {
            m_currPos.x = coords.x;
        }
        if (coords.y < 0 || coords.y > height) {
            m_currPos.y = 0;
            m_outsideCanvas = true;
        } else {
            m_currPos.y = coords.y;
        }
        if (m_outsideCanvas === true) {
            return;
        }
        fp = cam.focalPoint();
        fwp = vec4.fromValues(fp[0], fp[1], fp[2], 1);
        fdp = ren.worldToDisplay(fwp, cam.viewMatrix(), cam.projectionMatrix(), width, height);
        dp1 = vec4.fromValues(m_currPos.x, m_currPos.y, fdp[2], 1);
        dp2 = vec4.fromValues(m_lastPos.x, m_lastPos.y, fdp[2], 1);
        wp1 = ren.displayToWorld(dp1, cam.viewMatrix(), cam.projectionMatrix(), width, height);
        wp2 = ren.displayToWorld(dp2, cam.viewMatrix(), cam.projectionMatrix(), width, height);
        dx = wp1[0] - wp2[0];
        dy = wp1[1] - wp2[1];
        dz = wp1[2] - wp2[2];
        if (m_midMouseBtnDown) {
            cam.pan(-dx, -dy, -dz);
            m_that.viewer().render();
        }
        if (m_leftMouseBtnDown) {
            cam.rotate(m_lastPos.x - m_currPos.x, m_lastPos.y - m_currPos.y);
            ren.resetCameraClippingRange();
            m_that.viewer().render();
        }
        if (m_rightMouseBtnDown) {
            m_zTrans = 2 * (m_currPos.y - m_lastPos.y) / height;
            if (m_zTrans > 0) {
                cam.zoom(1 - Math.abs(m_zTrans));
            } else {
                cam.zoom(1 + Math.abs(m_zTrans));
            }
            ren.resetCameraClippingRange();
            m_that.viewer().render();
        }
        m_lastPos.x = m_currPos.x;
        m_lastPos.y = m_currPos.y;
        return false;
    };
    this.handleMouseDown = function(event) {
        var coords;
        if (event.button === 0) {
            m_leftMouseBtnDown = true;
        }
        if (event.button === 1) {
            m_midMouseBtnDown = true;
        }
        if (event.button === 2) {
            m_rightMouseBtnDown = true;
        }
        coords = m_that.view.relMouseCoords(event);
        if (coords.x < 0) {
            m_lastPos.x = 0;
        } else {
            m_lastPos.x = coords.x;
        }
        if (coords.y < 0) {
            m_lastPos.y = 0;
        } else {
            m_lastPos.y = coords.y;
        }
        return false;
    };
    this.handleMouseUp = function(event) {
        if (event.button === 0) {
            m_leftMouseBtnDown = false;
        }
        if (event.button === 1) {
            m_midMouseBtnDown = false;
        }
        if (event.button === 2) {
            m_rightMouseBtnDown = false;
        }
        return false;
    };
    this.handleMouseWheel = function(event) {
        var ren = m_that.viewer().renderWindow().activeRenderer(), cam = ren.camera();
        if (event.originalEvent.wheelDelta < 0) {
            cam.zoom(.9);
        } else {
            cam.zoom(1.1);
        }
        ren.resetCameraClippingRange();
        m_that.viewer().render();
        return true;
    };
    return this;
};

inherit(vgl.trackballInteractorStyle, vgl.interactorStyle);

vgl.pvwInteractorStyle = function() {
    "use strict";
    if (!(this instanceof vgl.pvwInteractorStyle)) {
        return new vgl.pvwInteractorStyle();
    }
    vgl.trackballInteractorStyle.call(this);
    var m_that = this, m_leftMouseButtonDown = false, m_rightMouseButtonDown = false, m_middleMouseButtonDown = false, m_width, m_height, m_renderer, m_camera, m_outsideCanvas, m_coords, m_currentMousePos, m_focalPoint, m_focusWorldPt, m_focusDisplayPt, m_displayPt1, m_displayPt2, m_worldPt1, m_worldPt2, m_dx, m_dy, m_dz, m_zTrans, m_mouseLastPos = {
        x: 0,
        y: 0
    };
    function render() {
        m_renderer.resetCameraClippingRange();
        m_that.viewer().render();
    }
    this.handleMouseMove = function(event) {
        var rens = [], i = null, secCameras = [], deltaxy = null;
        m_width = m_that.viewer().renderWindow().windowSize()[0];
        m_height = m_that.viewer().renderWindow().windowSize()[1];
        m_renderer = m_that.viewer().renderWindow().activeRenderer();
        m_camera = m_renderer.camera();
        m_outsideCanvas = false;
        m_coords = m_that.viewer().relMouseCoords(event);
        m_currentMousePos = {
            x: 0,
            y: 0
        };
        rens = m_that.viewer().renderWindow().renderers();
        for (i = 0; i < rens.length; ++i) {
            if (m_renderer !== rens[i]) {
                secCameras.push(rens[i].camera());
            }
        }
        if (m_coords.x < 0 || m_coords.x > m_width) {
            m_currentMousePos.x = 0;
            m_outsideCanvas = true;
        } else {
            m_currentMousePos.x = m_coords.x;
        }
        if (m_coords.y < 0 || m_coords.y > m_height) {
            m_currentMousePos.y = 0;
            m_outsideCanvas = true;
        } else {
            m_currentMousePos.y = m_coords.y;
        }
        if (m_outsideCanvas === true) {
            return;
        }
        m_focalPoint = m_camera.focalPoint();
        m_focusWorldPt = vec4.fromValues(m_focalPoint[0], m_focalPoint[1], m_focalPoint[2], 1);
        m_focusDisplayPt = m_renderer.worldToDisplay(m_focusWorldPt, m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);
        m_displayPt1 = vec4.fromValues(m_currentMousePos.x, m_currentMousePos.y, m_focusDisplayPt[2], 1);
        m_displayPt2 = vec4.fromValues(m_mouseLastPos.x, m_mouseLastPos.y, m_focusDisplayPt[2], 1);
        m_worldPt1 = m_renderer.displayToWorld(m_displayPt1, m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);
        m_worldPt2 = m_renderer.displayToWorld(m_displayPt2, m_camera.viewMatrix(), m_camera.projectionMatrix(), m_width, m_height);
        m_dx = m_worldPt1[0] - m_worldPt2[0];
        m_dy = m_worldPt1[1] - m_worldPt2[1];
        m_dz = m_worldPt1[2] - m_worldPt2[2];
        if (m_middleMouseButtonDown) {
            m_camera.pan(-m_dx, -m_dy, -m_dz);
            render();
        }
        if (m_leftMouseButtonDown) {
            deltaxy = [ m_mouseLastPos.x - m_currentMousePos.x, m_mouseLastPos.y - m_currentMousePos.y ];
            m_camera.rotate(deltaxy[0], deltaxy[1]);
            for (i = 0; i < secCameras.length; ++i) {
                secCameras[i].rotate(deltaxy[0], deltaxy[1]);
            }
            for (i = 0; i < rens.length; ++i) {
                rens[i].resetCameraClippingRange();
            }
            render();
        }
        if (m_rightMouseButtonDown) {
            m_zTrans = 2 * (m_currentMousePos.y - m_mouseLastPos.y) / m_height;
            if (m_zTrans > 0) {
                m_camera.zoom(1 - Math.abs(m_zTrans));
            } else {
                m_camera.zoom(1 + Math.abs(m_zTrans));
            }
            render();
        }
        m_mouseLastPos.x = m_currentMousePos.x;
        m_mouseLastPos.y = m_currentMousePos.y;
        return false;
    };
    this.handleMouseDown = function(event) {
        if (event.button === 0) {
            m_leftMouseButtonDown = true;
        }
        if (event.button === 1) {
            m_middleMouseButtonDown = true;
        }
        if (event.button === 2) {
            m_rightMouseButtonDown = true;
        }
        m_coords = m_that.viewer().relMouseCoords(event);
        if (m_coords.x < 0) {
            m_mouseLastPos.x = 0;
        } else {
            m_mouseLastPos.x = m_coords.x;
        }
        if (m_coords.y < 0) {
            m_mouseLastPos.y = 0;
        } else {
            m_mouseLastPos.y = m_coords.y;
        }
        return false;
    };
    this.handleMouseUp = function(event) {
        var canvas = m_that.viewer().canvas();
        if (event.button === 0) {
            m_leftMouseButtonDown = false;
        }
        if (event.button === 1) {
            m_middleMouseButtonDown = false;
        }
        if (event.button === 2) {
            m_rightMouseButtonDown = false;
        }
        return false;
    };
    return this;
};

inherit(vgl.pvwInteractorStyle, vgl.trackballInteractorStyle);

vgl.viewer = function(canvas) {
    "use strict";
    if (!(this instanceof vgl.viewer)) {
        return new vgl.viewer(canvas);
    }
    vgl.object.call(this);
    var m_that = this, m_canvas = canvas, m_ready = true, m_interactorStyle = null, m_renderer = vgl.renderer(), m_renderWindow = vgl.renderWindow(m_canvas);
    this.canvas = function() {
        return m_canvas;
    };
    this.renderWindow = function() {
        return m_renderWindow;
    };
    this.init = function() {
        if (m_renderWindow !== null) {
            m_renderWindow.createWindow();
        } else {
            console.log("[ERROR] No render window attached");
        }
    };
    this.interactorStyle = function() {
        return m_interactorStyle;
    };
    this.setInteractorStyle = function(style) {
        if (style !== m_interactorStyle) {
            m_interactorStyle = style;
            m_interactorStyle.setViewer(this);
            this.modified();
        }
    };
    this.handleMouseDown = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            if (event.button === 2) {
                fixedEvent.preventDefault();
            }
            fixedEvent.state = "down";
            fixedEvent.type = vgl.event.mousePress;
            $(m_that).trigger(fixedEvent);
        }
        return true;
    };
    this.handleMouseUp = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.state = "up";
            fixedEvent.type = vgl.event.mouseRelease;
            $(m_that).trigger(fixedEvent);
        }
        return true;
    };
    this.handleMouseMove = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.mouseMove;
            $(m_that).trigger(fixedEvent);
        }
        return true;
    };
    this.handleMouseWheel = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.mouseWheel;
            $(m_that).trigger(fixedEvent);
        }
        return true;
    };
    this.handleMouseOut = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.mouseOut;
            $(m_that).trigger(fixedEvent);
        }
        return true;
    };
    this.handleKeyPress = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.keyPress;
            $(m_that).trigger(fixedEvent);
        }
        return true;
    };
    this.handleContextMenu = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.contextMenu;
            $(m_that).trigger(fixedEvent);
        }
        return false;
    };
    this.handleClick = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.click;
            $(m_that).trigger(fixedEvent);
        }
        return false;
    };
    this.handleDoubleClick = function(event) {
        if (m_ready === true) {
            var fixedEvent = $.event.fix(event || window.event);
            fixedEvent.preventDefault();
            fixedEvent.type = vgl.event.dblClick;
            $(m_that).trigger(fixedEvent);
        }
        return false;
    };
    this.relMouseCoords = function(event) {
        if (event.pageX === undefined || event.pageY === undefined) {
            throw "Missing attributes pageX and pageY on the event";
        }
        var totalOffsetX = 0, totalOffsetY = 0, canvasX = 0, canvasY = 0, currentElement = m_canvas;
        do {
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        } while (currentElement = currentElement.offsetParent);
        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
        return {
            x: canvasX,
            y: canvasY
        };
    };
    this.render = function() {
        m_renderWindow.render();
    };
    this.bindEventHandlers = function() {
        $(m_canvas).on("mousedown", this.handleMouseDown);
        $(m_canvas).on("mouseup", this.handleMouseUp);
        $(m_canvas).on("mousemove", this.handleMouseMove);
        $(m_canvas).on("mousewheel", this.handleMouseWheel);
        $(m_canvas).on("contextmenu", this.handleContextMenu);
    };
    this.unbindEventHandlers = function() {
        $(m_canvas).off("mousedown", this.handleMouseDown);
        $(m_canvas).off("mouseup", this.handleMouseUp);
        $(m_canvas).off("mousemove", this.handleMouseMove);
        $(m_canvas).off("mousewheel", this.handleMouseWheel);
        $(m_canvas).off("contextmenu", this.handleContextMenu);
    };
    this._init = function() {
        this.bindEventHandlers();
        m_renderWindow.addRenderer(m_renderer);
    };
    this._init();
    return this;
};

inherit(vgl.viewer, vgl.object);

vgl.shader = function(type) {
    "use strict";
    if (!(this instanceof vgl.shader)) {
        return new vgl.shader(type);
    }
    vgl.object.call(this);
    var m_shaderHandle = null, m_compileTimestamp = vgl.timestamp(), m_shaderType = type, m_shaderSource = "";
    this.shaderHandle = function() {
        return m_shaderHandle;
    };
    this.shaderType = function() {
        return m_shaderType;
    };
    this.shaderSource = function() {
        return m_shaderSource;
    };
    this.setShaderSource = function(source) {
        m_shaderSource = source;
        this.modified();
    };
    this.compile = function() {
        if (this.getMTime() < m_compileTimestamp.getMTime()) {
            return m_shaderHandle;
        }
        gl.deleteShader(m_shaderHandle);
        m_shaderHandle = gl.createShader(m_shaderType);
        gl.shaderSource(m_shaderHandle, m_shaderSource);
        gl.compileShader(m_shaderHandle);
        if (!gl.getShaderParameter(m_shaderHandle, gl.COMPILE_STATUS)) {
            console.log("[ERROR] An error occurred compiling the shaders: " + gl.getShaderInfoLog(m_shaderHandle));
            console.log(m_shaderSource);
            gl.deleteShader(m_shaderHandle);
            return null;
        }
        m_compileTimestamp.modified();
        return m_shaderHandle;
    };
    this.attachShader = function(programHandle) {
        gl.attachShader(programHandle, m_shaderHandle);
    };
};

inherit(vgl.shader, vgl.object);

vgl.shaderProgram = function() {
    "use strict";
    if (!(this instanceof vgl.shaderProgram)) {
        return new vgl.shaderProgram();
    }
    vgl.materialAttribute.call(this, vgl.materialAttributeType.ShaderProgram);
    var m_programHandle = 0, m_compileTimestamp = vgl.timestamp(), m_shaders = [], m_uniforms = [], m_vertexAttributes = {}, m_uniformNameToLocation = {}, m_vertexAttributeNameToLocation = {};
    this.queryUniformLocation = function(name) {
        return gl.getUniformLocation(m_programHandle, name);
    };
    this.queryAttributeLocation = function(name) {
        return gl.getAttribLocation(m_programHandle, name);
    };
    this.addShader = function(shader) {
        if (m_shaders.indexOf(shader) > -1) {
            return false;
        }
        var i;
        for (i = 0; i < m_shaders.length; ++i) {
            if (m_shaders[i].shaderType() === shader.shaderType()) {
                m_shaders.splice(m_shaders.indexOf(shader), 1);
            }
        }
        m_shaders.push(shader);
        this.modified();
        return true;
    };
    this.addUniform = function(uniform) {
        if (m_uniforms.indexOf(uniform) > -1) {
            return false;
        }
        m_uniforms.push(uniform);
        this.modified();
    };
    this.addVertexAttribute = function(attr, key) {
        m_vertexAttributes[key] = attr;
        this.modified();
    };
    this.uniformLocation = function(name) {
        return m_uniformNameToLocation[name];
    };
    this.attributeLocation = function(name) {
        return m_vertexAttributeNameToLocation[name];
    };
    this.uniform = function(name) {
        var i;
        for (i = 0; i < m_uniforms.length; ++i) {
            if (m_uniforms[i].name() === name) {
                return m_uniforms[i];
            }
        }
        return null;
    };
    this.updateUniforms = function() {
        var i;
        for (i = 0; i < m_uniforms.length; ++i) {
            m_uniforms[i].callGL(m_uniformNameToLocation[m_uniforms[i].name()]);
        }
    };
    this.link = function() {
        gl.linkProgram(m_programHandle);
        if (!gl.getProgramParameter(m_programHandle, gl.LINK_STATUS)) {
            console.log("[ERROR] Unable to initialize the shader program.");
            return false;
        }
        return true;
    };
    this.use = function() {
        gl.useProgram(m_programHandle);
    };
    this.cleanUp = function() {
        this.deleteVertexAndFragment();
        this.deleteProgram();
    };
    this.deleteProgram = function() {
        gl.deleteProgram(m_programHandle);
    };
    this.deleteVertexAndFragment = function() {
        var i;
        for (i = 0; i < m_shaders.length; ++i) {
            gl.deleteShader(m_shaders[i].shaderHandle());
        }
    };
    this.bind = function(renderState) {
        var i = 0;
        if (m_programHandle === 0 || m_compileTimestamp.getMTime() < this.getMTime()) {
            m_programHandle = gl.createProgram();
            if (m_programHandle === 0) {
                console.log("[ERROR] Cannot create Program Object");
                return false;
            }
            for (i = 0; i < m_shaders.length; ++i) {
                m_shaders[i].compile();
                m_shaders[i].attachShader(m_programHandle);
            }
            this.bindAttributes();
            if (!this.link()) {
                console.log("[ERROR] Failed to link Program");
                this.cleanUp();
            }
            this.use();
            this.bindUniforms();
            m_compileTimestamp.modified();
        } else {
            this.use();
        }
        for (i = 0; i < m_uniforms.length; ++i) {
            m_uniforms[i].update(renderState, this);
        }
        this.updateUniforms();
    };
    this.undoBind = function(renderState) {};
    this.bindVertexData = function(renderState, key) {
        if (m_vertexAttributes.hasOwnProperty(key)) {
            m_vertexAttributes[key].bindVertexData(renderState, key);
        }
    };
    this.undoBindVertexData = function(renderState, key) {
        if (m_vertexAttributes.hasOwnProperty(key)) {
            m_vertexAttributes[key].undoBindVertexData(renderState, key);
        }
    };
    this.bindUniforms = function() {
        var i;
        for (i = 0; i < m_uniforms.length; ++i) {
            m_uniformNameToLocation[m_uniforms[i].name()] = this.queryUniformLocation(m_uniforms[i].name());
        }
    };
    this.bindAttributes = function() {
        var key, name;
        for (key in m_vertexAttributes) {
            name = m_vertexAttributes[key].name();
            gl.bindAttribLocation(m_programHandle, key, name);
            m_vertexAttributeNameToLocation[name] = key;
        }
    };
    return this;
};

inherit(vgl.shaderProgram, vgl.materialAttribute);

vgl.texture = function() {
    "use strict";
    if (!(this instanceof vgl.texture)) {
        return new vgl.texture();
    }
    vgl.materialAttribute.call(this, vgl.materialAttributeType.Texture);
    this.m_width = 0;
    this.m_height = 0;
    this.m_depth = 0;
    this.m_textureHandle = null;
    this.m_textureUnit = 0;
    this.m_pixelFormat = null;
    this.m_pixelDataType = null;
    this.m_internalFormat = null;
    this.m_image = null;
    var m_setupTimestamp = vgl.timestamp(), m_that = this;
    function activateTextureUnit() {
        switch (m_that.m_textureUnit) {
          case 0:
            gl.activeTexture(gl.TEXTURE0);
            break;

          case 1:
            gl.activeTexture(gl.TEXTURE1);
            break;

          case 2:
            gl.activeTexture(gl.TEXTURE2);
            break;

          case 3:
            gl.activeTexture(gl.TEXTURE3);
            break;

          case 4:
            gl.activeTexture(gl.TEXTURE4);
            break;

          case 5:
            gl.activeTexture(gl.TEXTURE5);
            break;

          case 6:
            gl.activeTexture(gl.TEXTURE6);
            break;

          case 7:
            gl.activeTexture(gl.TEXTURE7);
            break;

          case 8:
            gl.activeTexture(gl.TEXTURE8);
            break;

          case 9:
            gl.activeTexture(gl.TEXTURE9);
            break;

          case 10:
            gl.activeTexture(gl.TEXTURE10);
            break;

          case 11:
            gl.activeTexture(gl.TEXTURE11);
            break;

          case 12:
            gl.activeTexture(gl.TEXTURE12);
            break;

          case 13:
            gl.activeTexture(gl.TEXTURE13);
            break;

          case 14:
            gl.activeTexture(gl.TEXTURE14);
            break;

          case 15:
            gl.activeTexture(gl.TEXTURE15);
            break;

          default:
            throw "[error] Texture unit " + this.m_textureUnit + " is not supported";
        }
    }
    this.setup = function(renderState) {
        activateTextureUnit();
        gl.deleteTexture(this.m_textureHandle);
        this.m_textureHandle = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.m_textureHandle);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        if (this.m_image !== null) {
            this.updateDimensions();
            this.computeInternalFormatUsingImage();
            gl.texImage2D(gl.TEXTURE_2D, 0, this.m_internalFormat, this.m_pixelFormat, this.m_pixelDataType, this.m_image);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, this.m_internalFormat, this.m_pixelFormat, this.m_pixelDataType, null);
        }
        gl.bindTexture(gl.TEXTURE_2D, null);
        m_setupTimestamp.modified();
    };
    this.bind = function(renderState) {
        if (this.getMTime() > m_setupTimestamp.getMTime()) {
            this.setup(renderState);
        }
        activateTextureUnit();
        gl.bindTexture(gl.TEXTURE_2D, this.m_textureHandle);
    };
    this.undoBind = function(renderState) {
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    this.image = function() {
        return this.m_image;
    };
    this.setImage = function(image) {
        if (image !== null) {
            this.m_image = image;
            this.updateDimensions();
            this.modified();
            return true;
        }
        return false;
    };
    this.textureUnit = function() {
        return this.m_textureUnit;
    };
    this.setTextureUnit = function(unit) {
        if (this.m_textureUnit === unit) {
            return false;
        }
        this.m_textureUnit = unit;
        this.modified();
        return true;
    };
    this.width = function() {
        return this.m_width;
    };
    this.setWidth = function(width) {
        if (this.m_image === null) {
            return false;
        }
        this.m_width = width;
        this.modified();
        return true;
    };
    this.depth = function() {
        return this.m_depth;
    };
    this.setDepth = function(depth) {
        if (this.m_image === null) {
            return false;
        }
        this.m_depth = depth;
        this.modified();
        return true;
    };
    this.textureHandle = function() {
        return this.m_textureHandle;
    };
    this.internalFormat = function() {
        return this.m_internalFormat;
    };
    this.setInternalFormat = function(internalFormat) {
        if (this.m_internalFormat !== internalFormat) {
            this.m_internalFormat = internalFormat;
            this.modified();
            return true;
        }
        return false;
    };
    this.pixelFormat = function() {
        return this.m_pixelFormat;
    };
    this.setPixelFormat = function(pixelFormat) {
        if (this.m_image === null) {
            return false;
        }
        this.m_pixelFormat = pixelFormat;
        this.modified();
        return true;
    };
    this.pixelDataType = function() {
        return this.m_pixelDataType;
    };
    this.setPixelDataType = function(pixelDataType) {
        if (this.m_image === null) {
            return false;
        }
        this.m_pixelDataType = pixelDataType;
        this.modified();
        return true;
    };
    this.computeInternalFormatUsingImage = function() {
        this.m_internalFormat = gl.RGBA;
        this.m_pixelFormat = gl.RGBA;
        this.m_pixelDataType = gl.UNSIGNED_BYTE;
    };
    this.updateDimensions = function() {
        if (this.m_image !== null) {
            this.m_width = this.m_image.width;
            this.m_height = this.m_image.height;
            this.m_depth = 0;
        }
    };
    return this;
};

inherit(vgl.texture, vgl.materialAttribute);

vgl.lookupTable = function() {
    "use strict";
    if (!(this instanceof vgl.lookupTable)) {
        return new vgl.lookupTable();
    }
    vgl.texture.call(this);
    var m_setupTimestamp = vgl.timestamp(), m_range = [ 0, 0 ];
    this.m_colorTable = [ .07514311, .468049805, 1, 1, .247872569, .498782363, 1, 1, .339526309, .528909511, 1, 1, .409505078, .558608486, 1, 1, .468487184, .588057293, 1, 1, .520796675, .617435078, 1, 1, .568724526, .646924167, 1, 1, .613686735, .676713218, 1, 1, .656658579, .707001303, 1, 1, .698372844, .738002964, 1, 1, .739424025, .769954435, 1, 1, .780330104, .803121429, 1, 1, .821573924, .837809045, 1, 1, .863634967, .874374691, 1, 1, .907017747, .913245283, 1, 1, .936129275, .938743558, .983038586, 1, .943467973, .943498599, .943398095, 1, .990146732, .928791426, .917447482, 1, 1, .88332677, .861943246, 1, 1, .833985467, .803839606, 1, 1, .788626485, .750707739, 1, 1, .746206642, .701389973, 1, 1, .70590052, .654994046, 1, 1, .667019783, .610806959, 1, 1, .6289553, .568237474, 1, 1, .591130233, .526775617, 1, 1, .552955184, .485962266, 1, 1, .513776083, .445364274, 1, 1, .472800903, .404551679, 1, 1, .428977855, .363073592, 1, 1, .380759558, .320428137, 1, .961891484, .313155629, .265499262, 1, .916482116, .236630659, .209939162, 1 ].map(function(x) {
        return x * 255;
    });
    this.setup = function(renderState) {
        if (this.textureUnit() === 0) {
            gl.activeTexture(gl.TEXTURE0);
        } else if (this.textureUnit() === 1) {
            gl.activeTexture(gl.TEXTURE1);
        }
        gl.deleteTexture(this.m_textureHandle);
        this.m_textureHandle = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.m_textureHandle);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        this.m_width = this.m_colorTable.length / 4;
        this.m_height = 1;
        this.m_depth = 0;
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.m_width, this.m_height, this.m_depth, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(this.m_colorTable));
        gl.bindTexture(gl.TEXTURE_2D, null);
        m_setupTimestamp.modified();
    };
    this.colorTable = function() {
        return this.m_colorTable;
    };
    this.setColorTable = function(colors) {
        if (this.m_colorTable === colors) {
            return false;
        }
        this.m_colorTable = colors;
        this.modified();
        return true;
    };
    this.range = function() {
        return m_range;
    };
    this.setRange = function(range) {
        if (m_range === range) {
            return false;
        }
        m_range = range;
        this.modified();
        return true;
    };
    this.updateRange = function(range) {
        if (!(range instanceof Array)) {
            console.log("[error] Invalid data type for range. Requires array [min,max]");
        }
        if (range[0] < m_range[0]) {
            m_range[0] = range[0];
            this.modified();
        }
        if (range[1] > m_range[1]) {
            m_range[1] = range[1];
            this.modified();
        }
    };
    return this;
};

inherit(vgl.lookupTable, vgl.texture);

vgl.uniform = function(type, name) {
    "use strict";
    if (!(this instanceof vgl.uniform)) {
        return new vgl.uniform();
    }
    this.getTypeNumberOfComponents = function(type) {
        switch (type) {
          case gl.FLOAT:
          case gl.INT:
          case gl.BOOL:
            return 1;

          case gl.FLOAT_VEC2:
          case gl.INT_VEC2:
          case gl.BOOL_VEC2:
            return 2;

          case gl.FLOAT_VEC3:
          case gl.INT_VEC3:
          case gl.BOOLT_VEC3:
            return 3;

          case gl.FLOAT_VEC4:
          case gl.INT_VEC4:
          case gl.BOOL_VEC4:
            return 4;

          case gl.FLOAT_MAT3:
            return 9;

          case gl.FLOAT_MAT4:
            return 16;

          default:
            return 0;
        }
    };
    var m_type = type, m_name = name, m_dataArray = [], m_numberOfElements = 1;
    m_dataArray.length = this.getTypeNumberOfComponents(m_type);
    this.name = function() {
        return m_name;
    };
    this.type = function() {
        return m_type;
    };
    this.get = function() {
        return m_dataArray;
    };
    this.set = function(value) {
        var i = 0;
        if (m_dataArray.length === 16) {
            for (i = 0; i < 16; ++i) {
                m_dataArray[i] = value[i];
            }
        } else if (m_dataArray.length === 9) {
            for (i = 0; i < 9; ++i) {
                m_dataArray[i] = value[i];
            }
        } else if (m_dataArray.length === 4) {
            for (i = 0; i < 4; ++i) {
                m_dataArray[i] = value[i];
            }
        } else if (m_dataArray.length === 3) {
            for (i = 0; i < 3; ++i) {
                m_dataArray[i] = value[i];
            }
        } else if (m_dataArray.length === 2) {
            for (i = 0; i < 2; ++i) {
                m_dataArray[i] = value[i];
            }
        } else {
            m_dataArray[0] = value;
        }
    };
    this.callGL = function(location) {
        if (this.m_numberElements < 1) {
            return;
        }
        switch (m_type) {
          case gl.BOOL:
          case gl.INT:
            gl.uniform1iv(location, m_dataArray);
            break;

          case gl.FLOAT:
            gl.uniform1fv(location, m_dataArray);
            break;

          case gl.FLOAT_VEC2:
            gl.uniform2fv(location, m_dataArray);
            break;

          case gl.FLOAT_VEC3:
            gl.uniform3fv(location, m_dataArray);
            break;

          case gl.FLOAT_VEC4:
            gl.uniform4fv(location, m_dataArray);
            break;

          case gl.FLOAT_MAT3:
            gl.uniformMatrix3fv(location, gl.FALSE, m_dataArray);
            break;

          case gl.FLOAT_MAT4:
            gl.uniformMatrix4fv(location, gl.FALSE, m_dataArray);
            break;

          default:
            break;
        }
    };
    this.update = function(renderState, program) {};
    return this;
};

vgl.modelViewUniform = function(name) {
    "use strict";
    if (!(this instanceof vgl.modelViewUniform)) {
        return new vgl.modelViewUniform(name);
    }
    if (name.length === 0) {
        name = "modelViewMatrix";
    }
    vgl.uniform.call(this, gl.FLOAT_MAT4, name);
    this.set(mat4.create());
    this.update = function(renderState, program) {
        this.set(renderState.m_modelViewMatrix);
    };
    return this;
};

inherit(vgl.modelViewUniform, vgl.uniform);

vgl.projectionUniform = function(name) {
    "use strict";
    if (!(this instanceof vgl.projectionUniform)) {
        return new vgl.projectionUniform(name);
    }
    if (name.length === 0) {
        name = "projectionMatrix";
    }
    vgl.uniform.call(this, gl.FLOAT_MAT4, name);
    this.set(mat4.create());
    this.update = function(renderState, program) {
        this.set(renderState.m_projectionMatrix);
    };
    return this;
};

inherit(vgl.projectionUniform, vgl.uniform);

vgl.floatUniform = function(name, value) {
    "use strict";
    if (!(this instanceof vgl.floatUniform)) {
        return new vgl.floatUniform(name, value);
    }
    if (name.length === 0) {
        name = "floatUniform";
    }
    value = value === undefined ? 1 : value;
    vgl.uniform.call(this, gl.FLOAT, name);
    this.set(value);
};

inherit(vgl.floatUniform, vgl.uniform);

vgl.normalMatrixUniform = function(name) {
    "use strict";
    if (!(this instanceof vgl.normalMatrixUniform)) {
        return new vgl.normalMatrixUniform(name);
    }
    if (name.length === 0) {
        name = "normalMatrix";
    }
    vgl.uniform.call(this, gl.FLOAT_MAT4, name);
    this.set(mat4.create());
    this.update = function(renderState, program) {
        this.set(renderState.m_normalMatrix);
    };
    return this;
};

inherit(vgl.normalMatrixUniform, vgl.uniform);

vgl.vertexAttributeKeys = {
    Position: 0,
    Normal: 1,
    TextureCoordinate: 2,
    Color: 3,
    Scalar: 4,
    Scalar2: 5,
    Scalar3: 6,
    Scalar4: 7,
    Scalar5: 8,
    Scalar6: 9,
    Scalar7: 10,
    CountAttributeIndex: 11
};

vgl.vertexAttribute = function(name) {
    "use strict";
    if (!(this instanceof vgl.vertexAttribute)) {
        return new vgl.vertexAttribute(name);
    }
    var m_name = name;
    this.name = function() {
        return m_name;
    };
    this.bindVertexData = function(renderState, key) {
        var geometryData = renderState.m_mapper.geometryData(), sourceData = geometryData.sourceData(key), program = renderState.m_material.shaderProgram();
        gl.vertexAttribPointer(program.attributeLocation(m_name), sourceData.attributeNumberOfComponents(key), sourceData.attributeDataType(key), sourceData.normalized(key), sourceData.attributeStride(key), sourceData.attributeOffset(key));
        gl.enableVertexAttribArray(program.attributeLocation(m_name));
    };
    this.undoBindVertexData = function(renderState, key) {
        var program = renderState.m_material.shaderProgram();
        gl.disableVertexAttribArray(program.attributeLocation(m_name));
    };
};

vgl.source = function() {
    "use strict";
    if (!(this instanceof vgl.source)) {
        return new vgl.source();
    }
    vgl.object.call(this);
    this.create = function() {};
    return this;
};

inherit(vgl.source, vgl.object);

vgl.planeSource = function() {
    "use strict";
    if (!(this instanceof vgl.planeSource)) {
        return new vgl.planeSource();
    }
    vgl.source.call(this);
    var m_origin = [ 0, 0, 0 ], m_point1 = [ 1, 0, 0 ], m_point2 = [ 0, 1, 0 ], m_normal = [ 0, 0, 1 ], m_xresolution = 1, m_yresolution = 1, m_geom = null;
    this.setOrigin = function(x, y, z) {
        m_origin[0] = x;
        m_origin[1] = y;
        m_origin[2] = z;
    };
    this.setPoint1 = function(x, y, z) {
        m_point1[0] = x;
        m_point1[1] = y;
        m_point1[2] = z;
    };
    this.setPoint2 = function(x, y, z) {
        m_point2[0] = x;
        m_point2[1] = y;
        m_point2[2] = z;
    };
    this.create = function() {
        m_geom = new vgl.geometryData();
        var x = [], tc = [], v1 = [], v2 = [], pts = [], i, j, k, ii, numPts, numPolys, posIndex = 0, normIndex = 0, colorIndex = 0, texCoordIndex = 0, positions = [], normals = [], colors = [], texCoords = [], indices = [], tristrip = null, sourcePositions = null, sourceColors = null, sourceTexCoords;
        x.length = 3;
        tc.length = 2;
        v1.length = 3;
        v2.length = 3;
        pts.length = 3;
        for (i = 0; i < 3; i++) {
            v1[i] = m_point1[i] - m_origin[i];
            v2[i] = m_point2[i] - m_origin[i];
        }
        numPts = (m_xresolution + 1) * (m_yresolution + 1);
        numPolys = m_xresolution * m_yresolution * 2;
        positions.length = 3 * numPts;
        normals.length = 3 * numPts;
        texCoords.length = 2 * numPts;
        indices.length = numPts;
        for (k = 0, i = 0; i < m_yresolution + 1; i++) {
            tc[1] = i / m_yresolution;
            for (j = 0; j < m_xresolution + 1; j++) {
                tc[0] = j / m_xresolution;
                for (ii = 0; ii < 3; ii++) {
                    x[ii] = m_origin[ii] + tc[0] * v1[ii] + tc[1] * v2[ii];
                }
                positions[posIndex++] = x[0];
                positions[posIndex++] = x[1];
                positions[posIndex++] = x[2];
                colors[colorIndex++] = 1;
                colors[colorIndex++] = 1;
                colors[colorIndex++] = 1;
                normals[normIndex++] = m_normal[0];
                normals[normIndex++] = m_normal[1];
                normals[normIndex++] = m_normal[2];
                texCoords[texCoordIndex++] = tc[0];
                texCoords[texCoordIndex++] = tc[1];
            }
        }
        for (i = 0; i < m_yresolution; i++) {
            for (j = 0; j < m_xresolution; j++) {
                pts[0] = j + i * (m_xresolution + 1);
                pts[1] = pts[0] + 1;
                pts[2] = pts[0] + m_xresolution + 2;
                pts[3] = pts[0] + m_xresolution + 1;
            }
        }
        for (i = 0; i < numPts; ++i) {
            indices[i] = i;
        }
        tristrip = new vgl.triangleStrip();
        tristrip.setIndices(indices);
        sourcePositions = vgl.sourceDataP3fv();
        sourcePositions.pushBack(positions);
        sourceColors = vgl.sourceDataC3fv();
        sourceColors.pushBack(colors);
        sourceTexCoords = vgl.sourceDataT2fv();
        sourceTexCoords.pushBack(texCoords);
        m_geom.addSource(sourcePositions);
        m_geom.addSource(sourceColors);
        m_geom.addSource(sourceTexCoords);
        m_geom.addPrimitive(tristrip);
        return m_geom;
    };
};

inherit(vgl.planeSource, vgl.source);

vgl.pointSource = function() {
    "use strict";
    if (!(this instanceof vgl.pointSource)) {
        return new vgl.pointSource();
    }
    vgl.source.call(this);
    var m_this = this, m_positions = [], m_colors = [], m_textureCoords = [], m_size = [], m_geom = null;
    this.getPositions = function(positions) {
        return m_positions;
    };
    this.setPositions = function(positions) {
        if (positions instanceof Array) {
            m_positions = positions;
        } else {
            console.log("[ERROR] Invalid data type for positions. Array is required.");
        }
        m_this.modified();
    };
    this.getColors = function(positions) {
        return m_colors;
    };
    this.setColors = function(colors) {
        if (colors instanceof Array) {
            m_colors = colors;
        } else {
            console.log("[ERROR] Invalid data type for colors. Array is required.");
        }
        m_this.modified();
    };
    this.getSize = function(positions) {
        return m_size;
    };
    this.setSize = function(size) {
        m_size = size;
        this.modified();
    };
    this.setTextureCoordinates = function(texcoords) {
        if (texcoords instanceof Array) {
            m_textureCoords = texcoords;
        } else {
            console.log("[ERROR] Invalid data type for " + "texture coordinates. Array is required.");
        }
        m_this.modified();
    };
    this.create = function() {
        m_geom = new vgl.geometryData();
        if (m_positions.length % 3 !== 0) {
            console.log("[ERROR] Invalid length of the points array");
            return;
        }
        var numPts = m_positions.length / 3, i = 0, indices = [], pointsPrimitive, sourcePositions, sourceColors, sourceTexCoords, sourceSize;
        indices.length = numPts;
        for (i = 0; i < numPts; ++i) {
            indices[i] = i;
        }
        sourceSize = vgl.sourceDataDf();
        if (numPts !== m_size.length) {
            for (i = 0; i < numPts; ++i) {
                sourceSize.pushBack(m_size);
            }
        } else {
            sourceSize.setData(m_size);
        }
        m_geom.addSource(sourceSize);
        pointsPrimitive = new vgl.points();
        pointsPrimitive.setIndices(indices);
        sourcePositions = vgl.sourceDataP3fv();
        sourcePositions.pushBack(m_positions);
        m_geom.addSource(sourcePositions);
        if (m_colors.length > 0 && m_colors.length === m_positions.length) {
            sourceColors = vgl.sourceDataC3fv();
            sourceColors.pushBack(m_colors);
            m_geom.addSource(sourceColors);
        } else if (m_colors.length > 0 && m_colors.length !== m_positions.length) {
            console.log("[ERROR] Number of colors are different than number of points");
        }
        if (m_textureCoords.length > 0 && m_textureCoords.length === m_positions.length) {
            sourceTexCoords = vgl.sourceDataT2fv();
            sourceTexCoords.pushBack(m_textureCoords);
            m_geom.addSource(sourceTexCoords);
        } else if (m_textureCoords.length > 0 && m_textureCoords.length / 2 !== m_positions.length / 3) {
            console.log("[ERROR] Number of texture coordinates are different than number of points");
        }
        m_geom.addPrimitive(pointsPrimitive);
        return m_geom;
    };
};

inherit(vgl.pointSource, vgl.source);

vgl.lineSource = function(positions, colors) {
    "use strict";
    if (!(this instanceof vgl.lineSource)) {
        return new vgl.lineSource();
    }
    vgl.source.call(this);
    var m_positions = positions, m_colors = colors, m_height = null, m_geom = null;
    this.setPositions = function(positions) {
        if (positions instanceof Array) {
            m_positions = positions;
            this.modified();
            return true;
        }
        console.log("[ERROR] Invalid data type for positions. Array is required.");
        return false;
    };
    this.setColors = function(colors) {
        if (colors instanceof Array) {
            m_colors = colors;
            this.modified();
            return true;
        }
        console.log("[ERROR] Invalid data type for colors. Array is required.");
        return false;
    };
    this.create = function() {
        if (!m_positions) {
            console.log("[error] Invalid positions");
            return;
        }
        if (m_positions.length % 3 !== 0) {
            console.log("[error] Line source requires 3d points");
            return;
        }
        if (m_positions.length % 3 !== 0) {
            console.log("[ERROR] Invalid length of the points array");
            return;
        }
        var m_geom = new vgl.geometryData(), numPts = m_positions.length / 3, i, indices = [], linesPrimitive, sourcePositions, sourceColors;
        indices.length = numPts;
        for (i = 0; i < numPts; ++i) {
            indices[i] = i;
        }
        linesPrimitive = new vgl.lines();
        linesPrimitive.setIndices(indices);
        sourcePositions = vgl.sourceDataP3fv();
        sourcePositions.pushBack(m_positions);
        m_geom.addSource(sourcePositions);
        if (m_colors && m_colors.length > 0 && m_colors.length === m_positions.length) {
            sourceColors = vgl.sourceDataC3fv();
            sourceColors.pushBack(m_colors);
            m_geom.addSource(sourceColors);
        } else if (m_colors && m_colors.length > 0 && m_colors.length !== m_positions.length) {
            console.log("[error] Number of colors are different than number of points");
        }
        m_geom.addPrimitive(linesPrimitive);
        return m_geom;
    };
};

inherit(vgl.lineSource, vgl.source);

vgl.utils = function() {
    "use strict";
    if (!(this instanceof vgl.utils)) {
        return new vgl.utils();
    }
    vgl.object.call(this);
    return this;
};

inherit(vgl.utils, vgl.object);

vgl.utils.computePowerOfTwo = function(value, pow) {
    "use strict";
    pow = pow || 1;
    while (pow < value) {
        pow *= 2;
    }
    return pow;
};

vgl.utils.createTextureVertexShader = function(context) {
    "use strict";
    var vertexShaderSource = [ "attribute vec3 vertexPosition;", "attribute vec3 textureCoord;", "uniform mediump float pointSize;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "varying highp vec3 iTextureCoord;", "void main(void)", "{", "gl_PointSize = pointSize;", "gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);", " iTextureCoord = textureCoord;", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createTextureFragmentShader = function(context) {
    "use strict";
    var fragmentShaderSource = [ "varying highp vec3 iTextureCoord;", "uniform sampler2D sampler2d;", "uniform mediump float opacity;", "void main(void) {", "gl_FragColor = vec4(texture2D(sampler2d, vec2(iTextureCoord.s, iTextureCoord.t)).xyz, opacity);", "}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createRgbaTextureFragmentShader = function(context) {
    "use strict";
    var fragmentShaderSource = [ "varying highp vec3 iTextureCoord;", "uniform sampler2D sampler2d;", "void main(void) {", "gl_FragColor = vec4(texture2D(sampler2d, vec2(iTextureCoord.s, iTextureCoord.t)).xyzw);", "}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createVertexShader = function(context) {
    "use strict";
    var vertexShaderSource = [ "attribute vec3 vertexPosition;", "attribute vec3 vertexColor;", "uniform mediump float pointSize;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "varying mediump vec3 iVertexColor;", "varying highp vec3 iTextureCoord;", "void main(void)", "{", "gl_PointSize = pointSize;", "gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);", " iVertexColor = vertexColor;", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createPointVertexShader = function(context) {
    "use strict";
    var vertexShaderSource = [ "attribute vec3 vertexPosition;", "attribute vec3 vertexColor;", "attribute float vertexSize;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "varying mediump vec3 iVertexColor;", "varying highp vec3 iTextureCoord;", "void main(void)", "{", "gl_PointSize =  vertexSize;", "gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);", " iVertexColor = vertexColor;", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createVertexShaderSolidColor = function(context) {
    "use strict";
    var vertexShaderSource = [ "attribute vec3 vertexPosition;", "uniform mediump float pointSize;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "void main(void)", "{", "gl_PointSize = pointSize;", "gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createVertexShaderColorMap = function(context, min, max) {
    "use strict";
    var vertexShaderSource = [ "attribute vec3 vertexPosition;", "attribute float vertexScalar;", "uniform mediump float pointSize;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform float lutMin;", "uniform float lutMax;", "varying mediump float iVertexScalar;", "void main(void)", "{", "gl_PointSize = pointSize;", "gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition, 1.0);", "iVertexScalar = (vertexScalar-lutMin)/(lutMax-lutMin);", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createFragmentShader = function(context) {
    "use strict";
    var fragmentShaderSource = [ "varying mediump vec3 iVertexColor;", "uniform mediump float opacity;", "void main(void) {", "gl_FragColor = vec4(iVertexColor, opacity);", "}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createPhongVertexShader = function(context) {
    "use strict";
    var vertexShaderSource = [ "attribute highp vec3 vertexPosition;", "attribute mediump vec3 vertexNormal;", "attribute mediump vec3 vertexColor;", "uniform highp mat4 projectionMatrix;", "uniform mat4 modelViewMatrix;", "uniform mat4 normalMatrix;", "varying highp vec4 varPosition;", "varying mediump vec3 varNormal;", "varying mediump vec3 iVertexColor;", "void main(void)", "{", "varPosition = modelViewMatrix * vec4(vertexPosition, 1.0);", "gl_Position = projectionMatrix * varPosition;", "varNormal = vec3(normalMatrix * vec4(vertexNormal, 0.0));", "iVertexColor = vertexColor;", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createPhongFragmentShader = function(context) {
    "use strict";
    var fragmentShaderSource = [ "precision mediump float;", "varying vec3 varNormal;", "varying vec4 varPosition;", "varying mediump vec3 iVertexColor;", "const vec3 lightPos = vec3(0.0, 0.0,10000.0);", "const vec3 ambientColor = vec3(0.01, 0.01, 0.01);", "const vec3 specColor = vec3(1.0, 1.0, 1.0);", "void main() {", "vec3 normal = normalize(varNormal);", "vec3 lightDir = normalize(lightPos);", "vec3 reflectDir = -reflect(lightDir, normal);", "vec3 viewDir = normalize(-varPosition.xyz);", "float lambertian = max(dot(lightDir,normal), 0.0);", "float specular = 0.0;", "if(lambertian > 0.0) {", "float specAngle = max(dot(reflectDir, viewDir), 0.0);", "specular = pow(specAngle, 64.0);", "}", "gl_FragColor = vec4(ambientColor +", "lambertian*iVertexColor +", "specular*specColor, 1.0);", "}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createFragmentShaderSolidColor = function(context, color) {
    "use strict";
    var fragmentShaderSource = [ "uniform mediump float opacity;", "void main(void) {", "gl_FragColor = vec4(" + color[0] + "," + color[1] + "," + color[2] + ", opacity);", "}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createFragmentShaderColorMap = function(context) {
    "use strict";
    var fragmentShaderSource = [ "varying mediump float iVertexScalar;", "uniform sampler2D sampler2d;", "uniform mediump float opacity;", "void main(void) {", "gl_FragColor = vec4(texture2D(sampler2d, vec2(iVertexScalar, 0.0)).xyz, opacity);", "}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createPointSpritesVertexShader = function(context) {
    "use strict";
    var vertexShaderSource = [ "attribute vec3 vertexPosition;", "attribute vec3 vertexColor;", "uniform mediump vec2 pointSize;", "uniform mat4 modelViewMatrix;", "uniform mat4 projectionMatrix;", "uniform float height;", "varying mediump vec3 iVertexColor;", "varying highp float iVertexScalar;", "void main(void)", "{", "mediump float realPointSize = pointSize.y;", "if (pointSize.x > pointSize.y) {", "  realPointSize = pointSize.x;}", "gl_PointSize = realPointSize ;", "iVertexScalar = vertexPosition.z;", "gl_Position = projectionMatrix * modelViewMatrix * vec4(vertexPosition.xy, height, 1.0);", " iVertexColor = vertexColor;", "}" ].join("\n"), shader = new vgl.shader(gl.VERTEX_SHADER);
    shader.setShaderSource(vertexShaderSource);
    return shader;
};

vgl.utils.createPointSpritesFragmentShader = function(context) {
    "use strict";
    var fragmentShaderSource = [ "varying mediump vec3 iVertexColor;", "varying highp float iVertexScalar;", "uniform sampler2D opacityLookup;", "uniform highp float lutMin;", "uniform highp float lutMax;", "uniform sampler2D scalarsToColors;", "uniform int useScalarsToColors;", "uniform int useVertexColors;", "uniform mediump vec2 pointSize;", "uniform mediump float vertexColorWeight;", "void main(void) {", "mediump vec2 realTexCoord;", "if (pointSize.x > pointSize.y) {", "  realTexCoord = vec2(1.0, pointSize.y/pointSize.x) * gl_PointCoord;", "} else {", "  realTexCoord = vec2(pointSize.x/pointSize.y, 1.0) * gl_PointCoord;", "}", "highp float texOpacity = texture2D(opacityLookup, realTexCoord).w;", "if (useScalarsToColors == 1) {", "  gl_FragColor = vec4(texture2D(scalarsToColors, vec2((iVertexScalar - lutMin)/(lutMax - lutMin), 0.0)).xyz, texOpacity);", "} else if (useVertexColors == 1) {", "  gl_FragColor = vec4(iVertexColor, texOpacity);", "} else {", "  gl_FragColor = vec4(texture2D(opacityLookup, realTexCoord).xyz, texOpacity);", "}}" ].join("\n"), shader = new vgl.shader(gl.FRAGMENT_SHADER);
    shader.setShaderSource(fragmentShaderSource);
    return shader;
};

vgl.utils.createTextureMaterial = function(isRgba) {
    "use strict";
    var mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), vertexShader = vgl.utils.createTextureVertexShader(gl), fragmentShader = null, posVertAttr = new vgl.vertexAttribute("vertexPosition"), texCoordVertAttr = new vgl.vertexAttribute("textureCoord"), pointsizeUniform = new vgl.floatUniform("pointSize", 5), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix"), samplerUniform = new vgl.uniform(gl.INT, "sampler2d"), opacityUniform = null;
    samplerUniform.set(0);
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(texCoordVertAttr, vgl.vertexAttributeKeys.TextureCoordinate);
    prog.addUniform(pointsizeUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    if (isRgba) {
        fragmentShader = vgl.utils.createRgbaTextureFragmentShader(gl);
    } else {
        fragmentShader = vgl.utils.createTextureFragmentShader(gl);
        opacityUniform = new vgl.floatUniform("opacity", 1);
        prog.addUniform(opacityUniform);
    }
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    return mat;
};

vgl.utils.createGeometryMaterial = function() {
    "use strict";
    var mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), pointSize = 5, opacity = .5, vertexShader = vgl.utils.createVertexShader(gl), fragmentShader = vgl.utils.createFragmentShader(gl), posVertAttr = new vgl.vertexAttribute("vertexPosition"), colorVertAttr = new vgl.vertexAttribute("vertexColor"), pointsizeUniform = new vgl.floatUniform("pointSize", pointSize), opacityUniform = new vgl.floatUniform("opacity", opacity), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix");
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
    prog.addUniform(pointsizeUniform);
    prog.addUniform(opacityUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    return mat;
};

vgl.utils.createPointGeometryMaterial = function(opacity) {
    "use strict";
    var mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), opacity = opacity === undefined ? 1 : opacity, vertexShader = vgl.utils.createPointVertexShader(gl), fragmentShader = vgl.utils.createFragmentShader(gl), posVertAttr = new vgl.vertexAttribute("vertexPosition"), colorVertAttr = new vgl.vertexAttribute("vertexColor"), sizeVertAttr = new vgl.vertexAttribute("vertexSize"), opacityUniform = new vgl.floatUniform("opacity", opacity), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix");
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
    prog.addVertexAttribute(sizeVertAttr, vgl.vertexAttributeKeys.Scalar);
    prog.addUniform(opacityUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    return mat;
};

vgl.utils.createPhongMaterial = function() {
    "use strict";
    var mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), vertexShader = vgl.utils.createPhongVertexShader(gl), fragmentShader = vgl.utils.createPhongFragmentShader(gl), posVertAttr = new vgl.vertexAttribute("vertexPosition"), normalVertAttr = new vgl.vertexAttribute("vertexNormal"), colorVertAttr = new vgl.vertexAttribute("vertexColor"), opacityUniform = new vgl.floatUniform("opacity", 1), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), normalUniform = new vgl.normalMatrixUniform("normalMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix");
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(normalVertAttr, vgl.vertexAttributeKeys.Normal);
    prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
    prog.addUniform(opacityUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addUniform(normalUniform);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    return mat;
};

vgl.utils.createColorMaterial = function() {
    "use strict";
    var mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), vertexShader = vgl.utils.createVertexShader(gl), fragmentShader = vgl.utils.createFragmentShader(gl), posVertAttr = new vgl.vertexAttribute("vertexPosition"), texCoordVertAttr = new vgl.vertexAttribute("textureCoord"), colorVertAttr = new vgl.vertexAttribute("vertexColor"), pointsizeUniform = new vgl.floatUniform("pointSize", 5), opacityUniform = new vgl.floatUniform("opacity", .5), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix");
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
    prog.addVertexAttribute(texCoordVertAttr, vgl.vertexAttributeKeys.TextureCoordinate);
    prog.addUniform(pointsizeUniform);
    prog.addUniform(opacityUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    return mat;
};

vgl.utils.createColorMappedMaterial = function(lut) {
    "use strict";
    if (!lut) {
        lut = new vgl.lookupTable();
    }
    var scalarRange = lut.range(), mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), vertexShader = vgl.utils.createVertexShaderColorMap(gl, scalarRange[0], scalarRange[1]), fragmentShader = vgl.utils.createFragmentShaderColorMap(gl), posVertAttr = new vgl.vertexAttribute("vertexPosition"), scalarVertAttr = new vgl.vertexAttribute("vertexScalar"), pointsizeUniform = new vgl.floatUniform("pointSize", 5), opacityUniform = new vgl.floatUniform("opacity", .5), lutMinUniform = new vgl.floatUniform("lutMin", scalarRange[0]), lutMaxUniform = new vgl.floatUniform("lutMax", scalarRange[1]), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix"), samplerUniform = new vgl.uniform(gl.FLOAT, "sampler2d"), lookupTable = lut;
    samplerUniform.set(0);
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(scalarVertAttr, vgl.vertexAttributeKeys.Scalar);
    prog.addUniform(pointsizeUniform);
    prog.addUniform(opacityUniform);
    prog.addUniform(lutMinUniform);
    prog.addUniform(lutMaxUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    mat.addAttribute(lookupTable);
    return mat;
};

vgl.utils.updateColorMappedMaterial = function(mat, lut) {
    "use strict";
    if (!mat) {
        console.log("[warning] Invalid material. Nothing to update.");
        return;
    }
    if (!lut) {
        console.log("[warning] Invalid lookup table. Nothing to update.");
        return;
    }
    var lutMin = mat.shaderProgram().uniform("lutMin"), lutMax = mat.shaderProgram().uniform("lutMax");
    lutMin.set(lut.range()[0]);
    lutMax.set(lut.range()[1]);
    mat.setAttribute(lut);
};

vgl.utils.createSolidColorMaterial = function(color) {
    "use strict";
    if (!color) {
        color = [ 1, 1, 1 ];
    }
    var mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), vertexShader = vgl.utils.createVertexShaderSolidColor(gl), fragmentShader = vgl.utils.createFragmentShaderSolidColor(gl, color), posVertAttr = new vgl.vertexAttribute("vertexPosition"), pointsizeUniform = new vgl.floatUniform("pointSize", 5), opacityUniform = new vgl.floatUniform("opacity", 1), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix");
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addUniform(pointsizeUniform);
    prog.addUniform(opacityUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    return mat;
};

vgl.utils.createPointSpritesMaterial = function(image, lut) {
    "use strict";
    var scalarRange = lut === undefined ? [ 0, 1 ] : lut.range(), mat = new vgl.material(), blend = new vgl.blend(), prog = new vgl.shaderProgram(), vertexShader = vgl.utils.createPointSpritesVertexShader(gl), fragmentShader = vgl.utils.createPointSpritesFragmentShader(gl), posVertAttr = new vgl.vertexAttribute("vertexPosition"), colorVertAttr = new vgl.vertexAttribute("vertexColor"), heightUniform = new vgl.floatUniform("height", 0), vertexColorWeightUniform = new vgl.floatUniform("vertexColorWeight", 0), lutMinUniform = new vgl.floatUniform("lutMin", scalarRange[0]), lutMaxUniform = new vgl.floatUniform("lutMax", scalarRange[1]), modelViewUniform = new vgl.modelViewUniform("modelViewMatrix"), projectionUniform = new vgl.projectionUniform("projectionMatrix"), samplerUniform = new vgl.uniform(gl.INT, "opacityLookup"), scalarsToColors = new vgl.uniform(gl.INT, "scalarsToColors"), useScalarsToColors = new vgl.uniform(gl.INT, "useScalarsToColors"), useVertexColors = new vgl.uniform(gl.INT, "useVertexColors"), pointSize = new vgl.uniform(gl.FLOAT_VEC2, "pointSize"), texture = new vgl.texture();
    samplerUniform.set(0);
    scalarsToColors.set(1);
    useScalarsToColors.set(0);
    useVertexColors.set(0);
    pointSize.set([ 1, 1 ]);
    prog.addVertexAttribute(posVertAttr, vgl.vertexAttributeKeys.Position);
    prog.addVertexAttribute(colorVertAttr, vgl.vertexAttributeKeys.Color);
    prog.addUniform(heightUniform);
    prog.addUniform(vertexColorWeightUniform);
    prog.addUniform(modelViewUniform);
    prog.addUniform(projectionUniform);
    prog.addUniform(samplerUniform);
    prog.addUniform(useVertexColors);
    prog.addUniform(useScalarsToColors);
    prog.addUniform(pointSize);
    prog.addShader(fragmentShader);
    prog.addShader(vertexShader);
    mat.addAttribute(prog);
    mat.addAttribute(blend);
    if (lut) {
        prog.addUniform(scalarsToColors);
        useScalarsToColors.set(1);
        prog.addUniform(lutMinUniform);
        prog.addUniform(lutMaxUniform);
        lut.setTextureUnit(1);
        mat.addAttribute(lut);
    }
    texture.setImage(image);
    texture.setTextureUnit(0);
    mat.addAttribute(texture);
    return mat;
};

vgl.utils.createPlane = function(originX, originY, originZ, point1X, point1Y, point1Z, point2X, point2Y, point2Z) {
    "use strict";
    var mapper = new vgl.mapper(), planeSource = new vgl.planeSource(), mat = vgl.utils.createGeometryMaterial(), actor = new vgl.actor();
    planeSource.setOrigin(originX, originY, originZ);
    planeSource.setPoint1(point1X, point1Y, point1Z);
    planeSource.setPoint2(point2X, point2Y, point2Z);
    mapper.setGeometryData(planeSource.create());
    actor.setMapper(mapper);
    actor.setMaterial(mat);
    return actor;
};

vgl.utils.createTexturePlane = function(originX, originY, originZ, point1X, point1Y, point1Z, point2X, point2Y, point2Z, isRgba) {
    "use strict";
    var mapper = new vgl.mapper(), planeSource = new vgl.planeSource(), mat = vgl.utils.createTextureMaterial(isRgba), actor = new vgl.actor();
    planeSource.setOrigin(originX, originY, originZ);
    planeSource.setPoint1(point1X, point1Y, point1Z);
    planeSource.setPoint2(point2X, point2Y, point2Z);
    mapper.setGeometryData(planeSource.create());
    actor.setMapper(mapper);
    actor.setMaterial(mat);
    return actor;
};

vgl.utils.createPoints = function(positions, size, colors, texcoords, opacity) {
    "use strict";
    if (!positions) {
        console.log("[ERROR] Cannot create points without positions");
        return null;
    }
    var opacity = opacity === undefined ? 1 : opacity, mapper = new vgl.mapper(), pointSource = new vgl.pointSource(), mat = vgl.utils.createPointGeometryMaterial(opacity), actor = new vgl.actor();
    pointSource.setPositions(positions);
    if (colors) {
        pointSource.setColors(colors);
    }
    if (texcoords) {
        pointSource.setTextureCoordinates(texcoords);
    }
    if (size) {
        pointSource.setSize(size);
    } else {
        pointSource.setSize(1);
    }
    mapper.setGeometryData(pointSource.create());
    actor.setMapper(mapper);
    actor.setMaterial(mat);
    return actor;
};

vgl.utils.createPointSprites = function(image, positions, colors, texcoords) {
    "use strict";
    if (!image) {
        console.log("[ERROR] Point sprites requires an image");
        return null;
    }
    if (!positions) {
        console.log("[ERROR] Cannot create points without positions");
        return null;
    }
    var mapper = new vgl.mapper(), pointSource = new vgl.pointSource(), mat = vgl.utils.createPointSpritesMaterial(image), actor = new vgl.actor();
    pointSource.setPositions(positions);
    if (colors) {
        pointSource.setColors(colors);
    }
    if (texcoords) {
        pointSource.setTextureCoordinates(texcoords);
    }
    mapper.setGeometryData(pointSource.create());
    actor.setMapper(mapper);
    actor.setMaterial(mat);
    return actor;
};

vgl.utils.createLines = function(positions, colors) {
    "use strict";
    if (!positions) {
        console.log("[ERROR] Cannot create points without positions");
        return null;
    }
    var mapper = new vgl.mapper(), lineSource = new vgl.lineSource(), mat = vgl.utils.createGeometryMaterial(), actor = new vgl.actor();
    lineSource.setPositions(positions);
    if (colors) {
        lineSource.setColors(colors);
    }
    mapper.setGeometryData(lineSource.create());
    actor.setMapper(mapper);
    actor.setMaterial(mat);
    return actor;
};

vgl.utils.createColorLegend = function(varname, lookupTable, origin, width, height, countMajor, countMinor) {
    "use strict";
    if (!lookupTable) {
        console.log("[error] Invalid lookup table");
        return [];
    }
    function createLabels(varname, positions, range) {
        if (!positions) {
            console.log("[error] Create labels requires positions (x,y,z) array");
            return;
        }
        if (positions.length % 3 !== 0) {
            console.log("[error] Create labels require positions array contain 3d points");
            return;
        }
        if (!range) {
            console.log("[error] Create labels requires Valid range");
            return;
        }
        var actor = null, size = vgl.utils.computePowerOfTwo(48), index = 0, actors = [], origin = [], pt1 = [], pt2 = [], delta = positions[6] - positions[0], axisLabelOffset = 4, i;
        origin.length = 3;
        pt1.length = 3;
        pt2.length = 3;
        for (i = 0; i < 2; ++i) {
            index = i * (positions.length - 3);
            origin[0] = positions[index] - delta;
            origin[1] = positions[index + 1] - 2 * delta;
            origin[2] = positions[index + 2];
            pt1[0] = positions[index] + delta;
            pt1[1] = origin[1];
            pt1[2] = origin[2];
            pt2[0] = origin[0];
            pt2[1] = positions[1];
            pt2[2] = origin[2];
            actor = vgl.utils.createTexturePlane(origin[0], origin[1], origin[2], pt1[0], pt1[1], pt1[2], pt2[0], pt2[1], pt2[2], true);
            actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
            actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
            actor.material().addAttribute(vgl.utils.create2DTexture(range[i].toFixed(2).toString(), 12, null));
            actors.push(actor);
        }
        origin[0] = (positions[0] + positions[positions.length - 3] - size) * .5;
        origin[1] = positions[1] + axisLabelOffset;
        origin[2] = positions[2];
        pt1[0] = origin[0] + size;
        pt1[1] = origin[1];
        pt1[2] = origin[2];
        pt2[0] = origin[0];
        pt2[1] = origin[1] + size;
        pt2[2] = origin[2];
        actor = vgl.utils.createTexturePlane(origin[0], origin[1], origin[2], pt1[0], pt1[1], pt1[2], pt2[0], pt2[1], pt2[2], true);
        actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
        actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
        actor.material().addAttribute(vgl.utils.create2DTexture(varname, 24, null));
        actors.push(actor);
        return actors;
    }
    function createTicksAndLabels(varname, lut, originX, originY, originZ, pt1X, pt1Y, pt1Z, pt2X, pt2Y, pt2Z, countMajor, countMinor, heightMajor, heightMinor) {
        var width = pt2X - pt1X, index = null, delta = width / countMajor, positions = [], actor = null, actors = [];
        for (index = 0; index <= countMajor; ++index) {
            positions.push(pt1X + delta * index);
            positions.push(pt1Y);
            positions.push(pt1Z);
            positions.push(pt1X + delta * index);
            positions.push(pt1Y + heightMajor);
            positions.push(pt1Z);
        }
        actor = vgl.utils.createLines(positions, null);
        actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
        actor.material().setBinNumber(vgl.material.RenderBin.Overlay);
        actors.push(actor);
        actors = actors.concat(createLabels(varname, positions, lut.range()));
        return actors;
    }
    var pt1X = origin[0] + width, pt1Y = origin[1], pt1Z = 0, pt2X = origin[0], pt2Y = origin[1] + height, pt2Z = 0, actors = [], actor = null, mapper = null, mat = null, group = vgl.groupNode();
    actor = vgl.utils.createTexturePlane(origin[0], origin[1], origin[2], pt1X, pt1Y, pt1Z, pt2X, pt2Y, pt2Z);
    mat = actor.material();
    mat.addAttribute(lookupTable);
    actor.setMaterial(mat);
    group.addChild(actor);
    actor.setReferenceFrame(vgl.boundingObject.ReferenceFrame.Absolute);
    actors.push(actor);
    actors = actors.concat(createTicksAndLabels(varname, lookupTable, origin[0], origin[1], origin[1], pt2X, pt1Y, pt1Z, pt1X, pt1Y, pt1Z, countMajor, countMinor, 5, 3));
    return actors;
};

vgl.utils.create2DTexture = function(textToWrite, textSize, color, font, alignment, baseline, bold) {
    "use strict";
    var canvas = document.getElementById("textRendering"), ctx = null, texture = vgl.texture();
    font = font || "sans-serif";
    alignment = alignment || "center";
    baseline = baseline || "bottom";
    if (typeof bold === "undefined") {
        bold = true;
    }
    if (!canvas) {
        canvas = document.createElement("canvas");
    }
    ctx = canvas.getContext("2d");
    canvas.setAttribute("id", "textRendering");
    canvas.style.display = "none";
    canvas.height = vgl.utils.computePowerOfTwo(8 * textSize);
    canvas.width = canvas.height;
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.fillStyle = "rgba(200, 85, 10, 1.0)";
    ctx.textAlign = alignment;
    ctx.textBaseline = baseline;
    ctx.font = 4 * textSize + "px " + font;
    if (bold) {
        ctx.font = "bold " + ctx.font;
    }
    ctx.fillText(textToWrite, canvas.width / 2, canvas.height / 2, canvas.width);
    texture.setImage(canvas);
    texture.updateDimensions();
    return texture;
};

vgl.picker = function() {
    "use strict";
    if (!(this instanceof vgl.picker)) {
        return new vgl.picker();
    }
    vgl.object.call(this);
    var m_that = this, m_tolerance = .025, m_actors = [];
    this.getActors = function() {
        return m_actors;
    };
    this.pick = function(selectionX, selectionY, renderer) {
        if (typeof selectionX === "undefined") {
            return 0;
        }
        if (typeof selectionY === "undefined") {
            return 0;
        }
        if (typeof renderer === "undefined") {
            return 0;
        }
        m_actors = [];
        var camera = renderer.camera(), width = renderer.width(), height = renderer.height(), fpoint = camera.focalPoint(), focusWorldPt = vec4.fromValues(fpoint[0], fpoint[1], fpoint[2], 1), focusDisplayPt = renderer.worldToDisplay(focusWorldPt, camera.viewMatrix(), camera.projectionMatrix(), width, height), displayPt = vec4.fromValues(selectionX, selectionY, focusDisplayPt[2], 1), worldPt = renderer.displayToWorld(displayPt, camera.viewMatrix(), camera.projectionMatrix(), width, height), cameraPos = camera.position(), ray = [], actors, count, i, bb, tmin, tmax, tymin, tymax, tzmin, tzmax, actor;
        for (i = 0; i < 3; ++i) {
            ray[i] = worldPt[i] - cameraPos[i];
        }
        actors = renderer.sceneRoot().children();
        count = 0;
        for (i = 0; i < actors.length; ++i) {
            actor = actors[i];
            if (actor.visible() === true) {
                bb = actor.bounds();
                if (ray[0] >= 0) {
                    tmin = (bb[0] - cameraPos[0]) / ray[0];
                    tmax = (bb[1] - cameraPos[0]) / ray[0];
                } else {
                    tmin = (bb[1] - cameraPos[0]) / ray[0];
                    tmax = (bb[0] - cameraPos[0]) / ray[0];
                }
                if (ray[1] >= 0) {
                    tymin = (bb[2] - cameraPos[1]) / ray[1];
                    tymax = (bb[3] - cameraPos[1]) / ray[1];
                } else {
                    tymin = (bb[3] - cameraPos[1]) / ray[1];
                    tymax = (bb[2] - cameraPos[1]) / ray[1];
                }
                if (tmin > tymax || tymin > tmax) {
                    continue;
                }
                if (tymin > tmin) {
                    tmin = tymin;
                }
                if (tymax < tmax) {
                    tmax = tymax;
                }
                if (ray[2] >= 0) {
                    tzmin = (bb[4] - cameraPos[2]) / ray[2];
                    tzmax = (bb[5] - cameraPos[2]) / ray[2];
                } else {
                    tzmin = (bb[5] - cameraPos[2]) / ray[2];
                    tzmax = (bb[4] - cameraPos[2]) / ray[2];
                }
                if (tmin > tzmax || tzmin > tmax) {
                    continue;
                }
                if (tzmin > tmin) {
                    tmin = tzmin;
                }
                if (tzmax < tmax) {
                    tmax = tzmax;
                }
                m_actors[count++] = actor;
            }
        }
        return count;
    };
    return this;
};

inherit(vgl.picker, vgl.object);

vgl.shapefileReader = function() {
    "use strict";
    if (!(this instanceof vgl.shapefileReader)) {
        return new vgl.shapefileReader();
    }
    var m_that = this;
    var SHP_HEADER_LEN = 8;
    var SHP_NULL = 0;
    var SHP_POINT = 1;
    var SHP_POLYGON = 5;
    var SHP_POLYLINE = 3;
    this.int8 = function(data, offset) {
        return data.charCodeAt(offset);
    };
    this.bint32 = function(data, offset) {
        return ((data.charCodeAt(offset) & 255) << 24) + ((data.charCodeAt(offset + 1) & 255) << 16) + ((data.charCodeAt(offset + 2) & 255) << 8) + (data.charCodeAt(offset + 3) & 255);
    };
    this.lint32 = function(data, offset) {
        return ((data.charCodeAt(offset + 3) & 255) << 24) + ((data.charCodeAt(offset + 2) & 255) << 16) + ((data.charCodeAt(offset + 1) & 255) << 8) + (data.charCodeAt(offset) & 255);
    };
    this.bint16 = function(data, offset) {
        return ((data.charCodeAt(offset) & 255) << 8) + (data.charCodeAt(offset + 1) & 255);
    };
    this.lint16 = function(data, offset) {
        return ((data.charCodeAt(offset + 1) & 255) << 8) + (data.charCodeAt(offset) & 255);
    };
    this.ldbl64 = function(data, offset) {
        var b0 = data.charCodeAt(offset) & 255;
        var b1 = data.charCodeAt(offset + 1) & 255;
        var b2 = data.charCodeAt(offset + 2) & 255;
        var b3 = data.charCodeAt(offset + 3) & 255;
        var b4 = data.charCodeAt(offset + 4) & 255;
        var b5 = data.charCodeAt(offset + 5) & 255;
        var b6 = data.charCodeAt(offset + 6) & 255;
        var b7 = data.charCodeAt(offset + 7) & 255;
        var sign = 1 - 2 * (b7 >> 7);
        var exp = ((b7 & 127) << 4) + ((b6 & 240) >> 4) - 1023;
        var frac = (b6 & 15) * Math.pow(2, 48) + b5 * Math.pow(2, 40) + b4 * Math.pow(2, 32) + b3 * Math.pow(2, 24) + b2 * Math.pow(2, 16) + b1 * Math.pow(2, 8) + b0;
        return sign * (1 + frac * Math.pow(2, -52)) * Math.pow(2, exp);
    };
    this.lfloat32 = function(data, offset) {
        var b0 = data.charCodeAt(offset) & 255;
        var b1 = data.charCodeAt(offset + 1) & 255;
        var b2 = data.charCodeAt(offset + 2) & 255;
        var b3 = data.charCodeAt(offset + 3) & 255;
        var sign = 1 - 2 * (b3 >> 7);
        var exp = ((b3 & 127) << 1) + ((b2 & 254) >> 7) - 127;
        var frac = (b2 & 127) * Math.pow(2, 16) + b1 * Math.pow(2, 8) + b0;
        return sign * (1 + frac * Math.pow(2, -23)) * Math.pow(2, exp);
    };
    this.str = function(data, offset, length) {
        var chars = [];
        var index = offset;
        while (index < offset + length) {
            var c = data[index];
            if (c.charCodeAt(0) !== 0) chars.push(c); else {
                break;
            }
            index++;
        }
        return chars.join("");
    };
    this.readHeader = function(data) {
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
            bounds: new Box(vect(xmin, ymin), vect(xmax, ymax))
        };
    };
    this.loadShx = function(data) {
        var indices = [];
        var appendIndex = function(offset) {
            indices.push(2 * m_that.bint32(data, offset));
            return offset + 8;
        };
        var offset = 100;
        while (offset < data.length) {
            offset = appendIndex(offset);
        }
        return indices;
    };
    this.Shapefile = function(options) {
        var path = options.path;
        $.ajax({
            url: path + ".shx",
            mimeType: "text/plain; charset=x-user-defined",
            success: function(data) {
                var indices = this.loadShx(data);
                $.ajax({
                    url: path + ".shp",
                    mimeType: "text/plain; charset=x-user-defined",
                    success: function(data) {
                        $.ajax({
                            url: path + ".dbf",
                            mimeType: "text/plain; charset=x-user-defined",
                            success: function(dbf_data) {
                                var layer = this.loadShp(data, dbf_data, indices, options);
                                options.success(layer);
                            }
                        });
                    }
                });
            }
        });
    };
    this.localShapefile = function(options) {
        var shxFile = options.shx;
        var shpFile = options.shp;
        var dbfFile = options.dbf;
        var shxReader = new FileReader();
        shxReader.onloadend = function() {
            var indices = m_that.loadShx(shxReader.result);
            var shpReader = new FileReader();
            shpReader.onloadend = function() {
                var shpData = shpReader.result;
                var dbfReader = new FileReader();
                dbfReader.onloadend = function() {
                    var dbfData = dbfReader.result;
                    var layer = m_that.loadShp(shpData, dbfData, indices, options);
                    options.success(layer);
                };
                dbfReader.readAsBinaryString(dbfFile);
            };
            shpReader.readAsBinaryString(shpFile);
        };
        shxReader.readAsBinaryString(shxFile);
    };
    this.loadDBF = function(data) {
        var readHeader = function(offset) {
            var name = m_that.str(data, offset, 10);
            var type = m_that.str(data, offset + 11, 1);
            var length = m_that.int8(data, offset + 16);
            return {
                name: name,
                type: type,
                length: length
            };
        };
        var level = m_that.int8(data, 0);
        if (level == 4) {
            throw "Level 7 dBASE not supported";
        }
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
            headers.push(readHeader(header_offset));
            header_offset += HEADER_LENGTH;
        }
        var records = [];
        var record_offset = header_size;
        while (record_offset < header_size + num_entries * record_size) {
            var declare = m_that.str(data, record_offset, 1);
            if (declare == "*") {
                record_offset += record_size;
            } else {
                record_offset++;
                var record = {};
                for (var i = 0; i < headers.length; i++) {
                    var header = headers[i];
                    var value;
                    if (header.type == "C") {
                        value = m_that.str(data, record_offset, header.length).trim();
                    } else if (header.type == "N") {
                        value = parseFloat(m_that.str(data, record_offset, header.length));
                    }
                    record_offset += header.length;
                    record[header.name] = value;
                }
                records.push(record);
            }
        }
        return records;
    };
    this.loadShp = function(data, dbf_data, indices, options) {
        var features = [];
        var readRing = function(offset, start, end) {
            var ring = [];
            for (var i = end - 1; i >= start; i--) {
                var x = m_that.ldbl64(data, offset + 16 * i);
                var y = m_that.ldbl64(data, offset + 16 * i + 8);
                ring.push([ x, y ]);
            }
            return ring;
        };
        var readRecord = function(offset) {
            var index = m_that.bint32(data, offset);
            var record_length = m_that.bint32(data, offset + 4);
            var record_offset = offset + 8;
            var geom_type = m_that.lint32(data, record_offset);
            if (geom_type == SHP_NULL) {
                console.log("NULL Shape");
            } else if (geom_type == SHP_POINT) {
                var x = m_that.ldbl64(data, record_offset + 4);
                var y = m_that.ldbl64(data, record_offset + 12);
                features.push({
                    type: "Point",
                    attr: {},
                    geom: [ [ x, y ] ]
                });
            } else if (geom_type == SHP_POLYGON) {
                var num_parts = m_that.lint32(data, record_offset + 36);
                var num_points = m_that.lint32(data, record_offset + 40);
                var parts_start = offset + 52;
                var points_start = offset + 52 + 4 * num_parts;
                var rings = [];
                for (var i = 0; i < num_parts; i++) {
                    var start = m_that.lint32(data, parts_start + i * 4);
                    var end;
                    if (i + 1 < num_parts) {
                        end = m_that.lint32(data, parts_start + (i + 1) * 4);
                    } else {
                        end = num_points;
                    }
                    var ring = readRing(points_start, start, end);
                    rings.push(ring);
                }
                features.push({
                    type: "Polygon",
                    attr: {},
                    geom: [ rings ]
                });
            } else if (geom_type == SHP_POLYLINE) {
                var num_parts = m_that.lint32(data, record_offset + 36);
                var num_points = m_that.lint32(data, record_offset + 40);
                var parts_start = offset + 52;
                var points_start = offset + 52 + 4 * num_parts;
                var rings = [];
                for (var i = 0; i < num_parts; i++) {
                    var start = m_that.lint32(data, parts_start + i * 4);
                    var end;
                    if (i + 1 < num_parts) {
                        end = m_that.lint32(data, parts_start + (i + 1) * 4);
                    } else {
                        end = num_points;
                    }
                    var ring = readRing(points_start, start, end);
                    rings.push(ring);
                }
                features.push({
                    type: "Polyline",
                    attr: {},
                    geom: [ rings ]
                });
            } else {
                throw "Not Implemented: " + geom_type;
            }
        };
        var attr = this.loadDBF(dbf_data);
        for (var i = 0; i < indices.length; i++) {
            var offset = indices[i];
            readRecord(offset);
        }
        var layer = [];
        for (var i = 0; i < features.length; i++) {
            var feature = features[i];
            feature.attr = attr[i];
            layer.push(feature);
        }
        return layer;
    };
    return this;
};

vgl.vtkReader = function() {
    "use strict";
    if (!(this instanceof vgl.vtkReader)) {
        return new vgl.vtkReader();
    }
    var m_base64Chars = [ "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "/" ], m_reverseBase64Chars = [], m_vtkObjectList = {}, m_vglObjects = {}, m_vtkRenderedList = {}, m_vtkObjHashList = {}, m_vtkObjectCount = 0, m_vtkScene = null, m_node = null, END_OF_INPUT = -1, m_base64Str = "", m_base64Count = 0, m_pos = 0, m_viewer = null, i = 0;
    if (m_reverseBase64Chars.length === 0) {
        for (i = 0; i < m_base64Chars.length; i++) {
            m_reverseBase64Chars[m_base64Chars[i]] = i;
        }
    }
    this.ntos = function(n) {
        var unN;
        unN = n.toString(16);
        if (unN.length === 1) {
            unN = "0" + unN;
        }
        unN = "%" + unN;
        return unescape(unN);
    };
    this.readReverseBase64 = function() {
        var nextCharacter;
        if (!m_base64Str) {
            return END_OF_INPUT;
        }
        while (true) {
            if (m_base64Count >= m_base64Str.length) {
                return END_OF_INPUT;
            }
            nextCharacter = m_base64Str.charAt(m_base64Count);
            m_base64Count++;
            if (m_reverseBase64Chars[nextCharacter]) {
                return m_reverseBase64Chars[nextCharacter];
            }
            if (nextCharacter === "A") {
                return 0;
            }
        }
        return END_OF_INPUT;
    };
    this.decode64 = function(str) {
        var result = "", inBuffer = new Array(4), done = false;
        m_base64Str = str;
        m_base64Count = 0;
        while (!done && (inBuffer[0] = this.readReverseBase64()) !== END_OF_INPUT && (inBuffer[1] = this.readReverseBase64()) !== END_OF_INPUT) {
            inBuffer[2] = this.readReverseBase64();
            inBuffer[3] = this.readReverseBase64();
            result += this.ntos(inBuffer[0] << 2 & 255 | inBuffer[1] >> 4);
            if (inBuffer[2] !== END_OF_INPUT) {
                result += this.ntos(inBuffer[1] << 4 & 255 | inBuffer[2] >> 2);
                if (inBuffer[3] !== END_OF_INPUT) {
                    result += this.ntos(inBuffer[2] << 6 & 255 | inBuffer[3]);
                } else {
                    done = true;
                }
            } else {
                done = true;
            }
        }
        return result;
    };
    this.readNumber = function(ss) {
        var v = ss[m_pos++] + (ss[m_pos++] << 8) + (ss[m_pos++] << 16) + (ss[m_pos++] << 24);
        return v;
    };
    this.readF3Array = function(numberOfPoints, ss) {
        var size = numberOfPoints * 4 * 3, test = new Int8Array(size), points = null, i;
        for (i = 0; i < size; i++) {
            test[i] = ss[m_pos++];
        }
        points = new Float32Array(test.buffer);
        return points;
    };
    this.readColorArray = function(numberOfPoints, ss, vglcolors) {
        var i, r, g, b, idx = 0, tmp = new Array(numberOfPoints * 3);
        for (i = 0; i < numberOfPoints; i++) {
            tmp[idx++] = ss[m_pos++] / 255;
            tmp[idx++] = ss[m_pos++] / 255;
            tmp[idx++] = ss[m_pos++] / 255;
            m_pos++;
        }
        vglcolors.insert(tmp);
    };
    this.parseObject = function(vtkObject) {
        var geom = new vgl.geometryData(), mapper = vgl.mapper(), ss = [], type = null, data = null, size, matrix = null, material = null, actor = null, shaderProg, opacityUniform;
        data = atob(vtkObject.data);
        for (i = 0; i < data.length; i++) {
            ss[i] = data.charCodeAt(i) & 255;
        }
        m_pos = 0;
        size = this.readNumber(ss);
        type = String.fromCharCode(ss[m_pos++]);
        geom.setName(type);
        if (type === "L") {
            matrix = this.parseLineData(geom, ss);
            material = vgl.utils.createGeometryMaterial();
        } else if (type === "M") {
            matrix = this.parseMeshData(geom, ss);
            material = vgl.utils.createPhongMaterial();
        } else if (type === "P") {
            matrix = this.parsePointData(geom, ss);
            material = vgl.utils.createGeometryMaterial();
        } else if (type === "C") {
            matrix = this.parseColorMapData(geom, ss, size);
            material = vgl.utils.createGeometryMaterial();
        } else {
            console.log("Ignoring unrecognized encoded data type " + type);
        }
        mapper.setGeometryData(geom);
        if (vtkObject.hasTransparency) {
            shaderProg = material.shaderProgram();
            opacityUniform = shaderProg.uniform("opacity");
            shaderProg.addUniform(new vgl.floatUniform("opacity", .5));
            material.setBinNumber(1e3);
        }
        actor = vgl.actor();
        actor.setMapper(mapper);
        actor.setMaterial(material);
        actor.setMatrix(mat4.transpose(mat4.create(), matrix));
        return actor;
    };
    this.parseLineData = function(geom, ss) {
        var vglpoints = null, vglcolors = null, vgllines = null, matrix = mat4.create(), numberOfIndex, numberOfPoints, points, temp, index, size, m, i, p = null, idx = 0;
        numberOfPoints = this.readNumber(ss);
        p = new Array(numberOfPoints * 3);
        vglpoints = new vgl.sourceDataP3fv();
        points = this.readF3Array(numberOfPoints, ss);
        for (i = 0; i < numberOfPoints; i++) {
            p[idx++] = points[i * 3];
            p[idx++] = points[i * 3 + 1];
            p[idx++] = points[i * 3 + 2];
        }
        vglpoints.insert(p);
        geom.addSource(vglpoints);
        vglcolors = new vgl.sourceDataC3fv();
        this.readColorArray(numberOfPoints, ss, vglcolors);
        geom.addSource(vglcolors);
        vgllines = new vgl.lines();
        geom.addPrimitive(vgllines);
        numberOfIndex = this.readNumber(ss);
        temp = new Int8Array(numberOfIndex * 2);
        for (i = 0; i < numberOfIndex * 2; i++) {
            temp[i] = ss[m_pos++];
        }
        index = new Uint16Array(temp.buffer);
        vgllines.setIndices(index);
        vgllines.setPrimitiveType(gl.LINES);
        size = 16 * 4;
        temp = new Int8Array(size);
        for (i = 0; i < size; i++) {
            temp[i] = ss[m_pos++];
        }
        m = new Float32Array(temp.buffer);
        mat4.copy(matrix, m);
        return matrix;
    };
    this.parseMeshData = function(geom, ss) {
        var vglpoints = null, vglcolors = null, vgllines = null, normals = null, matrix = mat4.create(), v1 = null, vgltriangles = null, numberOfIndex, numberOfPoints, points, temp, index, size, m, i, tcoord, pn = null, idx = 0;
        numberOfPoints = this.readNumber(ss);
        pn = new Array(numberOfPoints * 6);
        vglpoints = new vgl.sourceDataP3N3f();
        points = this.readF3Array(numberOfPoints, ss);
        normals = this.readF3Array(numberOfPoints, ss);
        for (i = 0; i < numberOfPoints; i++) {
            pn[idx++] = points[i * 3];
            pn[idx++] = points[i * 3 + 1];
            pn[idx++] = points[i * 3 + 2];
            pn[idx++] = normals[i * 3];
            pn[idx++] = normals[i * 3 + 1];
            pn[idx++] = normals[i * 3 + 2];
        }
        vglpoints.insert(pn);
        geom.addSource(vglpoints);
        vglcolors = new vgl.sourceDataC3fv();
        this.readColorArray(numberOfPoints, ss, vglcolors);
        geom.addSource(vglcolors);
        temp = [];
        vgltriangles = new vgl.triangles();
        numberOfIndex = this.readNumber(ss);
        temp = new Int8Array(numberOfIndex * 2);
        for (i = 0; i < numberOfIndex * 2; i++) {
            temp[i] = ss[m_pos++];
        }
        index = new Uint16Array(temp.buffer);
        vgltriangles.setIndices(index);
        geom.addPrimitive(vgltriangles);
        size = 16 * 4;
        temp = new Int8Array(size);
        for (i = 0; i < size; i++) {
            temp[i] = ss[m_pos++];
        }
        m = new Float32Array(temp.buffer);
        mat4.copy(matrix, m);
        tcoord = null;
        return matrix;
    };
    this.parsePointData = function(geom, ss) {
        var numberOfPoints, points, indices, temp, size, matrix = mat4.create(), vglpoints = null, vglcolors = null, vglVertexes = null, m, p = null, idx = 0;
        numberOfPoints = this.readNumber(ss);
        p = new Array(numberOfPoints * 3);
        vglpoints = new vgl.sourceDataP3fv();
        points = this.readF3Array(numberOfPoints, ss);
        indices = new Uint16Array(numberOfPoints);
        for (i = 0; i < numberOfPoints; i++) {
            indices[i] = i;
            p[idx++] = points[i * 3];
            p[idx++] = points[i * 3 + 1];
            p[idx++] = points[i * 3 + 2];
        }
        vglpoints.insert(p);
        geom.addSource(vglpoints);
        vglcolors = new vgl.sourceDataC3fv();
        this.readColorArray(numberOfPoints, ss, vglcolors);
        geom.addSource(vglcolors);
        vglVertexes = new vgl.points();
        vglVertexes.setIndices(indices);
        geom.addPrimitive(vglVertexes);
        size = 16 * 4;
        temp = new Int8Array(size);
        for (i = 0; i < size; i++) {
            temp[i] = ss[m_pos++];
        }
        m = new Float32Array(temp.buffer);
        mat4.copy(matrix, m);
        return matrix;
    };
    this.parseColorMapData = function(geom, ss, numColors) {
        return null;
    };
    this.parseSceneMetadata = function(renderer, layer) {
        var sceneRenderer = m_vtkScene.Renderers[layer], camera = renderer.camera(), bgc, localWidth, localHeight;
        localWidth = (sceneRenderer.size[0] - sceneRenderer.origin[0]) * m_node.width;
        localHeight = (sceneRenderer.size[1] - sceneRenderer.origin[1]) * m_node.height;
        renderer.resize(localWidth, localHeight);
        camera.setCenterOfRotation([ sceneRenderer.LookAt[1], sceneRenderer.LookAt[2], sceneRenderer.LookAt[3] ]);
        camera.setViewAngleDegrees(sceneRenderer.LookAt[0]);
        camera.setPosition(sceneRenderer.LookAt[7], sceneRenderer.LookAt[8], sceneRenderer.LookAt[9]);
        camera.setFocalPoint(sceneRenderer.LookAt[1], sceneRenderer.LookAt[2], sceneRenderer.LookAt[3]);
        camera.setViewUpDirection(sceneRenderer.LookAt[4], sceneRenderer.LookAt[5], sceneRenderer.LookAt[6]);
        if (layer === 0) {
            bgc = sceneRenderer.Background1;
            renderer.setBackgroundColor(bgc[0], bgc[1], bgc[2], 1);
        } else {
            renderer.setResizable(false);
        }
        renderer.setLayer(layer);
    };
    this.initScene = function() {
        var renderer, layer;
        if (m_vtkScene === null) {
            return m_viewer;
        }
        for (layer = m_vtkScene.Renderers.length - 1; layer >= 0; layer--) {
            renderer = this.getRenderer(layer);
            this.parseSceneMetadata(renderer, layer);
        }
        return m_viewer;
    };
    this.createViewer = function(node) {
        var interactorStyle;
        if (m_viewer === null) {
            m_node = node;
            m_viewer = vgl.viewer(node);
            m_viewer.init();
            m_vtkRenderedList[0] = m_viewer.renderWindow().activeRenderer();
            m_viewer.renderWindow().resize(node.width, node.height);
            interactorStyle = vgl.pvwInteractorStyle();
            m_viewer.setInteractorStyle(interactorStyle);
        }
        return m_viewer;
    };
    this.deleteViewer = function() {
        m_vtkRenderedList = {};
        m_viewer = null;
    };
    this.updateCanvas = function(node) {
        m_node = node;
        m_viewer.renderWindow().resize(node.width, node.height);
        return m_viewer;
    };
    this.numObjects = function() {
        return m_vtkObjectCount;
    };
    this.getRenderer = function(layer) {
        var renderer;
        renderer = m_vtkRenderedList[layer];
        if (renderer === null || typeof renderer === "undefined") {
            renderer = new vgl.renderer();
            renderer.setResetScene(false);
            renderer.setResetClippingRange(false);
            m_viewer.renderWindow().addRenderer(renderer);
            if (layer !== 0) {
                renderer.camera().setClearMask(vgl.GL.DepthBufferBit);
            }
            m_vtkRenderedList[layer] = renderer;
        }
        return renderer;
    };
    this.setVtkScene = function(scene) {
        m_vtkScene = scene;
    };
    return this;
};

var ogs;

if (!window || window.ogs === undefined) {
    ogs = {};
} else {
    ogs = window.ogs;
}

ogs.namespace = function(ns_string) {
    "use strict";
    var parts = ns_string.split("."), parent = ogs, i;
    if (parts[0] === "ogs") {
        parts = parts.slice(1);
    }
    for (i = 0; i < parts.length; i += 1) {
        if (parent[parts[i]] === undefined) {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

var geo = ogs.namespace("geo");

window.geo = geo;

geo.renderers = {};

geo.features = {};

geo.fileReaders = {};

inherit = function(C, P) {
    "use strict";
    var F = function() {};
    F.prototype = P.prototype;
    C.prototype = new F();
    C.uber = P.prototype;
    C.prototype.constructor = C;
};

Object.size = function(obj) {
    "use strict";
    var size = 0, key = null;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            size += 1;
        }
    }
    return size;
};

geo.registerFileReader = function(name, func) {
    "use strict";
    if (geo.fileReaders === undefined) {
        geo.fileReaders = {};
    }
    geo.fileReaders[name] = func;
};

geo.createFileReader = function(name, opts) {
    "use strict";
    if (geo.fileReaders.hasOwnProperty(name)) {
        return geo.fileReaders[name](opts);
    }
    return null;
};

geo.registerRenderer = function(name, func) {
    "use strict";
    if (geo.renderers === undefined) {
        geo.renderers = {};
    }
    geo.renderers[name] = func;
};

geo.createRenderer = function(name, layer, canvas) {
    "use strict";
    if (geo.renderers.hasOwnProperty(name)) {
        var ren = geo.renderers[name]({
            layer: layer,
            canvas: canvas
        });
        ren._init();
        return ren;
    }
    return null;
};

geo.registerFeature = function(category, name, func) {
    "use strict";
    if (geo.features === undefined) {
        geo.features = {};
    }
    if (!(category in geo.features)) {
        geo.features[category] = {};
    }
    geo.features[category][name] = func;
};

geo.createFeature = function(name, layer, renderer, arg) {
    "use strict";
    var category = renderer.api(), options = {
        layer: layer,
        renderer: renderer
    };
    if (category in geo.features && name in geo.features[category]) {
        if (arg !== undefined) {
            $.extend(true, options, arg);
        }
        return geo.features[category][name](options);
    }
    return null;
};

geo.registerLayer = function(name, func) {
    "use strict";
    if (geo.layers === undefined) {
        geo.layers = {};
    }
    geo.layers[name] = func;
};

geo.createLayer = function(name, map, arg) {
    "use strict";
    var options = {
        map: map,
        renderer: "vglRenderer"
    }, layer = null;
    if (name in geo.layers) {
        if (arg !== undefined) {
            $.extend(true, options, arg);
        }
        layer = geo.layers[name](options);
        layer._init();
        return layer;
    } else {
        return null;
    }
};

function require(libs, callback) {
    var el = libs.shift();
    if (typeof window[el["lib"]] != "function") {
        var newscript = document.createElement("script");
        newscript.type = "text/javascript";
        newscript.src = el["script"];
        if (libs.length > 0) {
            newscript.onload = function() {
                require(libs, callback);
            };
        } else if (typeof callback != "undefined") {
            newscript.onload = callback;
        }
        (document.getElementsByTagName("head")[0] || document.getElementsByTagName("body")[0]).appendChild(newscript);
    } else {
        require(libs, callback);
    }
}

geo.loadDependencies = function(callback) {
    require([ {
        lib: "jQuery",
        script: "http://opengeoscience.github.io/geojs/lib/jquery-1.9.1.js"
    }, {
        lib: "jQuery",
        script: "http://opengeoscience.github.io/geojs/lib/gl-matrix.js"
    }, {
        lib: "jQuery",
        script: "http://opengeoscience.github.io/geojs/lib/d3.v3.min.js"
    }, {
        lib: "jQuery",
        script: "http://opengeoscience.github.io/geojs/lib/proj4.js"
    }, {
        lib: "jQuery",
        script: "http://opengeoscience.github.io/geojs/lib/vgl.js"
    } ], callback);
};

geo.object = function() {
    "use strict";
    if (!(this instanceof geo.object)) {
        return new geo.object();
    }
    var m_this = this, m_eventHandlers = {}, m_idleHandlers = [], m_deferredCount = 0;
    this.onIdle = function(handler) {
        if (m_deferredCount) {
            m_idleHandlers.push(handler);
        } else {
            handler();
        }
    };
    this.addDeferred = function(defer) {
        m_deferredCount += 1;
        defer.done(function() {
            m_deferredCount -= 1;
            if (!m_deferredCount) {
                m_idleHandlers.splice(0, m_idleHandlers.length).forEach(function(handler) {
                    handler();
                });
            }
        });
    };
    this.on = function(event, handler) {
        if (Array.isArray(event)) {
            event.forEach(function(e) {
                m_this.on(e, handler);
            });
            return m_this;
        }
        if (!m_eventHandlers.hasOwnProperty(event)) {
            m_eventHandlers[event] = [];
        }
        m_eventHandlers[event].push(handler);
        return m_this;
    };
    this.trigger = function(event, args) {
        if (Array.isArray(event)) {
            event.forEach(function(e) {
                m_this.trigger(e, args);
            });
            return m_this;
        }
        if (m_eventHandlers.hasOwnProperty(event)) {
            m_eventHandlers[event].forEach(function(handler) {
                handler(args);
            });
        }
        return m_this;
    };
    this.off = function(event, arg) {
        if (Array.isArray(event)) {
            event.forEach(function(e) {
                m_this.off(e, arg);
            });
            return m_this;
        }
        if (!arg) {
            m_eventHandlers[event] = [];
        } else if (Array.isArray(arg)) {
            arg.forEach(function(handler) {
                m_this.off(event, handler);
            });
            return m_this;
        }
        if (m_eventHandlers.hasOwnProperty(event)) {
            m_eventHandlers[event] = m_eventHandlers[event].filter(function(f) {
                return f !== arg;
            });
        }
        return m_this;
    };
    vgl.object.call(this);
    return this;
};

inherit(geo.object, vgl.object);

geo.sceneObject = function(arg) {
    "use strict";
    if (!(this instanceof geo.sceneObject)) {
        return new geo.sceneObject();
    }
    geo.object.call(this, arg);
    var m_this = this, m_parent = null, m_children = [], s_trigger = this.trigger, s_addDeferred = this.addDeferred, s_onIdle = this.onIdle;
    this.addDeferred = function(defer) {
        if (m_parent) {
            m_parent.addDeferred(defer);
        } else {
            s_addDeferred(defer);
        }
    };
    this.onIdle = function(handler) {
        if (m_parent) {
            m_parent.onIdle(handler);
        } else {
            s_onIdle(handler);
        }
    };
    this.parent = function(arg) {
        if (arg === undefined) {
            return m_parent;
        }
        m_parent = arg;
        return m_this;
    };
    this.addChild = function(child) {
        if (Array.isArray(child)) {
            child.forEach(m_this.addChild);
            return m_this;
        }
        child.parent(m_this);
        m_children.push(child);
        return m_this;
    };
    this.removeChild = function(child) {
        if (Array.isArray(child)) {
            child.forEach(m_this.removeChild);
            return m_this;
        }
        m_children = m_children.filter(function(c) {
            return c !== child;
        });
        return m_this;
    };
    this.children = function() {
        return m_children.slice();
    };
    this.draw = function(arg) {
        m_this.children().forEach(function(child) {
            child.draw(arg);
        });
        return m_this;
    };
    this.trigger = function(event, args, childrenOnly) {
        var geoArgs;
        args = args || {};
        geoArgs = args.geo || {};
        args.geo = geoArgs;
        if (!childrenOnly && m_parent && geoArgs._triggeredBy !== m_parent) {
            geoArgs._triggeredBy = m_this;
            m_parent.trigger(event, args);
            return m_this;
        }
        s_trigger.call(m_this, event, args);
        if (geoArgs.stopPropagation) {
            return m_this;
        }
        m_children.forEach(function(child) {
            geoArgs._triggeredBy = m_this;
            child.trigger(event, args);
        });
        return m_this;
    };
    return this;
};

inherit(geo.sceneObject, geo.object);

geo.timestamp = function() {
    "use strict";
    if (!(this instanceof geo.timestamp)) {
        return new geo.timestamp();
    }
    vgl.timestamp.call(this);
};

inherit(geo.timestamp, vgl.timestamp);

geo.ellipsoid = function(x, y, z) {
    "use strict";
    if (!(this instanceof geo.ellipsoid)) {
        return new geo.ellipsoid(x, y, z);
    }
    x = vgl.defaultValue(x, 0);
    y = vgl.defaultValue(y, 0);
    z = vgl.defaultValue(z, 0);
    if (x < 0 || y < 0 || z < 0) {
        return console.log("[error] Al radii components must be greater than zero");
    }
    var m_this = this, m_radii = new vec3.fromValues(x, y, z), m_radiiSquared = new vec3.fromValues(x * x, y * y, z * z), m_minimumRadius = Math.min(x, y, z), m_maximumRadius = Math.max(x, y, z);
    this.radii = function() {
        return m_radii;
    };
    this.radiiSquared = function() {
        return m_radiiSquared;
    };
    this.maximumRadius = function() {
        return m_maximumRadius;
    };
    this.minimumRadius = function() {
        return m_minimumRadius;
    };
    this.computeGeodeticSurfaceNormal = function(lat, lon) {
        if (typeof lat === "undefined" || typeof lon === "undefined") {
            throw "[error] Valid latitude and longitude is required";
        }
        var cosLatitude = Math.cos(lat), result = vec3.create();
        result[0] = cosLatitude * Math.cos(lon);
        result[1] = cosLatitude * Math.sin(lon);
        result[2] = Math.sin(lat);
        vec3.normalize(result, result);
        return result;
    };
    this.transformPoint = function(lat, lon, elev) {
        lat = lat * (Math.PI / 180);
        lon = lon * (Math.PI / 180);
        var n = m_this.computeGeodeticSurfaceNormal(lat, lon), k = vec3.create(), gamma = Math.sqrt(vec3.dot(n, k)), result = vec3.create();
        vec3.multiply(k, m_radiiSquared, n);
        vec3.scale(k, k, 1 / gamma);
        vec3.scale(n, n, elev);
        vec3.add(result, n, k);
        return result;
    };
    this.transformGeometry = function(geom) {
        if (!geom) {
            throw "[error] Failed to transform to cartesian. Invalid geometry.";
        }
        var sourceData = geom.sourceData(vgl.vertexAttributeKeys.Position), sourceDataArray = sourceData.data(), noOfComponents = sourceData.attributeNumberOfComponents(vgl.vertexAttributeKeys.Position), stride = sourceData.attributeStride(vgl.vertexAttributeKeys.Position), offset = sourceData.attributeOffset(vgl.vertexAttributeKeys.Position), sizeOfDataType = sourceData.sizeOfAttributeDataType(vgl.vertexAttributeKeys.Position), index = null, count = sourceDataArray.length * (1 / noOfComponents), gamma = null, n = null, j = 0, k = vec3.create(), result = vec3.create();
        stride /= sizeOfDataType;
        offset /= sizeOfDataType;
        if (noOfComponents !== 3) {
            throw "[error] Requires positions with three components";
        }
        for (j = 0; j < count; j += 1) {
            index = j * stride + offset;
            sourceDataArray[index] = sourceDataArray[index] * (Math.PI / 180);
            sourceDataArray[index + 1] = sourceDataArray[index + 1] * (Math.PI / 180);
            n = m_this.computeGeodeticSurfaceNormal(sourceDataArray[index + 1], sourceDataArray[index]);
            vec3.multiply(k, m_radiiSquared, n);
            gamma = Math.sqrt(vec3.dot(n, k));
            vec3.scale(k, k, 1 / gamma);
            vec3.scale(n, n, sourceDataArray[index + 2]);
            vec3.add(result, n, k);
            sourceDataArray[index] = result[0];
            sourceDataArray[index + 1] = result[1];
            sourceDataArray[index + 2] = result[2];
        }
    };
    return m_this;
};

geo.ellipsoid.WGS84 = vgl.freezeObject(geo.ellipsoid(6378137, 6378137, 6356752.314245179));

geo.ellipsoid.UNIT_SPHERE = vgl.freezeObject(geo.ellipsoid(1, 1, 1));

geo.mercator = {
    r_major: 6378137
};

geo.mercator.r_minor = function(spherical) {
    "use strict";
    var r_minor;
    spherical = spherical !== undefined ? spherical : false;
    if (spherical) {
        r_minor = 6378137;
    } else {
        r_minor = 6356752.314245179;
    }
    return r_minor;
};

geo.mercator.f = function(spherical) {
    "use strict";
    return (geo.mercator.r_major - geo.mercator.r_minor(spherical)) / geo.mercator.r_major;
};

geo.mercator.long2tilex = function(lon, z) {
    "use strict";
    var rad = (lon + 180) / 360, f = Math.floor(rad * Math.pow(2, z));
    return f;
};

geo.mercator.lat2tiley = function(lat, z) {
    "use strict";
    var rad = lat * Math.PI / 180;
    return Math.floor((1 - rad / Math.PI) / 2 * Math.pow(2, z));
};

geo.mercator.long2tilex2 = function(lon, z) {
    "use strict";
    var rad = (lon + 180) / 360, f = rad * Math.pow(2, z), ret = Math.floor(f), frac = f - ret;
    return [ ret, frac ];
};

geo.mercator.lat2tiley2 = function(lat, z) {
    "use strict";
    var rad = lat * Math.PI / 180, f = (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * Math.pow(2, z), ret = Math.floor(f), frac = f - ret;
    return [ ret, frac ];
};

geo.mercator.tilex2long = function(x, z) {
    "use strict";
    return x / Math.pow(2, z) * 360 - 180;
};

geo.mercator.tiley2lat = function(y, z) {
    "use strict";
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return 180 / Math.PI * Math.atan(.5 * (Math.exp(n) - Math.exp(-n)));
};

geo.mercator.y2lat = function(a) {
    "use strict";
    return 180 / Math.PI * (2 * Math.atan(Math.exp(a * Math.PI / 180)) - Math.PI / 2);
};

geo.mercator.lat2y = function(a) {
    "use strict";
    return 180 / Math.PI * Math.log(Math.tan(Math.PI / 4 + a * (Math.PI / 180) / 2));
};

geo.mercator.deg2rad = function(d) {
    "use strict";
    var r = d * (Math.PI / 180);
    return r;
};

geo.mercator.rad2deg = function(r) {
    "use strict";
    var d = r / (Math.PI / 180);
    return d;
};

geo.mercator.ll2m = function(lon, lat, spherical) {
    "use strict";
    if (lat > 89.5) {
        lat = 89.5;
    }
    if (lat < -89.5) {
        lat = -89.5;
    }
    var x = this.r_major * this.deg2rad(lon), temp = this.r_minor(spherical) / this.r_major, es = 1 - temp * temp, eccent = Math.sqrt(es), phi = this.deg2rad(lat), sinphi = Math.sin(phi), con = eccent * sinphi, com = .5 * eccent, con2 = Math.pow((1 - con) / (1 + con), com), ts = Math.tan(.5 * (Math.PI * .5 - phi)) / con2, y = -this.r_major * Math.log(ts), ret = {
        x: x,
        y: y
    };
    return ret;
};

geo.mercator.m2ll = function(x, y, spherical) {
    "use strict";
    var lon = this.rad2deg(x / this.r_major), temp = this.r_minor(spherical) / this.r_major, e = Math.sqrt(1 - temp * temp), lat = this.rad2deg(this.pjPhi2(Math.exp(-(y / this.r_major)), e)), ret = {
        lon: lon,
        lat: lat
    };
    return ret;
};

geo.mercator.pjPhi2 = function(ts, e) {
    "use strict";
    var N_ITER = 15, HALFPI = Math.PI / 2, TOL = 1e-10, con, dphi, i = N_ITER, eccnth = .5 * e, Phi = HALFPI - 2 * Math.atan(ts);
    do {
        con = e * Math.sin(Phi);
        dphi = HALFPI - 2 * Math.atan(ts * Math.pow((1 - con) / (1 + con), eccnth)) - Phi;
        Phi += dphi;
        i -= 1;
    } while (Math.abs(dphi) > TOL && i);
    return Phi;
};

geo.latlng = function(arg1, arg2) {
    "use strict";
    if (!(this instanceof geo.latlng)) {
        return new geo.latlng(arg1, arg2);
    }
    var m_this = this, m_lat = arg2 === undefined ? arg1.lat() : arg1, m_lng = arg2 === undefined ? arg1.lng() : arg2;
    this.lat = function(val) {
        if (val === undefined) {
            return m_lat;
        } else {
            m_lat = val;
        }
    };
    this.lng = function(val) {
        if (val === undefined) {
            return m_lng;
        } else {
            m_lng = val;
        }
    };
    this.x = function(val) {
        if (val === undefined) {
            return m_this.lng();
        } else {
            m_lng = val;
        }
    };
    this.y = function(val) {
        if (val === undefined) {
            return m_this.lat();
        } else {
            m_lat = val;
        }
    };
    return this;
};

geo.layerOptions = function() {
    "use strict";
    if (!(this instanceof geo.layerOptions)) {
        return new geo.layerOptions();
    }
    this.opacity = .5;
    this.showAttribution = true;
    this.visible = true;
    this.binNumber = vgl.material.RenderBin.Default;
    return this;
};

geo.newLayerId = function() {
    "use strict";
    var currentId = 1;
    return function() {
        var id = currentId;
        currentId += 1;
        return id;
    };
}();

geo.layer = function(arg) {
    "use strict";
    if (!(this instanceof geo.layer)) {
        return new geo.layer(arg);
    }
    arg = arg || {};
    geo.sceneObject.call(this, arg);
    var m_this = this, m_style = arg.style === undefined ? {
        opacity: .5,
        color: [ .8, .8, .8 ],
        visible: true,
        bin: 100
    } : arg.style, m_id = arg.id === undefined ? geo.newLayerId() : arg.id, m_name = "", m_gcs = "EPSG:4326", m_timeRange = null, m_source = arg.source || null, m_map = arg.map === undefined ? null : arg.map, m_isReference = false, m_x = 0, m_y = 0, m_width = 0, m_height = 0, m_node = null, m_canvas = null, m_renderer = null, m_initialized = false, m_rendererName = arg.renderer === undefined ? "vglRenderer" : arg.renderer, m_dataTime = geo.timestamp(), m_updateTime = geo.timestamp(), m_drawTime = geo.timestamp(), m_sticky = arg.sticky === undefined ? true : arg.sticky;
    this.sticky = function() {
        return m_sticky;
    };
    this.node = function() {
        return m_node;
    };
    this.id = function(val) {
        if (val === undefined) {
            return m_id;
        }
        m_id = geo.newLayerId();
        m_this.modified();
        return m_this;
    };
    this.name = function(val) {
        if (val === undefined) {
            return m_name;
        }
        m_name = val;
        m_this.modified();
        return m_this;
    };
    this.opacity = function(val) {
        if (val === undefined) {
            return m_style.opacity;
        }
        m_style.opacity = val;
        m_this.modified();
        return m_this;
    };
    this.visible = function(val) {
        if (val === undefined) {
            return m_style.visible;
        }
        m_style.visible = val;
        m_this.modified();
        return m_this;
    };
    this.bin = function(val) {
        if (val === undefined) {
            return m_style.bin;
        }
        m_style.bin = val;
        m_this.modified();
        return m_this;
    };
    this.gcs = function(val) {
        if (val === undefined) {
            return m_gcs;
        }
        m_gcs = val;
        m_this.modified();
        return m_this;
    };
    this.transform = function(val) {
        geo.transform.transformLayer(val, m_this, m_map.baseLayer());
        return m_this;
    };
    this.timeRange = function(val) {
        if (val === undefined) {
            return m_timeRange;
        }
        m_timeRange = val;
        m_this.modified();
        return m_this;
    };
    this.source = function(val) {
        if (val === undefined) {
            return m_source;
        }
        m_source = val;
        m_this.modified();
        return m_this;
    };
    this.map = function(val) {
        if (val === undefined) {
            return m_map;
        }
        m_map = val;
        m_map.node().append(m_node);
        m_this.modified();
        return m_this;
    };
    this.renderer = function() {
        return m_renderer;
    };
    this.canvas = function() {
        return m_canvas;
    };
    this.viewport = function() {
        return [ m_x, m_y, m_width, m_height ];
    };
    this.dataTime = function() {
        return m_dataTime;
    };
    this.updateTime = function() {
        return m_updateTime;
    };
    this.drawTime = function() {
        return m_drawTime;
    };
    this.query = function() {};
    this.referenceLayer = function(val) {
        if (val !== undefined) {
            m_isReference = val;
            m_this.modified();
            return m_this;
        }
        return m_isReference;
    };
    this.initialized = function(val) {
        if (val !== undefined) {
            m_initialized = val;
            return m_this;
        }
        return m_initialized;
    };
    this.toLocal = function(input) {
        return input;
    };
    this.fromLocal = function(input) {
        return input;
    };
    this._init = function() {
        if (m_initialized) {
            return m_this;
        }
        m_node = $(document.createElement("div"));
        m_node.attr("id", m_name);
        m_node.css("position", "absolute");
        if (m_map) {
            m_map.node().append(m_node);
        }
        if (m_canvas) {
            m_renderer = geo.createRenderer(m_rendererName, m_this, m_canvas);
        } else {
            m_renderer = geo.createRenderer(m_rendererName, m_this);
            m_canvas = m_renderer.canvas();
        }
        m_this.addChild(m_renderer);
        m_initialized = true;
        return m_this;
    };
    this._exit = function() {};
    this._update = function() {};
    this._resize = function(x, y, w, h) {
        m_x = x;
        m_y = y;
        m_width = w;
        m_height = h;
        m_node.width(w);
        m_node.height(h);
        m_this.modified();
        m_this.trigger(geo.event.resize, {
            x: x,
            y: y,
            width: m_width,
            height: m_height
        });
        return m_this;
    };
    this.width = function() {
        return m_width;
    };
    this.height = function() {
        return m_height;
    };
    return this;
};

inherit(geo.layer, geo.sceneObject);

geo.featureLayer = function(arg) {
    "use strict";
    if (!(this instanceof geo.featureLayer)) {
        return new geo.featureLayer(arg);
    }
    geo.layer.call(this, arg);
    var m_this = this, m_features = [], s_init = this._init, s_update = this._update, s_draw = this.draw;
    this.createFeature = function(featureName, arg) {
        var newFeature = geo.createFeature(featureName, m_this, m_this.renderer(), arg);
        m_this.addChild(newFeature);
        m_features.push(newFeature);
        m_this.features(m_features);
        m_this.modified();
        return newFeature;
    };
    this.deleteFeature = function(feature) {
        var i;
        for (i = 0; i < m_features.length; i += 1) {
            if (m_features[i] === feature) {
                m_features[i]._exit();
                m_this.dataTime().modified();
                m_this.modified();
                m_features.splice(i, 1);
                return m_this;
            }
        }
        m_this.removeChild(feature);
        return m_this;
    };
    this.features = function(val) {
        if (val === undefined) {
            return m_features;
        } else {
            m_features = val.slice(0);
            m_this.dataTime().modified();
            m_this.modified();
            return m_this;
        }
    };
    this._init = function() {
        if (m_this.initialized()) {
            return m_this;
        }
        s_init.call(m_this);
        m_this.on(geo.event.resize, function(event) {
            m_this.renderer()._resize(event.x, event.y, event.width, event.height);
            m_this._update({});
            m_this.renderer()._render();
        });
        m_this.on(geo.event.pan, function(event) {
            m_this._update({
                event: event
            });
            m_this.renderer()._render();
        });
        m_this.on(geo.event.zoom, function(event) {
            if (m_this.map()) {
                m_this.map().zoom(event.curr_zoom);
            }
            m_this._update({
                event: event
            });
            m_this.renderer()._render();
        });
        return m_this;
    };
    this._update = function(request) {
        var i;
        if (!m_features.length) {
            return m_this;
        }
        s_update.call(m_this, request);
        if (!m_this.source() && m_features && m_features.length === 0) {
            console.log("[info] No valid data source found.");
            return;
        }
        if (m_this.dataTime().getMTime() > m_this.updateTime().getMTime()) {
            for (i = 0; i < m_features.length; i += 1) {
                m_features[i].renderer(m_this.renderer());
            }
        }
        for (i = 0; i < m_features.length; i += 1) {
            m_features[i]._update();
        }
        m_this.updateTime().modified();
        return m_this;
    };
    this.draw = function() {
        s_draw();
        m_this.renderer()._render();
        return m_this;
    };
    this.clear = function() {
        var i;
        if (!m_features.length) return m_this;
        for (i = 0; i < m_features.length; i += 1) {
            m_features[i]._exit();
        }
        m_this.dataTime().modified();
        m_this.modified();
        m_features = [];
        return m_this;
    };
    return m_this;
};

inherit(geo.featureLayer, geo.layer);

geo.registerLayer("feature", geo.featureLayer);

geo.event = function() {
    "use strict";
    if (!(this instanceof geo.event)) {
        return new geo.event();
    }
    vgl.event.call(this);
    return this;
};

inherit(geo.event, vgl.event);

geo.event.update = "geo.update";

geo.event.opacityUpdate = "geo.opacityUpdate";

geo.event.layerAdd = "geo.layerAdd";

geo.event.layerRemove = "geo.layerRemove";

geo.event.layerToggle = "geo.layerToggle";

geo.event.layerSelect = "geo.layerSelect";

geo.event.layerUnselect = "geo.layerUnselect";

geo.event.zoom = "geo.zoom";

geo.event.center = "geo.center";

geo.event.pan = "geo.pan";

geo.event.rotate = "geo.rotate";

geo.event.resize = "geo.resize";

geo.event.animate = "geo.animate";

geo.event.query = "geo.query";

geo.event.draw = "geo.draw";

geo.event.drawEnd = "geo.drawEnd";

geo.event.animationPause = "geo.animationPause";

geo.event.animationStop = "geo.animationStop";

geo.event.animationComplete = "geo.animationComplete";

geo.time = {};

geo.time.incrementTime = function(time, unit, delta) {
    "use strict";
    if (unit === "days") {
        time.setDate(time.getDate() + delta);
    } else if (unit === "months") {
        time.setMonth(time.getMonth() + delta);
    } else if (unit === "years") {
        time.setYear(time.getYear() + delta);
    } else if (unit === "index") {
        time = time + delta;
    }
    return time;
};

geo.fileReader = function(arg) {
    "use strict";
    if (!(this instanceof geo.fileReader)) {
        return new geo.fileReader(arg);
    }
    geo.object.call(this);
    arg = arg || {};
    if (!(arg.layer instanceof geo.featureLayer)) {
        throw "fileReader must be given a feature layer";
    }
    var m_layer = arg.layer;
    this.layer = function() {
        return m_layer;
    };
    this.canRead = function() {
        return false;
    };
    this.read = function(file, done) {
        done(false);
    };
    function newFileReader(done, progress) {
        var reader = new FileReader();
        if (progress) {
            reader.onprogress = progress;
        }
        reader.onloadend = function() {
            if (!reader.result) {
                done(reader.error);
            }
            done(reader.result);
        };
        return reader;
    }
    this._getString = function(file, done, progress) {
        var reader = newFileReader(done, progress);
        reader.readAsText(file);
    };
    this._getArrayBuffer = function(file, done, progress) {
        var reader = newFileReader(done, progress);
        reader.readAsText(file);
    };
    return this;
};

inherit(geo.fileReader, geo.object);

geo.jsonReader = function(arg) {
    "use strict";
    if (!(this instanceof geo.jsonReader)) {
        return new geo.jsonReader(arg);
    }
    var m_this = this, m_style = arg.style || {};
    geo.fileReader.call(this, arg);
    this.canRead = function(file) {
        if (file instanceof File) {
            return file.type === "application/json" || file.name.match(/\.json$/);
        } else if (typeof file === "string") {
            try {
                JSON.parse(file);
            } catch (e) {
                return false;
            }
            return true;
        }
        try {
            if (Array.isArray(m_this._featureArray(file))) {
                return true;
            }
        } catch (e) {}
        return false;
    };
    this._readObject = function(file, done, progress) {
        var object;
        function onDone(fileString) {
            if (typeof fileString !== "string") {
                done(false);
            }
            try {
                object = JSON.parse(fileString);
            } catch (e) {
                done(false);
            }
            done(object);
        }
        if (file instanceof File) {
            m_this._getString(file, onDone, progress);
        } else if (typeof file === "string") {
            onDone(file);
        } else {
            done(file);
        }
    };
    this._featureArray = function(spec) {
        if (spec.type === "FeatureCollection") {
            return spec.features || [];
        }
        if (spec.type === "GeometryCollection") {
            throw "GeometryCollection not yet implemented.";
        }
        if (Array.isArray(spec.coordinates)) {
            return spec;
        }
        throw "Unsupported collection type: " + spec.type;
    };
    this._featureType = function(spec) {
        var geometry = spec.geometry || {};
        if (geometry.type === "Point" || geometry.type === "MultiPoint") {
            return "point";
        }
        if (geometry.type === "LineString") {
            return "line";
        }
        return null;
    };
    this._getCoordinates = function(spec) {
        var geometry = spec.geometry || {}, coordinates = geometry.coordinates || [];
        if ((coordinates.length === 2 || coordinates.length === 3) && (isFinite(coordinates[0]) && isFinite(coordinates[1]))) {
            return [ geo.latlng(coordinates[1], coordinates[0]) ];
        }
        return coordinates.map(function(c) {
            return geo.latlng(c[1], c[0]);
        });
    };
    this._getStyle = function(spec) {
        return spec.properties || {};
    };
    this.read = function(file, done, progress) {
        function _done(object) {
            var features, allFeatures = [];
            features = m_this._featureArray(object);
            features.forEach(function(feature) {
                var type = m_this._featureType(feature), coordinates = m_this._getCoordinates(feature), style = m_this._getStyle(feature);
                if (type) {
                    allFeatures.push(m_this._addFeature(type, coordinates, style));
                } else {
                    console.log("unsupported feature type: " + feature.geometry.type);
                }
            });
            if (done) {
                done(allFeatures);
            }
        }
        m_this._readObject(file, _done, progress);
    };
    this._addFeature = function(type, coordinates, style) {
        var _style = $.extend({}, m_style, style);
        return m_this.layer().createFeature(type).positions(coordinates).style(_style);
    };
};

inherit(geo.jsonReader, geo.fileReader);

geo.registerFileReader("jsonReader", geo.jsonReader);

geo.map = function(arg) {
    "use strict";
    if (!(this instanceof geo.map)) {
        return new geo.map(arg);
    }
    arg = arg || {};
    geo.sceneObject.call(this, arg);
    arg.layers = arg.layers === undefined ? [] : arg.layers;
    var m_this = this, m_x = 0, m_y = 0, m_node = $(arg.node), m_width = arg.width || m_node.width(), m_height = arg.height || m_node.height(), m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs, m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs, m_center = arg.center === undefined ? [ 0, 0 ] : arg.center, m_zoom = arg.zoom === undefined ? 10 : arg.zoom, m_baseLayer = null, toMillis, calculateGlobalAnimationRange, cloneTimestep, m_animationState = {
        range: null,
        timestep: null,
        layers: null
    }, m_intervalMap = {}, m_pause, m_stop, m_fileReader = null;
    m_intervalMap.milliseconds = 1;
    m_intervalMap.seconds = m_intervalMap.milliseconds * 1e3;
    m_intervalMap.minutes = m_intervalMap.seconds * 60;
    m_intervalMap.hours = m_intervalMap.minutes * 60;
    m_intervalMap.days = m_intervalMap.hours * 24;
    m_intervalMap.weeks = m_intervalMap.days * 7;
    m_intervalMap.months = m_intervalMap.weeks * 4;
    m_intervalMap.years = m_intervalMap.months * 12;
    this.on(geo.event.animationPause, function() {
        m_pause = true;
    });
    this.on(geo.event.animationStop, function() {
        m_stop = true;
    });
    toMillis = function(delta) {
        var deltaLowercase = delta.toLowerCase();
        return m_intervalMap[deltaLowercase];
    };
    calculateGlobalAnimationRange = function(layers) {
        var delta, deltaUnits, start = null, end = null, layerTimeRange, layerDelta, indexTimestep = false, smallestDeltaInMillis = Number.MAX_VALUE, i;
        for (i = 0; i < layers.length; i += 1) {
            layerTimeRange = layers[i].timeRange();
            if (!layerTimeRange) {
                continue;
            }
            if (layerTimeRange.deltaUnits === "index") {
                indexTimestep = true;
                layerDelta = layerTimeRange.delta;
            } else {
                if (indexTimestep) {
                    throw "Can't mix index timesteps with time based timesteps";
                }
                layerDelta = toMillis(layerTimeRange.deltaUnits) * layerTimeRange.delta;
            }
            if (layerDelta < smallestDeltaInMillis) {
                delta = layerTimeRange.delta;
                deltaUnits = layerTimeRange.deltaUnits;
                smallestDeltaInMillis = layerDelta;
            }
            if (start === null || layerTimeRange.start < start) {
                start = layerTimeRange.start;
            }
            if (end === null || layerTimeRange.end < end) {
                end = layerTimeRange.end;
            }
        }
        return {
            start: start,
            end: end,
            delta: delta,
            deltaUnits: deltaUnits
        };
    };
    cloneTimestep = function(timestep) {
        if (timestep instanceof Date) {
            timestep = new Date(timestep.getTime());
        }
        return timestep;
    };
    this.gcs = function(arg) {
        if (arg === undefined) {
            return m_gcs;
        }
        m_gcs = arg;
        return m_this;
    };
    this.uigcs = function() {
        return m_uigcs;
    };
    this.node = function() {
        return m_node;
    };
    this.zoom = function(val) {
        if (val === undefined) {
            return m_zoom;
        }
        if (val !== m_zoom) {
            m_zoom = val;
            m_this.modified();
        }
        return m_this;
    };
    this.center = function(val) {
        if (val === undefined) {
            return m_center;
        }
        m_center = val.slice;
        m_this.modified();
        return m_this;
    };
    this.createLayer = function(layerName, arg) {
        var newLayer = geo.createLayer(layerName, m_this, arg);
        if (newLayer !== null || newLayer !== undefined) {
            newLayer._resize(m_x, m_y, m_width, m_height);
        } else {
            return null;
        }
        if (newLayer.referenceLayer() || m_this.children().length === 0) {
            m_this.baseLayer(newLayer);
        }
        m_this.addChild(newLayer);
        m_this.modified();
        m_this.trigger(geo.event.layerAdd, {
            type: geo.event.layerAdd,
            target: m_this,
            layer: newLayer
        });
        return newLayer;
    };
    this.deleteLayer = function(layer) {
        if (layer !== null && layer !== undefined) {
            layer._exit();
            m_this.removeChild(layer);
            m_this.modified();
            m_this.trigger(geo.event.layerRemove, {
                type: geo.event.layerRemove,
                target: m_this,
                layer: layer
            });
        }
        return layer;
    };
    this.toggle = function(layer) {
        if (layer !== null && layer !== undefined) {
            layer.visible(!layer.visible());
            m_this.modified();
            m_this.trigger(geo.event.layerToggle, {
                type: geo.event.layerToggle,
                target: m_this,
                layer: layer
            });
        }
        return m_this;
    };
    this.resize = function(x, y, w, h) {
        var i, layers = m_this.children();
        m_x = x;
        m_y = y;
        m_width = w;
        m_height = h;
        for (i = 0; i < layers.length; i += 1) {
            layers[i]._resize(x, y, w, h);
        }
        m_this.trigger(geo.event.resize, {
            type: geo.event.resize,
            target: m_this,
            x: m_x,
            y: m_y,
            width: w,
            height: h
        });
        m_this.modified();
        return m_this;
    };
    this.gcsToDisplay = function(input) {
        var world, output;
        if (input instanceof Array && input.length > 0 || input instanceof Object) {
            world = m_baseLayer.toLocal(input);
            output = m_baseLayer.renderer().worldToDisplay(world);
        } else {
            throw "Conversion method latLonToDisplay does not handle " + input;
        }
        return output;
    };
    this.displayToGcs = function(input) {
        var output;
        if (input instanceof Array && input.length > 0 || input instanceof Object) {
            output = m_baseLayer.renderer().displayToWorld(input);
            output = m_baseLayer.fromLocal(output);
        } else {
            throw "Conversion method latLonToDisplay does not handle " + input;
        }
        return output;
    };
    this.query = function() {};
    this.baseLayer = function(baseLayer) {
        if (baseLayer !== undefined) {
            if (m_gcs !== baseLayer.gcs()) {
                m_this.gcs(baseLayer.gcs());
            }
            m_baseLayer = baseLayer;
            m_baseLayer.referenceLayer(true);
            return m_this;
        }
        return m_baseLayer;
    };
    this.draw = function() {
        var i, layers = m_this.children();
        m_this.trigger(geo.event.draw, {
            type: geo.event.draw,
            target: m_this
        });
        m_this._update();
        for (i = 0; i < layers.length; i += 1) {
            layers[i].draw();
        }
        m_this.trigger(geo.event.drawEnd, {
            type: geo.event.drawEnd,
            target: m_this
        });
        return m_this;
    };
    this.animate = function(layers) {
        var animationRange;
        layers = layers === undefined ? m_this.children() : layers;
        if (m_animationState.timestep === null) {
            animationRange = calculateGlobalAnimationRange(layers);
            if (!animationRange.start || !animationRange.end) {
                throw "Animation range could not be calculated. " + "Check that layers have ranges associated with them";
            }
            m_animationState = {
                range: animationRange,
                timestep: cloneTimestep(animationRange.start),
                layers: layers
            };
        }
        m_this._animate();
        return m_this;
    };
    this.pauseAnimation = function() {
        m_this.trigger(geo.event.animationPause);
        return m_this;
    };
    this.stopAnimation = function() {
        m_this.trigger(geo.event.animationStop);
        m_animationState.timestep = null;
        return m_this;
    };
    this.stepAnimationForward = function(layers) {
        var animationRange;
        layers = layers === undefined ? m_animationState.layers : layers;
        if (layers === null) {
            layers = m_this.children();
        }
        if (m_animationState.timestep === null) {
            animationRange = calculateGlobalAnimationRange(layers);
            m_animationState = {
                range: animationRange,
                timestep: cloneTimestep(animationRange.start),
                layers: layers
            };
        }
        m_this._stepAnimationForward();
        return m_this;
    };
    this.stepAnimationBackward = function(layers) {
        var animationRange;
        layers = layers === undefined ? m_animationState.layers : layers;
        if (layers === null) {
            layers = m_this.children();
        }
        if (m_animationState.timestep === null) {
            animationRange = calculateGlobalAnimationRange(layers);
            m_animationState = {
                range: animationRange,
                timestep: cloneTimestep(animationRange.end),
                layers: layers
            };
        }
        m_this._stepAnimationBackward();
        return m_this;
    };
    this._animate = function() {
        var animationRange, nextTimestep, id;
        animationRange = m_animationState.range;
        nextTimestep = cloneTimestep(animationRange.start);
        m_stop = false;
        m_pause = false;
        nextTimestep = geo.time.incrementTime(nextTimestep, animationRange.deltaUnits, animationRange.delta);
        if (nextTimestep > animationRange.end) {
            throw "Invalid time range";
        }
        function renderTimestep() {
            if (m_animationState.timestep > animationRange.end || m_stop) {
                clearInterval(id);
                m_animationState.timestep = null;
                m_this.trigger(geo.event.animationComplete);
            } else if (m_pause) {
                clearInterval(id);
            } else {
                m_this._animateTimestep();
                m_animationState.timestep = geo.time.incrementTime(m_animationState.timestep, m_animationState.range.deltaUnits, m_animationState.range.delta);
            }
        }
        id = setInterval(renderTimestep, 10);
        return m_this;
    };
    this._animateTimestep = function() {
        if (m_animationState) {
            $.each(m_animationState.layers, function(i, layer) {
                var timestep = m_animationState.timestep;
                if (timestep instanceof Date) {
                    timestep = timestep.getTime();
                }
                layer._update({
                    timestep: timestep
                });
            });
            m_this.trigger(geo.event.animate, {
                timestep: m_animationState.timestep
            });
            m_this.draw();
        }
        return m_this;
    };
    this._stepAnimationForward = function() {
        var nextTimestep;
        if (m_animationState.timestep === null) {
            m_animationState.timestep = cloneTimestep(m_animationState.range.start);
        }
        nextTimestep = cloneTimestep(m_animationState.timestep);
        nextTimestep = geo.time.incrementTime(nextTimestep, m_animationState.range.deltaUnits, m_animationState.range.delta);
        if (nextTimestep <= m_animationState.range.end) {
            m_animationState.timestep = nextTimestep;
            m_this._animateTimestep();
        }
        return m_this;
    };
    this._stepAnimationBackward = function() {
        var previousTimestep;
        if (m_animationState.timestep === null) {
            m_animationState.timestep = cloneTimestep(m_animationState.range.end);
        }
        previousTimestep = cloneTimestep(m_animationState.timestep);
        previousTimestep = geo.time.incrementTime(previousTimestep, m_animationState.range.deltaUnits, -m_animationState.range.delta);
        if (previousTimestep < m_animationState.range.start) {
            return;
        }
        m_animationState.timestep = previousTimestep;
        m_this._animateTimestep();
        return m_this;
    };
    this.fileReader = function(readerType, opts) {
        var layer, renderer;
        opts = opts || {};
        if (!readerType) {
            return m_fileReader;
        }
        layer = opts.layer;
        if (!layer) {
            renderer = opts.renderer;
            if (!renderer) {
                renderer = "d3Renderer";
            }
            layer = m_this.createLayer("feature", {
                renderer: renderer
            });
        }
        opts.layer = layer;
        opts.renderer = renderer;
        m_fileReader = geo.createFileReader(readerType, opts);
        return m_this;
    };
    this._init = function(arg) {
        var i;
        if (m_node === undefined || m_node === null) {
            throw "Map require DIV node";
        }
        if (arg !== undefined && arg.layers !== undefined) {
            for (i = 0; i < arg.layers.length; i += 1) {
                if (i === 0) {
                    m_this.baseLayer(arg.layers[i]);
                }
                m_this.addLayer(arg.layers[i]);
            }
        }
        return m_this;
    };
    this._update = function(request) {
        var i, layers = m_this.children();
        for (i = 0; i < layers.length; i += 1) {
            layers[i]._update(request);
        }
        return m_this;
    };
    this._exit = function() {
        var i, layers = m_this.children();
        for (i = 0; i < layers.length; i += 1) {
            layers[i]._exit();
        }
    };
    this._init(arg);
    this.node().on("dragover", function(e) {
        var evt = e.originalEvent;
        if (m_this.fileReader()) {
            evt.stopPropagation();
            evt.preventDefault();
            evt.dataTransfer.dropEffect = "copy";
        }
    }).on("drop", function(e) {
        var evt = e.originalEvent, reader = m_this.fileReader(), i, file;
        function done() {
            m_this.draw();
        }
        if (reader) {
            evt.stopPropagation();
            evt.preventDefault();
            for (i = 0; i < evt.dataTransfer.files.length; i += 1) {
                file = evt.dataTransfer.files[i];
                if (reader.canRead(file)) {
                    reader.read(file, done);
                }
            }
        }
    });
    return this;
};

inherit(geo.map, geo.sceneObject);

geo.feature = function(arg) {
    "use strict";
    if (!(this instanceof geo.feature)) {
        return new geo.feature(arg);
    }
    geo.sceneObject.call(this);
    arg = arg || {};
    var m_this = this, m_style = {}, m_layer = arg.layer === undefined ? null : arg.layer, m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs, m_visible = arg.visible === undefined ? true : arg.visible, m_bin = arg.bin === undefined ? 0 : arg.bin, m_renderer = arg.renderer === undefined ? null : arg.renderer, m_dataTime = geo.timestamp(), m_buildTime = geo.timestamp(), m_updateTime = geo.timestamp();
    this.style = function(arg1, arg2) {
        if (arg1 === undefined) {
            return m_style;
        } else if (arg2 === undefined) {
            m_style = $.extend({}, m_style, arg1);
            m_this.modified();
            return m_this;
        } else {
            m_style[arg1] = arg2;
            m_this.modified();
            return m_this;
        }
    };
    this.layer = function() {
        return m_layer;
    };
    this.renderer = function() {
        return m_renderer;
    };
    this.drawables = function() {
        return m_this._drawables();
    };
    this.gcs = function(val) {
        if (val === undefined) {
            return m_gcs;
        } else {
            m_gcs = val;
            m_this.modified();
            return m_this;
        }
    };
    this.visible = function(val) {
        if (val === undefined) {
            return m_visible;
        } else {
            m_visible = val;
            m_this.modified();
            return m_this;
        }
    };
    this.bin = function(val) {
        if (val === undefined) {
            return m_bin;
        } else {
            m_bin = val;
            m_this.modified();
            return m_this;
        }
    };
    this.dataTime = function(val) {
        if (val === undefined) {
            return m_dataTime;
        } else {
            m_dataTime = val;
            m_this.modified();
            return m_this;
        }
    };
    this.buildTime = function(val) {
        if (val === undefined) {
            return m_buildTime;
        } else {
            m_buildTime = val;
            m_this.modified();
            return m_this;
        }
    };
    this.updateTime = function(val) {
        if (val === undefined) {
            return m_updateTime;
        } else {
            m_updateTime = val;
            m_this.modified();
            return m_this;
        }
    };
    this._init = function(arg) {
        if (!m_layer) {
            throw "Feature requires a valid layer";
        }
        m_style = $.extend({}, {
            opacity: 1
        }, arg.style === undefined ? {} : arg.style);
    };
    this._build = function() {};
    this._drawables = function() {};
    this._update = function() {};
    this._exit = function() {};
    this._init(arg);
    return this;
};

inherit(geo.feature, geo.sceneObject);

geo.pointFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.pointFeature)) {
        return new geo.pointFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    var m_this = this, m_positions = arg.positions === undefined ? null : arg.positions, s_init = this._init;
    this.positions = function(val) {
        if (val === undefined) {
            return m_positions;
        } else {
            m_positions = val.slice(0);
            m_this.dataTime().modified();
            m_this.modified();
            return m_this;
        }
    };
    this._init = function(arg) {
        s_init.call(m_this, arg);
        var defaultStyle = $.extend({}, {
            size: 1,
            width: 1,
            height: 1,
            color: [ 1, 1, 1 ],
            point_sprites: false,
            point_sprites_image: null
        }, arg.style === undefined ? {} : arg.style);
        m_this.style(defaultStyle);
        if (m_positions) {
            m_this.dataTime().modified();
        }
    };
    m_this._init(arg);
    return m_this;
};

inherit(geo.pointFeature, geo.feature);

geo.lineFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.lineFeature)) {
        return new geo.lineFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    var m_this = this, m_positions = arg.positions === undefined ? [] : arg.positions, s_init = this._init;
    this.positions = function(val) {
        if (val === undefined) {
            return m_positions;
        } else {
            m_positions = val.slice(0);
            m_this.dataTime().modified();
            m_this.modified();
            return m_this;
        }
    };
    this._init = function(arg) {
        s_init.call(m_this, arg);
        var defaultStyle = $.extend({}, {
            width: [ 1 ],
            color: [ 1, 1, 1 ],
            pattern: "solid"
        }, arg.style === undefined ? {} : arg.style);
        m_this.style(defaultStyle);
        if (m_positions) {
            m_this.dataTime().modified();
        }
    };
    this._init(arg);
    return this;
};

inherit(geo.lineFeature, geo.feature);

geo.pathFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.pathFeature)) {
        return new geo.pathFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    var m_this = this, m_positions = arg.positions === undefined ? [] : arg.positions, s_init = this._init;
    this.positions = function(val) {
        if (val === undefined) {
            return m_positions;
        }
        m_positions = val.slice(0);
        m_this.dataTime().modified();
        m_this.modified();
        return m_this;
    };
    this._init = function(arg) {
        s_init.call(m_this, arg);
        var defaultStyle = $.extend({}, {
            width: [ 1 ],
            color: [ 1, 1, 1 ],
            pattern: "solid"
        }, arg.style === undefined ? {} : arg.style);
        m_this.style(defaultStyle);
        if (m_positions) {
            m_this.dataTime().modified();
        }
    };
    this._init(arg);
    return this;
};

inherit(geo.pathFeature, geo.feature);

geo.polygonFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.polygonFeature)) {
        return new geo.polygonFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    var m_this = this, s_init = this._init;
    this._init = function(arg) {
        s_init.call(m_this, arg);
        var defaultStyle = $.extend({}, {
            color: [ 1, 1, 1 ],
            fill_color: [ 1, 1, 1 ],
            fill: true
        }, arg.style === undefined ? {} : arg.style);
        m_this.style(defaultStyle);
    };
    m_this._init(arg);
    return m_this;
};

inherit(geo.polygonFeature, geo.feature);

geo.planeFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.planeFeature)) {
        return new geo.planeFeature(arg);
    }
    arg = arg || {};
    arg.ul = arg.ul === undefined ? [ 0, 1, 0 ] : arg.ul;
    arg.lr = arg.lr === undefined ? [ 1, 0, 0 ] : arg.lr;
    arg.depth = arg.depth === undefined ? 0 : arg.depth;
    geo.polygonFeature.call(this, arg);
    var m_this = this, m_origin = [ arg.ul.x, arg.lr.y, arg.depth ], m_upperLeft = [ arg.ul.x, arg.ul.y, arg.depth ], m_lowerRight = [ arg.lr.x, arg.lr.y, arg.depth ], m_defaultDepth = arg.depth, m_drawOnAsyncResourceLoad = arg.drawOnAsyncResourceLoad === undefined ? true : false, s_init = this._init;
    this.origin = function(val) {
        if (val === undefined) {
            return m_origin;
        } else if (val instanceof Array) {
            if (val.length > 3 || val.length < 2) {
                throw "Upper left point requires point in 2 or 3 dimension";
            }
            m_origin = val.slice(0);
            if (m_origin.length === 2) {
                m_origin[2] = m_defaultDepth;
            }
        } else if (val instanceof geo.latlng) {
            m_origin = [ val.x(), val.y(), m_defaultDepth ];
        }
        m_this.dataTime().modified();
        m_this.modified();
        return m_this;
    };
    this.upperLeft = function(val) {
        if (val === undefined) {
            return m_upperLeft;
        } else if (val instanceof Array) {
            if (val.length > 3 || val.length < 2) {
                throw "Upper left point requires point in 2 or 3 dimension";
            }
            m_upperLeft = val.slice(0);
            if (m_upperLeft.length === 2) {
                m_upperLeft[2] = m_defaultDepth;
            }
        } else if (val instanceof geo.latlng) {
            m_upperLeft = [ val.x(), val.y(), m_defaultDepth ];
        }
        m_this.dataTime().modified();
        m_this.modified();
        return m_this;
    };
    this.lowerRight = function(val) {
        if (val === undefined) {
            return m_lowerRight;
        } else if (val instanceof Array) {
            if (val.length > 3 || val.length < 2) {
                throw "Upper left point requires point in 2 or 3 dimension";
            }
            m_lowerRight = val.slice(0);
            if (m_lowerRight.length === 2) {
                m_lowerRight[2] = m_defaultDepth;
            }
            m_this.dataTime().modified();
        } else if (val instanceof geo.latlng) {
            m_lowerRight = [ val.x(), val.y(), m_defaultDepth ];
        }
        m_this.dataTime().modified();
        m_this.modified();
        return m_this;
    };
    this.drawOnAsyncResourceLoad = function(val) {
        if (val === undefined) {
            return m_drawOnAsyncResourceLoad;
        } else {
            m_drawOnAsyncResourceLoad = val;
            return m_this;
        }
    };
    this._init = function(arg) {
        var style = null;
        s_init.call(m_this, arg);
        style = m_this.style();
        if (style.image === undefined) {
            style.image = null;
        }
        m_this.style(style);
    };
    this._init(arg);
    return this;
};

inherit(geo.planeFeature, geo.polygonFeature);

geo.geomFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.geomFeature)) {
        return new geo.geomFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    arg.style = arg.style === undefined ? $.extend({}, {
        color: [ 1, 1, 1 ],
        point_sprites: false,
        point_sprites_image: null
    }, arg.style) : arg.style;
    this.style(arg.style);
    return this;
};

inherit(geo.geomFeature, geo.feature);

geo.graphFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.graphFeature)) {
        return new geo.graphFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    var m_this = this, s_style = this.style, m_nodes = null, m_points = null, m_links = [], s_init = this._init, s_exit = this._exit;
    this._init = function(arg) {
        s_init.call(m_this, arg);
        var defaultStyle = $.extend(true, {}, {
            nodes: {
                size: 5,
                color: [ 0, 0, 1 ]
            },
            links: {
                color: [ 1, 1, 1 ]
            },
            linkType: "path"
        }, arg.style === undefined ? {} : arg.style);
        m_this.style(defaultStyle);
        if (m_nodes) {
            m_this.dataTime().modified();
        }
    };
    this._build = function() {
        m_this.children().forEach(function(child) {
            child._build();
        });
    };
    this._update = function() {
        m_this.children().forEach(function(child) {
            child._update();
        });
    };
    this._exit = function() {
        m_this.nodes([]);
        m_points._exit();
        m_this.removeChild(m_points);
        s_exit();
        return m_this;
    };
    this.style = function(arg) {
        var out = s_style.call(m_this, arg);
        if (out !== m_this) {
            return out;
        }
        m_points.style(arg.nodes);
        m_links.forEach(function(l) {
            l.style(arg.links);
        });
        return m_this;
    };
    this.nodes = function(val) {
        var layer = m_this.layer(), nLinks = 0, style;
        if (val === undefined) {
            return m_nodes;
        }
        style = m_this.style();
        m_nodes = val.slice(0);
        m_points.positions(m_nodes);
        m_nodes.forEach(function(source) {
            (source.children || []).forEach(function(target) {
                var link;
                nLinks += 1;
                if (m_links.length < nLinks) {
                    link = geo.createFeature(style.linkType, layer, layer.renderer()).style(style.links);
                    m_this.addChild(link);
                    m_links.push(link);
                }
                m_links[nLinks - 1].positions([ source, target ]);
            });
        });
        m_links.splice(nLinks, m_links.length - nLinks).forEach(function(l) {
            l._exit();
            m_this.removeChild(l);
        });
        m_this.dataTime().modified();
        m_this.modified();
        return m_this;
    };
    this.nodeFeature = function() {
        return m_points;
    };
    this.linkFeatures = function() {
        return m_links;
    };
    m_points = geo.createFeature("point", this.layer(), this.layer().renderer());
    m_this.addChild(m_points);
    if (arg.nodes) {
        this.nodes(arg.nodes);
    }
    this._init(arg);
    return this;
};

inherit(geo.graphFeature, geo.feature);

geo.transform = {};

geo.transform.osmTransformFeature = function(destGcs, feature, inplace) {
    "use strict";
    if (!feature) {
        console.log("[warning] Invalid (null) feature");
        return;
    }
    if (feature.gcs() === destGcs) {
        return;
    }
    if (!(feature instanceof geo.pointFeature || feature instanceof geo.lineFeature)) {
        throw "Supports only point or line feature";
    }
    var noOfComponents = null, pointOffset = 0, count = null, inPos = null, outPos = null, srcGcs = feature.gcs(), i, yCoord;
    inplace = !!inplace;
    if (feature instanceof geo.pointFeature || feature instanceof geo.lineFeature) {
        if (srcGcs !== "EPSG:4326") {
            geo.transform.transformFeature("EPSG:4326", feature, true);
        }
        inPos = feature.positions();
        count = inPos.length;
        if (!(inPos instanceof Array)) {
            throw "Supports Array of 2D and 3D points";
        }
        if (inPos.length > 0 && inPos[0] instanceof geo.latlng) {
            noOfComponents = 2;
            pointOffset = 1;
        } else {
            noOfComponents = count % 2 === 0 ? 2 : count % 3 === 0 ? 3 : null;
            pointOffset = noOfComponents;
        }
        if (noOfComponents !== 2 && noOfComponents !== 3) {
            throw "Transform points require points in 2D or 3D";
        }
        if (inplace) {
            outPos = inPos;
        } else {
            outPos = inPos.slice(0);
        }
        for (i = 0; i < count; i += pointOffset) {
            if (inPos[i] instanceof geo.latlng) {
                yCoord = inPos[i].lat();
            } else {
                yCoord = inPos[i + 1];
            }
            if (yCoord > 85.0511) {
                yCoord = 85.0511;
            }
            if (yCoord < -85.0511) {
                yCoord = -85.0511;
            }
            if (inPos[i] instanceof geo.latlng) {
                outPos[i] = geo.latlng(geo.mercator.lat2y(yCoord), outPos[i].lng());
            } else {
                outPos[i + 1] = geo.mercator.lat2y(yCoord);
            }
        }
        if (inplace) {
            feature.positions(outPos);
            feature.gcs(destGcs);
        }
        return outPos;
    }
    return null;
};

geo.transform.transformFeature = function(destGcs, feature, inplace) {
    "use strict";
    if (!feature) {
        throw "Invalid (null) feature";
    }
    if (!(feature instanceof geo.pointFeature || feature instanceof geo.lineFeature)) {
        throw "Supports only point or line feature";
    }
    if (feature.gcs() === destGcs) {
        return feature.positions();
    }
    if (destGcs === "EPSG:3857") {
        return geo.transform.osmTransformFeature(destGcs, feature, inplace);
    }
    var noOfComponents = null, pointOffset = 0, count = null, inPos = null, outPos = null, projPoint = null, srcGcs = feature.gcs(), i, projSrcGcs = new proj4.Proj(srcGcs), projDestGcs = new proj4.Proj(destGcs);
    inplace = !!inplace;
    if (feature instanceof geo.pointFeature || feature instanceof geo.lineFeature) {
        inPos = feature.positions();
        count = inPos.length;
        if (!(inPos instanceof Array)) {
            throw "Supports Array of 2D and 3D points";
        }
        if (inPos.length > 0 && inPos[0] instanceof geo.latlng) {
            noOfComponents = 2;
            pointOffset = 1;
        } else {
            noOfComponents = count % 2 === 0 ? 2 : count % 3 === 0 ? 3 : null;
            pointOffset = noOfComponents;
        }
        if (noOfComponents !== 2 && noOfComponents !== 3) {
            throw "Transform points require points in 2D or 3D";
        }
        if (inplace) {
            outPos = inPos;
        } else {
            outPos = [];
            outPos.length = inPos.length;
        }
        for (i = 0; i < count; i += pointOffset) {
            if (noOfComponents === 2) {
                projPoint = new proj4.Point(inPos[i], inPos[i + 1], 0);
            } else {
                projPoint = new proj4.Point(inPos[i], inPos[i + 1], inPos[i + 2]);
            }
            proj4.transform(projSrcGcs, projDestGcs, projPoint);
            if (noOfComponents === 2) {
                outPos[i] = projPoint.x;
                outPos[i + 1] = projPoint.y;
            } else {
                outPos[i] = projPoint.x;
                outPos[i + 1] = projPoint.y;
                outPos[i + 2] = projPoint.z;
            }
        }
        if (inplace) {
            feature.positions(outPos);
            feature.gcs(destGcs);
        }
        return outPos;
    }
    return null;
};

geo.transform.transformLayer = function(destGcs, layer, baseLayer) {
    "use strict";
    var features, count, i;
    if (!layer) {
        throw "Requires valid layer for tranformation";
    }
    if (!baseLayer) {
        throw "Requires baseLayer used by the map";
    }
    if (layer === baseLayer) {
        return;
    }
    if (layer instanceof geo.featureLayer) {
        features = layer.features();
        count = features.length;
        i = 0;
        for (i = 0; i < count; i += 1) {
            if (destGcs === "EPSG:3857" && baseLayer instanceof geo.osmLayer) {
                geo.transform.osmTransformFeature(destGcs, features[i], true);
            } else {
                geo.transform.transformFeature(destGcs, features[i], true);
            }
        }
        layer.gcs(destGcs);
    } else {
        throw "Only feature layer transformation is supported";
    }
};

geo.transform.transformCoordinates = function(srcGcs, destGcs, coordinates, numberOfComponents) {
    "use strict";
    var i, count, offset, xCoord, yCoord, zCoord, xAcc, yAcc, zAcc, writer, output, projPoint, projSrcGcs = new proj4.Proj(srcGcs), projDestGcs = new proj4.Proj(destGcs);
    zAcc = function() {
        return 0;
    };
    if (destGcs === srcGcs) {
        return coordinates;
    }
    if (!destGcs || !srcGcs) {
        throw "Invalid source or destination GCS";
    }
    function handleLatLngCoordinates() {
        if (coordinates[0] && coordinates[0] instanceof geo.latlng) {
            xAcc = function(index) {
                return coordinates[index].x();
            };
            yAcc = function(index) {
                return coordinates[index].y();
            };
            writer = function(index, x, y) {
                output[index] = geo.latlng(y, x);
            };
        } else {
            xAcc = function() {
                return coordinates.x();
            };
            yAcc = function() {
                return coordinates.y();
            };
            writer = function(index, x, y) {
                output = geo.latlng(y, x);
            };
        }
    }
    function handleArrayCoordinates() {
        if (coordinates[0] instanceof Array) {
            if (coordinates[0].length === 2) {
                xAcc = function(index) {
                    return coordinates[index][0];
                };
                yAcc = function(index) {
                    return coordinates[index][1];
                };
                writer = function(index, x, y) {
                    output[index] = [ x, y ];
                };
            } else if (coordinates[0].length === 3) {
                xAcc = function(index) {
                    return coordinates[index][0];
                };
                yAcc = function(index) {
                    return coordinates[index][1];
                };
                zAcc = function(index) {
                    return coordinates[index][2];
                };
                writer = function(index, x, y, z) {
                    output[index] = [ x, y, z ];
                };
            } else {
                throw "Invalid coordinates. Requires two or three components per array";
            }
        } else {
            if (coordinates.length === 2) {
                offset = 2;
                xAcc = function(index) {
                    return coordinates[index * offset];
                };
                yAcc = function(index) {
                    return coordinates[index * offset + 1];
                };
                writer = function(index, x, y) {
                    output[index] = x;
                    output[index + 1] = y;
                };
            } else if (coordinates.length === 3) {
                offset = 3;
                xAcc = function(index) {
                    return coordinates[index * offset];
                };
                yAcc = function(index) {
                    return coordinates[index * offset + 1];
                };
                zAcc = function(index) {
                    return coordinates[index * offset + 2];
                };
                writer = function(index, x, y, z) {
                    output[index] = x;
                    output[index + 1] = y;
                    output[index + 2] = z;
                };
            } else if (numberOfComponents) {
                if (numberOfComponents === 2 || numberOfComponents || 3) {
                    offset = numberOfComponents;
                    xAcc = function(index) {
                        return coordinates[index];
                    };
                    yAcc = function(index) {
                        return coordinates[index + 1];
                    };
                    if (numberOfComponents === 2) {
                        writer = function(index, x, y) {
                            output[index] = x;
                            output[index + 1] = y;
                        };
                    } else {
                        zAcc = function(index) {
                            return coordinates[index + 2];
                        };
                        writer = function(index, x, y, z) {
                            output[index] = x;
                            output[index + 1] = y;
                            output[index + 2] = z;
                        };
                    }
                } else {
                    throw "Number of components should be two or three";
                }
            } else {
                throw "Invalid coordinates";
            }
        }
    }
    function handleObjectCoordinates() {
        if (coordinates[0] && "x" in coordinates[0] && "y" in coordinates[0]) {
            xAcc = function(index) {
                return coordinates[index].x;
            };
            yAcc = function(index) {
                return coordinates[index].y;
            };
            if ("z" in coordinates[0]) {
                zAcc = function(index) {
                    return coordinates[index].z;
                };
                writer = function(index, x, y, z) {
                    output[i] = {
                        x: x,
                        y: y,
                        z: z
                    };
                };
            } else {
                writer = function(index, x, y) {
                    output[index] = {
                        x: x,
                        y: y
                    };
                };
            }
        } else if (coordinates && "x" in coordinates && "y" in coordinates) {
            xAcc = function() {
                return coordinates.x;
            };
            yAcc = function() {
                return coordinates.y;
            };
            if ("z" in coordinates) {
                zAcc = function() {
                    return coordinates.z;
                };
                writer = function(index, x, y, z) {
                    output = {
                        x: x,
                        y: y,
                        z: z
                    };
                };
            } else {
                writer = function(index, x, y) {
                    output = {
                        x: x,
                        y: y
                    };
                };
            }
        } else {
            throw "Invalid coordinates";
        }
    }
    if (coordinates instanceof Array) {
        output = [];
        output.length = coordinates.length;
        count = coordinates.length;
        if (coordinates[0] instanceof Array || coordinates[0] instanceof geo.latlng || coordinates[0] instanceof Object) {
            offset = 1;
            if (coordinates[0] instanceof Array) {
                handleArrayCoordinates();
            } else if (coordinates[0] instanceof geo.latlng) {
                handleLatLngCoordinates();
            } else if (coordinates[0] instanceof Object) {
                handleObjectCoordinates();
            }
        } else {
            handleArrayCoordinates();
        }
    } else if (coordinates && coordinates instanceof Object) {
        count = 1;
        offset = 1;
        if (coordinates instanceof geo.latlng) {
            handleLatLngCoordinates();
        } else if (coordinates && "x" in coordinates && "y" in coordinates) {
            handleObjectCoordinates();
        } else {
            throw "Coordinates are not valid";
        }
    }
    if (destGcs === "EPSG:3857" && srcGcs === "EPSG:4326") {
        for (i = 0; i < count; i += offset) {
            xCoord = xAcc(i);
            yCoord = yAcc(i);
            zCoord = zAcc(i);
            if (yCoord > 85.0511) {
                yCoord = 85.0511;
            }
            if (yCoord < -85.0511) {
                yCoord = -85.0511;
            }
            writer(i, xCoord, geo.mercator.lat2y(yCoord), zCoord);
        }
        return output;
    } else {
        for (i = 0; i < count; i += offset) {
            projPoint = new proj4.Point(xAcc(i), yAcc(i), zAcc(i));
            proj4.transform(projSrcGcs, projDestGcs, projPoint);
            writer(i, projPoint.x, projPoint.y, projPoint.z);
            return output;
        }
    }
};

geo.renderer = function(arg) {
    "use strict";
    if (!(this instanceof geo.renderer)) {
        return new geo.renderer(arg);
    }
    geo.sceneObject.call(this);
    arg = arg || {};
    var m_this = this, m_layer = arg.layer === undefined ? null : arg.layer, m_canvas = arg.canvas === undefined ? null : arg.canvas, m_initialized = false;
    this.layer = function() {
        return m_layer;
    };
    this.canvas = function(val) {
        if (val === undefined) {
            return m_canvas;
        } else {
            m_canvas = val;
            m_this.modified();
        }
    };
    this.map = function() {
        if (m_layer) {
            return m_layer.map();
        } else {
            return null;
        }
    };
    this.baseLayer = function() {
        if (m_this.map()) {
            return m_this.map().baseLayer();
        }
    };
    this.initialized = function(val) {
        if (val === undefined) {
            return m_initialized;
        } else {
            m_initialized = val;
            return m_this;
        }
    };
    this.api = function() {
        throw "Should be implemented by derivied classes";
    };
    this.reset = function() {
        return true;
    };
    this.worldToGcs = function() {
        throw "Should be implemented by derivied classes";
    };
    this.displayToGcs = function() {
        throw "Should be implemented by derivied classes";
    };
    this.gcsToDisplay = function() {
        throw "Should be implemented by derivied classes";
    };
    this.worldToDisplay = function() {
        throw "Should be implemented by derivied classes";
    };
    this.displayToWorld = function() {
        throw "Should be implemented by derivied classes";
    };
    this.relMouseCoords = function(event) {
        var totalOffsetX = 0, totalOffsetY = 0, canvasX = 0, canvasY = 0, currentElement = m_this.canvas();
        do {
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
            currentElement = currentElement.offsetParent;
        } while (currentElement);
        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
        return {
            x: canvasX,
            y: canvasY
        };
    };
    this._init = function() {};
    this._resize = function() {};
    this._render = function() {};
    this._exit = function() {};
    this._connectMouseEvents = function() {};
    return this;
};

inherit(geo.renderer, geo.sceneObject);

geo.osmLayer = function(arg) {
    "use strict";
    if (!(this instanceof geo.osmLayer)) {
        return new geo.osmLayer(arg);
    }
    geo.featureLayer.call(this, arg);
    var m_this = this, m_tiles = {}, m_hiddenBinNumber = 0, m_lastVisibleBinNumber = 999, m_visibleBinNumber = 1e3, m_pendingNewTiles = [], m_pendingInactiveTiles = [], m_numberOfCachedTiles = 0, m_tileCacheSize = 100, m_baseUrl = "http://tile.openstreetmap.org/", m_imageFormat = "png", m_updateTimerId = null, m_lastVisibleZoom = null, m_visibleTilesRange = {}, s_init = this._init, m_pendingNewTilesStat = {}, s_update = this._update, m_updateDefer = null;
    if (arg && arg.baseUrl !== undefined) {
        m_baseUrl = arg.baseUrl;
    }
    if (arg && arg.imageFormat !== undefined) {
        m_imageFormat = arg.imageFormat;
    }
    function getModifiedMapZoom() {
        if (m_this.map().zoom() < 18) {
            return m_this.map().zoom() + 1;
        } else {
            return m_this.map().zoom();
        }
    }
    function isTileVisible(tile) {
        if (tile.zoom in m_visibleTilesRange) {
            if (tile.index_x >= m_visibleTilesRange[tile.zoom].startX && tile.index_x <= m_visibleTilesRange[tile.zoom].endX && tile.index_y >= m_visibleTilesRange[tile.zoom].startY && tile.index_y <= m_visibleTilesRange[tile.zoom].endY) {
                return true;
            }
        }
        return false;
    }
    function drawTiles() {
        m_this._removeTiles();
        m_this.draw();
        delete m_pendingNewTilesStat[m_updateTimerId];
    }
    this.tileCacheSize = function(val) {
        if (val === undefined) {
            return m_tileCacheSize;
        }
        m_tileCacheSize = val;
        m_this.modified();
    };
    this.toLocal = function(input) {
        var i, output, delta;
        if (input instanceof Array && input.length > 0) {
            output = [];
            output.length = input.length;
            if (input[0] instanceof geo.latlng) {
                for (i = 0; i < input.length; i += 1) {
                    output[i] = geo.latlng(input[i]);
                    output[i].lat(geo.mercator.lat2y(output[i].lat()));
                }
            } else if (input[0] instanceof Array) {
                delta = input % 3 === 0 ? 3 : 2;
                if (delta === 2) {
                    for (i = 0; i < input.length; i += delta) {
                        output[i] = input[i];
                        output[i + 1] = geo.mercator.lat2y(input[i + 1]);
                    }
                } else {
                    for (i = 0; i < input.length; i += delta) {
                        output[i] = input[i];
                        output[i + 1] = geo.mercator.lat2y(input[i + 1]);
                        output[i + 2] = input[i + 2];
                    }
                }
            } else if (input[0] instanceof Object && "x" in input[0] && "y" in input[0] && "z" in input[0]) {
                output[i] = {
                    x: input[i].x,
                    y: geo.mercator.lat2y(input[i].y),
                    z: input[i].z
                };
            } else if (input[0] instanceof Object && "x" in input[0] && "y" in input[0] && "z" in input[0]) {
                output[i] = {
                    x: input[i].x,
                    y: geo.mercator.lat2y(input[i].y)
                };
            } else if (input.length >= 2) {
                output = input.slice(0);
                output[1] = geo.mercator.lat2y(input[1]);
            }
        } else if (input instanceof geo.latlng) {
            output = {};
            output.x = input.x();
            output.y = geo.mercator.lat2y(input.y());
        } else {
            output = {};
            output.x = input.x;
            output.y = geo.mercator.lat2y(input.y);
        }
        return output;
    };
    this.fromLocal = function(input) {
        var i, output;
        if (input instanceof Array && input.length > 0) {
            output = [];
            output.length = input.length;
            if (input[0] instanceof Object) {
                for (i = 0; i < input.length; i += 1) {
                    output[i] = {};
                    output[i].x = input[i].x;
                    output[i].y = geo.mercator.y2lat(input[i].y);
                }
            } else if (input[0] instanceof Array) {
                for (i = 0; i < input.length; i += 1) {
                    output[i] = input[i];
                    output[i][1] = geo.mercator.y2lat(input[i][1]);
                }
            } else {
                for (i = 0; i < input.length; i += 1) {
                    output[i] = input[i];
                    output[i + 1] = geo.mercator.y2lat(input[i + 1]);
                }
            }
        } else {
            output = {};
            output.x = input.x;
            output.y = geo.mercator.y2lat(input.y);
        }
        return output;
    };
    this._hasTile = function(zoom, x, y) {
        if (!m_tiles[zoom]) {
            return false;
        }
        if (!m_tiles[zoom][x]) {
            return false;
        }
        if (!m_tiles[zoom][x][y]) {
            return false;
        }
        return true;
    };
    this._addTile = function(request, zoom, x, y) {
        if (!m_tiles[zoom]) {
            m_tiles[zoom] = {};
        }
        if (!m_tiles[zoom][x]) {
            m_tiles[zoom][x] = {};
        }
        if (m_tiles[zoom][x][y]) {
            return;
        }
        var noOfTilesX = Math.max(1, Math.pow(2, zoom)), noOfTilesY = Math.max(1, Math.pow(2, zoom)), totalLatDegrees = 360, lonPerTile = 360 / noOfTilesX, latPerTile = totalLatDegrees / noOfTilesY, llx = -180 + x * lonPerTile, lly = -totalLatDegrees * .5 + y * latPerTile, urx = -180 + (x + 1) * lonPerTile, ury = -totalLatDegrees * .5 + (y + 1) * latPerTile, tile = new Image();
        tile.LOADING = true;
        tile.LOADED = false;
        tile.REMOVED = false;
        tile.REMOVING = false;
        tile.crossOrigin = "anonymous";
        tile.zoom = zoom;
        tile.index_x = x;
        tile.index_y = y;
        tile.llx = llx;
        tile.lly = lly;
        tile.urx = urx;
        tile.ury = ury;
        tile.lastused = new Date();
        tile.src = m_baseUrl + zoom + "/" + x + "/" + (Math.pow(2, zoom) - 1 - y) + "." + m_imageFormat;
        m_tiles[zoom][x][y] = tile;
        m_pendingNewTiles.push(tile);
        m_numberOfCachedTiles += 1;
        return tile;
    };
    this._removeTiles = function() {
        var i, x, y, tile, zoom, currZoom = getModifiedMapZoom(), lastZoom = m_lastVisibleZoom;
        if (!m_tiles) {
            return m_this;
        }
        for (zoom in m_tiles) {
            for (x in m_tiles[zoom]) {
                for (y in m_tiles[zoom][x]) {
                    tile = m_tiles[zoom][x][y];
                    if (tile) {
                        tile.REMOVING = true;
                        m_pendingInactiveTiles.push(tile);
                    }
                }
            }
        }
        m_pendingInactiveTiles.sort(function(a, b) {
            return a.lastused - b.lastused;
        });
        i = 0;
        while (m_numberOfCachedTiles > m_tileCacheSize && i < m_pendingInactiveTiles.length) {
            tile = m_pendingInactiveTiles[i];
            if (isTileVisible(tile)) {
                i += 1;
                continue;
            }
            m_this.deleteFeature(tile.feature);
            delete m_tiles[tile.zoom][tile.index_x][tile.index_y];
            m_pendingInactiveTiles.splice(i, 1);
            m_numberOfCachedTiles -= 1;
        }
        for (i = 0; i < m_pendingInactiveTiles.length; i += 1) {
            tile = m_pendingInactiveTiles[i];
            tile.REMOVING = false;
            tile.REMOVED = false;
            if (tile.zoom !== currZoom && tile.zoom === lastZoom) {
                tile.feature.bin(m_lastVisibleBinNumber);
            } else if (tile.zoom !== currZoom) {
                tile.feature.bin(m_hiddenBinNumber);
            } else {
                tile.lastused = new Date();
                tile.feature.bin(m_visibleBinNumber);
            }
            tile.feature._update();
        }
        m_pendingInactiveTiles = [];
        return m_this;
    };
    this._addTiles = function(request) {
        var feature, ren = m_this.renderer(), zoom = getModifiedMapZoom(), llx = 0, lly = m_this.height(), urx = m_this.width(), ury = 0, temp = null, tile = null, tile1x = null, tile1y = null, tile2x = null, tile2y = null, invJ = null, i = 0, j = 0, lastStartX, lastStartY, lastEndX, lastEndY, currStartX, currStartY, currEndX, currEndY, worldPt1 = ren.displayToWorld([ llx, lly ]), worldPt2 = ren.displayToWorld([ urx, ury ]);
        worldPt1[0] = Math.max(worldPt1[0], -180);
        worldPt1[0] = Math.min(worldPt1[0], 180);
        worldPt1[1] = Math.max(worldPt1[1], -180);
        worldPt1[1] = Math.min(worldPt1[1], 180);
        worldPt2[0] = Math.max(worldPt2[0], -180);
        worldPt2[0] = Math.min(worldPt2[0], 180);
        worldPt2[1] = Math.max(worldPt2[1], -180);
        worldPt2[1] = Math.min(worldPt2[1], 180);
        tile1x = geo.mercator.long2tilex(worldPt1[0], zoom);
        tile1y = geo.mercator.lat2tiley(worldPt1[1], zoom);
        tile2x = geo.mercator.long2tilex(worldPt2[0], zoom);
        tile2y = geo.mercator.lat2tiley(worldPt2[1], zoom);
        tile1x = Math.max(tile1x, 0);
        tile1x = Math.min(Math.pow(2, zoom) - 1, tile1x);
        tile1y = Math.max(tile1y, 0);
        tile1y = Math.min(Math.pow(2, zoom) - 1, tile1y);
        tile2x = Math.max(tile2x, 0);
        tile2x = Math.min(Math.pow(2, zoom) - 1, tile2x);
        tile2y = Math.max(tile2y, 0);
        tile2y = Math.min(Math.pow(2, zoom) - 1, tile2y);
        if (tile1x > tile2x) {
            temp = tile1x;
            tile1x = tile2x;
            tile2x = temp;
        }
        if (tile2y > tile1y) {
            temp = tile1y;
            tile1y = tile2y;
            tile2y = temp;
        }
        currStartX = tile1x;
        currEndX = tile2x;
        currStartY = Math.pow(2, zoom) - 1 - tile1y;
        currEndY = Math.pow(2, zoom) - 1 - tile2y;
        if (currEndY < currStartY) {
            temp = currStartY;
            currStartY = currEndY;
            currEndY = temp;
        }
        lastStartX = geo.mercator.long2tilex(worldPt1[0], m_lastVisibleZoom);
        lastStartY = geo.mercator.lat2tiley(worldPt1[1], m_lastVisibleZoom);
        lastEndX = geo.mercator.long2tilex(worldPt2[0], m_lastVisibleZoom);
        lastEndY = geo.mercator.lat2tiley(worldPt2[1], m_lastVisibleZoom);
        lastStartY = Math.pow(2, m_lastVisibleZoom) - 1 - lastStartY;
        lastEndY = Math.pow(2, m_lastVisibleZoom) - 1 - lastEndY;
        if (lastEndY < lastStartY) {
            temp = lastStartY;
            lastStartY = lastEndY;
            lastEndY = temp;
        }
        m_visibleTilesRange = {};
        m_visibleTilesRange[zoom] = {
            startX: currStartX,
            endX: currEndX,
            startY: currStartY,
            endY: currEndY
        };
        m_visibleTilesRange[m_lastVisibleZoom] = {
            startX: lastStartX,
            endX: lastEndX,
            startY: lastStartY,
            endY: lastEndY
        };
        m_pendingNewTilesStat[m_updateTimerId] = {
            total: (tile2x - tile1x + 1) * (tile1y - tile2y + 1),
            count: 0
        };
        for (i = tile1x; i <= tile2x; i += 1) {
            for (j = tile2y; j <= tile1y; j += 1) {
                invJ = Math.pow(2, zoom) - 1 - j;
                if (!m_this._hasTile(zoom, i, invJ)) {
                    tile = m_this._addTile(request, zoom, i, invJ);
                } else {
                    tile = m_tiles[zoom][i][invJ];
                    tile.feature.bin(m_visibleBinNumber);
                    if (tile.LOADED && m_updateTimerId in m_pendingNewTilesStat) {
                        m_pendingNewTilesStat[m_updateTimerId].count += 1;
                    }
                    tile.lastused = new Date();
                    tile.feature._update();
                }
                tile.updateTimerId = m_updateTimerId;
            }
        }
        function tileOnLoad(tile) {
            var defer = $.Deferred();
            m_this.addDeferred(defer);
            return function() {
                tile.LOADING = false;
                tile.LOADED = true;
                if ((tile.REMOVING || tile.REMOVED) && tile.feature && tile.zoom !== getModifiedMapZoom()) {
                    tile.feature.bin(m_hiddenBinNumber);
                    tile.REMOVING = false;
                    tile.REMOVED = true;
                } else {
                    tile.REMOVED = false;
                    tile.lastused = new Date();
                    tile.feature.bin(m_visibleBinNumber);
                }
                if (tile.updateTimerId === m_updateTimerId && m_updateTimerId in m_pendingNewTilesStat) {
                    tile.feature.bin(m_visibleBinNumber);
                    m_pendingNewTilesStat[m_updateTimerId].count += 1;
                } else {
                    tile.REMOVED = true;
                    tile.feature.bin(m_hiddenBinNumber);
                }
                tile.feature._update();
                if (m_updateTimerId in m_pendingNewTilesStat && m_pendingNewTilesStat[m_updateTimerId].count >= m_pendingNewTilesStat[m_updateTimerId].total) {
                    drawTiles();
                }
                defer.resolve();
            };
        }
        for (i = 0; i < m_pendingNewTiles.length; i += 1) {
            tile = m_pendingNewTiles[i];
            feature = m_this.createFeature("plane", {
                drawOnAsyncResourceLoad: false,
                onload: tileOnLoad(tile)
            }).origin([ tile.llx, tile.lly ]).upperLeft([ tile.llx, tile.ury ]).lowerRight([ tile.urx, tile.lly ]).gcs("EPSG:3857").style("image", tile);
            tile.feature = feature;
            tile.feature._update();
        }
        m_pendingNewTiles = [];
        if (m_updateTimerId in m_pendingNewTilesStat && m_pendingNewTilesStat[m_updateTimerId].count >= m_pendingNewTilesStat[m_updateTimerId].total) {
            drawTiles();
        }
    };
    function updateOSMTiles(request) {
        if (request === undefined) {
            request = {};
        }
        var zoom = getModifiedMapZoom();
        if (!m_lastVisibleZoom) {
            m_lastVisibleZoom = zoom;
        }
        m_this._addTiles(request);
        if (m_lastVisibleZoom !== zoom) {
            m_lastVisibleZoom = zoom;
        }
        m_this.updateTime().modified();
    }
    this._updateTiles = function(request) {
        var defer = $.Deferred();
        m_this.addDeferred(defer);
        if (m_updateTimerId !== null) {
            clearTimeout(m_updateTimerId);
            m_updateDefer.resolve();
            m_updateDefer = defer;
            if (m_updateTimerId in m_pendingNewTilesStat) {
                delete m_pendingNewTilesStat[m_updateTimerId];
            }
            m_updateTimerId = setTimeout(function() {
                updateOSMTiles(request);
                m_updateDefer.resolve();
            }, 100);
        } else {
            m_updateDefer = defer;
            m_updateTimerId = setTimeout(function() {
                updateOSMTiles(request);
                m_updateDefer.resolve();
            }, 0);
        }
        return m_this;
    };
    this._init = function() {
        s_init.call(m_this);
        this.gcs("EPSG:3857");
        return m_this;
    };
    this._update = function(request) {
        m_this._updateTiles(request);
        s_update.call(m_this, request);
    };
    return this;
};

inherit(geo.osmLayer, geo.featureLayer);

geo.registerLayer("osm", geo.osmLayer);

ggl = ogs.namespace("geo.gl");

ggl.renderer = function(arg) {
    "use strict";
    if (!(this instanceof ggl.renderer)) {
        return new ggl.renderer(arg);
    }
    geo.renderer.call(this, arg);
    this.contextRenderer = function() {
        throw "Should be implemented by derived classes";
    };
    return this;
};

inherit(ggl.renderer, geo.renderer);

geo.registerRenderer("vglRenderer", ggl.vglRenderer);

ggl.lineFeature = function(arg) {
    "use strict";
    if (!(this instanceof ggl.lineFeature)) {
        return new ggl.lineFeature(arg);
    }
    arg = arg || {};
    geo.lineFeature.call(this, arg);
    var m_this = this, m_actor = null, s_init = this._init, s_update = this._update;
    this._init = function(arg) {
        s_init.call(m_this, arg);
    };
    this._build = function() {
        var style = m_this.style();
        if (m_actor) {
            m_this.renderer().contextRenderer().removeActor(m_actor);
        }
        m_actor = vgl.utils.createLines(m_this.positions(), style.colors);
        m_this.renderer().contextRenderer().addActor(m_actor);
        m_this.buildTime().modified();
    };
    this._update = function() {
        var style = m_this.style();
        s_update.call(m_this);
        if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime()) {
            m_this._build();
        }
        if (m_this.updateTime().getMTime() <= m_this.getMTime()) {
            if (m_this.style.color instanceof vgl.lookupTable) {
                vgl.utils.updateColorMappedMaterial(m_this.material(), m_this.style.color);
            }
            m_actor.setVisible(m_this.visible());
            m_actor.material().setBinNumber(m_this.bin());
            if (style.size) {
                m_actor.material().shaderProgram().uniform("pointSize").set(style.size);
            }
        }
        m_this.updateTime().modified();
    };
    this._exit = function() {
        m_this.renderer().contextRenderer().removeActor(m_actor);
    };
    this._init(arg);
    return this;
};

inherit(ggl.lineFeature, geo.lineFeature);

geo.registerFeature("vgl", "line", ggl.lineFeature);

ggl.pointFeature = function(arg) {
    "use strict";
    if (!(this instanceof ggl.pointFeature)) {
        return new ggl.pointFeature(arg);
    }
    arg = arg || {};
    geo.pointFeature.call(this, arg);
    var m_this = this, m_actor = null, s_init = this._init, s_update = this._update;
    this._init = function(arg) {
        s_init.call(m_this, arg);
    };
    this._build = function() {
        var style = m_this.style(), positions = geo.transform.transformFeature(m_this.renderer().map().gcs(), m_this, false);
        if (m_actor) {
            m_this.renderer().contextRenderer().removeActor(m_actor);
        }
        if (style.point_sprites === true) {
            if (style.point_sprites_image === null) {
                throw "[error] Invalid image for point sprites";
            }
            m_actor = vgl.utils.createPointSprites(style.point_sprites_image, positions, style.colors);
        } else {
            m_actor = vgl.utils.createPoints(positions, style.colors);
        }
        m_this.renderer().contextRenderer().addActor(m_actor);
        m_this.buildTime().modified();
    };
    this._update = function() {
        var style = m_this.style();
        s_update.call(m_this);
        if (m_this.dataTime().getMTime() >= m_this.buildTime().getMTime()) {
            m_this._build();
        }
        if (m_this.updateTime().getMTime() <= m_this.getMTime()) {
            if (m_this.style.color instanceof vgl.lookupTable) {
                vgl.utils.updateColorMappedMaterial(m_this.material(), m_this.style.color);
            }
            if (style.point_sprites === true) {
                if (style.point_sprites_image === null) {
                    throw "[error] Invalid image for point sprites";
                }
                if (style.width && style.height) {
                    m_actor.material().shaderProgram().uniform("pointSize").set([ style.width, style.height ]);
                } else if (style.size) {
                    m_actor.material().shaderProgram().uniform("pointSize").set([ style.size, style.size ]);
                }
            } else {
                if (style.size) {
                    m_actor.material().shaderProgram().uniform("pointSize").set(style.size);
                }
            }
        }
        m_this.updateTime().modified();
    };
    this._exit = function() {
        m_this.renderer().contextRenderer().removeActor(m_actor);
    };
    this._init(arg);
    return this;
};

inherit(ggl.pointFeature, geo.pointFeature);

geo.registerFeature("vgl", "point", ggl.pointFeature);

ggl.geomFeature = function(arg) {
    "use strict";
    if (!(this instanceof ggl.geomFeature)) {
        return new ggl.geomFeature(arg);
    }
    arg = arg || {};
    geo.geomFeature.call(this, arg);
    var m_this = this, m_geom = arg.geom || null, m_actor = vgl.actor(), m_mapper = vgl.mapper(), m_material = null, m_scalar = null, m_color = arg.color || [ 1, 1, 1 ], m_buildTime = null, m_noOfPrimitives = 0;
    this._build = function() {
        var style = m_this.style();
        if (m_geom !== null) {
            m_scalar = m_geom.sourceData(vgl.vertexAttributeKeys.Scalar);
            m_color = m_geom.sourceData(vgl.vertexAttributeKeys.Color);
            m_mapper.setGeometryData(m_geom);
        }
        this.setMapper(m_mapper);
        if (style.point_sprites !== undefined && style.point_sprites && style.point_sprites_image !== undefined && style.point_sprites_image !== null && m_noOfPrimitives === 1 && m_geom.primitive(0).primitiveType() === gl.POINTS) {
            m_material = vgl.utils.createPointSpritesMaterial(style.point_sprites_image);
        } else if (m_scalar) {
            if (m_color instanceof vgl.lookupTable) {
                m_color.updateRange(m_scalar.scalarRange());
                m_material = vgl.utils.createColorMappedMaterial(m_color);
            } else {
                m_color = vgl.lookupTable();
                m_color.updateRange(m_scalar.scalarRange());
                m_material = vgl.utils.createColorMappedMaterial(m_color);
            }
        } else if (m_color) {
            m_material = vgl.utils.createColorMaterial();
        } else {
            m_material = vgl.utils.createSolidColorMaterial();
        }
        m_actor.setMaterial(m_material);
    };
    this._update = function() {
        if (m_buildTime && m_buildTime.getMTime() < m_this.getMTime()) {
            if (m_color instanceof vgl.lookupTable) {
                vgl.utils.updateColorMappedMaterial(m_this.material(), m_this.style.color);
            } else {}
        } else {
            m_buildTime = vgl.timestamp();
            m_buildTime.modified();
        }
    };
    this.geometry = function(val) {
        if (val === undefined) {
            return m_geom;
        } else {
            m_geom = val;
            m_this.modified();
            return m_this;
        }
    };
    return this;
};

inherit(ggl.geomFeature, geo.geomFeature);

ggl.planeFeature = function(arg) {
    "use strict";
    if (!(this instanceof ggl.planeFeature)) {
        return new ggl.planeFeature(arg);
    }
    geo.planeFeature.call(this, arg);
    var m_this = this, m_actor = null, m_onloadCallback = arg.onload === undefined ? null : arg.onload;
    this.coords = function() {
        return [ m_this.origin(), m_this.upperLeft(), m_this.lowerRight() ];
    };
    this._build = function() {
        var or = m_this.origin(), ul = m_this.upperLeft(), lr = m_this.lowerRight(), img = m_this.style().image, image = null, texture = null;
        or = geo.transform.transformCoordinates(m_this.gcs(), m_this.layer().map().gcs(), or);
        ul = geo.transform.transformCoordinates(m_this.gcs(), m_this.layer().map().gcs(), ul);
        lr = geo.transform.transformCoordinates(m_this.gcs(), m_this.layer().map().gcs(), lr);
        m_this.buildTime().modified();
        if (m_actor) {
            m_this.renderer().contextRenderer().removeActor(m_actor);
        }
        if (img && img instanceof Image) {
            image = img;
        } else if (img) {
            image = new Image();
            image.src = img;
        }
        if (!image) {
            m_actor = vgl.utils.createPlane(or[0], or[1], or[2], ul[0], ul[1], ul[2], lr[0], lr[1], lr[2]);
            m_this.renderer().contextRenderer().addActor(m_actor);
        } else {
            m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2], lr[0], lr[1], lr[2], ul[0], ul[1], ul[2], true);
            texture = vgl.texture();
            m_this.visible(false);
            m_this.renderer().contextRenderer().addActor(m_actor);
            if (image.complete) {
                texture.setImage(image);
                m_actor.material().addAttribute(texture);
                m_this.visible(true);
                if (m_onloadCallback) {
                    m_onloadCallback.call(m_this);
                }
            } else {
                image.onload = function() {
                    texture.setImage(image);
                    m_actor.material().addAttribute(texture);
                    m_this.visible(true);
                    if (m_onloadCallback) {
                        m_onloadCallback.call(m_this);
                    }
                    if (m_this.drawOnAsyncResourceLoad()) {
                        m_this._update();
                        m_this.layer()._draw();
                    }
                };
            }
        }
    };
    this._update = function() {
        if (m_this.buildTime().getMTime() <= m_this.dataTime().getMTime()) {
            m_this._build();
        }
        if (m_this.updateTime().getMTime() <= m_this.getMTime()) {
            m_actor.setVisible(m_this.visible());
            m_actor.material().setBinNumber(m_this.bin());
        }
        m_this.updateTime().modified();
    };
    this._exit = function() {
        m_this.renderer().contextRenderer().removeActor(m_actor);
    };
    return this;
};

inherit(ggl.planeFeature, geo.planeFeature);

geo.registerFeature("vgl", "plane", ggl.planeFeature);

ggl.mapInteractorStyle = function() {
    "use strict";
    if (!(this instanceof ggl.mapInteractorStyle)) {
        return new ggl.mapInteractorStyle();
    }
    vgl.interactorStyle.call(this);
    var m_map, m_this = this, m_leftMouseButtonDown = false, m_rightMouseButtonDown = false, m_middileMouseButtonDown = false, m_initRightBtnMouseDown = false, m_drawRegionMode = false, m_drawRegionLayer, m_clickLatLng, m_width, m_height, m_renderer, m_renderWindow, m_camera, m_outsideCanvas, m_currentMousePos = {
        x: 0,
        y: 0
    }, m_focusDisplayPoint, m_zTrans, m_coords, m_lastMousePos = {
        x: 0,
        y: 0
    }, m_useLastDirection = false, m_lastDirection = null, m_picker = new vgl.picker(), m_updateRenderParamsTime = vgl.timestamp();
    this.map = function(val) {
        if (val !== undefined) {
            m_map = val;
            return m_this;
        }
        return m_map;
    };
    this.drawRegionMode = function(val) {
        if (val !== undefined) {
            m_drawRegionMode = val;
            if (m_drawRegionLayer) {
                m_drawRegionLayer.setVisible(val);
            }
            m_map.draw();
            return m_this;
        }
        return m_drawRegionMode;
    };
    this._panCamera = function(renderer) {
        var worldPt1, worldPt2, dx, dy, dz, focusDisplayPoint = renderer.focusDisplayPoint();
        worldPt1 = m_renderWindow.displayToWorld(m_currentMousePos.x, m_currentMousePos.y, focusDisplayPoint, renderer);
        worldPt2 = m_renderWindow.displayToWorld(m_lastMousePos.x, m_lastMousePos.y, focusDisplayPoint, renderer);
        dx = worldPt1[0] - worldPt2[0];
        dy = worldPt1[1] - worldPt2[1];
        dz = worldPt1[2] - worldPt2[2];
        renderer.camera().pan(-dx, -dy, -dz);
    };
    this.handleMouseMove = function(event) {
        var mouseWorldPoint, lastWorldPos, currWorldPos, evt, i, renderers;
        m_this.updateRenderParams();
        m_this._computeCurrentMousePos(event);
        if (m_outsideCanvas === true) {
            return true;
        }
        if (m_leftMouseButtonDown) {
            if (m_drawRegionMode) {
                mouseWorldPoint = m_map.displayToMap(m_currentMousePos.x, m_currentMousePos.y);
                m_this.setDrawRegion(m_clickLatLng.lat(), m_clickLatLng.lng(), mouseWorldPoint.y, mouseWorldPoint.x);
            } else {
                lastWorldPos = m_camera.position();
                renderers = m_renderWindow.renderers();
                for (i = 0; i < renderers.length; i += 1) {
                    m_this._panCamera(renderers[i]);
                }
                currWorldPos = m_camera.position();
                evt = {
                    type: geo.event.pan,
                    last_display_pos: m_lastMousePos,
                    curr_display_pos: m_currentMousePos,
                    last_world_pos: lastWorldPos,
                    curr_world_pos: currWorldPos
                };
                $(m_this).trigger(evt);
            }
        }
        if (m_middileMouseButtonDown) {}
        if (m_rightMouseButtonDown && m_height > 0) {
            if (m_lastDirection !== null) {
                m_useLastDirection = true;
            }
            m_this.zoom();
        }
        m_lastMousePos.x = m_currentMousePos.x;
        m_lastMousePos.y = m_currentMousePos.y;
        return false;
    };
    this.handleMouseDown = function(event) {
        var point;
        m_this.updateRenderParams();
        m_this._computeCurrentMousePos(event);
        if (event.button === 0) {
            m_leftMouseButtonDown = true;
        }
        if (event.button === 1) {
            m_middileMouseButtonDown = true;
        }
        if (event.button === 2) {
            m_rightMouseButtonDown = true;
        }
        m_coords = m_this.viewer().relMouseCoords(event);
        if (m_coords.x < 0) {
            m_lastMousePos.x = 0;
        } else {
            m_lastMousePos.x = m_coords.x;
        }
        if (m_coords.y < 0) {
            m_lastMousePos.y = 0;
        } else {
            m_lastMousePos.y = m_coords.y;
        }
        if (m_drawRegionMode && m_leftMouseButtonDown) {
            point = m_map.displayToMap(m_lastMousePos.x, m_lastMousePos.y);
            m_clickLatLng = geo.latlng(point.y, point.x);
            m_this.setDrawRegion(point.y, point.x, point.y, point.x);
        }
        m_lastMousePos.x = m_currentMousePos.x;
        m_lastMousePos.y = m_currentMousePos.y;
        return false;
    };
    this.handleMouseUp = function(event) {
        var width = null, height = null, num = null;
        m_this.updateRenderParams();
        if (event.button === 0) {
            m_leftMouseButtonDown = false;
            width = m_this.viewer().renderWindow().windowSize()[0];
            height = m_this.viewer().renderWindow().windowSize()[1];
            m_renderer = m_this.viewer().renderWindow().activeRenderer();
            if (m_lastMousePos.x >= 0 && m_lastMousePos.x <= width && m_lastMousePos.y >= 0 && m_lastMousePos.y <= height) {
                num = m_picker.pick(m_lastMousePos.x, m_lastMousePos.y, m_renderer);
            }
        }
        if (event.button === 1) {
            m_middileMouseButtonDown = false;
        }
        if (event.button === 2) {
            m_rightMouseButtonDown = false;
            m_initRightBtnMouseDown = false;
            m_useLastDirection = false;
            m_lastDirection = null;
            m_this._computeCurrentMousePos(event);
        }
        return false;
    };
    this.handleMouseOut = function() {
        m_this.updateRenderParams();
        if (m_leftMouseButtonDown) {
            m_leftMouseButtonDown = false;
        } else if (m_middileMouseButtonDown) {
            m_middileMouseButtonDown = false;
        }
        if (m_rightMouseButtonDown) {
            m_rightMouseButtonDown = false;
            m_initRightBtnMouseDown = false;
            m_this.zoom();
        }
        return false;
    };
    this.handleMouseWheel = function(event) {
        m_this.updateRenderParams();
        var delta = event.originalEvent.wheelDeltaY / 120, deltaIsPositive, speed = .05;
        deltaIsPositive = delta >= 0 ? true : false;
        delta = Math.pow(1 + Math.abs(delta) / 2, delta > 0 ? -1 : 1);
        delta *= speed;
        m_this._computeCurrentMousePos(event);
        m_this.zoom(delta, !deltaIsPositive);
        return false;
    };
    this.handleDoubleClick = function() {
        m_this.zoom(.5, false);
        return false;
    };
    this._syncZoom = function(val, dir) {
        var i, renderers, pos, fp, cam, clipRange, gap, minGap = .01;
        m_this.updateRenderParams();
        if (val) {
            m_camera.zoom(val, dir);
            if (dir) {
                pos = m_camera.position();
                fp = m_camera.focalPoint();
                m_camera.setFocalPoint(pos[0], pos[1], fp[2]);
            }
            m_renderer.resetCameraClippingRange();
        }
        pos = m_camera.position();
        fp = m_camera.focalPoint();
        gap = vec3.distance(pos, fp);
        if (!dir) {
            dir = m_camera.directionOfProjection();
        }
        clipRange = m_camera.clippingRange();
        if (vec3.dot(dir, m_camera.directionOfProjection()) > 0 && (Math.abs(gap) < minGap || clipRange[0] < minGap)) {
            pos[0] = fp[0] + minGap * dir[0];
            pos[1] = fp[1] + minGap * dir[1];
            pos[2] = fp[2] - minGap * dir[2];
            m_camera.setPosition(pos[0], pos[1], pos[2]);
            m_camera.setFocalPoint(pos[0], pos[1], fp[2]);
            m_renderer.resetCameraClippingRange();
        }
        pos = m_camera.position();
        fp = m_camera.focalPoint();
        renderers = m_renderWindow.renderers();
        for (i = 0; i < renderers.length; i += 1) {
            cam = renderers[i].camera();
            if (cam !== m_camera) {
                cam.setPosition(pos[0], pos[1], pos[2]);
                cam.setFocalPoint(fp[0], fp[1], fp[2]);
                renderers[i].resetCameraClippingRange();
                renderers[i].render();
            }
        }
    };
    this._syncReset = function() {
        var i, renderers, pos, fp, zoom, center, cam, clippingRange;
        m_this.updateRenderParams();
        zoom = m_map.zoom();
        center = m_map.center();
        fp = m_camera.focalPoint();
        center = m_map.baseLayer().toLocal(geo.latlng(center[0], center[1]));
        if (center instanceof Object && "x" in center && "y" in center && m_map.baseLayer() instanceof geo.osmLayer) {
            m_camera.setPosition(center.x, center.y, computeCameraDistance(zoom));
            m_camera.setFocalPoint(center.x, center.y, fp[2]);
            m_renderer.resetCameraClippingRange();
        }
        fp = m_camera.focalPoint();
        pos = m_camera.position();
        clippingRange = m_camera.clippingRange();
        renderers = m_renderWindow.renderers();
        for (i = 0; i < renderers.length; i += 1) {
            cam = renderers[i].camera();
            if (cam !== m_camera) {
                cam.setPosition(pos[0], pos[1], pos[2]);
                cam.setFocalPoint(fp[0], fp[1], fp[2]);
                cam.setClippingRange(clippingRange[0], clippingRange[1]);
                renderers[i].render();
            }
        }
    };
    this._syncPan = function() {};
    this.zoom = function(val, zoomOut) {
        var evt, newZoomLevel, oldZoomLevel, cameraPos, cameraFp, newPos, clickedWorldPoint, direction, focusDisplayPoint, maxZoomedOutDist = 0, maxZoomedOut = false;
        m_this.updateRenderParams();
        m_zTrans = (m_currentMousePos.y - m_lastMousePos.y) / m_height;
        if (val === undefined) {
            val = 2 * Math.abs(m_zTrans);
        }
        oldZoomLevel = computeZoomLevel();
        focusDisplayPoint = m_renderer.focusDisplayPoint();
        clickedWorldPoint = m_renderWindow.displayToWorld(m_currentMousePos.x, m_currentMousePos.y, focusDisplayPoint, m_renderer);
        cameraPos = m_camera.position();
        cameraFp = m_camera.focalPoint();
        direction = [ clickedWorldPoint[0] - cameraPos[0], clickedWorldPoint[1] - cameraPos[1], clickedWorldPoint[2] - cameraPos[2] ];
        vec3.normalize(direction, direction);
        if (m_useLastDirection) {
            direction = m_lastDirection.slice(0);
        } else {
            m_lastDirection = direction.slice(0);
        }
        if (m_lastMousePos.y - m_currentMousePos.y < 0 || zoomOut) {
            direction[0] = -direction[0];
            direction[1] = -direction[1];
            direction[2] = -direction[2];
        }
        if (cameraPos[2] * Math.sin(m_camera.viewAngle()) >= 360 && zoomOut) {
            maxZoomedOut = true;
        } else {
            this._syncZoom(val, direction);
            newZoomLevel = computeZoomLevel();
        }
        cameraPos = m_camera.position();
        cameraFp = m_camera.focalPoint();
        if (maxZoomedOut || cameraPos[2] * Math.sin(m_camera.viewAngle()) >= 360) {
            maxZoomedOut = false;
            maxZoomedOutDist = computeCameraDistance(0);
            newPos = [ (maxZoomedOutDist - cameraPos[2]) * direction[0] / direction[2], (maxZoomedOutDist - cameraPos[2]) * direction[1] / direction[2] ];
            m_camera.setPosition(cameraPos[0] + newPos[0], cameraPos[1] + newPos[1], maxZoomedOutDist);
            m_camera.setFocalPoint(cameraPos[0] + newPos[0], cameraPos[1] + newPos[1], cameraFp[2]);
            m_renderer.resetCameraClippingRange();
            newZoomLevel = 0;
            this._syncZoom();
        }
        evt = {
            type: geo.event.zoom,
            curr_zoom: newZoomLevel,
            last_zoom: oldZoomLevel
        };
        $(m_this).trigger(evt);
    };
    this.lastMousePosition = function(newPosition) {
        if (newPosition !== undefined) {
            m_lastMousePos = newPosition;
            return m_this;
        }
        return m_lastMousePos;
    };
    this.leftMouseDown = function(newValue) {
        if (newValue !== undefined) {
            m_leftMouseButtonDown = newValue;
            return m_this;
        }
        return m_leftMouseButtonDown;
    };
    this.setDrawRegion = function(lat1, lon1, lat2, lon2) {
        var evt, plane = geo.planeFeature(geo.latlng(lat1, lon1), geo.latlng(lat2, lon2), 99);
        m_map.removeLayer(m_drawRegionLayer);
        m_drawRegionLayer = geo.featureLayer({
            opacity: .5,
            showAttribution: 1
        }, plane);
        m_map.addLayer(m_drawRegionLayer);
        evt = jQuery.Event(geo.event.updateDrawRegionEvent);
        $(m_this).trigger(geo.command.updateDrawRegionEvent, evt);
        return m_this;
    };
    this.getDrawRegion = function() {
        return m_drawRegionLayer.features()[0].getCoords();
    };
    this._computeCurrentMousePos = function(event) {
        if (event.pageX === undefined || event.pageY === undefined) {
            return;
        }
        m_this.updateRenderParams();
        m_outsideCanvas = false;
        m_coords = m_this.viewer().relMouseCoords(event);
        if (m_coords.x < 0 || m_coords.x > m_width) {
            m_currentMousePos.x = 0;
            m_outsideCanvas = true;
        } else {
            m_currentMousePos.x = m_coords.x;
        }
        if (m_coords.y < 0 || m_coords.y > m_height) {
            m_currentMousePos.y = 0;
            m_outsideCanvas = true;
        } else {
            m_currentMousePos.y = m_coords.y;
        }
    };
    this.updateRenderParams = function() {
        m_renderWindow = m_this.viewer().renderWindow();
        m_width = m_renderWindow.windowSize()[0];
        m_height = m_renderWindow.windowSize()[1];
        m_renderer = m_this.viewer().renderWindow().activeRenderer();
        m_camera = m_renderer.camera();
        m_focusDisplayPoint = m_renderWindow.focusDisplayPoint();
        m_updateRenderParamsTime.modified();
    };
    this.reset = function() {
        var evt, zoom;
        if (!m_map) {
            return;
        }
        zoom = m_map.zoom();
        m_this._syncReset();
        evt = {
            type: geo.event.zoom,
            curr_zoom: zoom,
            last_zoom: zoom
        };
        $(m_this).trigger(evt);
    };
    function computeZoomLevel() {
        var i, pos = m_camera.position(), width = pos[2] * Math.sin(m_camera.viewAngle());
        for (i = 0; i < 20; i += 1) {
            if (width >= 360 / Math.pow(2, i)) {
                return i;
            }
        }
    }
    function computeCameraDistance(zoomLevel) {
        var deg = 360 / Math.pow(2, zoomLevel);
        return deg / Math.sin(m_camera.viewAngle());
    }
    return this;
};

inherit(ggl.mapInteractorStyle, vgl.interactorStyle);

ggl._vglViewerInstance = null;

ggl.vglViewerInstance = function() {
    "use strict";
    var canvas;
    if (ggl._vglViewerInstance === null) {
        canvas = $(document.createElement("canvas"));
        canvas.attr("class", ".webgl-canvas");
        ggl._vglViewerInstance = vgl.viewer(canvas.get(0));
        ggl._vglViewerInstance.renderWindow().removeRenderer(ggl._vglViewerInstance.renderWindow().activeRenderer());
        ggl._vglViewerInstance.setInteractorStyle(ggl.mapInteractorStyle());
        ggl._vglViewerInstance.init();
    }
    return ggl._vglViewerInstance;
};

ggl.vglRenderer = function(arg) {
    "use strict";
    if (!(this instanceof ggl.vglRenderer)) {
        return new ggl.vglRenderer(arg);
    }
    ggl.renderer.call(this, arg);
    var m_this = this, m_viewer = ggl.vglViewerInstance(), m_contextRenderer = vgl.renderer(), m_width = 0, m_height = 0, s_init = this._init;
    m_contextRenderer.setResetScene(false);
    this.displayToWorld = function(input) {
        var i, delta, ren = m_this.contextRenderer(), cam = ren.camera(), fdp = ren.focusDisplayPoint(), output, temp, point;
        if (input instanceof Array && input.length > 0) {
            output = [];
            if (input[0] instanceof Object) {
                delta = 1;
                for (i = 0; i < input.length; i += delta) {
                    point = input[i];
                    temp = ren.displayToWorld(vec4.fromValues(point.x, point.y, fdp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                    output.push({
                        x: temp[0],
                        y: temp[1],
                        z: temp[2],
                        w: temp[3]
                    });
                }
            } else if (input[0] instanceof Array) {
                delta = 1;
                for (i = 0; i < input.length; i += delta) {
                    point = input[i];
                    temp = ren.displayToWorld(vec4.fromValues(point[0], point[1], fdp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                    output.push(temp);
                }
            } else {
                delta = input.length % 3 === 0 ? 3 : 2;
                for (i = 0; i < input.length; i += delta) {
                    temp = ren.displayToWorld(vec4.fromValues(input[i], input[i + 1], fdp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                    output.push(temp[0]);
                    output.push(temp[1]);
                    output.push(temp[2]);
                    output.push(temp[3]);
                }
            }
        } else if (input instanceof Object) {
            output = {};
            temp = ren.displayToWorld(vec4.fromValues(input.x, input.y, fdp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
            output = {
                x: temp[0],
                y: temp[1],
                z: temp[2],
                w: temp[3]
            };
        } else {
            throw "Display to world conversion requires array of 2D/3D points";
        }
        return output;
    };
    this.worldToDisplay = function(input) {
        var i, temp, delta, ren = m_this.contextRenderer(), cam = ren.camera(), fp = cam.focalPoint(), output = [];
        if (input instanceof Array && input.length > 0) {
            output = [];
            if (input[0] instanceof Object) {
                delta = 1;
                for (i = 0; i < input.length; i += delta) {
                    temp = ren.worldToDisplay(vec4.fromValues(input[i].x, input[i].y, fp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                    output[i] = {
                        x: temp[0],
                        y: temp[1],
                        z: temp[2]
                    };
                }
            } else if (input[0] instanceof Array) {
                delta = 1;
                for (i = 0; i < input.length; i += delta) {
                    temp = ren.worldToDisplay(vec4.fromValues(input[i][0], input[i][1], fp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                    output[i].push(temp);
                }
            } else {
                delta = input.length % 3 === 0 ? 3 : 2;
                if (delta === 2) {
                    for (i = 0; i < input.length; i += delta) {
                        temp = ren.worldToDisplay(vec4.fromValues(input[i], input[i + 1], fp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                        output.push(temp[0]);
                        output.push(temp[1]);
                        output.push(temp[2]);
                    }
                } else {
                    for (i = 0; i < input.length; i += delta) {
                        temp = ren.worldToDisplay(vec4.fromValues(input[i], input[i + 1], input[i + 2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
                        output.push(temp[0]);
                        output.push(temp[1]);
                        output.push(temp[2]);
                    }
                }
            }
        } else if (input instanceof Object) {
            temp = ren.worldToDisplay(vec4.fromValues(input.x, input.y, fp[2], 1), cam.viewMatrix(), cam.projectionMatrix(), m_width, m_height);
            output = {
                x: temp[0],
                y: temp[1],
                z: temp[2]
            };
        } else {
            throw "World to display conversion requires array of 2D/3D points";
        }
        return output;
    };
    this.contextRenderer = function() {
        return m_contextRenderer;
    };
    this.api = function() {
        return "vgl";
    };
    this.reset = function() {
        m_viewer.interactorStyle().reset();
    };
    this._init = function() {
        if (m_this.initialized()) {
            return m_this;
        }
        s_init.call(m_this);
        m_this.canvas($(m_viewer.canvas()));
        if (m_viewer.renderWindow().renderers().length > 0) {
            m_contextRenderer.setLayer(m_viewer.renderWindow().renderers().length);
            m_contextRenderer.setResetScene(false);
        }
        m_viewer.renderWindow().addRenderer(m_contextRenderer);
        m_this.layer().node().append(m_this.canvas());
        $(m_viewer.interactorStyle()).on(geo.event.pan, function(event) {
            m_this.trigger(geo.event.pan, event);
        });
        $(m_viewer.interactorStyle()).on(geo.event.zoom, function(event) {
            m_this.trigger(geo.event.zoom, event);
        });
        return m_this;
    };
    this._connectMapEvents = function() {
        if (m_this.layer().referenceLayer()) {
            var map = $(m_this.layer().map().node()), wheel = "onwheel" in map ? "wheel" : document.onmousewheel !== undefined ? "mousewheel" : "MozMousePixelScroll", wheelDelta = wheel === "wheel" ? function(evt) {
                return evt.originalEvent.deltaY * (evt.originalEvent.deltaMode ? 120 : 1);
            } : wheel === "mousewheel" ? function(evt) {
                return evt.originalEvent.wheelDelta;
            } : function(evt) {
                return -evt.originalEvent.detail;
            };
            m_viewer.unbindEventHandlers();
            map.on(wheel, function(event) {
                event.originalEvent.wheelDeltaY = wheelDelta(event);
                event.originalEvent.wheelDelta = event.originalEvent.wheelDeltaY;
                m_viewer.handleMouseWheel(event);
            });
            map.on("mousemove", function(event) {
                m_viewer.handleMouseMove(event);
            });
            map.on("mouseup", function(event) {
                m_viewer.handleMouseUp(event);
            });
            map.on("mousedown", function(event) {
                m_viewer.handleMouseDown(event);
            });
            map.on("mouseout", function(event) {
                var selection = $(map), offset = selection.offset(), width = selection.width(), height = selection.height(), x = event.pageX - offset.left, y = event.pageY - offset.top;
                if (x < 0 || x >= width || y < 0 || y >= height) {
                    m_viewer.handleMouseOut(event);
                }
            });
            map.on("keypress", function(event) {
                m_viewer.handleKeyPress(event);
            });
            map.on("contextmenu", function(event) {
                m_viewer.handleContextMenu(event);
            });
            map.on("click", function(event) {
                m_viewer.handleClick(event);
            });
            map.on("dblclick", function(event) {
                m_viewer.handleDoubleClick(event);
            });
        }
        m_viewer.interactorStyle().map(m_this.layer().map());
        m_viewer.interactorStyle().reset();
    };
    this.on(geo.event.layerAdd, function(event) {
        if (event.layer === m_this.layer()) {
            m_this._connectMapEvents();
        }
    });
    this._resize = function(x, y, w, h) {
        m_width = w;
        m_height = h;
        m_this.canvas().attr("width", w);
        m_this.canvas().attr("height", h);
        m_viewer.renderWindow().positionAndResize(x, y, w, h);
        m_this._render();
        return m_this;
    };
    this._render = function() {
        m_viewer.render();
        return m_this;
    };
    this._exit = function() {};
    return this;
};

inherit(ggl.vglRenderer, ggl.renderer);

geo.registerRenderer("vglRenderer", ggl.vglRenderer);

gd3 = ogs.namespace("geo.d3");

(function(gd3) {
    "use strict";
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz", strLength = 8;
    gd3.uniqueID = function() {
        var strArray = [], i;
        strArray.length = strLength;
        for (i = 0; i < strLength; i += 1) {
            strArray[i] = chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return strArray.join("");
    };
    geo.event.d3Rescale = "geo.d3.rescale";
})(gd3);

gd3.object = function(arg) {
    "use strict";
    if (!(this instanceof geo.object)) {
        return new gd3.object(arg);
    }
    geo.sceneObject.call(this);
    var m_id = "d3-" + gd3.uniqueID(), m_this = this, s_draw = this.draw;
    this._d3id = function() {
        return m_id;
    };
    this.select = function() {
        return m_this.renderer().select(m_this._d3id());
    };
    this.draw = function() {
        m_this._update();
        s_draw();
        return m_this;
    };
    this._exit = function() {
        return m_this.renderer()._removeFeature(m_this._d3id());
    };
    return this;
};

inherit(gd3.object, geo.sceneObject);

gd3.pointFeature = function(arg) {
    "use strict";
    if (!(this instanceof gd3.pointFeature)) {
        return new gd3.pointFeature(arg);
    }
    arg = arg || {};
    geo.pointFeature.call(this, arg);
    gd3.object.call(this);
    var m_this = this, s_init = this._init, s_update = this._update, m_buildTime = geo.timestamp(), m_style = {}, d_attr, d_style, m_sticky;
    d_attr = {
        cx: function(d) {
            return d.x;
        },
        cy: function(d) {
            return d.y;
        },
        r: 1
    };
    d_style = {
        fill: "black",
        stroke: "none"
    };
    m_style = {
        attributes: d_attr,
        style: d_style
    };
    this._init = function(arg) {
        s_init.call(m_this, arg);
        m_sticky = m_this.layer().sticky();
        return m_this;
    };
    this._build = function() {
        var data = m_this.positions() || [], s_style = m_this.style(), m_renderer = m_this.renderer();
        data = m_renderer.worldToDisplay(data);
        s_update.call(m_this);
        if (!data) {
            data = [];
        }
        m_style.id = m_this._d3id();
        m_style.data = data;
        m_style.append = "circle";
        m_style.style = $.extend({}, d_style);
        m_style.attributes = $.extend({}, d_attr);
        m_style.classes = [ "d3PointFeature" ];
        m_style.style.fill = d3.rgb(s_style.color[0] * 255, s_style.color[1] * 255, s_style.color[2] * 255);
        m_style.attributes.r = function() {
            var m_scale = m_renderer.scaleFactor();
            return (s_style.size / m_scale).toString() + "px";
        };
        m_style.style["fill-opacity"] = s_style.opacity;
        m_this.renderer()._drawFeatures(m_style);
        m_buildTime.modified();
        m_this.updateTime().modified();
        return m_this;
    };
    this._update = function() {
        s_update.call(m_this);
        if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
            m_this._build();
        }
        return m_this;
    };
    m_this.on(geo.event.d3Rescale, function() {
        m_this.renderer().select(m_this._d3id()).attr("r", m_style.attributes.r);
    });
    this._init(arg);
    return this;
};

inherit(gd3.pointFeature, geo.pointFeature);

geo.registerFeature("d3", "point", gd3.pointFeature);

gd3.lineFeature = function(arg) {
    "use strict";
    if (!(this instanceof gd3.lineFeature)) {
        return new gd3.lineFeature(arg);
    }
    arg = arg || {};
    geo.lineFeature.call(this, arg);
    gd3.object.call(this);
    var m_this = this, s_init = this._init, m_buildTime = geo.timestamp(), s_update = this._update, m_style = {};
    m_style.style = {};
    this._init = function(arg) {
        s_init.call(m_this, arg);
        return m_this;
    };
    this._build = function() {
        var data = m_this.positions() || [], s_style = m_this.style(), m_renderer = m_this.renderer(), line = d3.svg.line().x(function(d) {
            return d.x;
        }).y(function(d) {
            return d.y;
        });
        s_update.call(m_this);
        data = m_renderer.worldToDisplay(data);
        m_style.data = [ data ];
        m_style.attributes = {
            d: line
        };
        m_style.id = m_this._d3id();
        m_style.append = "path";
        m_style.classes = [ "d3LineFeature" ];
        m_style.style = {
            fill: "none",
            stroke: d3.rgb(s_style.color[0] * 255, s_style.color[1] * 255, s_style.color[2] * 255),
            "stroke-width": function() {
                var m_scale = m_renderer.scaleFactor();
                return (s_style.width[0] / m_scale).toString() + "px";
            },
            "stroke-opacity": s_style.opacity
        };
        m_renderer._drawFeatures(m_style);
        m_buildTime.modified();
        m_this.updateTime().modified();
        return m_this;
    };
    this._update = function() {
        s_update.call(m_this);
        if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
            m_this._build();
        }
        return m_this;
    };
    m_this.on(geo.event.d3Rescale, function() {
        m_this.renderer().select(m_this._d3id()).style("stroke-width", m_style.style["stroke-width"]);
    });
    this._init(arg);
    return this;
};

inherit(gd3.lineFeature, geo.lineFeature);

geo.registerFeature("d3", "line", gd3.lineFeature);

gd3.pathFeature = function(arg) {
    "use strict";
    if (!(this instanceof gd3.pathFeature)) {
        return new gd3.pathFeature(arg);
    }
    arg = arg || {};
    geo.pathFeature.call(this, arg);
    gd3.object.call(this);
    var m_this = this, s_init = this._init, m_buildTime = geo.timestamp(), s_update = this._update, m_style = {};
    m_style.style = {};
    this._init = function(arg) {
        s_init.call(m_this, arg);
        return m_this;
    };
    this._build = function() {
        var data = m_this.positions() || [], s_style = m_this.style(), m_renderer = m_this.renderer(), tmp, diag;
        s_update.call(m_this);
        diag = function(d) {
            var p = {
                source: d.source,
                target: d.target
            };
            return d3.svg.diagonal()(p);
        };
        tmp = [];
        data.forEach(function(d, i) {
            var src, trg;
            if (i < data.length - 1) {
                src = d;
                trg = data[i + 1];
                tmp.push({
                    source: m_renderer.worldToDisplay(src),
                    target: m_renderer.worldToDisplay(trg)
                });
            }
        });
        m_style.data = tmp;
        m_style.attributes = {
            d: diag
        };
        m_style.id = m_this._d3id();
        m_style.append = "path";
        m_style.classes = [ "d3PathFeature" ];
        m_style.style = {
            fill: "none",
            stroke: d3.rgb(s_style.color[0] * 255, s_style.color[1] * 255, s_style.color[2] * 255),
            "stroke-width": function() {
                var m_scale = m_renderer.scaleFactor();
                return (s_style.width[0] / m_scale).toString() + "px";
            },
            "stroke-opacity": s_style.opacity
        };
        m_this.renderer()._drawFeatures(m_style);
        m_buildTime.modified();
        m_this.updateTime().modified();
        return m_this;
    };
    this._update = function() {
        s_update.call(m_this);
        if (m_this.dataTime().getMTime() >= m_buildTime.getMTime()) {
            m_this._build();
        }
        return m_this;
    };
    m_this.on(geo.event.d3Rescale, function() {
        m_this.renderer().select(m_this._d3id()).style("stroke-width", m_style.style["stroke-width"]);
    });
    this._init(arg);
    return this;
};

inherit(gd3.pathFeature, geo.pathFeature);

geo.registerFeature("d3", "path", gd3.pathFeature);

gd3.graphFeature = function(arg) {
    "use strict";
    var m_this = this;
    if (!(this instanceof gd3.graphFeature)) {
        return new gd3.graphFeature(arg);
    }
    geo.graphFeature.call(this, arg);
    this.select = function() {
        var renderer = m_this.renderer(), selection = {}, node = m_this.nodeFeature(), links = m_this.linkFeatures();
        selection.nodes = renderer.select(node._d3id());
        selection.links = links.map(function(link) {
            return renderer.select(link._d3id());
        });
        return selection;
    };
    return this;
};

inherit(gd3.graphFeature, geo.graphFeature);

geo.registerFeature("d3", "graph", gd3.graphFeature);

gd3.d3Renderer = function(arg) {
    "use strict";
    if (!(this instanceof gd3.d3Renderer)) {
        return new gd3.d3Renderer(arg);
    }
    geo.renderer.call(this, arg);
    gd3.object.call(this, arg);
    arg = arg || {};
    var m_this = this, m_sticky = null, m_features = {}, m_corners = null, m_width = null, m_height = null, m_scale = 1, m_dx = 0, m_dy = 0, m_svg = null;
    function setAttrs(select, attrs) {
        var key;
        for (key in attrs) {
            if (attrs.hasOwnProperty(key)) {
                select.attr(key, attrs[key]);
            }
        }
    }
    function getMap() {
        var layer = m_this.layer();
        if (!layer) {
            return null;
        }
        return layer.map();
    }
    function getGroup() {
        return m_svg.select(".group-" + m_this._d3id());
    }
    function initCorners() {
        var layer = m_this.layer(), map = layer.map(), width = m_this.layer().width(), height = m_this.layer().height();
        m_width = width;
        m_height = height;
        if (!m_width || !m_height) {
            throw "Map layer has size 0";
        }
        m_corners = {
            upperLeft: map.displayToGcs({
                x: 0,
                y: 0
            }),
            lowerRight: map.displayToGcs({
                x: width,
                y: height
            })
        };
    }
    function setTransform() {
        if (!m_corners) {
            initCorners();
        }
        if (!m_sticky) {
            return;
        }
        var layer = m_this.layer(), map = layer.map(), upperLeft = map.gcsToDisplay(m_corners.upperLeft), lowerRight = map.gcsToDisplay(m_corners.lowerRight), group = getGroup(), dx, dy, scale;
        dx = upperLeft.x;
        dy = upperLeft.y;
        scale = (lowerRight.y - upperLeft.y) / m_height;
        group.attr("transform", "matrix(" + [ scale, 0, 0, scale, dx, dy ].join() + ")");
        m_scale = scale;
        m_dx = dx;
        m_dy = dy;
    }
    function baseToLocal(pt) {
        return {
            x: (pt.x - m_dx) / m_scale,
            y: (pt.y - m_dy) / m_scale
        };
    }
    function localToBase(pt) {
        return {
            x: pt.x * m_scale + m_dx,
            y: pt.y * m_scale + m_dy
        };
    }
    this._init = function() {
        if (!m_this.canvas()) {
            var canvas;
            m_svg = d3.select(m_this.layer().node().get(0)).append("svg");
            canvas = m_svg.append("g");
            m_sticky = m_this.layer().sticky();
            m_svg.attr("class", m_this._d3id());
            m_svg.attr("width", m_this.layer().node().width());
            m_svg.attr("height", m_this.layer().node().height());
            canvas.attr("class", "group-" + m_this._d3id());
            m_this.canvas(canvas);
        }
    };
    this.displayToWorld = function(pt) {
        var map = getMap();
        if (!map) {
            throw "Cannot project until this layer is connected to a map.";
        }
        if (Array.isArray(pt)) {
            pt = pt.map(function(x) {
                return map.displayToGcs(localToBase(x));
            });
        } else {
            pt = map.displayToGcs(localToBase(pt));
        }
        return pt;
    };
    this.worldToDisplay = function(pt) {
        var map = getMap();
        if (!map) {
            throw "Cannot project until this layer is connected to a map.";
        }
        var v;
        if (Array.isArray(pt)) {
            v = pt.map(function(x) {
                return baseToLocal(map.gcsToDisplay(x));
            });
        } else {
            v = baseToLocal(map.gcsToDisplay(pt));
        }
        return v;
    };
    this.api = function() {
        return "d3";
    };
    this.scaleFactor = function() {
        return m_scale;
    };
    this._resize = function(x, y, w, h) {
        if (!m_corners) {
            initCorners();
        }
        m_svg.attr("width", w);
        m_svg.attr("height", h);
        setTransform();
        m_this.layer().trigger(geo.event.d3Rescale, {
            scale: m_scale
        }, true);
    };
    this._update = function() {};
    this._exit = function() {
        m_features = {};
        m_this.canvas().remove();
    };
    this._drawFeatures = function(arg) {
        m_features[arg.id] = {
            data: arg.data,
            index: arg.dataIndex,
            style: arg.style,
            attributes: arg.attributes,
            classes: arg.classes,
            append: arg.append
        };
        return m_this._render(arg.id);
    };
    this._render = function(id) {
        var key;
        if (id === undefined) {
            for (key in m_features) {
                if (m_features.hasOwnProperty(key)) {
                    m_this._render(key);
                }
            }
            return m_this;
        }
        var data = m_features[id].data, index = m_features[id].index, style = m_features[id].style, attributes = m_features[id].attributes, classes = m_features[id].classes, append = m_features[id].append, selection = m_this.select(id).data(data, index);
        selection.enter().append(append);
        selection.exit().remove();
        setAttrs(selection, attributes);
        selection.attr("class", classes.concat([ id ]).join(" "));
        selection.style(style);
        return m_this;
    };
    this.select = function(id) {
        return getGroup().selectAll("." + id);
    };
    this._removeFeature = function(id) {
        m_this.select(id).remove();
        delete m_features[id];
        return m_this;
    };
    this.draw = function() {};
    this.on(geo.event.pan, setTransform);
    this.on(geo.event.zoom, function() {
        setTransform();
        m_this.layer().trigger(geo.event.d3Rescale, {
            scale: m_scale
        }, true);
    });
    this.on(geo.event.resize, function(event) {
        m_this._resize(event.x, event.y, event.width, event.height);
    });
    this._init(arg);
    return this;
};

inherit(gd3.d3Renderer, geo.renderer);

geo.registerRenderer("d3Renderer", gd3.d3Renderer);

geo.version = "0.1.0";