/*jslint devel: true, forin: true, newcap: true, plusplus: true, white: true, indent: 2*/
/*global geoModule, ogs, $, document, uiModule*/


uiModule.gis = function() {
  "use strict";
  if (!(this instanceof uiModule.gis)) {
    return new uiModule.gis();
  }

  return this;
};

uiModule.gis.selectedLayers = function() {
  var layers = []
  $('#table-layers tr').each(function(i, tr) {
    // call the function passing the id
    if ($('#selected', tr)[0].checked)
      layers.push(tr.id);
  });

  return layers;
}


/**
 * Create a placeholder to display current layers
 *
 * @param rootId
 * @param heading
 */
uiModule.gis.createLayerList = function(map, rootId, heading, toggleFunct, removeFunct) {
  var tableRoot = uiModule.gis.createList(rootId, heading);

  // Add the controls
  var controls = $(document.createElement('div'));
  controls.attr('id', 'layer-control-btns');
  controls.addClass('btn-group');
  //controls.width('400px');

  // Toggle button
  var toggleButton = $(document.createElement('button'));
  toggleButton.attr('class', 'btn-toggle-layer btn-small btn-warning layer-control-btn');
  toggleButton.attr('disabled', 'true');
  toggleButton.html('Toggle');
  toggleButton.width('70px');
  controls.append(toggleButton)

  var forEachSelectedLayer = function(funct) {
    $('#table-layers tr').each(function(i, tr) {
      // call the function passing the id
      if ($('#selected', tr)[0].checked)
        funct(tr.id);
    });
  };

  // Add click action
  toggleButton.click(function() {

    forEachSelectedLayer(function(id) {
      toggleFunct(this, id);
    });

  });

  // Remove button
  var removeButton = $(document.createElement('button'));
  removeButton.attr('class', 'btn-edit-layer btn-small btn-danger layer-control-btn');
  removeButton.attr('disabled', 'true');
  removeButton.html('Remove');
  removeButton.width('70px');
  controls.append(removeButton);

  // Add click action
  removeButton.click(function() {

    forEachSelectedLayer(function(id) {
      removeFunct(this, id);
    });

  });

  // Modify button
  var modifyButton =  $(document.createElement('button'));
  modifyButton.attr('class', 'btn-small btn-success');
  modifyButton.attr('disabled', 'true');
  modifyButton.html('Modify');
  modifyButton.width('70px');
  controls.append(modifyButton);

  var editFunction = function() {

    var editDiv =  $(document.createElement('div'));
    editDiv.attr('id', 'edit-layer-controls');
    editDiv.width(200);
    editDiv.height(200);

    uiModule.gis.createOpacityControl(editDiv, map, uiModule.gis.selectedLayers);

    return editDiv;
  }

  var popoverOptions = {
      html: true,
      container: "body",
      placement: "right",
      trigger: "click",
      title: null,
      content: editFunction,
      delay: {
          show: 100,
          hide: 100
      }
  };

  //popoverOptions.content = editDiv;
  modifyButton.popover(popoverOptions);

  // Hide the popover if the controls are minimsed
  $('#drawer').on('click', function(event){
    modifyButton.popover('hide');
  });

  // Add animation controls

  var animationControls =
    $('<div>', {id: 'animation-controls',  class: 'btn-group'}).append(
      $('<button>', {id: 'step-backward', class: 'btn btn-small', disabled: 'true'}).append(
        $('<i>', {class: 'icon-step-backward'})
      )
      ,
      $('<button>', {id: 'play', class: 'btn btn-small', disabled: 'true'}).append(
        $('<i>', {class: 'icon-play'})
      )
      ,
      $('<button>', {id: 'pause', class: 'btn btn-small', disabled: 'true'}).append(
        $('<i>', {class: 'icon-pause'})
      )
      ,
      $('<button>', {id: 'stop', class: 'btn btn-small', disabled: 'true'}).append(
        $('<i>', {class: 'icon-stop'})
      )
      ,
      $('<button>', {id: 'step-forward', class: 'btn btn-small', disabled: 'true'}).append(
        $('<i>', {class: 'icon-step-forward'})
      )
    );

  animationControls.css({left: "10px"});
  controls.append($(animationControls));

  var layersToAnimate = function() {
    var layers = []

    $.each(uiModule.gis.selectedLayers(), function(i, id) {
      var dataset = $('#'+id).data('dataset');
      var layer = map.findLayerById(dataset.dataset_id);

      layers.push({dataset: dataset, layer: layer});
    });

    return layers;
  };

  $('#play', animationControls).click(function() {
    $(this).addClass('active');
    $('#pause', animationControls).removeClass('active');
    $.each(layersToAnimate(), function(i, data) {
      var dataset = data.dataset;
      var layer = data.layer;

      map.animate(dataset.timesteps, [layer]);
    });
  });

  $('#pause', animationControls).click(function() {
    $(this).addClass('active');
    $('#play', animationControls).removeClass('active');
    map.pauseAnimation();
  })

  $('#stop', animationControls).click(function() {
    $('#play', animationControls).removeClass('active');
    $('#pause', animationControls).removeClass('active');
    map.stopAnimation();
  })

  $('#step-forward', animationControls).click(function() {
    $.each(uiModule.gis.selectedLayers(), function(i, id) {
      var dataset = $('#'+id).data('dataset');
      var layer = map.findLayerById(dataset.dataset_id);

      map.stepAnimationForward(dataset.timesteps, [layer]);
    });
  });

  $('#step-backward', animationControls).click(function() {
    $.each(uiModule.gis.selectedLayers(), function(i, id) {
      var dataset = $('#'+id).data('dataset');
      var layer = map.findLayerById(dataset.dataset_id);

      map.stepAnimationBackward(dataset.timesteps, [layer]);
    });
  });

  $(map).on(geoModule.command.animateEvent, function (event) {
    if (event.currentTime == event.endTime)
      $('#play', animationControls).removeClass('active');
  });

  $('#table-layers').on('layers-selection', function() {
    $.each($('#layer-control-btns button'), function(i, button) {
      $(button).removeAttr('disabled');
    });
    $.each($('#animation-controls button'), function(i, button) {
      $(button).removeAttr('disabled');
    });
  });

  $('#table-layers').on('layers-no-selection', function() {
    $.each($('#layer-control-btns button'), function(i, button) {
      $(button).attr('disabled', 'true');
    });
    $.each($('#animation-controls button'), function(i, button) {
      $(button).attr('disabled', 'true');
    });
  });

  controls.hide();

  $('#'+rootId + ' .accordion-inner').prepend(controls)
}

