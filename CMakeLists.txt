cmake_minimum_required(VERSION 2.8)

project(geojs NONE)
set(GEOJS_VERSION 0.1.0)

set(MINIFY OFF CACHE BOOL "Build minified library.")
set(MANGLE OFF CACHE BOOL "When minifying, also mangle non-public symbol names.")

set(BUILD_TESTING ON CACHE BOOL "Enable geojs testing")
set(BUILD_DOCUMENTATION OFF CACHE BOOL "Build documentation")

# make npm a hard dependency
find_program(NPM_EXECUTABLE npm)
if("${NPM_EXECUTABLE}" STREQUAL "NPM_EXECUTABLE-NOTFOUND")
  message(FATAL_ERROR "Could not find npm executable")
endif()

# set up targets for node programs
set(NODE_MODULES_PATH "${CMAKE_CURRENT_BINARY_DIR}/node_modules")

set(JSHINT_EXECUTABLE "${NODE_MODULES_PATH}/jshint/bin/jshint")
add_custom_command(
  OUTPUT "${JSHINT_EXECUTABLE}"
  COMMAND "${NPM_EXECUTABLE}" install jshint@2.4.x
  COMMENT "Installing jshint."
)

set(PHANTOMJS_EXECUTABLE "${NODE_MODULES_PATH}/phantomjs/bin/phantomjs")
add_custom_command(
  OUTPUT "${PHANTOMJS_EXECUTABLE}"
  COMMAND "${NPM_EXECUTABLE}" install phantomjs@1.9.x
  COMMENT "Installing phantomjs."
)

set(UGLIFYJS_EXECUTABLE "${NODE_MODULES_PATH}/uglify-js/bin/uglifyjs")
add_custom_command(
  OUTPUT "${UGLIFYJS_EXECUTABLE}"
  COMMAND "${NPM_EXECUTABLE}" install uglify-js@2.4.x
  COMMENT "Installing uglifyjs."
)

set(need_python FALSE)
if(${BUILD_TESTING})
  set(need_python TRUE)

  set(JS_HINT_TESTS ON CACHE BOOL "Generate style tests for JS source files.")
  set(PHANTOMJS_TESTS ON CACHE BOOL "Generate phantomjs unit tests.")
  set(COVERAGE_TESTS OFF CACHE BOOL "Generate coverage reports.")
  set(SELENIUM_TESTS OFF CACHE BOOL "Generate selenium unit tests.")
endif()

# set up python variables for starting a test server
if(${need_python})

  find_package(PythonInterp REQUIRED)

  set(TESTING_HOST localhost CACHE STRING "The host to connect to for unit tests")
  mark_as_advanced(TESTING_HOST)
  set(TESTING_PORT 50100 CACHE STRING "The port number to use for the testing web server")
endif()

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

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
  core/event.js
  core/time.js
  core/fileReader.js
  core/jsonReader.js
  core/map.js
  core/feature.js
  core/pointFeature.js
  core/lineFeature.js
  core/pathFeature.js
  core/polygonFeature.js
  core/planeFeature.js
  core/geomFeature.js
  core/graphFeature.js
  core/transform.js
  core/renderer.js
  core/osmLayer.js
  gl/init.js
  gl/renderer.js
  gl/lineFeature.js
  gl/pointFeature.js
  gl/geomFeature.js
  gl/planeFeature.js
  gl/mapInteractorStyle.js
  gl/vglRenderer.js
  d3/init.js
  d3/object.js
  d3/pointFeature.js
  d3/lineFeature.js
  d3/pathFeature.js
  d3/graphFeature.js
  d3/d3Renderer.js
)

# GeoJS requires a deployment directory
if (NOT DEFINED GEOJS_DEPLOY_DIR)
  set(GEOJS_DEPLOY_DIR "${CMAKE_CURRENT_BINARY_DIR}/deploy"
      CACHE PATH "PATH to deployment directory" FORCE)
endif()

# define where to copy files within the web root
set(GEOJS_SRC_DIR "${GEOJS_DEPLOY_DIR}/src")

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

set(_min_js_file ${GEOJS_DEPLOY_LIB_DIR}/geo.min.js)
set(_js_file ${GEOJS_DEPLOY_LIB_DIR}/geo.js)

