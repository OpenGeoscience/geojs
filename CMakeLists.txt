cmake_minimum_required(VERSION 2.8)

project(geojs)
set(GEOJS_VERSION 0.1.0)

set(MINIFY ON CACHE BOOL "Minify the JavaScript files prior to concatenating.")
set(MANGLE ON CACHE BOOL "When minifying, also mangle non-public symbol names.")

set(BUILD_TESTING_OLD OFF CACHE BOOL "Enable old testing (to be removed)")

set(BUILD_TESTING ON CACHE BOOL "Enable geojs testing")

set(need_python FALSE)
if(${BUILD_TESTING_OLD} OR ${BUILD_TESTING})
  set(need_python TRUE)
  set(GEOJS_DATA_DIR "" CACHE PATH  "Path to directory containing data for testing.")
  set(GEOJS_BASELINE_DIR "" CACHE PATH "Path to directory containing baseline images for testing.")
endif()

if(${BUILD_TESTING})
  set(need_python TRUE)

  # turn on when fixed
  set(JS_LINT_TESTS OFF CACHE BOOL "Generate style tests for JS source files.")

  set(PHANTOMJS_TESTS ON CACHE BOOL "Generate phantomjs unit tests.")

  # once implemented
  #set(COVERAGE_TESTS OFF CACHE BOOL "Generate coverage reports.")
  #set(SELENIUM_TESTS OFF CACHE BOOL "Generate selenium unit tests.")
endif()

# set up python variables for starting a test server
if(${need_python})

  find_package(PythonInterp REQUIRED)

  set(TESTING_HOST localhost CACHE STRING "The host to connect to for unit tests")
  mark_as_advanced(TESTING_HOST)
  set(TESTING_PORT 50100 CACHE STRING "The port number to use for the testing web server")
endif()

# Uglify and concatenate the library js files.
if(NOT ${MINIFY})
    set(MINIFY_FLAG "-b")
endif()

if(${MINIFY} AND ${MANGLE})
    set(MANGLE_FLAG "-m")
endif()

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

# Find UglifyJS.
find_package(UglifyJS)

set(_source_files
  core/init.js
  core/object.js
  core/sceneObject.js
  core/timestamp.js
  core/ellipsoid.js
  core/mercator.js
  core/latlng.js
  core/layer.js
  core/featureLayer.js
  core/featureCollection.js
  core/layerSource.js
  core/archiveLayerSource.js
  core/event.js
  core/time.js
  core/map.js
  core/feature.js
  core/pointFeature.js
  core/lineFeature.js
  core/polygonFeature.js
  core/planeFeature.js
  core/geomFeature.js
  core/graphFeature.js
  core/transform.js
  core/renderer.js 
  core/osmLayer.js
  gl/init.js
  gl/renderer.js
  gl/pointFeature.js
  gl/geomFeature.js
  gl/planeFeature.js
  gl/mapInteractorStyle.js	
  gl/vglRenderer.js
  d3/init.js
  d3/object.js
  d3/pointFeature.js
  d3/lineFeature.js
  d3/graphFeature.js
  d3/d3Renderer.js
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
  plugin/jquery-plugin.js
)

set(_exclude_js_lint
  wfl/registry.js
  wfl/staticWorkflows.js
)

# GeoJS requires a deployment directory
if (NOT DEFINED GEOJS_DEPLOY_DIR)
  set(GEOJS_DEPLOY_DIR "${CMAKE_CURRENT_BINARY_DIR}/deploy"
      CACHE PATH "PATH to deployment directory" FORCE)
endif()

# Create deploy directory if it does not exists
if(NOT DEFINED "${GEOJS_DEPLOY_LIB_DIR}")
  set(GEOJS_DEPLOY_LIB_DIR "${GEOJS_DEPLOY_DIR}/web/lib")
  add_custom_command(OUTPUT "${GEOJS_DEPLOY_LIB_DIR}"
    COMMAND ${CMAKE_COMMAND} -E make_directory "${GEOJS_DEPLOY_LIB_DIR}"
  )
  add_custom_target(geojs_pre_deploy ALL DEPENDS ${GEOJS_DEPLOY_LIB_DIR})
endif()

set(VGL_DEPLOY_DIR "${GEOJS_DEPLOY_DIR}")
set(VGL_DEPLOY_LIB_DIR "${GEOJS_DEPLOY_LIB_DIR}")

set(_min_js_file ${GEOJS_DEPLOY_LIB_DIR}/geojs.min.js)

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
    DEPENDS ${GEOJS_DEPLOY_LIB_DIR} ${_js_uglify_files}
  )
else()
  # Use custom command to call CMake script to cat files together
  add_custom_command(
    OUTPUT ${_min_js_file}
    COMMAND ${CMAKE_COMMAND} -DCAT_OUTPUT_FILE=${_min_js_file}
            # Note the quotes so we get the ; included
            "-DCAT_FILES=${_js_uglify_files}"
            -P ${CMAKE_CURRENT_SOURCE_DIR}/cmake/cat.cmake
    DEPENDS ${GEOJS_DEPLOY_LIB_DIR} ${_js_uglify_files}
    VERBATIM
  )
endif()

# Build project
add_custom_target(${PROJECT_NAME} ALL DEPENDS ${_min_js_file})
add_dependencies(${PROJECT_NAME} geojs_pre_deploy)

