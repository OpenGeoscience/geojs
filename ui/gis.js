
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
uiModule.gis.createGisLayerList = function(rootId, heading) {
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
  tableRoot.setAttribute("id", rootId + '-table');
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
uiModule.gis.createGisDataList = function(rootId, heading, layersRootId, data, callback) {
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
  subItemsList.appendChild(tableRoot);

  $.each(data, function(i, item) {
    var row = document.createElement("tr");
    row.setAttribute("class", "success");
    tableRoot.appendChild(row);
    var col = document.createElement("td");
    col.appendChild(document.createTextNode(item.basename));
    row.appendChild(col);

    // Add drop-down so that users can select a variable
    col = document.createElement("td");
    var select = document.createElement('select');
    col.appendChild(select);
    for (var k = 0; k < item.variables.length; ++k) {
      var varname = item.variables[k].name;
      var option= document.createElement('option');
      option.setAttribute('value', varname);
      option.innerHTML = varname;
      select.appendChild(option);
    }
    row.appendChild(col);

    // Add 'add' button
    col = document.createElement("td");
    var button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("class", "btn btn-primary");
    button.setAttribute("id", "btn-add-" + item.name);
    button.setAttribute("_id", item._id);
    button.setAttribute("name", item.name);
    button.setAttribute("basename", item.basename);
    button.setAttribute("data-toggle", "button");
    button.appendChild(document.createTextNode("Add"));
    col.appendChild(button);
    row.appendChild(col);

    if (callback != undefined) {
      $(button).on("click", callback);
      /*$(button).on("click", function() {
        geoModule.addLayer(layersRootId, this);
        $(button).attr("disabled", "disabled");
      });*/
    }
  });
};

/**
 * Add a document as a layer to the list
 *
 * @todo Actually load a layer
 *
 * @param layersRootId
 * @param elem
 */
uiModule.gis.addLayer = function(object, layersRootId, elem, togglefunc, removefunc, callback) {
  var rootId = "#" + layersRootId;
  var _id = $(elem).attr("_id");
  if (_id !== null) {
    var tbody = $(rootId).find('tbody');
    var basename = $(elem).attr("name");
    $(elem).removeClass("btn-primary");
    $(elem).addClass("btn-success");
    $(elem).addClass("disabled");
    var layerId = basename;
    $(tbody).append("<tr id="+layerId+">");
    $(rootId + " tr:last").append("<td>" + basename + "</td>")
    $(rootId + " tr:last").append("<td class='td-btn-layer'><button class='btn-layer btn btn-warning disabled' disabled='disabled' onclick="+togglefunc+"('"+basename+"')> Toggle </button></td>")
    $(rootId + " tr:last").append("<td class='td-btn-layer'><button class='btn-layer btn btn-danger disabled' disabled='disabled' onclick="+removefunc+"('"+basename+"')> Remove </button></td>")
    layerId = '#'+layerId;

    $('.btn-layer').width(Math.max.apply(Math,
                                            $('.btn-layer').map(function(){
                                              return $(this).outerWidth();}).get()));
    }
    // @todo Just calling fadeIn does not work. It has to be set invisible
    // and then only it works. We need to check if this is expected.
    $(layerId).fadeOut(0);
    $(layerId).fadeIn('slow', callback);
};

/**
 * Remove a layer from the list
 *
 * @param elem
 * @returns {Boolean}
 */
uiModule.gis.removeLayer = function(layerId) {
  var buttonId = $('#btn-add-'+layerId);
  var button = $(buttonId);

  if (button !== null || button !== undefined) {
    button.removeClass('disabled');
    button.removeClass('btn-success');
    button.removeClass('active');
    button.addClass('btn-primary');

    $('#' + layerId).fadeOut(function() {
      $('#' + layerId).remove();
    });

    return true;
  }

  return false;
};

uiModule.gis.toggleLayer = function(layerId) {

}