macro(list_contains var value)
  set(${var})
  foreach(value2 ${ARGN})
    if(${value} STREQUAL ${value2})
      set(${var} TRUE)
    endif(${value} STREQUAL ${value2})
  endforeach(value2)
endmacro(list_contains)

# customize files that should be ignored while globbing
function(glob_filter f)
  # ignore /.*
  get_filename_component(base "${f}" NAME)
  string(SUBSTRING "${base}" 0 1 first)
  if("${first}" STREQUAL ".")
    set(glob_ignore true PARENT_SCOPE)
  else()
    set(glob_ignore false PARENT_SCOPE)
  endif()
endfunction()

set(_js_uglify_files)
set(_js_lint_files)
set(_script_include)
foreach(d ${_source_files})
  add_custom_command(
    OUTPUT "${GEOJS_SRC_DIR}/${d}"
    COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_SOURCE_DIR}/src/${d}" "${GEOJS_SRC_DIR}/${d}"
    DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/src/${d}"
  )
  set(_js_lint_files ${_js_lint_files} "${CMAKE_CURRENT_SOURCE_DIR}/src/${d}")
  set(_js_uglify_files ${_js_uglify_files} "${GEOJS_SRC_DIR}/${d}")
  set(_script_include ${_script_include}<script src=\"/src/${d}\" data-cover></script>)
endforeach()

# configure version information
configure_file(
  ${CMAKE_CURRENT_SOURCE_DIR}/src/core/version.js.in
  ${GEOJS_SRC_DIR}/core/version.js
)
set(_js_uglify_files ${_js_uglify_files} ${GEOJS_SRC_DIR}/core/version.js)
set(_script_include ${_script_include}<script src=\"/src/core/version.js\" data-cover></script>)

# Build concatonated js file
add_custom_command(
  OUTPUT ${_js_file}
  COMMAND ${UGLIFYJS_EXECUTABLE} -b -o ${_js_file} ${_js_uglify_files}
  DEPENDS ${UGLIFYJS_EXECUTABLE} ${GEOJS_DEPLOY_LIB_DIR} ${_js_uglify_files}
  VERBATIM
)

if(MINIFY)
  if(MANGLE)
      set(MANGLE_FLAG "-m")
  endif()

  # Build minified js file
  add_custom_command(
    OUTPUT ${_min_js_file}
    COMMAND ${UGLIFYJS_EXECUTABLE} ${_js_file} -c ${MANGLE_FLAG} -o ${_min_js_file} ${_js_file}
    DEPENDS ${UGLIFYJS_EXECUTABLE} ${GEOJS_DEPLOY_LIB_DIR} ${_js_file}
  )
  add_custom_target(${PROJECT_NAME} ALL DEPENDS ${_min_js_file})
else()
  add_custom_target(${PROJECT_NAME} ALL DEPENDS ${_js_file})
endif()

add_dependencies(${PROJECT_NAME} geojs_pre_deploy)

file(GLOB_RECURSE all_example_files RELATIVE "${CMAKE_CURRENT_SOURCE_DIR}" "${CMAKE_CURRENT_SOURCE_DIR}/examples/*")
set(example_files_deploy)
foreach(f ${all_example_files})
  glob_filter("${f}")
  if(NOT ${glob_ignore})
    add_custom_command(
      OUTPUT "${GEOJS_DEPLOY_DIR}/${f}"
      COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_SOURCE_DIR}/${f}" "${GEOJS_DEPLOY_DIR}/${f}"
      DEPENDS "${CMAKE_CURRENT_SOURCE_DIR}/${f}"
      COMMENT "Copying ${f} to deploy directory."
    )
    set(example_files_deploy ${example_files_deploy} "${GEOJS_DEPLOY_DIR}/${f}")
  endif()
endforeach()
add_custom_target(geojs_examples ALL DEPENDS ${example_files_deploy} ${MIDAS_DOWNLOAD_FILES})

add_subdirectory(vgl)
add_dependencies(vgl geojs_pre_deploy)

# add a test with a resource lock for the web server
function(add_geojs_test test_name)
  add_test(
    NAME "${test_name}"
    WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
    COMMAND ${PYTHON_EXECUTABLE}
            ${CMAKE_CURRENT_BINARY_DIR}/test/geojs_test_runner.py
            ${ARGN}
  )
  set_property(TEST "${test_name}" APPEND PROPERTY RESOURCE_LOCK webserver)
  if (COVERAGE_TESTS)
    set_property(TEST "${test_name}" APPEND PROPERTY DEPENDS "coverage-reset")
    set_property(TEST "coverage-report" APPEND PROPERTY DEPENDS "${test_name}")
  endif()
endfunction()

set(MIDAS_BASE_URL "http://midas3.kitware.com/midas" CACHE STRING "MIDAS data store URL.")
mark_as_advanced(MIDAS_BASE_URL)
set(MIDAS_COMMUNITY "GeoJS" CACHE STRING "MIDAS community hosting test images.")
mark_as_advanced(MIDAS_COMMUNITY)

# set variables for MIDAS3.cmake
set(MIDAS_REST_URL "${MIDAS_BASE_URL}/api/json")
set(MIDAS_KEY_DIR "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-data")
set(MIDAS_DATA_DIR "${GEOJS_DEPLOY_DIR}/data")
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/MIDAS3.cmake)

