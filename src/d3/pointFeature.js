//////////////////////////////////////////////////////////////////////////////
/**
 * @module geo.gl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2, unparam: true*/

/*global geo, gd3, inherit, document, d3*/
//////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////
/**
 * Create a new instance of pointFeature
 *
 * @class
 * @returns {ggl.pointFeature}
 */
//////////////////////////////////////////////////////////////////////////////
gd3.pointFeature = function(arg) {
  "use strict";
  if (!(this instanceof gd3.pointFeature)) {
    return new gd3.pointFeature(arg);
  }
  arg = arg || {};
  geo.pointFeature.call(this, arg);

  ////////////////////////////////////////////////////////////////////////////
  /**
   * @private
   */
  ////////////////////////////////////////////////////////////////////////////
  var m_id = 'geo-point-' + gd3.uniqueID(),
      s_init = this._init,
      s_update = this._update;

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Initialize
   */
  ////////////////////////////////////////////////////////////////////////////
  this._init = function(arg) {
    s_init.call(this, arg);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Return the class of the svg elements created by this class
   */
  ////////////////////////////////////////////////////////////////////////////
  this._id = function () {
    return m_id;
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Build
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._build = function() {
    s_update.call(this);
  };

  ////////////////////////////////////////////////////////////////////////////
  /**
   * Update
   *
   * @override
   */
  ////////////////////////////////////////////////////////////////////////////
  this._update = function() {
    s_update.call(this);

    var sel, enter, exit;
    
    // TODO: Need to provide an accessor api in core:
    //          - position
    //          - id
    //          - style?
    function lat(d) {
      return d.lat;
    }

    function lng(d) {
      return d.lon;
    }

    function id(d, i) {
      return i;
    }

    function color() {
        return 'red';
    }

    function radius() {
        return '5pt';
    }

    // boilerplate... maybe abstract this in the d3 namespace
    sel = this.renderer().canvas()
            .selectAll('.' + this._id())
              .data(this.positions(), id);
    enter = sel.enter();
    exit = sel.exit();

    enter.append('circle');

    sel
      .attr('r', radius)
      .attr('cx', lng)
      .attr('cy', lat)
      .style('fill', color);

    exit.remove();
  };

  this._init(arg);
  return this;
};

inherit(gd3.pointFeature, geo.pointFeature);

// Now register it
geo.registerFeature('d3', 'pointFeature', gd3.pointFeature);