uiModule.gis.createList = function(rootId, heading) {
  "use strict";
  var listRoot, itemRoot, itemHeading, itemCollection, subItemsRoot,
      subItemsList, tableRoot, tbody;

  listRoot = document.getElementById(rootId);
  itemRoot = document.createElement("div");
  itemRoot.setAttribute("class", "accordion-group");
  listRoot.appendChild(itemRoot);

  itemHeading = document.createElement("div");
  itemHeading.setAttribute("class", "accordion-heading");
  itemRoot.appendChild(itemHeading);

  itemCollection = document.createElement("a");
  itemCollection.setAttribute("class", "accordion-toggle");
  itemCollection.setAttribute("data-toggle", "collapse");
  itemCollection.setAttribute("data-parent", "#" + rootId);
  itemCollection.setAttribute("href", "#collapse-" + rootId);
  itemCollection.appendChild(document.createTextNode(heading));
  itemHeading.appendChild(itemCollection);

  subItemsRoot = document.createElement("div");
  subItemsRoot.setAttribute("class", "accordion-body collapse in");
  subItemsRoot.setAttribute("id", "collapse-" + rootId);
  itemRoot.appendChild(subItemsRoot);
  subItemsList = document.createElement("div");
  subItemsList.setAttribute("class", "accordion-inner");
  subItemsRoot.appendChild(subItemsList);

  tableRoot = document.createElement("table");
  tableRoot.setAttribute("id", 'table-' + rootId);
  subItemsList.appendChild(tableRoot);

  tbody = document.createElement("tbody");
  tableRoot.appendChild(tbody);

  return tableRoot;
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
  "use strict";
  var listRoot, itemRoot, itemCollection, subItemsRoot, subItemsList, tableRoot, itemHeading;
  listRoot = $(document.getElementById(rootId));

  itemRoot = $(document.createElement('div'));
  itemRoot.attr('class', 'accordion-group');
  listRoot.append(itemRoot);

  itemHeading = $(document.createElement('div'));
  itemHeading.attr('class', 'accordion-heading');
  itemRoot.append(itemHeading);

  itemCollection = $(document.createElement('a'));
  itemCollection.attr('class', 'accordion-toggle');
  itemCollection.attr('data-toggle', 'collapse');
  itemCollection.attr('data-parent', '#' + rootId);
  itemCollection.attr('href', '#collapse-' + rootId);
  itemCollection.append(document.createTextNode(heading));
  itemHeading.append(itemCollection);

  subItemsRoot = $(document.createElement('div'));
  subItemsRoot.attr('class', 'accordion-body collapse in');
  subItemsRoot.attr('id', 'collapse-' + rootId);
  itemRoot.append(subItemsRoot);

  subItemsList = $(document.createElement('div'));
  subItemsList.attr('class', 'accordion-inner');
  subItemsRoot.append(subItemsList);

  tableRoot = $(document.createElement('table'));
  tableRoot.attr('class', 'table-hover');
  subItemsList.append(tableRoot);

  $.each(data, function(i, item) {
    var row, col, he, select, k, varname, option, button, rawTimes, time, tval;
    row = $(document.createElement('tr'));
    row.attr('class', 'success');
    tableRoot.append(row);

    col = $(document.createElement('td'));
    he = $(document.createElement('h4'));
    he.html(item.basename);
    col.append(he);
    row.append(col);

    rawTimes = ["na","na"];
    if (item.timeInfo.rawTimes)
      {
      console.log(item.timeInfo)
      rawTimes = item.timeInfo.rawTimes;
      }

    // Add a drop down to let user select time
    col = $(document.createElement('td'));
    time = $(document.createElement('select'));
    time.attr('class', 'combobox');
    time.attr('id', item.name + "_tselect");
    col.append(time);
    for (k = 0; k < rawTimes.length; ++k) {
      tval = rawTimes[k];
      option = $(document.createElement('option'));
      option.attr('value', tval);
      option.html(tval);
      time.append(option);
    }
    col.append(time);
    row.append(col);

    // Add drop-down so that users can select a variable
    col = $(document.createElement('td'));
    select = $(document.createElement('select'));
    select.attr('class', 'combobox');
    select.attr('id', item.name + "_vselect");
    col.append(select);
    for (k = 0; k < item.variables.length; ++k) {
      varname = item.variables[k].name;
      option = $(document.createElement('option'));
      option.attr('value', varname);
      option.html(varname);
      select.append(option);
    }
    row.append(col);

    // Add 'add' button
    col = $(document.createElement('td'));
    button = $(document.createElement('button'));
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

    if (callback !== undefined) {
      $(button).on("click", callback);
    }
  });

  $('.combobox').width(Math.max.apply(Math, $('.combobox').map(function() {
    return $(this).outerWidth();
  }).get()));
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
uiModule.gis.addLayer = function(object, layersRootId, dataSet, selectfunc,
    togglefunc, removefunc, callback, workflowfunc, displayProgress) {
  "use strict";

  // Show controls
  $('#layer-control-btns').show();

  var rootId, tbody, basename, layerId, tr, td, button, _id;
  rootId = "#" + layersRootId;
  layerId = $(dataSet).attr("dataset_id");
   if (layerId !== null) {
    tbody= $(rootId).find('tbody');
    basename = $(dataSet).attr("name");


    tr = $(document.createElement('tr'));
    tr.attr('id', layerId);
    $(tbody).append(tr);
    tr.data('dataset', dataSet);

    // Layer checkbox
    td = $(document.createElement('td'));
    td.width('20px');
    var checkBox = $(document.createElement('input'));
    checkBox.attr('type', 'checkbox');
    checkBox.attr('id', 'selected');
    td.append(checkBox)
    tr.append(td);

    checkBox.click(function() {

      var selected = 0;

      $('#table-layers tr').each(function(i, tr) {
        // call the function passing the id
        if ($('#selected', tr)[0].checked)
          selected++
      });

      if (selected == 1) {
        $('#table-layers').trigger('layers-selection');
      }
      else if (selected == 0) {
        $('#table-layers').trigger('layers-no-selection');
      }
    });


    // Toggle layer button
    td = $(document.createElement('td'));
    td.width('30px');
    var toggleButton = $(document.createElement('button'));
    toggleButton.addClass('btn btn-success btn-mini')
    toggleButton.attr('data-toggle', 'button')
    toggleButton.attr('type', 'button');

    // Add the click action
    toggleButton.click(layerId, function() {
      togglefunc(this, layerId);
    });

    // Add icon
    var icon = $(document.createElement('i'));
    icon.addClass('icon-globe icon-white')
    toggleButton.append(icon);
    td.append(toggleButton);
    tr.append(td);

    // Workflow button
    td = $(document.createElement('td'));
    td.width('45px');
    var workflowButton = $(document.createElement('button'));
    workflowButton.addClass('btn btn-info btn-mini')
    workflowButton.attr('type', 'button');

    // Add the click action
    workflowButton.click(layerId, function() {
      workflowfunc(this, layerId);
    });

    // Add icon
    var icon = $(document.createElement('i'));
    icon.addClass('icon-edit icon-white')
    workflowButton.append(icon);
    td.append(workflowButton);
    tr.append(td);

    // Name of the layer
    td = $(document.createElement('td'));
    var nameDiv = $(document.createElement('div'));
    nameDiv.attr('id', 'name');
    nameDiv.append($(document.createElement('h4')).html(basename));

    if (displayProgress) {
      var downloadStatus = $(document.createElement('div'))
      downloadStatus.attr('id', 'progress');
      var progress
        = $(document.createElement('div')).addClass('progress progress-success progress-striped active');
      progress.css({float: 'left', width: '80%'});
      var bar = $(document.createElement('div')).addClass('bar');
      progress.append(bar);
      bar.width('0%');
      var cancel = $(document.createElement('button')).addClass('btn btn-mini');
      cancel.attr('type', 'button');
      cancel.css({width: '20px', height: '20px', position: 'relative',
                  top: '-1px', left: '3px'});
      icon = $(document.createElement('i'));
      icon.addClass('icon-remove icon-black');
      icon.css({position: 'relative', left: '-4px', top: '-1px'});
      cancel.append(icon);
      downloadStatus.append(progress).append(cancel);
      nameDiv.append(downloadStatus);

      cancel.click(layerId, function(){
        tr.trigger('cancel-download-task');
      });
    }


    td.append(nameDiv);
    tr.append(td);

    // Status
    td = $(document.createElement('td'));
    //td.append(button);

    $('.btn-layer').width(Math.max.apply(Math, $('.btn-layer').map(function() {
      return $(this).outerWidth();
    }).get()));
  }
  // @todo Just calling fadeIn does not work. It has to be set invisible
  // and then only it works. We need to check if this is expected.
  $('#' + layerId).fadeOut(0);
  $('#' + layerId).fadeIn('slow', callback);
};

/**
 *
 */
uiModule.gis.layerAdded = function(elem) {
  "use strict";
  $(elem).removeClass("btn-primary");
  $(elem).addClass("btn-success");
  $(elem).addClass("disabled");
  $(elem).attr('data-loading-text', 'Added');
  $(elem).attr('disabled', 'disabled');
  $(elem).html('Added');
};

/**
 * Remove a layer from the list
 *
 * @param elem
 * @returns {Boolean}
 */
uiModule.gis.removeLayer = function(elem, layerId) {
  "use strict";
  var buttonId, button = $('#btn-add-' + layerId);

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

/**
 * Toggle visibility of a layer
 */
uiModule.gis.toggleLayer = function(elem, layerId) {
  "use strict";
  // Do nothing
};

/**
 * Update UI to when a layer is selected
 */
uiModule.gis.selectLayer = function(target, layerId) {
  "use strict";
  $(target).siblings().removeClass('active');

  if (target !== null || target !== undefined) {
    $(target).addClass('active');
  }

  return true;
};

uiModule.gis.hasLayer = function(layerTable, layerId) {
  "use strict";

  var found = false;
  $('tr', $(layerTable)).each(function(i, tr) {
    if (tr.id == layerId) {
      found = true;
      return;
    }
  });

  return found;
}

/**
 * Adds map controls that are overalled on the map, such as zoom controls.
 * map - This is the map object.
 * map - Container is the parent div holding the gl canvas
 */
uiModule.gis.createMapControls = function(map, container) {
  "use strict";

  var options, parent, key, row, col, heading, input, sliderDiv;
  options = map.options();

  parent = $(container);

  function slideZoom(event, ui) {
            map.setZoom(ui.value);
            map.redraw();
          }
  function stopSlider(e) {
          e.stopPropagation();
          return false;
        }
  function selCountryBound() {
          map.toggleCountryBoundries();
          map.redraw();
        }

  for (key in options) {

    if (options.hasOwnProperty(key)) {

      row = $(document.createElement('tr'));
      row.attr('class', 'row-fluid');
      parent.append(row);
      col = $(document.createElement('td'));
      row.append(col);

      heading = $(document.createElement('h4'));
      heading.html(key);
      col.append(heading);

      switch (key) {
      case "zoom":
        // Create a slider here
        sliderDiv = $(document.createElement('div'));
        sliderDiv.slider({
          range: "min",
          min: 0.0,
          max: 17.0,
          step: 1,
          value: options[key],
          slide: slideZoom
        });
        //Undefined e... please check
        $(sliderDiv).on('mousedown', stopSlider);
        col.attr('class', 'span10');
        $(col).append(sliderDiv);
        break;
      case "center":
        // @todo We need to update center dynamically which
        // will require quite a bit of work.
        // Text box
        // var latInput = $(document.createElement('input'));
        // latInput.attr('type', 'number');
        // latInput.attr('min', -180.0);
        // latInput.attr('max', +180.0);
        // latInput.val(map.options().center.lat());
        // latInput.click(function() {
        //   map.redraw();
        // });
        // $(latInput).on('mousedown', function(e) {
        //   e.stopPropagation();
        //   return false;
        // });
        // col.append(latInput);
        // var lngInput = $(document.createElement('input'));
        // lngInput.attr('type', 'number');
        // lngInput.attr('min', -90.0);
        // lngInput.attr('max', +90.0);
        // lngInput.val(map.options().center.lng());
        // lngInput.click(function() {
        //   map.redraw();
        // });
        // $(lngInput).on('mousedown', function(e) {
        //   e.stopPropagation();
        //   return false;
        // });
        // col.append(lngInput);
        break;
      case "country_boundries":
        // Boolean
        input = $(document.createElement('input'));
        input.attr('type', 'checkbox');
        input.attr('checked', map.options().country_boundries);
        input.click(selCountryBound);
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


}


/**
 * Create control for opacity
 */
uiModule.gis.createOpacityControl = function(parent, map, layersFunction) {
  "use strict";
//  var tbody, row, col, opacityDiv;
//  tbody = $($(table).find('tbody'));
//  row = $(document.createElement('tr'));
//  tbody.append(row);
//
//  col = $(document.createElement('td'));
//  row.append(col);
//  col.append('<h4>opacity</h4>');

  // Create slider to control opacity of a layer
  var opacityControl = $(document.createElement('div'));
  opacityControl.append('<h4>opacity</h4>');
  var opacityDiv = $(document.createElement('div'));
  opacityDiv.width('100%');
  opacityDiv.addClass('ui-slider ui-slider-horizontal ui-widget ui-widget-content ui-corner-all');
  opacityControl.append(opacityDiv);
  parent.append(opacityControl);

  opacityDiv.slider({
    range: "min",
    min: 0.0,
    max: 1.0,
    step: 0.01,
    value: 0.5
  });

  // Listen for slider slidechange event
  opacityDiv.slider().bind('slide', function(event, ui) {

    var layers = layersFunction();

    $.each(layers, function(i, layerId){
      map.findLayerById(layerId).setOpacity(ui.value);
    });

    map.redraw();
  });

  opacityDiv.on('mousedown', function(e) {
    e.stopPropagation();
    return false;
  });

  opacityDiv.slider();
};