add_download_target()

# set up testing framework and add tests
if(BUILD_TESTING)
  include(CTest)
  enable_testing()

  # copy blanket JS files
  configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/testing/js/blanket.min.js
    ${GEOJS_DEPLOY_DIR}/test/lib/blanket.min.js
    COPYONLY
  )
  configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/testing/js/jasmine-boot.js
    ${GEOJS_DEPLOY_DIR}/test/lib/jasmine-boot.js
    COPYONLY
  )
  configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/aggregate-json-reporter.js.in
    ${GEOJS_DEPLOY_DIR}/test/lib//aggregate-json-reporter.js
  )
  configure_file(${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/geojs_test_runner.py.in
                 ${CMAKE_CURRENT_BINARY_DIR}/test/geojs_test_runner.py
  )

  configure_file(${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/blanket_server.py
                 ${CMAKE_CURRENT_BINARY_DIR}/test/blanket_server.py
                 COPYONLY
  )

  if (COVERAGE_TESTS)

    set(BLANKET_INCLUDE <script src=/test/lib/blanket.min.js></script>)
    add_test(
      NAME "coverage-reset"
      WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
      COMMAND "${PYTHON_EXECUTABLE}"
              "${CMAKE_CURRENT_BINARY_DIR}/test/blanket_server.py"
              "reset"
    )

    add_test(
      NAME "coverage-report"
      WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
      COMMAND "${PYTHON_EXECUTABLE}"
              "${CMAKE_CURRENT_BINARY_DIR}/test/blanket_server.py"
              "report" "${CMAKE_CURRENT_BINARY_DIR}/coverage.xml"
    )
    set_property(TEST "coverage-report" APPEND PROPERTY DEPENDS "coverage-reset")

  else()

      set(BLANKET_INCLUDE "")

  endif()

  if(PHANTOMJS_TESTS)
    set(PHANTOMJS_REL_DIR "test/phantomjs")
    set(PHANTOMJS_ABS_DIR "${GEOJS_DEPLOY_DIR}/${PHANTOMJS_REL_DIR}")

    configure_file(
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/js/jasmine-blanket.js
      ${GEOJS_DEPLOY_DIR}/test/lib/jasmine-blanket.js
      COPYONLY
    )

    file(GLOB JS_UNIT_TEST_CASES
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-cases/phantomjs-tests/*.js
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
                                 -DSCRIPT_INCLUDE="${_script_include}"
                                 -DBLANKET_INCLUDE="${BLANKET_INCLUDE}"
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

    add_custom_target(
      phantomjs_tests
      ALL
      DEPENDS ${PHANTOMJS_EXECUTABLE} ${JS_UNIT_TEST_FILES}
    )

  endif() # PHANTOMJS_TESTS

  if(SELENIUM_TESTS)

    set(FIREFOX_TESTS ON CACHE BOOL "Turn on Firefox selenium tests.")
    set(CHROME_TESTS OFF CACHE BOOL "Turn on Chrome selenium tests.")
    set(DATA_REPO_PATH "" CACHE PATH "Local path to the geojs data repository (optional).")
    set(SELENIUM_TEST_DIR "${GEOJS_DEPLOY_DIR}/test/selenium")
    set(SELENIUM_HOST localhost CACHE STRING "The selenium test server host.")
    mark_as_advanced(SELENIUM_HOST)
    set(SELENIUM_PORT 4444 CACHE STRING "The selenium test server port.")
    mark_as_advanced(SELENIUM_PORT)

    configure_file(
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/js/selenium-blanket.js
      ${GEOJS_DEPLOY_DIR}/test/lib/selenium-blanket.js
      COPYONLY
    )
    configure_file(
      "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/selenium_test.py.in"
      "${CMAKE_CURRENT_BINARY_DIR}/test/selenium_test.py"
    )
    configure_file(
      "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/midas_handler.py"
      "${CMAKE_CURRENT_BINARY_DIR}/test/midas_handler.py"
      COPYONLY
    )
    configure_file(
      "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/upload_test_cases.py"
      "${CMAKE_CURRENT_BINARY_DIR}/test/upload_test_cases.py"
      COPYONLY
    )
    file(GLOB SELENIUM_TEST_DIRS
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-cases/selenium-tests/*
    )
    foreach(dir ${SELENIUM_TEST_DIRS})
      if(IS_DIRECTORY "${dir}" AND EXISTS "${dir}/include.js")
        set(html "${dir}/include.html")
        set(js "${dir}/include.js")
        set(css "${dir}/include.css")
        get_filename_component(f "${dir}" NAME_WE)
        set(test_dir "${SELENIUM_TEST_DIR}/${f}")
        set(output_html "${test_dir}/index.html")

        add_custom_command(OUTPUT "${output_html}"
          COMMAND ${CMAKE_COMMAND} -DHTML_INCLUDE="${html}"
                                   -DJS_INCLUDE="${js}"
                                   -DCSS_INCLUDE="${css}"
                                   -DSCRIPT_INCLUDE="${_script_include}"
                                   -DOUTPUT_HTML="${output_html}"
                                   -DTEMPLATE_HTML="${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/selenium-template.html.in"
                                   -DBLANKET_INCLUDE="${BLANKET_INCLUDE}"
                                   -P ${CMAKE_SOURCE_DIR}/cmake/configure-js-selenium-test.cmake
          COMMAND ${CMAKE_COMMAND} -E touch "${output_html}"
          DEPENDS "${html}" "${js}" "${css}" "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/selenium-template.html.in"
          COMMENT "Generating selenium test ${f}"
        )
        list(APPEND SELENIUM_TEST_FILES "${output_html}")

        add_test(
          NAME "selenium:${f}"
          WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
          COMMAND ${PYTHON_EXECUTABLE} -m unittest discover -v -s "${dir}"
        )
        set_property(TEST "selenium:${f}" APPEND PROPERTY RESOURCE_LOCK webserver)

        if (COVERAGE_TESTS)
          set_property(TEST "selenium:${f}" APPEND PROPERTY DEPENDS "coverage-reset")
          set_property(TEST "coverage-report" APPEND PROPERTY DEPENDS "selenium:${f}")
        endif()
        set_property(TEST "selenium:${f}" APPEND PROPERTY ENVIRONMENT "PYTHONPATH=${CMAKE_CURRENT_BINARY_DIR}/test")
        set_property(TEST "selenium:${f}" APPEND PROPERTY ENVIRONMENT "FIREFOX_TESTS=${FIREFOX_TESTS}")
        set_property(TEST "selenium:${f}" APPEND PROPERTY ENVIRONMENT "CHROME_TESTS=${CHROME_TESTS}")
      endif()
    endforeach()

    set(jasmine_runner ${CMAKE_CURRENT_BINARY_DIR}/test/selenium_jasmine_runner.py)
    set(JASMINE_DEPLOY_URL /test/jasmine)

    configure_file(
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/selenium_jasmine_runner.py.in
      ${jasmine_runner}
    )

    list(APPEND JAMINE_TEST_FILES ${jasmine_runner})

    set(JASMINE_TEST_DIR "${GEOJS_DEPLOY_DIR}/test/jasmine")
    file(GLOB JASMINE_TEST_SOURCES
      ${CMAKE_CURRENT_SOURCE_DIR}/testing/test-cases/jasmine-tests/*.js
    )
    foreach(f ${JASMINE_TEST_SOURCES})
      get_filename_component(base "${f}" NAME_WE)
      set(html "${JASMINE_TEST_DIR}/${base}.html")

      add_custom_command(OUTPUT ${html}
        COMMAND ${CMAKE_COMMAND} -DTEST_HTML="${html}"
                                 -DSOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}"
                                 -DSOURCE_FILE="${f}"
                                 -DSCRIPT_INCLUDE="${_script_include}"
                                 -DBLANKET_INCLUDE="${BLANKET_INCLUDE}"
                                 -P ${CMAKE_SOURCE_DIR}/cmake/configure-js-unit-test.cmake
        COMMAND ${CMAKE_COMMAND} -E touch ${html}
        DEPENDS ${f} ${CMAKE_SOURCE_DIR}/testing/test-runners/jasmine-runner.html.in
        COMMENT "Generating jasmine unit test ${base}"
      )
      list(APPEND JASMINE_TEST_FILES ${html})

      add_test(
        NAME "selenium:jasmine:${base}"
        COMMAND ${PYTHON_EXECUTABLE} ${jasmine_runner} ${base}
      )
      set_property(TEST "selenium:jasmine:${base}" APPEND PROPERTY RESOURCE_LOCK webserver)
      if(COVERAGE_TESTS)
        set_property(TEST "selenium:jasmine:${base}" APPEND PROPERTY DEPENDS "coverage-reset")
        set_property(TEST "coverage-report" APPEND PROPERTY DEPENDS "selenium:jasmine:${base}")
      endif()
      set_property(TEST "selenium:jasmine:${base}" APPEND PROPERTY ENVIRONMENT "PYTHONPATH=${CMAKE_CURRENT_BINARY_DIR}/test")
      set_property(TEST "selenium:jasmine:${base}" APPEND PROPERTY ENVIRONMENT "FIREFOX_TESTS=${FIREFOX_TESTS}")
      set_property(TEST "selenium:jasmine:${base}" APPEND PROPERTY ENVIRONMENT "CHROME_TESTS=${CHROME_TESTS}")
    endforeach()

    add_custom_target(
      selenium_tests
      ALL
      DEPENDS ${SELENIUM_TEST_FILES} ${MIDAS_DOWNLOAD_FILES} ${JASMINE_TEST_FILES}
    )

  endif()

  # JSLint tests.
  if(${JS_HINT_TESTS})

    add_custom_target(
      jshint-binary
      ALL
      DEPENDS "${JSHINT_EXECUTABLE}"
    )
    foreach(js ${_js_lint_files})
      file(RELATIVE_PATH rel_f "${CMAKE_CURRENT_SOURCE_DIR}" "${js}")
      add_test(
        NAME "jshint:${rel_f}"
        COMMAND ${JSHINT_EXECUTABLE} ${js}
      )
    endforeach()

  endif() # JS_HINT_TESTS

endif()

if(BUILD_DOCUMENTATION)
  find_program(SPHINX_EXECUTABLE sphinx-build)
  if("${SPHINX_EXECUTABLE}" STREQUAL "SPHINX_EXECUTABLE-NOTFOUND")
    message(FATAL_ERROR "Could not find sphinx-build for BUILD_DOCUMENTATION")
  endif()

  set(docs_sources
    "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/blanket_server.py"
    "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/geojs_test_runner.py.in"
    "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/midas_handler.py"
    "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/selenium_test.py.in"
    "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/upload_test_cases.py"
    "${CMAKE_CURRENT_SOURCE_DIR}/docs/conf.py"
    "${CMAKE_CURRENT_SOURCE_DIR}/docs/index.rst"
    "${CMAKE_CURRENT_SOURCE_DIR}/docs/quickstart.rst"
    "${CMAKE_CURRENT_SOURCE_DIR}/docs/testingutils.rst"
  )


  add_custom_command(
    OUTPUT "${GEOJS_DEPLOY_DIR}/docs/index.html"
    DEPENDS ${docs_sources}
    COMMAND "${CMAKE_COMMAND}" -E make_directory "${GEOJS_DEPLOY_DIR}/docs"
    COMMAND "${SPHINX_EXECUTABLE}" -c "${CMAKE_CURRENT_SOURCE_DIR}/docs" -b html "${CMAKE_CURRENT_SOURCE_DIR}/docs" "${GEOJS_DEPLOY_DIR}/docs"
    COMMENT "Building documentation"
  )
  add_custom_target(
    docs
    ALL
    DEPENDS "${GEOJS_DEPLOY_DIR}/docs/index.html"
  )
endif()
