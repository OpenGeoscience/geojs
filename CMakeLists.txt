cmake_minimum_required(VERSION 2.8.8)

project(geojs)

set(MINIFY ON CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE ON CACHE BOOL "When minifying, also mangle non-public symbol names.")

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

# Find JSLint.
find_package(JSLint)

# Find UglifyJS.
find_package(UglifyJS)

set(_source_files
  core/init.js
  core/ellipsoid.js
  core/mercator.js
  core/latlng.js
  core/layer.js
  core/featureLayer.js
  core/openStreetMapLayer.js
  core/featureCollection.js
  core/layerSource.js
  core/archiveLayerSource.js
  core/command.js
  core/updateRequest.js
  core/prepareForRenderRequest.js
  core/mapInteractorStyle.js
  core/time.js
  core/map.js
  core/feature.js
  core/geoTransform.js
  core/data.js
  ui/init.js
  ui/gis.js
  srv/init.js
  srv/webSocket.js
  wfl/init.js
  wfl/utils.js
  wfl/workflow.js
  wfl/module.js
  wfl/connection.js
  wfl/port.js
  wfl/registry.js
  wfl/inputModule.js
  wfl/outputPort.js
  wfl/inputPort.js
  wfl/layerSource.js
  wfl/editor.js
  wfl/style.js
  wfl/staticWorkflows.js
)

set(_exclude_js_lint
  wfl/registry.js
  wfl/staticWorkflows.js
)

set(_min_js_file ${DEPLOY_LIB_DIR}/geojs.min.js)

macro(list_contains var value)
  set(${var})
  foreach(value2 ${ARGN})
    if(${value} STREQUAL ${value2})
      set(${var} TRUE)
    endif(${value} STREQUAL ${value2})
  endforeach(value2)
endmacro(list_contains)

set(_js_lint_files)
set(_js_uglify_files)
foreach(d ${_source_files})
  list_contains(contains d ${_exclude_js_lint})
  if(NOT contains)
      set(_js_lint_files ${_js_lint_files} ${CMAKE_CURRENT_SOURCE_DIR}/src/${d})
  endif()
  set(_js_uglify_files ${_js_uglify_files} ${CMAKE_CURRENT_SOURCE_DIR}/src/${d})
endforeach()

if (UglifyJS_EXECUTABLE)
  add_custom_command(
    OUTPUT ${_min_js_file}
    COMMAND ${UglifyJS_EXECUTABLE} -o ${_min_js_file} ${_js_uglify_files}
            ${MINIFY_FLAG} ${MANGLE_FLAG}
    DEPENDS ${DEPLOY_LIB_DIR} ${_js_uglify_files}
  )
else()
  # Use custom command to call CMake script to cat files together
  add_custom_command(
    OUTPUT ${_min_js_file}
    COMMAND ${CMAKE_COMMAND} -DCAT_OUTPUT_FILE=${_min_js_file}
            # Note the quotes so we get the ; included
            "-DCAT_FILES=${_js_uglify_files}"
            -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/cat.cmake
    DEPENDS ${DEPLOY_LIB_DIR} ${_js_uglify_files}
    VERBATIM
  )
endif()

add_custom_target(${PROJECT_NAME} ALL DEPENDS ${_min_js_file})
add_dependencies(${PROJECT_NAME} predeploy)

add_subdirectory(vgl)

# Testing
if (BUILD_TESTING)
  include(CTest)
  enable_testing()
endif()

# JSLint tests.
foreach(f ${_js_lint_files})
    add_test(jslint-${f} ${JSLint_EXECUTABLE} ${f})
endforeach()
