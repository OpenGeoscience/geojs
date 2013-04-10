
uiModule.gis = function() {
  if (!(this instanceof uiModule.gis)) {
    return new uiModule.gis();
  }

  return this;
};

/**
 * Create a placeholder to display current layers
 *
 * @param rootId
 * @param heading
 */
uiModule.gis.createList = function(rootId, heading) {
  var listRoot = document.getElementById(rootId);
  var itemRoot = document.createElement("div");
  itemRoot.setAttribute("class", "accordion-group");
  listRoot.appendChild(itemRoot);

  var itemHeading = document.createElement("div");
  itemHeading.setAttribute("class", "accordion-heading");
  itemRoot.appendChild(itemHeading);

  var itemCollection = document.createElement("a");
  itemCollection.setAttribute("class", "accordion-toggle");
  itemCollection.setAttribute("data-toggle", "collapse");
  itemCollection.setAttribute("data-parent", "#"+rootId);
  itemCollection.setAttribute("href", "#collapse-"+rootId);
  itemCollection.appendChild(document.createTextNode(heading));
  itemHeading.appendChild(itemCollection);

  var subItemsRoot = document.createElement("div");
  subItemsRoot.setAttribute("class", "accordion-body collapse in");
  subItemsRoot.setAttribute("id", "collapse-"+rootId);
  itemRoot.appendChild(subItemsRoot);
  var subItemsList = document.createElement("div");
  subItemsList.setAttribute("class", "accordion-inner");
  subItemsRoot.appendChild(subItemsList);

  var tableRoot = document.createElement("table");
  tableRoot.setAttribute("id", 'table-' + rootId);
  subItemsList.appendChild(tableRoot);

  var tbody = document.createElement("tbody");
  tableRoot.appendChild(tbody);
};

/**
 * Create a list of documents that could be added as a layer
 *
 * @param rootId
 * @param heading
 * @param layersRootId
 * @param data
 */
uiModule.gis.createDataList = function(rootId, heading, layersRootId, data, callback) {
  var listRoot = $(document.getElementById(rootId));

  var itemRoot = $(document.createElement('div'));
  itemRoot.attr('class', 'accordion-group');
  listRoot.append(itemRoot);

  var itemHeading = $(document.createElement('div'));
  itemHeading.attr('class', 'accordion-heading');
  itemRoot.append(itemHeading);

  var itemCollection = $(document.createElement('a'));
  itemCollection.attr('class', 'accordion-toggle');
  itemCollection.attr('data-toggle', 'collapse');
  itemCollection.attr('data-parent', '#'+rootId);
  itemCollection.attr('href', '#collapse-'+rootId);
  itemCollection.append(document.createTextNode(heading));
  itemHeading.append(itemCollection);

  var subItemsRoot = $(document.createElement('div'));
  subItemsRoot.attr('class', 'accordion-body collapse in');
  subItemsRoot.attr('id', 'collapse-'+rootId);
  itemRoot.append(subItemsRoot);

  var subItemsList = $(document.createElement('div'));
  subItemsList.attr('class', 'accordion-inner');
  subItemsRoot.append(subItemsList);

  var tableRoot = $(document.createElement('table'));
  tableRoot.attr('class', 'table-hover');
  subItemsList.append(tableRoot);

  $.each(data, function(i, item) {
    var row = $(document.createElement('tr'));
    row.attr('class', 'success');
    tableRoot.append(row);

    var col = $(document.createElement('td'));
    var he = $(document.createElement('h4'));
    he.html(item.basename);
    col.append(he);
    row.append(col);

    // Add drop-down so that users can select a variable
    col = $(document.createElement('td'));
    var select = $(document.createElement('select'));
    select.attr('class', 'combobox');
    col.append(select);
    for (var k = 0; k < item.variables.length; ++k) {
      var varname = item.variables[k].name;
      var option = $(document.createElement('option'));
      option.attr('value', varname);
      option.html(varname);
      select.append(option);
    }
    row.append(col);

    // Add 'add' button
    col = $(document.createElement('td'));
    var button = $(document.createElement('button'));
    button.attr('type', 'button');
    button.attr('class', 'btn btn-primary');
    button.attr('id', 'btn-add-' + item.name);
    button.attr('_id', item._id);
    button.attr('name', item.name);
    button.attr('basename', item.basename);
    button.attr('data-toggle', 'button');
    button.attr('data-loading-text', 'Loading...');
    button.html('Add');
    col.append(button);
    row.append(col);

    if (callback != undefined) {
      $(button).on("click", callback);
    }
  });

  $('.combobox').width(Math.max.apply(Math,
                                       $('.combobox').map(function(){
                                         return $(this).outerWidth();}).get()));
  $('.combobox').select2();
};

/**
 * Add a document as a layer to the list
 *
 * @todo Actually load a layer
 *
 * @param layersRootId
 * @param elem
 */
