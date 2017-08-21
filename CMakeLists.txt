cmake_minimum_required(VERSION 2.8)

project(geojs NONE)

include(CTest)
enable_testing()

set(BUILD_TESTING ON CACHE BOOL "Enable geojs testing")
set(HEADLESS_TESTS ON CACHE BOOL "Generate headless browser unit tests.")
set(WEBGLHEADLESS_TESTS ON CACHE BOOL "Generate headless WebGL unit tests (requires xvfb to be running).")
set(TEST_SAVE_IMAGE "none" CACHE STRING "Save headless test images even if there aren't errors.  Valid options are none, all, or the a comma-separated list of test names.")
set(ESLINT_TESTS ON CACHE BOOL "Generate eslint style tests for JS source files.")

site_name(HOSTNAME)

set(TESTING_HOST "${HOSTNAME}" CACHE STRING "The host to connect to for unit tests")
set(TESTING_PORT 30100 CACHE STRING "The port number to use for the testing web server")
mark_as_advanced(TESTING_PORT)

list(APPEND CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/cmake")

set(NOTES_PATH "${CMAKE_CURRENT_BINARY_DIR}/build_notes.json")

# set the path where webpack builds the sources
set(GEOJS_DEPLOY_DIR "${CMAKE_CURRENT_SOURCE_DIR}/dist")

find_program(NPM_EXECUTABLE npm)
if(NOT NPM_EXECUTABLE)
  message(FATAL_ERROR "npm is required for many tests")
endif()

function(add_geojs_test test_name)
  add_test(
    NAME "${test_name}"
    WORKING_DIRECTORY "${GEOJS_DEPLOY_DIR}"
    COMMAND ${PYTHON_EXECUTABLE}
            ${CMAKE_CURRENT_BINARY_DIR}/test/geojs_test_runner.py
            ${ARGN}
  )
  set_property(TEST "${test_name}" APPEND PROPERTY DEPENDS "notes-reset")
  set_property(TEST "notes-report" APPEND PROPERTY DEPENDS "${test_name}")
endfunction()

# set variables for girder.cmake
set(Girder_KEY_DIR "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-data")
set(Girder_DATA_DIR "${GEOJS_DEPLOY_DIR}/data")
include(${CMAKE_CURRENT_SOURCE_DIR}/cmake/girder.cmake)

add_download_target()

configure_file(${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/geojs_test_runner.py.in
               ${CMAKE_CURRENT_BINARY_DIR}/test/geojs_test_runner.py
)

# Generate notes to send along with the test reports
add_test(
  NAME "notes-reset"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  COMMAND "./tests/notes.js" "reset" "${CMAKE_CURRENT_BINARY_DIR}/notes" "${NOTES_PATH}"
)

add_test(
  NAME "notes-report"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  COMMAND "./tests/notes.js" "combine" "${CMAKE_CURRENT_BINARY_DIR}/notes" "${NOTES_PATH}"
)
set_property(TEST "notes-report" APPEND PROPERTY DEPENDS "notes-reset")

add_test(
  NAME "total-coverage"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  COMMAND "${NPM_EXECUTABLE}" run combine-coverage
)
set_property(TEST "notes-report" APPEND PROPERTY DEPENDS "notes-reset")

if(HEADLESS_TESTS)
  add_test(
    NAME "headless"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${NPM_EXECUTABLE}" run test
  )
  set_property(TEST "headless" APPEND PROPERTY ENVIRONMENT "CTEST_NOTES_PATH=${CMAKE_CURRENT_BINARY_DIR}/notes")
  set_property(TEST "headless" APPEND PROPERTY DEPENDS "notes-reset")
  set_property(TEST "notes-report" APPEND PROPERTY DEPENDS "headless")
  set_property(TEST "total-coverage" APPEND PROPERTY DEPENDS "headless")

  add_test(
    NAME "tutorials"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${NPM_EXECUTABLE}" run tutorialsci
  )
  set_property(TEST "tutorials" APPEND PROPERTY DEPENDS "build_tutorials")
  set_property(TEST "total-coverage" APPEND PROPERTY DEPENDS "tutorials")
endif()

add_custom_target(
  data_files
  ALL
  DEPENDS ${Girder_DOWNLOAD_FILES}
)
add_test(NAME get_data_files COMMAND "${CMAKE_COMMAND}" --build ${CMAKE_BINARY_DIR} --target data_files)

add_custom_command(OUTPUT "${GEOJS_DEPLOY_DIR}/examples/bundle.js"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  COMMAND "${NPM_EXECUTABLE}" run build-examples
  COMMENT "Build examples"
  VERBATIM
)
add_custom_target(examples DEPENDS "${GEOJS_DEPLOY_DIR}/examples/bundle.js")
add_test(NAME build_examples COMMAND "${CMAKE_COMMAND}" --build ${CMAKE_BINARY_DIR} --target examples)
set_property(TEST "build_examples" APPEND PROPERTY DEPENDS "get_data_files")

add_custom_command(OUTPUT "${GEOJS_DEPLOY_DIR}/tutorials/bundle.js"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  COMMAND "${NPM_EXECUTABLE}" run build-tutorials
  COMMENT "Build tutorials"
  VERBATIM
)
add_custom_target(tutorials DEPENDS "${GEOJS_DEPLOY_DIR}/tutorials/bundle.js")
add_test(NAME build_tutorials COMMAND "${CMAKE_COMMAND}" --build ${CMAKE_BINARY_DIR} --target tutorials)
set_property(TEST "build_tutorials" APPEND PROPERTY DEPENDS "get_data_files")

if(WEBGLHEADLESS_TESTS)
  add_test(
    NAME "webglheadless"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${NPM_EXECUTABLE}" run glci
  )
  set_property(TEST "webglheadless" APPEND PROPERTY ENVIRONMENT "CTEST_IMAGE_PATH=${CMAKE_CURRENT_BINARY_DIR}/images")
  set_property(TEST "webglheadless" APPEND PROPERTY ENVIRONMENT "TEST_SAVE_IMAGE=${TEST_SAVE_IMAGE}")
  set_property(TEST "total-coverage" APPEND PROPERTY DEPENDS "webglheadless")
  set_property(TEST "webglheadless" APPEND PROPERTY DEPENDS "get_data_files")
  # We use some of the example images in the webglheadless tests
  set_property(TEST "webglheadless" APPEND PROPERTY DEPENDS "build_examples")

  add_test(
    NAME "examplesheadless"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${NPM_EXECUTABLE}" run examplesci
  )
  set_property(TEST "examplesheadless" APPEND PROPERTY ENVIRONMENT "CTEST_IMAGE_PATH=${CMAKE_CURRENT_BINARY_DIR}/images")
  set_property(TEST "examplesheadless" APPEND PROPERTY ENVIRONMENT "TEST_SAVE_IMAGE=${TEST_SAVE_IMAGE}")
  set_property(TEST "total-coverage" APPEND PROPERTY DEPENDS "examplesheadless")
  set_property(TEST "examplesheadless" APPEND PROPERTY DEPENDS "build_examples")

  configure_file(
    "${CMAKE_CURRENT_SOURCE_DIR}/testing/test-runners/baseline_images.py"
    "${CMAKE_CURRENT_BINARY_DIR}/test/baseline_images.py"
    COPYONLY
  )
endif()

add_custom_command(OUTPUT "${CMAKE_CURRENT_BINARY_DIR}/base-images.tgz"
  WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
  # Make sure we have the data files.
  COMMAND "${CMAKE_COMMAND}" --build ${CMAKE_BINARY_DIR} --target data_files
  # Run the webglheadless test, asking to save all images
  COMMAND TEST_SAVE_IMAGE=all "${NPM_EXECUTABLE}" run glci
  # Build examples to make sure that they are available.
  COMMAND "${NPM_EXECUTABLE}" run build-examples
  # Run the examplesheadless test, asking to save all images
  COMMAND TEST_SAVE_IMAGE=all "${NPM_EXECUTABLE}" run examplesci
  # If optipng is available, reduce the size of the images
  # COMMAND bash -c "optipng '${CMAKE_CURRENT_BINARY_DIR}'/images/*.png || true"
  COMMAND bash -c "find '${CMAKE_CURRENT_BINARY_DIR}'/images -name '*.png' -a -not -name '*-test.png' -a -not -name '*-diff.png' -a -not -name '*-base.png' -a -not -name '*-screen.png' -print0 | xargs -0 -n 1 -P 8 optipng || true"
  # Make a tarball of all of the images
  COMMAND tar -zcvf "${CMAKE_CURRENT_BINARY_DIR}/base-images.tgz" --exclude=*-test.png --exclude=*-diff.png --exclude=*-base.png --exclude=*-screen.png -C "${CMAKE_CURRENT_BINARY_DIR}/images" .
  COMMENT "Create baseline images, then tar them into a single file"
  VERBATIM
)

add_custom_target(baseline_images DEPENDS "${CMAKE_CURRENT_BINARY_DIR}/base-images.tgz")

add_test(NAME baseline_images CONFIGURATIONS "baseline_images" COMMAND "${CMAKE_COMMAND}" --build ${CMAKE_BINARY_DIR} --target baseline_images)
set_property(TEST "baseline_images" APPEND PROPERTY ENVIRONMENT "CTEST_IMAGE_PATH=${CMAKE_CURRENT_BINARY_DIR}/images")

if(${ESLINT_TESTS})
  add_test(
    NAME "eslint"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${NPM_EXECUTABLE}" "run" "lint"
  )
  add_test(
    NAME "puglint"
    WORKING_DIRECTORY "${CMAKE_CURRENT_SOURCE_DIR}"
    COMMAND "${NPM_EXECUTABLE}" "run" "puglint"
  )
endif() # ESLINT_TESTS
