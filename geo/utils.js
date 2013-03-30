/**
 * Create a placeholder to display current layers
 *
 * @param rootId
 * @param heading
 */
geoModule.createGisLayerList = function(rootId, heading) {
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
geoModule.createGisDataList = function(rootId, heading, layersRootId, data, callback) {
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
    col = document.createElement("td");

    var button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("class", "btn btn-primary");
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
geoModule.addLayer = function(layersRootId, elem) {
  var rootId = "#" + layersRootId;
  var _id = $(elem).attr("_id");
  if (_id !== null) {
    var tbody = $(rootId).find('tbody');
    var basename = $(elem).attr("name");
    $(elem).removeClass("btn-primary");
    $(elem).addClass("btn-success");
    $(elem).addClass("disabled");
    $(tbody).append("<tr id=layer_"+_id+">");
    $(rootId + " tr:last").append("<td>" + basename + "</td>")
    $(rootId + " tr:last").append("<td><button class='btn btn-warning'> Hide </button></td>");
  }
};

/**
 * Remove a layer from the list
 * @param elem
 * @returns {Boolean}
 */
geoModule.removeLayer = function(elem) {
  var _id = $(elem).attr("_id");
  var layerId = "#layer_" + _id;
  $(layerId).remove();
  return false;
};