uiModule.gis.addLayer = function(object, layersRootId, elem, selectfunc, togglefunc,
  removefunc, callback) {

  var rootId = "#" + layersRootId;
  var _id = $(elem).attr("_id");
  if (_id !== null) {
    var tbody = $(rootId).find('tbody');
    var basename = $(elem).attr("name");
    $(elem).button('loading');

    var layerId = basename;

    var tr = $(document.createElement('tr'));
    tr.attr('id', layerId);
    $(tbody).append(tr);

    // Name of the layer
    var td = $(document.createElement('td'));
    td.append($(document.createElement('h4')).html(basename));
    tr.append(td);

    // Select button
    td = $(document.createElement('td'));
    td.attr('class', 'td-btn-layer');
    var button = $(document.createElement('button'));
    button.attr('class', 'btn-layer btn-select-layer btn btn-primary disabled');
    button.attr('disabled', 'disabled');
    button.html('Select');
    button.click(layerId, function() {
      selectfunc(this, layerId);
    });
    td.append(button);

    // Toggle button
    button = $(document.createElement('button'));
    button.attr('class', 'btn-layer btn-toggle-layer btn btn-warning disabled');
    button.attr('disabled', 'disabled');
    button.html('Toggle');
    button.click(layerId, function() {
      togglefunc(this, layerId);
    });
    td.append(button);

    // Remove button
    button = $(document.createElement('button'));
    button.attr('class', 'btn-layer btn-remove-layer btn btn-danger disabled');
    button.attr('disabled', 'disabled');
    button.html('Remove');
    button.click(layerId, function() {
      removefunc(this, layerId);
    });
    td.append(button);
    tr.append(td);

    $('.btn-layer').width(Math.max.apply(Math,
                                            $('.btn-layer').map(function(){
                                              return $(this).outerWidth();}).get()));
    }
    // @todo Just calling fadeIn does not work. It has to be set invisible
    // and then only it works. We need to check if this is expected.
    $('#'+layerId).fadeOut(0);
    $('#'+layerId).fadeIn('slow', callback);
};

/**
 *
 */
uiModule.gis.layerAdded = function(elem) {
  $(elem).removeClass("btn-primary");
  $(elem).addClass("btn-success");
  $(elem).addClass("disabled");
  $(elem).attr('data-loading-text', 'Added');
  $(elem).attr('disabled', 'disabled');
  $(elem).html('Added');
}

/**
 * Remove a layer from the list
 *
 * @param elem
 * @returns {Boolean}
 */
uiModule.gis.removeLayer = function(elem, layerId) {
  var buttonId = $('#btn-add-'+layerId);
  var button = $(buttonId);

  if (button !== null || button !== undefined) {
    button.removeClass('disabled');
    button.removeAttr('disabled');
    button.removeClass('btn-success');
    button.removeClass('active');
    button.button('reset');
    button.addClass('btn-primary');

    $('#' + layerId).fadeOut(function() {
      $('#' + layerId).remove();
    });

    return true;
  }

  return false;
};

uiModule.gis.toggleLayer = function(elem, layerId) {
  // Do nothing
};

/**
 * Update UI to when a layer is selected
 */
uiModule.gis.selectLayer = function(target, layerId) {
  $('btn-select-layer').siblings().removeClass('active');

  if (target !== null || target !== undefined) {
    $(target).addClass('active');
  }

  return true;
};


uiModule.gis.generateOptions = function(rootId, map) {
  var options = map.options();

  var parent = $('#'+rootId);

  for (var key in options) {
    if (options.hasOwnProperty(key)) {

      var row = $(document.createElement('tr'));
      parent.append(row);
      var col = $(document.createElement('td'));
      row.append(col);

      var heading = $(document.createElement('h4'));
      heading.html(key);
      col.append(heading);

      switch(key) {
        case "zoom":
          // Create a slider here
          col = $(document.createElement('td'));
          var sliderDiv = $(document.createElement('div'));
          sliderDiv.slider({
            range: "min",
            min: 0.0,
            max: 17.0,
            step: 1,
            value: options[key],
            slide: function( event, ui ) {
              map.setZoom( ui.value );
              map.redraw();
            }
          });
          $(sliderDiv).on('mousedown', function(e) {
            e.stopPropagation();
            return false;
          });
          col.attr('class', 'span10');
          $(col).append(sliderDiv);
          row.append(col);
          break;
        case "center":
          // Text box
          col = $(document.createElement('td'));
          row.append(col);

          var latInput = $(document.createElement('input'));
          latInput.attr('type', 'number');
          //latInput.attr('value', map.options().center[0]);
          latInput.click(function() {
            map.redraw();
          });
          col.append(input);

          var lngInput = $(document.createElement('input'));
          lngInput.attr('type', 'number');
          //lngInput.attr('value', map.options().center[1]);
          lngInput.click(function() {
            map.redraw();
          });
          col.append(input);
          break;
        case "country_boundries":
          // Boolean
          col = $(document.createElement('td'));
          row.append(col);

          var input = $(document.createElement('input'));
          input.attr('type', 'checkbox');
          input.attr('checked', map.options().country_boundries);
          input.click(function() {
            map.toggleCountryBoundries();
            map.redraw();
          });
          col.append(input);

          break;
        case "us_states":
          // Boolean
          break;
        case "source":
          // Dropdown
          break;
      }
    }
  }
};