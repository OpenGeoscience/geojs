 var shapeFiles = []; // 0: .shp, 1: .shx, 2: .dbf
 
 ////////////////////////////////////////////////////////////////////////////
/**
 * Colormapping functions from debugging polygon vis
 */
////////////////////////////////////////////////////////////////////////////
getR = function(idx,max) {return (idx/max)>0.5 ? 2*(idx/max)-1 : 0.0;}
getG = function(idx,max) {return (idx/max)>0.5 ? -2*(idx/max)+2 : 2*(idx/max);}
getB = function(idx,max) {return (idx/max)<0.5 ? -2*(idx/max)+1 : 0.0;}

////////////////////////////////////////////////////////////////////////////
/**
 * Output human-readable filesizes
 */
////////////////////////////////////////////////////////////////////////////
function getReadableFileSize(fileSizeInBytes) {
    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB'];
    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};


////////////////////////////////////////////////////////////////////////////
/**
 * Load shapefiles
 */
////////////////////////////////////////////////////////////////////////////
function handleFileSelect(evt) {
   evt.stopPropagation();
   evt.preventDefault();
   
   var files = evt.dataTransfer.files; // FileList object.
   
   // files is a FileList of File objects. List some properties.
   var output = [];
   for (var i = 0, f; f = files[i]; i++) {
     output.push('<li><strong>', escape(f.name), '</strong>, ', getReadableFileSize(f.size),'</li>');
      if (f.name.indexOf("shp")>-1) {shapeFiles[0] = f;}
      if (f.name.indexOf("shx")>-1) {shapeFiles[1] = f;}
      if (f.name.indexOf("dbf")>-1) {shapeFiles[2] = f;}
   }
   document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
   
   if ((!shapeFiles[0])||(!shapeFiles[1])||(!shapeFiles[2])) {
      console.log("Missing files !");
   } else {
      var node = document.getElementById("glcanvas");
      var viewer = vglModule.viewer(node);
      // Initialize the viewer
      viewer.init();
      viewer.renderWindow().resize($(node).width(), $(node).height());
      var renderer = viewer.renderWindow().activeRenderer();
      
      var sfr = vglModule.shapefileReader();
      if ((!shapeFiles[0])||(!shapeFiles[1])||(!shapeFiles[2])) {
         console.log("Missing files");
         return;
      }
      var start = 0;
      var end = 50;
      sfr.readFiles(shapeFiles, renderer, viewer, start, end);
   }
}

////////////////////////////////////////////////////////////////////////////
/**
 * Drag-over
 */
////////////////////////////////////////////////////////////////////////////
function handleDragOver(evt) {
   evt.stopPropagation();
   evt.preventDefault();
   evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
}
 

////////////////////////////////////////////////////////////////////////////
/**
 * Onload function
 */
////////////////////////////////////////////////////////////////////////////
var testShapes = {};
 testShapes.main = function() {
   shapeFiles = [null, null, null];

   var dropZone = document.getElementById("drop_zone");
   dropZone.addEventListener('dragover', handleDragOver, false);
   dropZone.addEventListener('drop', handleFileSelect, false);

 }
