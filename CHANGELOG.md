# GeoJS Change Log

## Version 1.8.8

### Improvements

- Reduce polygon and position function calls ([#1208](../../pull/1208))

## Version 1.8.7

### Improvements

- Add some code paths to reduce transform calls ([#1207](../../pull/1207))

## Version 1.8.6

### Improvements

- Allow constraining rectangle and ellipse annotations to a list of fixed sizes ([#1205](../../pull/1205))

## Version 1.8.5

### Improvements

- Optimize reordering fetch queue ([#1203](../../pull/1203))

## Version 1.8.4

### Improvements

- Support polygon annotations with holes through geojson ([#1201](../../pull/1201))
- Adjust queue track size based on number of tile layers ([#1202](../../pull/1202))

## Version 1.8.3

### Improvements

- Support polygon annotations with holes ([#1200](../../pull/1200))

## Version 1.8.2

### Improvements

- Reduce tile layer updates ([#1196](../../pull/1196))

## Version 1.8.1

### Improvements

- Reduce memory copy on pixelmap layer creation ([#1194](../../pull/1194))

## Version 1.8.0

### Features

- Square, circle, and ellipse annotations, plus a way to constrain rectangle and ellipse annotations to a list of aspect ratios ([#1192](../../pull/1192))

## Version 1.7.3

### Bug Fixes

- Emit layerMove event when changing a lyer's z-index ([#1185](../../pull/1185))

## Version 1.7.2

### Bug Fixes

- Tile layers with keepLower: false purged tiles on high zoom ([#1178](../../pull/1178))

## Version 1.7.1

### Improvements

- Reduce texture memory check ([#1175](../../pull/1175))

## Version 1.7.0

### Features

- Support tiled pixelmaps ([#1153](../../pull/1153))

## Version 1.6.6

### Improvements

- Add support for webgl pixelmaps ([#1152](../../pull/1152))

## Version 1.6.5

### Bug Fixes

- Fix spelling of collinear ([#1173](../../pull/1173))

## Version 1.6.4

### Bug Fixes

- Fix the priority of styles used for tracks ([#1169](../../pull/1169))

## Version 1.6.3

### Improvements

- Update option for addAnnotation ([#1161](../../pull/1161))

## Version 1.6.2

### Bug Fixes

- Do not name osm layers based on the tile source ([#1154](../../pull/1154))

## Version 1.6.1

### Changes

- Build for older browsers ([#1145](../../issues/1145))

## Version 1.6.0

### Changes

- Switch to webpack v5 and update build tooling ([#1132](../../issues/1132))

### Bug Fixes

- Harden checking for optional dependencies ([#1143](../../pull/1143))

## Version 1.5.0

### Features

- Add scaleWithZoom option to heatmaps ([#1125](../../pull/1125))

### Improvements

- Automatically adjust heatmap update delay ([#1124](../../pull/1124))
- Log if we can't allocate texture memory([#1116](../../pull/1116))

## Version 1.4.3

### Changes

- Removed wikimedia from the map source list ([#1109](../../pull/1109))

## Version 1.4.2

### Improvements

- Added more tile sources to the default list ([#1107](../../pull/1107))

## Version 1.4.1

### Improvements

- Add a continuousCloseProximity option to annotations ([#1106](../../pull/1106))

## Version 1.4.0

### Features

- Add a gridFeature ([#1082](../../pull/1082))

## Version 1.3.0

### Features

- Add an optional baseQuad to the tileLayer ([#1105](../../pull/1105))
- Support cropping quads ([#1104](../../pull/1104))

## Version 1.2.0

### Features

- Allow sharing queues between tile layers ([#1100](../../pull/1100))
- Allow removing promises from the idle monitor ([#1101](../../pull/1101))
- Improve when tile layers are idle ([#1101](../../pull/1101))

## Version 1.1.0

### Features
- Added a geoOnce handler for events ([#1097](../../pull/1097))

## Version 1.0.3

### Bug Fixes
- Have semantic release publish artifacts to the GitHub release ([#1094](../../pull/1094))

## Version 1.0.2

### Improvements
- The primary map div now has overflow hidden set on it ([#1088](../../pull/1088))

## Version 1.0.1

### Improvements
- Contours with continuous (unstepped) data can specify the same number of values in `rangeValues` and `colorRange` ([#1079](../../pull/1079))

## Version 1.0.0

### Improvements
- Screenshots now handle mix-blend-mode settings on top level divs ([#1074](../../pull/1074))
- More flexible default position accessors ([#1066](../../pull/1066))

### Bug Fixes
- Fixed an issue with affine transforms and polygons ([#1073](../../pull/1073))

## Version 0.20.0

### Features
- Added a marker feature ([#1035](../../pull/1035))
- The mapInteractor cancelOnMove option can now take a movement threshold ([#1058](../../pull/1058))
- GCS can now be specified in pointSearch, boxSearch, and polygonSearch ([#1051](../../pull/1051))
- Added a track feature ([#1040](../../pull/1040))
- Added a geo.gui.scaleWidget.formatUnit utility function ([#1048](../../pull/1048))

### Improvements
- The pointInPolygon2D function is faster ([#1052](../../pull/1052))
- On markers, updateStyleFromArray optimizes certain updates and exposes a faster way to change symbol and symbol value ([#1049](../../pull/1049))

## Version 0.19.8

### Changes
- Line segments with zero width or zero opacity won't be found by pointSearch or polygonSearch ([#1041](../../pull/1041))

### Bug Fixes
- Removed extra calls to sceneObject constructors ([#1039](../../pull/1039))
- Fixed an issue with rendering on hidden tabs in Chrome ([#1042](../../pull/1042))

## Version 0.19.7

### Features
- The osmLayer now has predefined `tileSources` that can be used with the `source` method or property to switch multiple parameters at once ([#1020](../../pull/1020))

### Improvements
- Points with small radii or thin strokes are rendered better ([#1021](../../pull/1021))
- When only updating point styles, don't recompute geometry transforms ([#1022](../../pull/1022))
- Optimized a transform code path for pixel coordinates ([#1023](../../pull/1023))
- WebGL point features automatically use the most memory-efficient primitive shape for the point sizes used based on the system's graphics capabilities ([#1031](../../pull/1031))
- Less data is transferred to the GPU when only styles have changed in webgl line or polygon features ([#1016](../../pull/1016))

### Changes
- Switched the default tile server to Stamen Design's toner-lite ([#1020](../../pull/1020))

### Bug Fixes
- Mouse wheel events didn't recompute gcs coordinates, so a wheel event without a previous move event could list the wrong location ([#1027](../../pull/1027))
- Original event data was not included with actionwheel events ([#1030](../../pull/1030))

## Version 0.19.6

### Features
- Added a polygonSearch method to features ([#1014](../../pull/1014))

### Changes
- The feature boxSearch function now uses map input gcs coordinates consistently and returns results in the same format as pointSearch ([#1014](../../pull/1014))
- The pointTo2DTriangleBasis utility function was renamed to pointToTriangleBasis2d ([#1014](../../pull/1014))

## Version 0.19.5

### Features
- Fetch queues can have an initial size different from their regular size ([#1000](../../pull/1000))
- Autoshare renderers now has three states, with the default being more likely to not change anything visually ([#1011](../../pull/1011))

### Improvements
- More response zooming via mouse wheel ([#993](../../pull/993))
- Explicitly exit retired renderers when autosharing renderers ([#1007](../../pull/1007))
- If a point has no stroke or fill, don't return it from pointSearch ([#1003](../../pull/1003))
- WebGL point, line, polygon, and contour features use a localized origin for improved precision at high zoom levels.  This reduces panning jitter in zoom levels 19 and up ([#1005](../../pull/1005))
- When doing a point search on a line feature, report which line segment is found ([#1008](../../pull/1008))
- Include source event information in some feature events ([#1009](../../pull/1009))

### Changes
- Idle handlers no longer defer to scene-graph parents.  Parents still wait for all children to be idle ([#1001](../../pull/1001))
- Better handling of tiles with overlap ([#997](../../pull/997))

### Bug Fixes
- Shared tile layers stack properly by clearing quads on layer addition and removal ([#1010](../../pull/1010))

## Version 0.19.4

### Improvements
- Speed up rebuilding webgl point features ([#994](../../pull/994))

## Version 0.19.3

### Features
- Layers that use webgl renderers automatically share contexts when possible.  Layers can switch renderers manually as well.  This largely avoids the limitation of number of webgl contexts in a browser ([#975](../../pull/975))
- Support affine transforms in the proj4 string ([#986](../../pull/986))

### Improvements
- Speed up rendering geojson features by using constant values for constant geojson styles ([#987](../../pull/987))

### Changes
- The point clustering radius value is now in display pixels ([#983](../../pull/983))

### Bug Fixes
- Fixed drawing partial fixed-scale canvas quads ([#985](../../pull/985))

## Version 0.19.2

### Improvements
- Make fewer function calls when computing polygon strokes ([#980](../../pull/980))
- Speed up coordinate transforms that only switch y-axis ([#979](../../pull/979))

## Version 0.19.1

### Features
- Polygon annotations can be drawn in the same continuous smooth manner as line annotations. ([#976](../../pull/976))

### Changes
- Rename the d3 renderer to svg.  d3 still works as an alias ([#965](../../pull/965))
- Rename the vgl renderer to webgl.  vgl still works as an alias ([#965](../../pull/965))

## Version 0.19.0

### Features
- Feature selection API is now enabled automatically if any event handlers are bounds to the feature ([#921](../../pull/921))
- Added a VTK.js renderer which supports a point feature ([#893](../../pull/893), [#953](../../pull/953))

### Improvements
- Coordinate transforms on flat arrays are now faster ([#939](../../pull/939))
- `convertColor` is memoized to speed up repeated calls ([#936](../../pull/936))
- All features have a `featureType` property ([#931](../../pull/931))
- When changing geometry sizes, buffers are reallocated less ([#941](../../pull/941))
- Initial rendering webGL features is somewhat faster ([#943](../../pull/943))
- WebGL point and polygon features no longer clip by z coordinates ([#963](../../pull/963))

### Changes
- Removed the dependency on the vgl module for the `object` and `timestamp` classes ([#918](../../pull/918))
- CSS color names are obtained from an npm package rather than being defined in the util module ([#936](../../pull/936))
- Updated several npm modules ([#944](../../pull/944))
- Report the unmasked renderer used with webgl ([#947](../../pull/947))
- Width and height are now in the base renderer class ([#962](../../pull/962))

### Bug Fixes
- Fixed some minor issues with layers ([#949](../../pull/949))

### Documentation
- Improve documentation ([#922](../../pull/922), [#928](../../pull/928), [#929](../../pull/929), [#930](../../pull/930), [#932](../../pull/932), [#948](../../pull/948), [#950](../../pull/950), [#951](../../pull/951), [#956](../../pull/956), [#960](../../pull/960), [#961](../../pull/961))
- Added a point cluster example ([#957](../../pull/957))
- Editor tutorials keep history in browser ([#926](../../pull/926))

## Version 0.18.1

### Bug Fixes
- Fixed an issue with the annotation key handler ([#923](../../pull/923))

## Version 0.18.0

### Features
- Added an idle property to objects ([#894](../../pull/894))
- Better handling and changing of camera clipbounds ([#899](../../pull/899))
- File readers (the geojsonReader) now returns a Promise.  The layer will report that it is not idle until this promise is finalized ([#905](../../pull/905))

### Bug Fixes
- Fixed an issue with overlapping, cropped tiles on old browsers ([#901](../../pull/901))
- Fixed an issue where a `geo.gl.polygonFeature` could be updated after it was deleted ([#913](../../pull/913))

### Changes
- Changed build process: optional dependencies are now included in the bundle by default ([#890](../../pull/890))
- Transpile with Babel to support old browsers and new language features ([#900](../../pull/900), [#903](../../pull/903))
- The geojsonReader has been renamed from `jsonReader` to `geojsonReader`.  The old name still works as an alias ([#905](../../pull/905))
- Catch errors in animation frame callbacks ([#911](../../pull/911))

## Version 0.17.0

### Features
- Add multi-color support to the continuous color legend ([#810](../../pull/810))
- Warn when trying to create an unsupported feature ([#823](../../pull/823))
- Expose registries ([#830](../../pull/830))
- Add all proj4 projections ([#840](../../pull/840), [#873](../../pull/873))
- Trigger an event when an annotation's coordinates change ([#841](../../pull/841))
- Add an option to limit text feature rendering ([#834](../../pull/834))
- Calculating min and max of array is now a utility function ([#835](../../pull/835))
- Generalized meshes ([#817](../../pull/817))
- Added a `wrapAngle` utility function ([#836](../../pull/836))
- Isolines ([#838](../../pull/838))

### Bug Fixes
- Ensure GL polygons are built once before their strokes so that the strokes are always on top ([#806](../../pull/806))
- Work around `atan` bugs in openmesa and swiftshader WebGL renderers ([#816](../../pull/816))
- Fix text alignment on the scale widget ([#828](../../pull/828))
- Ignore z values in `vgl.lineFeature` ([#833](../../pull/833))
- Don't modify geojson object coordinates ([#848](../../pull/848))
- Ensure all point position calls pass the data index ([#852](../../pull/852))

### Testing
- Test with a muted video ([#811](../../pull/811))
- Use Firefox headless ([#818](../../pull/818))
- Use karma-spec-reported for better output ([#829](../../pull/829))
- Upgrade jasmine ([#837](../../pull/837))
- Refactor how external data is fetched ([#851](../../pull/851))
- Add more support for testing examples, similar to tutorial tests ([#866](../../pull/866))
- Refactored the server script to allow serving the website and build directories as well as the dist directory ([#868](../../pull/868))

### Documentation
- Improve tutorial page layout ([#809](../../pull/809))
- Improve documentation ([#819](../../pull/819), [#825](../../pull/825), [#824](../../pull/824), [#839](../../pull/839), [#844](../../pull/844), [#849](../../pull/849), [#859](../../pull/859), [#858](../../pull/858), [#867](../../pull/867), [#872](../../pull/872))
- Update tutorials when text is deleted ([#827](../../pull/827))
- Added a rainfall example with isolines and contours ([#869](../../pull/869))
- Change the Deep Zoom example to make it more generic and use a public data source ([#875](../../pull/875))
- Automate website deployment ([#877](../../pull/877))

### Changes
- Remove bower support ([#856](../../pull/856))
- Switch to webpack v3 ([#854](../../pull/854))
- Removed needless function wrappers ([#870](../../pull/870))

## Version 0.16.0

### Features
- Events allow changing feature order on mouse over and mouse click ([#807](../../pull/807))

### Improvements
- Multiple UI layers can be active at once ([#802](../../pull/802))
- Clear animation queue when the map is destroyed ([#801](../../pull/801))
- Handle dereferencing errors in screenshots more gracefully ([#803](../../pull/803))

### Changes
- Line style function parameters are more consistent ([#804](../../pull/804))

### Bug Fixes
- Polygon strokes were sometimes drawn under polygon fills ([#806](../../pull/806))

### Documentation
- Added a [line tutorial](https://opengeoscience.github.io/geojs/tutorials/lines) ([#805](../../pull/805))

## Version 0.15.2

### Features
- Allow specifying the map's initial maximum bounds in a different GCS ([#794](../../pull/794))
- Improve setting widget positions ([#796](../../pull/796))
- Add methods to simplify line geometries ([#791](../../pull/791))
- Add functions computing spherical and Vincenty distances ([#797](../../pull/797))
- Add a scale widget ([#798](../../pull/798))
- Improve the screenshot function by dereferencing CSS urls ([#799](../../pull/799))

### Testing
- Fix testing with Chrome 65 ([#792](../../pull/792))
- Add tests for geo.gui.widget and geo.gui.domWidget ([#795](../../pull/795))

### Documentation
- Enable the [color legend example](https://opengeoscience.github.io/geojs/examples/color-legend/) ([#790](../../pull/790))
- Add a new [editor tutorial](https://opengeoscience.github.io/geojs/tutorials/editor3) with HTML and CSS panes ([#783](../../pull/783))
- Use https urls for openstreetmap tiles in all examples and tutorials ([#793](../../pull/793))

## Version 0.15.1

### Testing
- Use resemblejs for testing rather than node-resemble ([#785](../../pull/785))

### Packaging
- Resolve hammerjs by it's name on npm in addition to the global variable `Hammer` ([#787](../../pull/787))

## Version 0.15.0

### Features
- Individual annotations can be edited ([#769](../../pull/769))

### Improvements
- Sped up updating line features ([#779](../../pull/779))

### Bug Fixes
- Fixed hit test on closed lines ([#780](../../pull/780))
- Fixed mouse buttons reporting on Firefox ([#782](../../pull/782))

## Version 0.14.0

### Features

- Added an `object.geoIsOn` function to check if an event is bound ([#768](../../pull/768))
- Use the average perimeter for the center of a polygon or line ([#761](../../pull/761))
- Allow display to/from gcs conversion functions to handle arrays of points ([#766](../../pull/766))
- When drawing a line annotation, don't create intermediate collinear points ([#759](../../pull/759))
- Improve exiting and reloading maps ([#750](../../pull/750))
- Various minor improvements ([#767](../../pull/767), [#760](../../pull/760))

### Packaging
- Refactored importing optional dependencies so webpack makes them truly optional ([#770](../../pull/770))
- Upgraded to jQuery 3.x ([#772](../../pull/772), [#773](../../pull/773))
- Updated npm packages ([#756](../../pull/756))
- Reduce packaging effects ([#763](../../pull/763), [#751](../../pull/751))

### Testing
- Improved testing with different browsers (Chrome 64 and Firefox 58) ([#775](../../pull/775), [#771](../../pull/771), [#755](../../pull/755))

### Bug Fixes
- Include stroke widths when doing a point search on polygons ([#762](../../pull/762))
- Fixed `pointSearch` when the feature used a non-default gcs ([#758](../../pull/758))
- Fixed unbinding keyboard events ([#757](../../pull/757))

### Tutorials and Website
- Added more tutorials ([#774](../../pull/774))
- Minor website improvements ([#753](../../pull/753), [#752](../../pull/752))

## Version 0.13.0

### New features
- Added a new video quad feature ([#745](../../pull/745))
- Annotation id's are now persevered when reloading geojson ([#747](../../pull/747))

### Bug fixes
- Fixed setting rotation on map creation ([#740](../../pull/740))
- Fixed polygon fill and opacity interaction ([#744](../../pull/744))
- Fixed handling GCS in geojson annotation imports ([#748](../../pull/748))

### Improvements to the website and documentation
- Updated GeoJS's [website](https://opengeoscience.github.io/geojs/) ([#729](../../pull/729))
- Improved the [API documentation](https://opengeoscience.github.io/geojs/apidocs/) ([#738](../../pull/738))
- Added an "editor" [tutorial](https://opengeoscience.github.io/geojs/tutorials/) ([#742](../../pull/742))
- Updated some [examples](https://opengeoscience.github.io/geojs/tutorials/) ([#743](../../pull/743))

## Version 0.12.4

- Added a new color legend widget ([#731](../../pull/731))
- Fixed `z-index` bug on new layers ([#732](../../pull/732))
- Improved testing infrastructure ([#735](../../pull/735), [#737](../../pull/737))
- Removed some boiler plate code from the examples ([#733](../../pull/733))

## Version 0.12.3

- Added annotation labels ([#719](../../pull/719))
- Added text feature ([#719](../../pull/719))
- Added tutorial infrastructure and some simple tutorials ([#725](../../pull/725), [#727](../../pull/727), [#728](../../pull/728))
- Handle tap-touch actions (adds support for some tablet styluses) ([#730](../../pull/730))

## Version 0.12.2

- Started revamping our [API documentation](https://opengeoscience.github.io/geojs/apidocs/) with a new template ([#704](../../pull/704), [#706](../../pull/706), [#708](../../pull/708), [#710](../../pull/710), [#713](../../pull/713))
- Several minor API improvements ([#707](../../pull/707))
- Added subdomain template parameters for tile layer urls ([#715](../../pull/715))

## Version 0.12.1

- Fix bugs in rectangle annotations ([#693](../../pull/693), [#694](../../pull/694))
- Add new optimized methods for updating styles of features for animations and a new [example](https://opengeoscience.github.io/geojs/examples/animation/) ([#687](../../pull/687))
- Fix checks for optional dependencies ([#696](../../pull/696))
- Change the template for our [apidocs](https://opengeoscience.github.io/geojs/apidocs/) to [jaguarjs-jsdoc](https://github.com/davidshimjs/jaguarjs-jsdoc) ([#697](../../pull/697))
- Fix a bug in applying polygon stroke styles ([#700](../../pull/700))

## Version 0.12.0

- Handle basic touch interactions using hammerjs ([#675](../../pull/675))
- Increase testing coverage ([#676](../../pull/676), [#677](../../pull/677), [#684](../../pull/684))
- Support additional line styling options in the json reader ([#680](../../pull/680))
- Add the ability to draw line annotations ([#681](../../pull/681))
- Add `visible` and `selectionAPI` methods to layers ([#682](../../pull/682))
- Replace custom quad tree implementation with kdbush ([#685](../../pull/685))
- Remove several unused utility methods ([#686](../../pull/686))
- Move vgl mocking function into `utils` for use in upstream testing ([#688](../../pull/688))

## Version 0.11.1

- Added a `map.screenshot` method to take screenshots of the current map view ([#665](../../pull/665), [#667](../../pull/667))
- Added a screenshot button on the example pages ([#669](../../pull/669))
- Made it easier to disable or replace keyboard actions in the interactor ([#670](../../pull/670))

## Version 0.11.0

- Refactored GL line feature with a number of new styling options available.  See our [blog post](https://blog.kitware.com/drawing-lines-in-geojs/) and the new [line example](https://opengeoscience.github.io/geojs/examples/lines/) for more details.  ([#649](../../pull/649), [#662](../../pull/662))
- Added keyboard shortcuts for map navigation.  ([#661](../../pull/661))
- Most DOM styling is now done with a CSS file rather than setting inline styles.  ([#660](../../pull/660))
- Added GCS options to the annotation interface.  ([#654](../../pull/654))
- Added headless unit testing for GL code and examples.  ([#651](../../pull/651), [#658](../../pull/658)).
- Removed unused source files.  ([#656](../../pull/656), [#657](../../pull/657))

## Version 0.10.5

- Made annotation states more consistent ([#643](../../pull/643))
- Reduced lag between layers ([#644](../../pull/644))
- Fixed gaps between tiles ([#648](../../pull/648))
- Fixed map jumping after certain transitions ([#650](../../pull/650))

## Version 0.10.4

### Changes
- Added a pixelmap feature and [example](https://opengeoscience.github.io/geojs/examples/pixelmap/) ([#637](../../pull/637))
- The location with a quad is reported in mouse events and point search functions ([#635](../../pull/635))
- Canvas elements can be rendered in quads on the canvas renderer ([#634](../../pull/634))
- Most features support visibility ([#632](../../pull/632))
- Colors can be specified with a greater variety of css methods, such as `rgb()` and `rgba()` ([#636](../../pull/636))
- Point annotations can scale with zoom ([#628](../../pull/628))

## Version 0.10.3

### Changes
- Fixed a bug in getting the visible bounds using a custom map projection ([#625](../../pull/625))
- Slider widgets can now be repositioned and resized ([#619](../../pull/619))
- Improved the annotation API with the ability to import and export GeoJSON ([#617](../../pull/617))

## Version 0.10.2

### Changes
- Add a closed flag for line features ([#602](../../pull/602))
- Minor changes and bug fixes in the interactor ([#603](../../pull/603), [#604](../../pull/604), [#605](../../pull/605))
- Allow showing partial tiles on edges ([#606](../../pull/606))
- Minor fixes to geojson rendering ([#609](../../pull/609))
- Update to VGL 0.3.10 ([#608](../../pull/608), [#612](../../pull/612))
- Reduce flickering in point cluster rendering ([#621](../../pull/621))
- Beta support for interactive annotations and a new [example](https://opengeoscience.github.io/geojs/examples/annotations/) ([#613](../../pull/613), [#616](../../pull/616))

## Version 0.10.1

### Bug fixes
- Fixed a bug preventing deletion of stroked polygons ([#601](../../pull/601))

## Version 0.10.0

### Breaking changes
- Removed the `planeFeature` class in favor of the faster and more powerful`quadFeature` ([#583](../../pull/583))
- Changed the callback signature for the `fill` style, which turns on or off rendering the polygon fill ([#597](../../pull/597))

### Additions and improvements
- Improved heatmap feature and [example](https://opengeoscience.github.io/geojs/examples/heatmap/) ([#574](../../pull/574), [#577](../../pull/577), [#578](../../pull/578), [#579](../../pull/579))
- Replaced grunt build tasks with webpack and npm scripts ([#580](../../pull/580))
- Added a d3 rendered `quadFeature` ([#581](../../pull/581))
- Added selection-based zoom ([#582](../../pull/582))
- Added an interface for `createLayer` to request renderers by feature support ([#590](../../pull/590))
- Improved polygon rendering performance  ([massively](https://github.com/OpenGeoscience/geojs/pull/594#issuecomment-226821131)) and added a usage [example](https://opengeoscience.github.io/geojs/examples/polygons/) ([#594](../../pull/594))
- Added an [example](https://opengeoscience.github.io/geojs/examples/sld/) of customizing the style of WMS layers ([#595](../../pull/595))
- Added stroking to the polygon feature ([#597](../../pull/597))

### Bug fixes
- Fixed a bug in box selection with map rotation ([#582](../../pull/582))
- Fixed the `draw` method on GL and canvas features ([#585](../../pull/585))
- Fixed a rendering bug in GL line features ([#597](../../pull/597))
- Removed the [now unavailable](http://devblog.mapquest.com/2016/06/15/modernization-of-mapquest-results-in-changes-to-open-tile-access/) mapquest tile servers from the examples ([#598](../../pull/598))

## Version 0.9.1

### Changes
- Added a new [heatmap](https://opengeoscience.github.io/geojs/examples/heatmap/) feature ([#557](../../pull/557))
- Switched to [earcut](https://github.com/mapbox/earcut) for triangulating polygons ([#555](../../pull/555))
- Added methods on `geo.transform` to load EPSG projections from [epsg.io](http://epsg.io/) ([#561](../../pull/561))
- Recorded the git SHA at build time as `geo.sha` ([#562](../../pull/562))
- Made `tileLayer.tilesAtZoom` configurable to support rectangular images ([#568](../../pull/568))
- Added caching to proj4 transform objects ([#570](../../pull/570))
- Added jQuery to the distributed bundle ([#572](../../pull/572))

## Version 0.9.0

### New features
- Added a canvas renderer for tile layers and quad features
- Added new marker styles for d3 rendered vectors
- Zooming with the mouse wheel now supports animation and momentum (see the updated [Tiles](https://opengeoscience.github.io/geojs/examples/tiles/) example)
- All files have been converted into CommonJS modules and are built with [webpack](https://webpack.github.io/)
- PhantomJS tests are now executed with the [Karma test runner](https://karma-runner.github.io/0.13/index.html)
- Unit test coverage information is collected by [istanbul](https://gotwarlost.github.io/istanbul/) and reported to [codecov](https://codecov.io/github/OpenGeoscience/geojs?branch=master)
- Performance results are submitted to CDash during testing as a JSON-encoded "notes" file ([example](https://my.cdash.org/viewNotes.php?buildid=936301))

### Bug fixes
- Fixed several bugs related to map animations and transitions
- Fixed a tile layer performance bug when `keepLower=false`

### Breaking changes
- The global `inherit` function has moved to `geo.inherit`
- The released bundle (`geo.js`) now includes **pnltri**, **proj4**, and **gl-matrix** internally
- The external bundle (`geo.ext.js`) now contains only **jQuery** and **d3**
- All sources in `src/core/` have moved up a directory to be consistent with the namespaces in the module
- The jQuery plugin has moved to [OpenGeoscience/geojs-jquery-plugin](https://github.com/OpenGeoscience/geojs-jquery-plugin) and [geojs-jquery-plugin](https://www.npmjs.com/package/geojs-jquery-plugin) on npm

## Version 0.8.0

### Major changes
- Quad features have been created as a replacement for plane features.  They can draw multiple convex quadrilaterals with images or solid colors as textures within a single feature instantiation.  These features also support default styles or images that display while asynchronous resources load.
- A new [quad example](https://opengeoscience.github.io/geojs/examples/quads/) demonstrates the new capabilities of the quad feature.
- A new [reprojection example](https://opengeoscience.github.io/geojs/examples/reprojection/) demonstrates how quad features can be used to reproject a standard tile layer.  It also provides an additional example of using mouse events on point features to display textual information in a popup box and to recenter the map on click.
- UI Layers will now automatically remain on top when adding new layers.
- Migrated to [ESLint](https://eslint.org/) from jshint/jscs for style checking.

### Performance improvements

Migrating from the plane feature to the new quad feature provides major performance gains for the GL tile layer.  @manthey provided some [benchmarks](https://github.com/OpenGeoscience/geojs/pull/528#issuecomment-180411371) in his PR demonstrating how much this improves performance on a variety of platforms.  Here is an summary of the improvements he measured:

| Test | Average frame (ms) | Slow frames (%) | Worst frame (ms) |
| --- | --- | --- | --- |
| desktop-chrome-plane | 12.69 | 24.59 | 84.9 |
| desktop-chrome-quad | 3.31 | 0.44 | 20.74 |
| destop-firefox-plane | 55.25 | 55.52 | 1316.73 |
| destop-firefox-quad | 7.5 | 3.82 | 41.04 |
| laptop-chrome-plane | 25.55 | 60.21 | 157.15 |
| laptop-chrome-quad | 3.89 | 3.31 | 62.62 |
| laptop-firefox-plane | 130.04 | 95.71 | 1126.31 |
| laptop-firefox-quad | 21.92 | 91.1 | 67.21 |

## Version 0.7.0

### New features
- Maps can now be rotated either through the [javascript API](https://github.com/OpenGeoscience/geojs/blob/release-0.7.0/src/core/map.js#L416-L426) or by pressing `Ctrl` while dragging or using the mouse wheel.
- The Tile Layer example allows turning on or off rotations or restricting rotations to specific orientations.
- A new renderer fallback API supports querying support for a renderer and falling back to a different supported renderer.  The default OSM layer now supports this mechanism falling back to a raw HTML interface when webGL is not available.

### Bug fixes
-  The [Deepzoom example](https://opengeoscience.github.io/geojs/examples/deepzoom/) was mistakenly using the HTML renderer.
- Fixed several race conditions involved in loading and purging tiles
- The tile cache will now automatically grow when it is not large enough to contain all of the tiles in use

### Testing
- Unit tested code coverage is now up to 62% from 42% at version 0.6.

## Version 0.6.0

### New features and API additions
- Completely new tile layer class that moves formally GL specific code into core
  - Maps no longer require GL or even a base layer
  - Support for SVG and HTML rendering for tile layers
  - Support for arbitrary [PROJ4](http://proj4js.org/) projection strings
  - Support wrapping tiles both horizontally and vertically for periodic images
  - Tiles can be an arbitrarily sized rectangle
  - Hooks for dynamically generated tiles rather than just static images
  - The definition of "zoom level" is now consistent with the use in other libraries
- New camera class used to keep track of the visible area and world to image space conversions
- General support for image pyramids through the tile layer (including [medical imaging](https://opengeoscience.github.io/geojs/examples/deepzoom/))
- [Choropleth](https://opengeoscience.github.io/geojs/examples/choropleth/) feature type
- New API for [widgets](https://opengeoscience.github.io/geojs/examples/widgets/)
- New [example](https://opengeoscience.github.io/geojs/examples/tiles/) showing off the features available for tile layers
- GeoJSON reader now supports [Polygon](http://geojson.org/geojson-spec.html#polygon) and [Multipolygon](http://geojson.org/geojson-spec.html#multipolygon) geometries
- Layers can now be reordered dynamically
- Added a new mouse event (`click`) that detects mouse clicks on the map canvas
- The map interactor can be disabled temporarily to cede control of the mouse and keyboard events to external handlers
- Support for subdomains in tile url template strings
- Opacity controls are now supported by all layer types
- Map "origin" parameter provides a fixed offset for world coordinates to support higher precision at high zoom levels
- New map option (`clampZoom`) to limit zoom levels to a given range
- New `osmLayer` option (`tileRounding`) to control which tiles are loaded at non-integer zoom levels

### API changes
- Web mercator (`EPSG:3857`) coordinates are now in units of meters rather than degrees
- Lower resolution tiles are loaded before high resolution tiles
  - Creates the perception of faster load times
  - Greatly reduces the occurrence of background visibility while tiles load
- Removed the per-layer geographic projection attribute (`layer.gcs`) that was never fully implemented
  - Every layer is now expected to render in the map's world coordinate system
  - Feature layers can define a "local" coordinate system that is used internally
  - Tile layers have an additional coordinate system defined for each displayable zoom level
- Removed `geo.mercator` in favor of a generic projection class based on PROJ4
- Tile URL template strings now use the more common curly brackets (`{x}`) rather than angle brackets (`<x>`)
- Nearly all of the internals of the `osmLayer`

### Performance
- A tile fetch queue now prioritizes downloaded tiles by what is currently in view
- Mouse event handlers are now throttled to fire at most every 30 ms
- Compiled GL shaders are now cached and shared between features
- Configurable tile cache size

### Testing
- A new library of "mocked" classes has been started to mock interfaces between the classes inside unit tests.
- All new core classes have unittest coverage over 80% and many more classes now have coverage over 50%

| File | Cov | File | Cov | File | Cov |
| :-- | :-- | :-- | :-- | :-- | :-- |
| event.js | 100.0% | tileLayer.js | 96.2% | mapInteractor.js | 79.7% |
| osmLayer.js | 100.0% | tile.js | 96.1% | renderer.js | 71.4% |
| tileCache.js | 100.0% | object.js | 90.4% | layer.js | 70.8% |
| timestamp.js | 100.0% | sceneObject.js | 87.3% | featureLayer.js | 69.0% |
| version.js | 100.0% | planeFeature.js | 87.0% | init.js | 66.3% |
| fetchQueue.js | 100.0% | imageTile.js | 81.8% | map.js | 55.7% |
| camera.js | 97.7% |  |  |  |  |

### Infrastructure and building
- Continuous coverage reporting of unit tests submitted to [CDash](https://my.cdash.org/index.php?project=geojs)
- VGL submodule removed in favor of inclusion via bower
- Support for installing as the `root` user
- Data used for testing and examples are now hosted at [data.kitware.com](https://data.kitware.com/)
- The library is no longer built automatically after `npm install` to fix [downstream build problems](https://github.com/OpenGeoscience/geojs/pull/461).

### Bug fixes
- Setting camera bounds now uses the correct coordinate system
- GeoJSON polygon features no longer rendered as lines
- Discrete zoom now works with touch-like devices
- The `planeFeature` now handles coordinate transformations
- Rendering operations (such as loading new tiles) now occur during map navigation and transition events

### Known issues
- Several [performance problems](https://github.com/OpenGeoscience/geojs/issues?utf8=%E2%9C%93&q=label%3Aperformance+) have been exposed by rendering new tiles during map navigations
  - Many garbage collections occur during mouse handlers due to excessive memory allocations
  - Shader programs are not shared among tiles so they need to be linked for each tile

### Contributors
- @aashish24
- @danlamanna
- @dcjohnston
- @jbeezley
- @manthey

Huge thanks to all of the contributors, and the many others who tested, created issues, and gave feedback during the development of this release.


## Version 0.5.0

### New features
- Contour feature for generating [contour plots](https://opengeoscience.github.io/geojs/examples/contour/) from gridded data
- Hierarchical data clustering with an experimental option for clustered point features
- Multipolygon support in the GeoJSON reader
- Support for rendering with parallel projection along with discrete zooming and image to device pixel alignment
- Per layer attribution notices as well as default attributions for OpenStreetMap
- Support for drawing multiple maps on a single web page
- Support for authenticated tile servers via `crossOrigin = "use-credentials"`

### Breaking changes
- Zoom level is now consistent with other mapping libraries
- Removed `geo.latlng`
- Changed default feature colors
- Map nodes are now created as `position: relative`

## Version 0.4.2

- New examples added showing [map transitions](https://opengeoscience.github.io/geojs/examples/transitions/) and [data animation](https://opengeoscience.github.io/geojs/examples/dynamicData/)
- Large performance improvement for point feature mouse handler setup
- Removed jquery-mousewheel dependency
- Toggling feature visibility now toggles mouse handlers as well
- JQuery plugin will now accept constant values for point sizes and will no longer reset the global gl variable

## Version 0.4.1

- Fixes the built library included in the repository so that it contains vgl

## Version 0.4.0

- Updated to 0.4.0 because npm versions are immutable (the previous geojs was published up to 0.3.x)
- Minor changes to the build process to make `npm install` work

## Version 0.2.0

## Version 0.1.0

- First Release
