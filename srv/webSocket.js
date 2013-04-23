/*global $, document, window, console*/

/**
 * WebSocket options object specification
 */
srvModule.webSocketOptions = function() {

  // Check against no use of new()
  if (!(this instanceof srvModule.webSocketOptions)) {
    return new srvModule.webSocketOptions();
  }

  this.url = 'ws://' + window.location.host + '/ws';
  this.nodes = [];

  return this;
};


/**
 * WebSocket wrapper to more easily communicate with geoweb server
 */
srvModule.webSocket = function(options) {

  this.events = {
    "message_recieved" : "message_recieved",
    "opened" : "opened",
    "closed" : "closed",
    "ready" : "ready"
  };

  if (!(this instanceof srvModule.webSocket)) {
    return new srvModule.webSocket(options);
  }

  ogs.vgl.object.call(this);

  /** @private */
  var m_that = this;

  /** @private */
  var m_url = options.url || 'ws://' + window.location.host + '/ws';

  /** @private */
  var m_nodes = options.nodes || [];

  /** @private */
  var m_readynodes = {};

  /** @private */
  var m_binders = {};

  /** @private */
  var m_open = false;

  /** @private */
  var m_ws;

  if (window.WebSocket) {
    m_ws = new window.WebSocket(m_url);
  } else if (window.MozWebSocket) {
    m_ws = window.MozWebSocket(m_url);
  } else {
    console.log("[WARNING] WebSocket Not Supported");
    return;
  }

  // Close the websocket when the window closes
  window.onbeforeunload = function (event) {
    m_ws.close(1000, 'Window closed');
    m_open = false;

    if (!event) {
      event = window.event;
    }
    event.stopPropagation();
    event.preventDefault();
  };

  // websocket connection established
  m_ws.onopen = function() {
    m_open = true;
    $(m_that).trigger({
      type: m_that.events.opened
    });

    //initiate nodes if needed
    if(m_nodes.length == 0) {
      $(m_that).trigger({
	type: m_that.events.ready
      });
    } else {

      m_that.bind('nodemanager', function(node) {
	m_readynodes[node] = true;
	var allReady = true;
	for(var i = 0; i < m_nodes.length; i++) {
	  if(!m_readynodes[m_nodes[i]]) {
	    allReady = false;
	  }
	}
	if(allReady) {
	  $(m_that).trigger({
	    type: m_that.events.ready
	  });
	}
      });

      for(var i = 0; i < m_nodes.length; i++) {
	m_that.message('nodemanager',m_nodes[i]);
      }
    }
  }

  // websocket connection lost
  m_ws.onclosed = function() {
    m_open = false;
    $(m_that).trigger({
      type: m_that.events.closed
    });
  }

  // Recieved a message from the server
  // trigger event, and call all callbacks registered for this target
  m_ws.onmessage = function (event) {
    $(m_that).trigger({
      type : m_that.events.message_recieved,
      message : event.data
    });

    data = JSON.parse(event.data);
    if(m_binders.hasOwnProperty(data.target)) {
      for(var i in m_binders[data.target]) {
	m_binders[data.target][i].call(m_that, data.message);
      }
    }
  }

  /**
   * Send a signal to a server node
   *
   * @param {String} target
   * @param {String} slot
   * @param {array} args [optional]
   * @param {object} kwargs [optional]
   */
  this.signal = function(node, slot, args, kwargs) {
    args = typeof args !== 'undefined' ? args : [];
    kwargs = typeof kwargs !== 'undefined' ? kwargs : {};
    var json = {
      target:node,
      message: {
	slot: slot,
	args: args,
	kwargs: kwargs
      }
    };

    m_ws.send(JSON.stringify(json));
  };

  /**
   * Send a message to a server node or handler
   *
   * @param {String} target
   * @param {Mixed} message
   */
  this.message = function(node, message) {
    var json = {
      target: node,
      message: message
    };

    m_ws.send(JSON.stringify(json));
  };

  /**
   * Get the url used by this websocket
   *
   * @returns {String}
   */
  this.url = function() {
    return m_url;
  };

  /**
   * Get the open status of this websocket
   *
   * @returns {Boolean}
   */
  this.open = function() {
    return m_open;
  };

  /**
   * Get the underlying websocket
   *
   * @returns {WebSocket}
   */
  this.name = function() {
    return m_ws;
  };

  /**
   * Bind to named websocket messages from the server
   * 'this' for the callback will be this websocket object
   *
   * @param {String} name
   * @param {function} callback
   */
  this.bind = function(name, callback) {
    if( !m_binders.hasOwnProperty(name)) {
      m_binders[name] = [];
    }
    m_binders[name].push(callback);
  }

  /**
   * Unbind from named websocket messages from the server
   *
   * @param {String} name
   * @param {function} callback
   */
  this.unbind = function(name, callback) {
    if( m_binders.hasOwnProperty(name)) {
      index = m_binders[name].indexof(callback);
      if(index != -1) {
	m_binders.splice(index,1);
      }
    }
  }

  /**
   * Unbind all callbacks from named websocket messages from the server
   * If name is blank, all binded functions for all names are removed
   * Otherwise only callbacks binded to that name
   *
   * @param {String} name [optional]
   */
  this.unbindAll = function(name) {
    if(typeof name !== 'undefined') {
      if( m_binders.hasOwnProperty(name)) {
	m_binders[name] = [];
      }
    } else {
      m_binders = {}
    }
  }

  return this;
};

inherit(srvModule.webSocket, ogs.vgl.object);
