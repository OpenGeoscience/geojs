cmake_minimum_required(VERSION 2.8)

project(geojs NONE)

include(CTest)
enable_testing()

set(BUILD_TESTING ON CACHE BOOL "Enable geojs testing")
set(BUILD_DOCUMENTATION OFF CACHE BOOL "Build documentation")

# set up targets for node programs
set(NODE_MODULES_PATH "${CMAKE_CURRENT_SOURCE_DIR}/node_modules")
set(JSHINT_EXECUTABLE "${NODE_MODULES_PATH}/.bin/jshint")
set(JSCS_EXECUTABLE "${NODE_MODULES_PATH}/.bin/jscs")
set(PHANTOMJS_EXECUTABLE "${NODE_MODULES_PATH}/.bin/phantomjs")
set(GRUNT_EXECUTABLE "${NODE_MODULES_PATH}/.bin/grunt")

set(JS_HINT_TESTS ON CACHE BOOL "Generate jshint style tests for JS source files.")
set(JSCS_TESTS ON CACHE BOOL "Generate jscs style tests for JS source files.")
set(PHANTOMJS_TESTS ON CACHE BOOL "Generate phantomjs unit tests.")
set(COVERAGE_TESTS OFF CACHE BOOL "Generate coverage reports.")
set(SELENIUM_TESTS OFF CACHE BOOL "Generate selenium unit tests.")

find_package(PythonInterp REQUIRED)

set(TESTING_HOST localhost CACHE STRING "The host to connect to for unit tests")
mark_as_advanced(TESTING_HOST)
set(TESTING_PORT 50100 CACHE STRING "The port number to use for the testing web server")

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

# set the path where grunt builds the sources
set(GEOJS_DEPLOY_DIR "${CMAKE_CURRENT_SOURCE_DIR}/dist")


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
configure_file(${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/selenium-test-utils.js
               ${GEOJS_DEPLOY_DIR}/test/lib/selenium-test-utils.js
               COPYONLY
)

if (COVERAGE_TESTS)
  set(SOURCES_INCLUDE <script src=/built/geo.all.dev.js data-cover></script>)
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

  # We need to put sources under the build path for ctest to pick them up
  file(COPY "${GEOJS_DEPLOY_DIR}/src" DESTINATION "${CMAKE_CURRENT_BINARY_DIR}")
else()

  set(SOURCES_INCLUDE <script src=/built/geo.all.js></script>)
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
                               -DSOURCES_INCLUDE="${SOURCES_INCLUDE}"
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
                                 -DSOURCES_INCLUDE="${SOURCES_INCLUDE}"
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
                               -DSOURCES_INCLUDE="${SOURCES_INCLUDE}"
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

if(${JS_HINT_TESTS})

  add_custom_target(
    jshint-binary
    ALL
    DEPENDS "${JSHINT_EXECUTABLE}"
  )
  add_test(
    NAME "jshint"
    WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
    COMMAND "${JSHINT_EXECUTABLE}" "--exclude" "src/vgl" "src"
  )

endif() # JS_HINT_TESTS

if(${JSCS_TESTS})

  add_custom_target(
    jscs-binary
    ALL
    DEPENDS "${JSCS_EXECUTABLE}"
  )
  add_test(
    NAME "jscs"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${JSCS_EXECUTABLE}" "src"
  )

endif() # JSCS_TESTS

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
