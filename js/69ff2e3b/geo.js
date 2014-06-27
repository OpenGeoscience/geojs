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

geo = ogs.namespace("geo");

geo.renderers = {};

geo.features = {};

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

geo.object = function() {
    "use strict";
    if (!(this instanceof geo.object)) {
        return new geo.object();
    }
    var m_this = this, m_eventHandlers = {};
    this.on = function(event, handler) {
        if (Array.isArray(event)) {
            event.forEach(function(e) {
                m_this.on(e, handler);
            });
            return this;
        }
        if (!m_eventHandlers.hasOwnProperty(event)) {
            m_eventHandlers[event] = [];
        }
        m_eventHandlers[event].push(handler);
        return this;
    };
    this.trigger = function(event, args) {
        if (Array.isArray(event)) {
            event.forEach(function(e) {
                m_this.trigger(e, args);
            });
            return this;
        }
        if (m_eventHandlers.hasOwnProperty(event)) {
            m_eventHandlers[event].forEach(function(handler) {
                handler(args);
            });
        }
        return this;
    };
    this.off = function(event, arg) {
        if (Array.isArray(event)) {
            event.forEach(function(e) {
                m_this.off(e, arg);
            });
            return this;
        }
        if (!arg) {
            m_eventHandlers[event] = [];
        } else if (Array.isArray(arg)) {
            arg.forEach(function(handler) {
                m_this.off(event, handler);
            });
            return this;
        }
        if (m_eventHandlers.hasOwnProperty(event)) {
            m_eventHandlers[event] = m_eventHandlers[event].filter(function(f) {
                return f !== arg;
            });
        }
        return this;
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
    var m_this = this, m_parent = null, m_children = [], s_trigger = this.trigger;
    this.parent = function(arg) {
        if (arg === undefined) {
            return m_parent;
        }
        m_parent = arg;
        return this;
    };
    this.addChild = function(child) {
        if (Array.isArray(child)) {
            child.forEach(this.addChild);
            return this;
        }
        child.parent(this);
        m_children.push(child);
        return this;
    };
    this.removeChild = function(child) {
        if (Array.isArray(child)) {
            child.forEach(this.removeChild);
            return this;
        }
        m_children = m_children.filter(function(c) {
            return c !== child;
        });
        return this;
    };
    this.children = function() {
        return m_children.slice();
    };
    this.trigger = function(event, args) {
        args = args || {};
        if (m_parent && args._triggeredBy !== m_parent) {
            args._triggeredBy = m_this;
            m_parent.trigger(event, args);
            return this;
        }
        s_trigger.call(this, event, args);
        m_children.forEach(function(child) {
            args._triggeredBy = m_this;
            child.trigger(event, args);
        });
        return this;
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
    var m_radii = new vec3.fromValues(x, y, z), m_radiiSquared = new vec3.fromValues(x * x, y * y, z * z), m_minimumRadius = Math.min(x, y, z), m_maximumRadius = Math.max(x, y, z);
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
        var n = this.computeGeodeticSurfaceNormal(lat, lon), k = vec3.create(), gamma = Math.sqrt(vec3.dot(n, k)), result = vec3.create();
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
            n = this.computeGeodeticSurfaceNormal(sourceDataArray[index + 1], sourceDataArray[index]);
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
    return this;
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
    var m_lat = arg2 === undefined ? arg1.lat() : arg1, m_lng = arg2 === undefined ? arg1.lng() : arg2;
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
            return this.lng();
        } else {
            m_lng = val;
        }
    };
    this.y = function(val) {
        if (val === undefined) {
            return this.lat();
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
    } : arg.style, m_id = arg.id === undefined ? geo.newLayerId() : arg.id, m_name = "", m_gcs = "EPSG:4326", m_timeRange = null, m_source = arg.source || null, m_map = arg.map === undefined ? null : arg.map, m_isReference = false, m_x = 0, m_y = 0, m_width = 0, m_height = 0, m_node = null, m_canvas = null, m_renderer = null, m_initialized = false, m_rendererName = arg.renderer === undefined ? "vglRenderer" : arg.renderer, m_dataTime = geo.timestamp(), m_updateTime = geo.timestamp(), m_drawTime = geo.timestamp();
    this.node = function() {
        return m_node;
    };
    this.id = function(val) {
        if (val === undefined) {
            return m_id;
        }
        m_id = geo.newLayerId();
        m_this.modified();
        return this;
    };
    this.name = function(val) {
        if (val === undefined) {
            return m_name;
        }
        m_name = val;
        m_this.modified();
        return this;
    };
    this.opacity = function(val) {
        if (val === undefined) {
            return m_style.opacity;
        }
        m_style.opacity = val;
        m_this.modified();
        return this;
    };
    this.visible = function(val) {
        if (val === undefined) {
            return m_style.visible;
        }
        m_style.visible = val;
        m_this.modified();
        return this;
    };
    this.bin = function(val) {
        if (val === undefined) {
            return m_style.bin;
        }
        m_style.bin = val;
        m_this.modified();
        return this;
    };
    this.gcs = function(val) {
        if (val === undefined) {
            return m_gcs;
        }
        m_gcs = val;
        m_this.modified();
        return this;
    };
    this.transform = function(val) {
        geo.transform.transformLayer(val, m_this, m_map.baseLayer());
        return this;
    };
    this.timeRange = function(val) {
        if (val === undefined) {
            return m_timeRange;
        }
        m_timeRange = val;
        m_this.modified();
        return this;
    };
    this.source = function(val) {
        if (val === undefined) {
            return m_source;
        }
        m_source = val;
        m_this.modified();
        return this;
    };
    this.map = function(val) {
        if (val === undefined) {
            return m_map;
        }
        m_map = val;
        m_map.node().append(m_node);
        m_this.modified();
        return this;
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
            return this;
        }
        return m_isReference;
    };
    this.initialized = function(val) {
        if (val !== undefined) {
            m_initialized = val;
            return this;
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
            return this;
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
        return this;
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
        return this;
    };
    this.width = function() {
        return m_width;
    };
    this.height = function() {
        return m_height;
    };
    this._draw = function() {};
    return this;
};

inherit(geo.layer, geo.sceneObject);

geo.featureLayer = function(arg) {
    "use strict";
    if (!(this instanceof geo.featureLayer)) {
        return new geo.featureLayer(arg);
    }
    geo.layer.call(this, arg);
    var m_this = this, m_features = null, s_init = this._init, s_update = this._update;
    this.createFeature = function(featureName, arg) {
        var newFeature = geo.createFeature(featureName, m_this, this.renderer(), arg);
        if (!m_features) {
            m_features = [];
        }
        m_features.push(newFeature);
        this.features(m_features);
        this.modified();
        return newFeature;
    };
    this.deleteFeature = function() {};
    this.features = function(val) {
        return this._features(val);
    };
    this._features = function(val) {
        if (val === undefined) {
            return m_features || [];
        } else {
            m_features = val.slice(0);
            this.dataTime().modified();
            this.modified();
        }
    };
    this._delete = function(feature) {
        var i;
        for (i = 0; i < m_features.length; i += 1) {
            if (m_features[i] === feature) {
                m_features[i]._exit();
                this.dataTime().modified();
                this.modified();
                return m_features.splice(i, 1);
            }
        }
        return this;
    };
    this._init = function() {
        if (this.initialized()) {
            return this;
        }
        s_init.call(this);
        this.on(geo.event.resize, function(event) {
            m_this.renderer()._resize(event.x, event.y, event.width, event.height);
            m_this._update({});
            m_this.renderer()._render();
        });
        this.on(geo.event.pan, function(event) {
            m_this._update({
                event: event
            });
            m_this.renderer()._render();
        });
        this.on(geo.event.zoom, function(event) {
            if (m_this.map()) {
                m_this.map().zoom(event.curr_zoom);
            }
            m_this._update({
                event: event
            });
            m_this.renderer()._render();
        });
        return this;
    };
    this._update = function(request) {
        var i, reset = false;
        if (!m_features) {
            return this;
        }
        s_update.call(this, request);
        if (!this.source() && m_features && m_features.length === 0) {
            console.log("[info] No valid data source found.");
            return;
        }
        if (this.dataTime().getMTime() > this.updateTime().getMTime()) {
            for (i = 0; i < m_features.length; i += 1) {
                m_features[i].renderer(this.renderer());
            }
            reset = true;
        }
        for (i = 0; i < m_features.length; i += 1) {
            m_features[i]._update();
        }
        this.updateTime().modified();
        if (reset) {
            m_this.renderer().reset();
        }
        return this;
    };
    this._draw = function() {
        this.renderer()._render();
        return this;
    };
    this.clear = function() {
        var i;
        if (!m_features) return this;
        for (i = 0; i < m_features.length; i += 1) {
            m_features[i]._exit();
        }
        this.dataTime().modified();
        this.modified();
        m_features = [];
        return this;
    };
    return this;
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

geo.map = function(arg) {
    "use strict";
    if (!(this instanceof geo.map)) {
        return new geo.map(arg);
    }
    arg = arg || {};
    geo.sceneObject.call(this, arg);
    arg.layers = arg.layers === undefined ? [] : arg.layers;
    var m_this = this, m_x = 0, m_y = 0, m_node = $(arg.node), m_width = m_node.width(), m_height = m_node.height(), m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs, m_uigcs = arg.uigcs === undefined ? "EPSG:4326" : arg.uigcs, m_center = arg.center === undefined ? [ 0, 0 ] : arg.center, m_zoom = arg.zoom === undefined ? 10 : arg.zoom, m_baseLayer = null, toMillis, calculateGlobalAnimationRange, cloneTimestep, m_animationState = {
        range: null,
        timestep: null,
        layers: null
    }, m_intervalMap = {}, m_pause, m_stop;
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
        return this;
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
        m_zoom = val;
        m_this.modified();
        return this;
    };
    this.center = function(val) {
        if (val === undefined) {
            return m_center;
        }
        m_center = val.slice;
        m_this.modified();
        return this;
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
        return this;
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
        return this;
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
            return this;
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
            layers[i]._draw();
        }
        m_this.trigger(geo.event.drawEnd, {
            type: geo.event.drawEnd,
            target: m_this
        });
        return this;
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
        this._animate();
        return this;
    };
    this.pauseAnimation = function() {
        m_this.trigger(geo.event.animationPause);
        return this;
    };
    this.stopAnimation = function() {
        m_this.trigger(geo.event.animationStop);
        m_animationState.timestep = null;
        return this;
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
        return this;
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
        return this;
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
        return this;
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
        return this;
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
        return this;
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
        return this;
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
        return this;
    };
    this._update = function(request) {
        var i, layers = m_this.children();
        for (i = 0; i < layers.length; i += 1) {
            layers[i]._update(request);
        }
        return this;
    };
    this._exit = function() {
        var i, layers = m_this.children();
        for (i = 0; i < layers.length; i += 1) {
            layers[i]._exit();
        }
    };
    this._init(arg);
    return this;
};

