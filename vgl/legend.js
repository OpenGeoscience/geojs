//////////////////////////////////////////////////////////////////////////////
/**
 * @module ogs.vgl
 */

/*jslint devel: true, forin: true, newcap: true, plusplus: true*/
/*jslint white: true, indent: 2*/

/*global vglModule, ogs, inherit, $, Image*/
/*global vglModule*/
//////////////////////////////////////////////////////////////////////////////

vglModule.legend = function() {
    if (!(this instanceof vglModule.legend)) {
        return new vglModule.legend();
    }
    vglModule.actor.call(this);

    this.lookupTable = function() {
      return m_lookupTable;
    };

    this.setLookupTable = function(lookupTable) {
      m_lookupTable = lookupTable;
      this.modified();
    };



    return this;
};