# Old testing framework
if (BUILD_TESTING_OLD)
  include(CTest)
  enable_testing()

  if(EXISTS "${GEOJS_DATA_DIR}" AND IS_DIRECTORY "${GEOJS_DATA_DIR}")
    message("[info] GeoJS data directory is set to ${GEOJS_DATA_DIR}")
    set(VGL_DATA_DIR "${GEOJS_DATA_DIR}")
  else()
    message(FATAL_ERROR "GeoJS testing requires valid data directory")
  endif()

  if(EXISTS "${GEOJS_BASELINE_DIR}" AND IS_DIRECTORY "${GEOJS_BASELINE_DIR}")
    message("[info] GeoJS baseline directory is set to ${GEOJS_BASELINE_DIR}")
    set(VGL_BASELINE_DIR "${GEOJS_BASELINE_DIR}")
  else()
    message(FATAL_ERROR "GeoJS testing requires valid baseline directory")
  endif()

  add_custom_command(
    OUTPUT "${GEOJS_DEPLOY_DIR}/testing"
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_SOURCE_DIR}/testing
            "${GEOJS_DEPLOY_DIR}/testing"
  )
  add_custom_target(geojs_testing ALL DEPENDS "${GEOJS_DEPLOY_DIR}/testing")
  add_dependencies(${PROJECT_NAME} geojs_testing)

  # GUI testing (requires python)
  find_package(PythonInterp REQUIRED)
endif()

add_subdirectory(vgl)
add_dependencies(vgl geojs_pre_deploy)

# add a test with a resource lock for the web server
function(add_geojs_test test_name)
  add_test(
    NAME "${test_name}"
    WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
    COMMAND ${PYTHON_EXECUTABLE}
            ${CMAKE_CURRENT_BINARY_DIR}/test/geojs-test-runner.py
            ${ARGN}
  )
  set_property(TEST "${test_name}" PROPERTY RESOURCE_LOCK webserver)
endfunction()

# set up testing framework and add tests
if(BUILD_TESTING)
  include(CTest)
  enable_testing()

  if(PHANTOMJS_TESTS)
    find_package(PhantomJS REQUIRED)

    set(PHANTOMJS_REL_DIR "test/phantomjs")
    set(PHANTOMJS_ABS_DIR "${GEOJS_DEPLOY_DIR}/${PHANTOMJS_REL_DIR}")

    # copy blanket JS files
    configure_file(
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/js/blanket.min.js
      ${GEOJS_DEPLOY_DIR}/test/js-coverage/blanket.min.js
      COPYONLY
    )
    configure_file(
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/js/jasmine-blanket.js
      ${GEOJS_DEPLOY_DIR}/test/js-coverage/jasmine-blanket.js
      COPYONLY
    )


    file(GLOB JS_UNIT_TEST_CASES
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-cases/phantomjs-tests/*.js
    )

    configure_file(${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/geojs-test-runner.py.in
                   ${CMAKE_CURRENT_BINARY_DIR}/test/geojs-test-runner.py
    )

    list(APPEND TESTING_DEPENDENCIES ${_min_js_file})

    # add phantomjs unit tests
    foreach(js ${JS_UNIT_TEST_CASES})
      get_filename_component(f "${js}" NAME_WE)
      set(html "${PHANTOMJS_ABS_DIR}/${f}.html")

      add_custom_command(OUTPUT ${html}
        COMMAND ${CMAKE_COMMAND} -DTEST_HTML="${html}"
                                 -DSOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}"
                                 -DSOURCE_FILE="${js}"
                                 -P ${CMAKE_SOURCE_DIR}/cmake/configure-js-unit-test.cmake
        COMMAND ${CMAKE_COMMAND} -E touch ${html}
        DEPENDS ${js} ${CMAKE_SOURCE_DIR}/testing/test-runners/jasmine-runner.html.in
        COMMENT "Generating phantomjs unit test ${f}"
      )
      list(APPEND JS_UNIT_TEST_FILES ${html})

      add_geojs_test(phantomjs:${f}
        ${PHANTOMJS_EXECUTABLE} ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/run-jasmine.js
                http://${TESTING_HOST}:${TESTING_PORT}/${PHANTOMJS_REL_DIR}/${f}.html
      )
    endforeach()

    # generate the coverage report
    set(coverage_test ${GEOJS_DEPLOY_DIR}/test/js-coverage/geojs-coverage.html)
    set(coverage_configurator ${CMAKE_CURRENT_SOURCE_DIR}/cmake/configure-js-coverage-test.cmake)
    add_custom_command(
      OUTPUT ${coverage_test}
      COMMAND ${CMAKE_COMMAND} "-DJS_UNIT_TEST_CASES=\"${JS_UNIT_TEST_CASES}\""
                                -DSOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}"
                                -DDEPLOY_DIR="${GEOJS_DEPLOY_DIR}"
                                -P ${coverage_configurator}
      COMMAND ${CMAKE_COMMAND} -E touch ${coverage_test}
      DEPENDS ${JS_UNIT_TEST_FILES} ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/coverage-runner.html.in ${coverage_configurator}
      COMMENT "Generating geojs coverage report"
    )

    list(APPEND JS_UNIT_TEST_FILES ${coverage_test})

    add_custom_target(
      phantomjs_tests
      ALL
      DEPENDS ${JS_UNIT_TEST_FILES}
    )
  endif() # PHANTOMJS_TESTS

  # JSLint tests.
  if(${JS_LINT_TESTS})
    # Find JSLint.
    find_package(JSLint REQUIRED)

    foreach(js ${_js_lint_files})
      add_test(
        NAME "jslint:${js}"
        COMMAND ${JSLint_EXECUTABLE} ${js}
      )
    endforeach()

  endif() # JS_LINT_TESTS

endif()