inherit(geo.map, geo.sceneObject);

geo.feature = function(arg) {
    "use strict";
    if (!(this instanceof geo.feature)) {
        return new geo.feature(arg);
    }
    geo.object.call(this);
    arg = arg || {};
    var m_style = {}, m_layer = arg.layer === undefined ? null : arg.layer, m_gcs = arg.gcs === undefined ? "EPSG:4326" : arg.gcs, m_visible = arg.visible === undefined ? true : arg.visible, m_bin = arg.bin === undefined ? 0 : arg.bin, m_renderer = arg.renderer === undefined ? null : arg.renderer, m_dataTime = geo.timestamp(), m_buildTime = geo.timestamp(), m_updateTime = geo.timestamp();
    this.style = function(arg1, arg2) {
        if (arg1 === undefined) {
            return m_style;
        } else if (arg2 === undefined) {
            m_style = $.extend({}, m_style, arg1);
            this.modified();
            return this;
        } else {
            m_style[arg1] = arg2;
            this.modified();
            return this;
        }
    };
    this.layer = function() {
        return m_layer;
    };
    this.renderer = function() {
        return m_renderer;
    };
    this.drawables = function() {
        return this._drawables();
    };
    this.gcs = function(val) {
        if (val === undefined) {
            return m_gcs;
        } else {
            m_gcs = val;
            this.modified();
            return this;
        }
    };
    this.visible = function(val) {
        if (val === undefined) {
            return m_visible;
        } else {
            m_visible = val;
            this.modified();
            return this;
        }
    };
    this.bin = function(val) {
        if (val === undefined) {
            return m_bin;
        } else {
            m_bin = val;
            this.modified();
            return this;
        }
    };
    this.dataTime = function(val) {
        if (val === undefined) {
            return m_dataTime;
        } else {
            m_dataTime = val;
            this.modified();
            return this;
        }
    };
    this.buildTime = function(val) {
        if (val === undefined) {
            return m_buildTime;
        } else {
            m_buildTime = val;
            this.modified();
            return this;
        }
    };
    this.updateTime = function(val) {
        if (val === undefined) {
            return m_updateTime;
        } else {
            m_updateTime = val;
            this.modified();
            return this;
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

inherit(geo.feature, geo.object);

geo.pointFeature = function(arg) {
    "use strict";
    if (!(this instanceof geo.pointFeature)) {
        return new geo.pointFeature(arg);
    }
    arg = arg || {};
    geo.feature.call(this, arg);
    var m_positions = arg.positions === undefined ? null : arg.positions, s_init = this._init;
    this.positions = function(val) {
        if (val === undefined) {
            return m_positions;
        } else {
            m_positions = val.slice(0);
            this.dataTime().modified();
            this.modified();
            return this;
        }
    };
    this._init = function(arg) {
        s_init.call(this, arg);
        var defaultStyle = $.extend({}, {
            size: 1,
            width: 1,
            height: 1,
            color: [ 1, 1, 1 ],
            point_sprites: false,
            point_sprites_image: null
        }, arg.style === undefined ? {} : arg.style);
        this.style(defaultStyle);
        if (m_positions) {
            this.dataTime().modified();
        }
    };
    this._init(arg);
    return this;
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
            return this;
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
    var m_positions = arg.positions === undefined ? [] : arg.positions, s_init = this._init;
    this.positions = function(val) {
        if (val === undefined) {
            return m_positions;
        }
        m_positions = val.slice(0);
        this.dataTime().modified();
        this.modified();
        return this;
    };
    this._init = function(arg) {
        s_init.call(this, arg);
        var defaultStyle = $.extend({}, {
            width: [ 1 ],
            color: [ 1, 1, 1 ],
            pattern: "solid"
        }, arg.style === undefined ? {} : arg.style);
        this.style(defaultStyle);
        if (m_positions) {
            this.dataTime().modified();
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
    var s_init = this._init;
    this._init = function(arg) {
        s_init.call(this, arg);
        var defaultStyle = $.extend({}, {
            color: [ 1, 1, 1 ],
            fill_color: [ 1, 1, 1 ],
            fill: true
        }, arg.style === undefined ? {} : arg.style);
        this.style(defaultStyle);
    };
    this._init(arg);
    return this;
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
    var m_origin = [ arg.ul.x, arg.lr.y, arg.depth ], m_upperLeft = [ arg.ul.x, arg.ul.y, arg.depth ], m_lowerRight = [ arg.lr.x, arg.lr.y, arg.depth ], m_defaultDepth = arg.depth, m_drawOnAsyncResourceLoad = arg.drawOnAsyncResourceLoad === undefined ? true : false, s_init = this._init;
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
        this.dataTime().modified();
        this.modified();
        return this;
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
        this.dataTime().modified();
        this.modified();
        return this;
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
            this.dataTime().modified();
        } else if (val instanceof geo.latlng) {
            m_lowerRight = [ val.x(), val.y(), m_defaultDepth ];
        }
        this.dataTime().modified();
        this.modified();
        return this;
    };
    this.drawOnAsyncResourceLoad = function(val) {
        if (val === undefined) {
            return m_drawOnAsyncResourceLoad;
        } else {
            m_drawOnAsyncResourceLoad = val;
            return this;
        }
    };
    this._init = function(arg) {
        var style = null;
        s_init.call(this, arg);
        style = this.style();
        if (style.image === undefined) {
            style.image = null;
        }
        this.style(style);
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
    var m_this = this, s_style = this.style, m_nodes = null, m_points = null, m_links = [], s_init = this._init;
    this._init = function(arg) {
        s_init.call(this, arg);
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
        this.style(defaultStyle);
        if (m_nodes) {
            this.dataTime().modified();
        }
    };
    this.style = function(arg) {
        var out = s_style.call(this, arg);
        if (out !== this) {
            return out;
        }
        m_points.style(arg.nodes);
        m_links.forEach(function(l) {
            l.style(arg.links);
        });
        return this;
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
                nLinks += 1;
                if (m_links.length < nLinks) {
                    m_links.push(layer.createFeature(style.linkType).style(style.links));
                }
                m_links[nLinks - 1].positions([ source, target ]);
            });
        });
        m_links.splice(nLinks, m_links.length - nLinks).forEach(function(l) {
            layer._delete(l);
        });
        this.dataTime().modified();
        this.modified();
        return this;
    };
    m_points = this.layer().createFeature("point");
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
            this.modified();
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
            return this;
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
        var totalOffsetX = 0, totalOffsetY = 0, canvasX = 0, canvasY = 0, currentElement = this.canvas();
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
    var m_this = this, m_tiles = {}, m_hiddenBinNumber = 0, m_visibleBinNumber = 1e3, m_pendingNewTiles = [], m_pendingInactiveTiles = [], m_numberOfCachedTiles = 0, m_tileCacheSize = 100, m_previousZoom = null, m_baseUrl = "http://tile.openstreetmap.org/", m_imageFormat = "png", s_init = this._init, s_update = this._update;
    if (arg && arg.baseUrl !== undefined) {
        m_baseUrl = arg.baseUrl;
    }
    if (arg && arg.imageFormat !== undefined) {
        m_imageFormat = arg.imageFormat;
    }
    this.tileCacheSize = function(val) {
        if (val === undefined) {
            return m_tileCacheSize;
        }
        m_tileCacheSize = val;
        this.modified();
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
            } else if ("x" in input[0] && "y" in input[0] && "z" in input[0]) {
                output[i] = {
                    x: input[i].x,
                    y: geo.mercator.lat2y(input[i].y),
                    z: input[i].z
                };
            } else if ("x" in input[0] && "y" in input[0] && "z" in input[0]) {
                output[i] = {
                    x: input[i].x,
                    y: geo.mercator.lat2y(input[i].y)
                };
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
        var x, y, tile, zoom, currZoom = this.map().zoom();
        if (!m_tiles) {
            return this;
        }
        if (m_previousZoom === currZoom) {
            return this;
        }
        m_previousZoom = currZoom;
        for (zoom in m_tiles) {
            if (currZoom === zoom) {
                continue;
            }
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
        setTimeout(function() {
            var tile, i;
            m_pendingInactiveTiles.sort(function(a, b) {
                return a.lastused - b.lastused;
            });
            i = 0;
            while (m_numberOfCachedTiles > m_tileCacheSize && i < m_pendingInactiveTiles.length) {
                tile = m_pendingInactiveTiles[i];
                if (tile.zoom !== m_this.map().zoom()) {
                    m_this._delete(tile.feature);
                    delete m_tiles[tile.zoom][tile.index_x][tile.index_y];
                    m_pendingInactiveTiles.splice(i, 1);
                    m_numberOfCachedTiles -= 1;
                }
                i += 1;
            }
            for (i = 0; i < m_pendingInactiveTiles.length; i += 1) {
                tile = m_pendingInactiveTiles[i];
                if (tile.zoom !== m_this.map().zoom()) {
                    tile.REMOVING = false;
                    tile.REMOVED = true;
                    tile.feature.bin(m_hiddenBinNumber);
                } else {
                    tile.REMOVING = false;
                    tile.REMOVED = false;
                    tile.lastused = new Date();
                    tile.feature.bin(m_visibleBinNumber);
                }
                tile.feature._update();
            }
            m_pendingInactiveTiles = [];
            m_this._draw();
        }, 100);
        return this;
    };
    this._addTiles = function(request) {
        var feature, ren = this.renderer(), zoom = this.map().zoom(), llx = 0, lly = this.height(), urx = this.width(), ury = 0, temp = null, tile = null, tile1x = null, tile1y = null, tile2x = null, tile2y = null, invJ = null, i = 0, j = 0, worldPt1 = ren.displayToWorld([ llx, lly ]), worldPt2 = ren.displayToWorld([ urx, ury ]);
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
            tile1x = tile2y;
            tile2y = temp;
        }
        for (i = tile1x; i <= tile2x; i += 1) {
            for (j = tile2y; j <= tile1y; j += 1) {
                invJ = Math.pow(2, zoom) - 1 - j;
                if (!m_this._hasTile(zoom, i, invJ)) {
                    m_this._addTile(request, zoom, i, invJ);
                } else {
                    tile = m_tiles[zoom][i][invJ];
                    tile.feature.bin(m_visibleBinNumber);
                    tile.lastused = new Date();
                    tile.feature._update();
                }
            }
        }
        function tileOnLoad(tile) {
            return function() {
                tile.LOADING = false;
                tile.LOADED = true;
                if ((tile.REMOVING || tile.REMOVED) && tile.feature && tile.zoom !== m_this.map().zoom()) {
                    tile.feature.bin(m_hiddenBinNumber);
                    tile.REMOVING = false;
                    tile.REMOVED = true;
                } else {
                    tile.REMOVED = false;
                    tile.lastused = new Date();
                    tile.feature.bin(m_visibleBinNumber);
                }
                tile.feature._update();
                m_this._draw();
            };
        }
        for (i = 0; i < m_pendingNewTiles.length; i += 1) {
            tile = m_pendingNewTiles[i];
            tile.onload = tileOnLoad(tile);
            feature = this.createFeature("plane", {
                drawOnAsyncResourceLoad: false
            }).origin([ tile.llx, tile.lly ]).upperLeft([ tile.llx, tile.ury ]).lowerRight([ tile.urx, tile.lly ]).gcs('"EPSG:3857"').style("image", tile);
            tile.feature = feature;
        }
        m_pendingNewTiles = [];
    };
    this._updateTiles = function(request) {
        this._addTiles(request);
        m_this._removeTiles(request);
        m_this._draw();
        this.updateTime().modified();
        return this;
    };
    this._init = function() {
        s_init.call(this);
        this.gcs("EPSG:3857");
        return this;
    };
    this._update = function(request) {
        this._updateTiles(request);
        s_update.call(this, request);
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

ggl.pointFeature = function(arg) {
    "use strict";
    if (!(this instanceof ggl.pointFeature)) {
        return new ggl.pointFeature(arg);
    }
    arg = arg || {};
    geo.pointFeature.call(this, arg);
    var m_this = this, m_actor = null, s_init = this._init, s_update = this._update;
    this._init = function(arg) {
        s_init.call(this, arg);
    };
    this._build = function() {
        var style = m_this.style(), positions = geo.transform.transformFeature(m_this.renderer().map().gcs(), this, false);
        if (m_actor) {
            this.renderer().contextRenderer().removeActor(m_actor);
        }
        if (style.point_sprites === true) {
            if (style.point_sprites_image === null) {
                throw "[error] Invalid image for point sprites";
            }
            m_actor = vgl.utils.createPointSprites(style.point_sprites_image, positions, style.colors);
        } else {
            m_actor = vgl.utils.createPoints(positions, style.colors);
        }
        this.renderer().contextRenderer().addActor(m_actor);
        this.buildTime().modified();
    };
    this._update = function() {
        var style = m_this.style();
        s_update.call(this);
        if (this.dataTime().getMTime() >= this.buildTime().getMTime()) {
            this._build();
        }
        if (this.updateTime().getMTime() <= this.getMTime()) {
            if (this.style.color instanceof vgl.lookupTable) {
                vgl.utils.updateColorMappedMaterial(this.material(), this.style.color);
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
        this.updateTime().modified();
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
        if (m_buildTime && m_buildTime.getMTime() < this.getMTime()) {
            if (m_color instanceof vgl.lookupTable) {
                vgl.utils.updateColorMappedMaterial(this.material(), this.style.color);
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
            this.modified();
            return this;
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
    var m_this = this, m_actor = null;
    this.coords = function() {
        return [ this.origin(), this.upperLeft(), this.lowerRight() ];
    };
    this._build = function() {
        var or = this.origin(), ul = this.upperLeft(), lr = this.lowerRight(), img = this.style().image, image = null, onloadCallback = null, texture = null;
        if (m_actor) {
            this.renderer().contextRenderer().removeActor(m_actor);
        }
        if (img && img instanceof Image) {
            image = img;
            onloadCallback = img.onload;
        } else if (img) {
            image = new Image();
            image.src = img;
        }
        if (!image) {
            m_actor = vgl.utils.createPlane(or[0], or[1], or[2], ul[0], ul[1], ul[2], lr[0], lr[1], lr[2]);
        } else {
            m_actor = vgl.utils.createTexturePlane(or[0], or[1], or[2], lr[0], lr[1], lr[2], ul[0], ul[1], ul[2], true);
            texture = vgl.texture();
            m_this.visible(false);
            image.onload = function() {
                texture.setImage(image);
                m_actor.material().addAttribute(texture);
                m_this.visible(true);
                if (onloadCallback) {
                    onloadCallback.call(this);
                }
                if (m_this.drawOnAsyncResourceLoad()) {
                    m_this._update();
                    m_this.layer()._draw();
                }
            };
        }
        m_this.renderer().contextRenderer().addActor(m_actor);
        this.buildTime().modified();
    };
    this._update = function() {
        if (this.buildTime().getMTime() <= this.dataTime().getMTime()) {
            this._build();
        }
        if (this.updateTime().getMTime() <= this.getMTime()) {
            m_actor.setVisible(this.visible());
            m_actor.material().setBinNumber(this.bin());
        }
        this.updateTime().modified();
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
    var m_map, m_this = this, m_leftMouseButtonDown = false, m_rightMouseButtonDown = false, m_middileMouseButtonDown = false, m_initRightBtnMouseDown = false, m_drawRegionMode = false, m_drawRegionLayer, m_clickLatLng, m_width, m_height, m_renderer, m_renderWindow, m_camera, m_outsideCanvas, m_currentMousePos, m_focusDisplayPoint, m_zTrans, m_coords, m_mouseLastPos = {
        x: 0,
        y: 0
    }, m_picker = new vgl.picker(), m_updateRenderParamsTime = vgl.timestamp();
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
        worldPt2 = m_renderWindow.displayToWorld(m_mouseLastPos.x, m_mouseLastPos.y, focusDisplayPoint, renderer);
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
                    last_display_pos: m_mouseLastPos,
                    curr_display_pos: m_currentMousePos,
                    last_world_pos: lastWorldPos,
                    curr_world_pos: currWorldPos
                };
                $(m_this).trigger(evt);
            }
        }
        if (m_middileMouseButtonDown) {}
        if (m_rightMouseButtonDown && m_height > 0) {
            m_zTrans = 2 * (m_currentMousePos.y - m_mouseLastPos.y) / m_height;
            m_this.zoom();
        }
        m_mouseLastPos.x = m_currentMousePos.x;
        m_mouseLastPos.y = m_currentMousePos.y;
        return false;
    };
    this.handleMouseDown = function(event) {
        var point;
        m_this.updateRenderParams();
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
            m_mouseLastPos.x = 0;
        } else {
            m_mouseLastPos.x = m_coords.x;
        }
        if (m_coords.y < 0) {
            m_mouseLastPos.y = 0;
        } else {
            m_mouseLastPos.y = m_coords.y;
        }
        if (m_drawRegionMode && m_leftMouseButtonDown) {
            point = m_map.displayToMap(m_mouseLastPos.x, m_mouseLastPos.y);
            m_clickLatLng = geo.latlng(point.y, point.x);
            m_this.setDrawRegion(point.y, point.x, point.y, point.x);
        }
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
            if (m_mouseLastPos.x >= 0 && m_mouseLastPos.x <= width && m_mouseLastPos.y >= 0 && m_mouseLastPos.y <= height) {
                num = m_picker.pick(m_mouseLastPos.x, m_mouseLastPos.y, m_renderer);
            }
        }
        if (event.button === 1) {
            m_middileMouseButtonDown = false;
        }
        if (event.button === 2) {
            m_rightMouseButtonDown = false;
            m_initRightBtnMouseDown = false;
            m_this.zoom();
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
        var delta = event.originalEvent.wheelDeltaY / 120;
        delta = Math.pow(1 + Math.abs(delta) / 2, delta > 0 ? -1 : 1);
        m_this._computeCurrentMousePos(event);
        m_this.zoom(delta);
        return false;
    };
    this._syncZoom = function(val) {
        var i, renderers, pos, fp, cam;
        m_this.updateRenderParams();
        if (val) {
            m_camera.zoom(val);
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
                console.log("Setting camera for ren ", renderers[i].layer());
                console.log("Setting pos ", pos);
                cam.setPosition(pos[0], pos[1], pos[2]);
                cam.setFocalPoint(fp[0], fp[1], fp[2]);
                cam.setClippingRange(clippingRange[0], clippingRange[1]);
                renderers[i].render();
            }
        }
    };
    this._syncPan = function() {};
    this.zoom = function(val) {
        var evt, newZoomLevel, oldZoomLevel, pos = m_camera.position();
        m_this.updateRenderParams();
        m_zTrans = (m_currentMousePos.y - m_mouseLastPos.y) / m_height;
        if (val === undefined) {
            if (m_zTrans < 0) {
                val = 1 - Math.abs(m_zTrans);
            } else {
                val = 1 + Math.abs(m_zTrans);
            }
        }
        oldZoomLevel = computeZoomLevel();
        if (pos[2] * Math.sin(m_camera.viewAngle()) >= 360 && val > 1) {
            m_camera.setPosition(pos[0], pos[1], computeCameraDistance(0));
            m_renderer.resetCameraClippingRange();
            newZoomLevel = 0;
        } else {
            this._syncZoom(val);
            newZoomLevel = computeZoomLevel();
        }
        pos = m_camera.position();
        if (pos[2] * Math.sin(m_camera.viewAngle()) >= 360 && val > 1) {
            m_camera.setPosition(pos[0], pos[1], computeCameraDistance(0));
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
            m_mouseLastPos = newPosition;
            return m_this;
        }
        return m_mouseLastPos;
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
        m_this.updateRenderParams();
        m_outsideCanvas = false;
        m_coords = m_this.viewer().relMouseCoords(event);
        m_currentMousePos = {
            x: 0,
            y: 0
        };
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
        var i, temp, delta, ren = this.contextRenderer(), cam = ren.camera(), fp = cam.focalPoint(), output = [];
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
        if (this.initialized()) {
            return this;
        }
        s_init.call(this);
        this.canvas($(m_viewer.canvas()));
        if (m_viewer.renderWindow().renderers().length > 0) {
            m_contextRenderer.setLayer(m_viewer.renderWindow().renderers().length);
            m_contextRenderer.setResetScene(false);
        }
        m_viewer.renderWindow().addRenderer(m_contextRenderer);
        this.layer().node().append(this.canvas());
        $(m_viewer.interactorStyle()).on(geo.event.pan, function(event) {
            m_this.trigger(geo.event.pan, event);
        });
        $(m_viewer.interactorStyle()).on(geo.event.zoom, function(event) {
            m_this.trigger(geo.event.zoom, event);
        });
        return this;
    };
    this._connectMapEvents = function() {
        if (m_this.layer().referenceLayer()) {
            var map = $(m_this.layer().map().node());
            map.on("mousewheel", function(event) {
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
        }
        m_viewer.interactorStyle().map(this.layer().map());
    };
    this.on(geo.event.layerAdd, function(event) {
        if (event.layer === m_this.layer()) {
            m_this._connectMapEvents();
        }
    });
    this._resize = function(x, y, w, h) {
        m_width = w;
        m_height = h;
        this.canvas().attr("width", w);
        this.canvas().attr("height", h);
        m_viewer.renderWindow().positionAndResize(x, y, w, h);
        this._render();
        return this;
    };
    this._render = function() {
        m_viewer.render();
        return this;
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
})(gd3);

gd3.object = function(arg) {
    "use strict";
    if (!(this instanceof geo.object)) {
        return new gd3.object(arg);
    }
    var m_id = "d3-" + gd3.uniqueID();
    this._d3id = function() {
        return m_id;
    };
    geo.sceneObject.call(this);
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
    var m_this = this;
    function georef(d, refresh) {
        if (!refresh && d.hasOwnProperty("_dispx") && d.hasOwnProperty("_dispy")) {
            return d;
        }
        var r = m_this.renderer(), p;
        p = r.worldToDisplay(d);
        d._dispx = function() {
            return p.x;
        };
        d._dispy = function() {
            return p.y;
        };
        return d;
    }
    var d_attr = {
        cx: function(d) {
            return georef(d, true)._dispx();
        },
        cy: function(d) {
            return georef(d)._dispy();
        },
        r: "1px"
    }, d_style = {
        fill: "black",
        stroke: "none"
    };
    var s_init = this._init, s_update = this._update, m_buildTime = geo.timestamp(), m_style = {};
    this._init = function(arg) {
        s_init.call(this, arg);
        return this;
    };
    this._drawables = function() {
        return d3.selectAll("." + this._d3id());
    };
    this._build = function() {
        var data = this.positions(), s_style = this.style();
        s_update.call(this);
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
        m_style.attributes.r = s_style.size.toString() + "px";
        m_style.style["fill-opacity"] = s_style.opacity;
        this.renderer().drawFeatures(m_style);
        m_buildTime.modified();
        this.updateTime().modified();
        return this;
    };
    this._update = function() {
        s_update.call(this);
        if (this.dataTime().getMTime() >= m_buildTime.getMTime()) {
            this._build();
        }
        return this;
    };
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
    function georef(d) {
        var r = m_this.renderer(), p;
        p = r.worldToDisplay(d);
        return p;
    }
    this._init = function(arg) {
        s_init.call(this, arg);
        return this;
    };
    this._build = function() {
        var data = this.positions(), s_style = this.style(), line = d3.svg.line().x(function(d) {
            return georef(d).x;
        }).y(function(d) {
            return georef(d).y;
        });
        s_update.call(this);
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
            "stroke-width": s_style.width[0].toString() + "px",
            "stroke-opacity": s_style.opacity
        };
        this.renderer().drawFeatures(m_style);
        m_buildTime.modified();
        this.updateTime().modified();
        return this;
    };
    this._update = function() {
        s_update.call(this);
        if (this.dataTime().getMTime() >= m_buildTime.getMTime()) {
            this._build();
        }
        return this;
    };
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
    function georef(d) {
        var r = m_this.renderer(), p;
        p = r.worldToDisplay(d);
        return p;
    }
    this._init = function(arg) {
        s_init.call(this, arg);
        return this;
    };
    this._build = function() {
        var data = this.positions(), s_style = this.style(), tmp, diag;
        s_update.call(this);
        diag = function(d) {
            var source = georef(d.source), target = georef(d.target), p = {
                source: source,
                target: target
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
                    source: src,
                    target: trg
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
            "stroke-width": s_style.width[0].toString() + "px",
            "stroke-opacity": s_style.opacity
        };
        this.renderer().drawFeatures(m_style);
        m_buildTime.modified();
        this.updateTime().modified();
        return this;
    };
    this._update = function() {
        s_update.call(this);
        if (this.dataTime().getMTime() >= m_buildTime.getMTime()) {
            this._build();
        }
        return this;
    };
    this._init(arg);
    return this;
};

inherit(gd3.pathFeature, geo.pathFeature);

geo.registerFeature("d3", "path", gd3.pathFeature);

gd3.graphFeature = function(arg) {
    "use strict";
    if (!(this instanceof gd3.graphFeature)) {
        return new gd3.graphFeature(arg);
    }
    geo.graphFeature.call(this, arg);
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
    gd3.object.call(this);
    var m_this = this, s_init = this._init, m_features = {}, m_translate = [ 0, 0 ];
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
    function translate(delta) {
        if (delta === undefined) {
            m_translate[0] = 0;
            m_translate[1] = 0;
        } else {
            m_translate[0] += delta.x;
            m_translate[1] += delta.y;
        }
        m_this.canvas().selectAll(".group-" + m_this._d3id()).attr("transform", "translate(" + m_translate.join() + ")");
    }
    this._init = function(arg) {
        s_init.call(this, arg);
        if (!this.canvas()) {
            var canvas = d3.select(this.layer().node().get(0)).append("svg");
            canvas.attr("class", this._d3id());
            canvas.attr("width", this.layer().node().width());
            canvas.attr("height", this.layer().node().height());
            this.canvas(canvas);
        }
    };
    this.displayToWorld = function(pt) {
        var map = getMap();
        if (!map) {
            throw "Cannot project until this layer is connected to a map.";
        }
        return map.displayToGcs(pt);
    };
    this.worldToDisplay = function(pt) {
        var map = getMap();
        if (!map) {
            throw "Cannot project until this layer is connected to a map.";
        }
        var v = map.gcsToDisplay(pt);
        v.x -= m_translate[0];
        v.y -= m_translate[1];
        return v;
    };
    this.api = function() {
        return "d3";
    };
    this._resize = function(x, y, w, h) {
        m_this.canvas().attr("width", w);
        m_this.canvas().attr("height", h);
        translate();
        m_this.updateFeatures();
    };
    this._render = function() {};
    this._exit = function() {
        this.canvas().remove();
    };
    function getGroup(grp) {
        var svg = m_this.canvas(), selection = svg.selectAll(".group-" + grp).data([ 0 ]);
        selection.enter().append("g").attr("class", "group-" + grp);
        return selection;
    }
    this.drawFeatures = function(arg) {
        m_features[arg.id] = {
            data: arg.data,
            index: arg.dataIndex,
            style: arg.style,
            attributes: arg.attributes,
            classes: arg.classes,
            append: arg.append
        };
        translate();
        return m_this.updateFeatures(arg.id);
    };
    this.updateFeatures = function(id) {
        var key;
        if (id === undefined) {
            for (key in m_features) {
                if (m_features.hasOwnProperty(key)) {
                    m_this.updateFeatures(key);
                }
            }
            return this;
        }
        var svg = getGroup(m_this._d3id()), data = m_features[id].data, index = m_features[id].index, style = m_features[id].style, attributes = m_features[id].attributes, classes = m_features[id].classes, append = m_features[id].append, selection = svg.selectAll("." + id).data(data, index);
        selection.enter().append(append);
        selection.exit().remove();
        setAttrs(selection, attributes);
        selection.attr("class", classes.concat([ id ]).join(" "));
        selection.style(style);
        return this;
    };
    this.on(geo.event.pan, function(event) {
        translate({
            x: event.curr_display_pos.x - event.last_display_pos.x,
            y: event.curr_display_pos.y - event.last_display_pos.y
        });
    });
    this.on(geo.event.zoom, function() {
        translate();
        m_this.updateFeatures();
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