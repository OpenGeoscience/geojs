set(CTEST_SOURCE_DIRECTORY "$ENV{TRAVIS_BUILD_DIR}")
set(CTEST_BINARY_DIRECTORY "$ENV{TRAVIS_BUILD_DIR}/_build")

include(${CTEST_SOURCE_DIRECTORY}/CTestConfig.cmake)
set(CTEST_SITE "Travis")
set(CTEST_BUILD_NAME "Linux-$ENV{TRAVIS_BRANCH}")
set(CTEST_CMAKE_GENERATOR "Unix Makefiles")
set(coverage_file "${CTEST_SOURCE_DIRECTORY}/dist/cobertura/phantomjs/coverage.xml")

ctest_start("Continuous")
ctest_configure(
  OPTIONS "-DSELENIUM_TESTS=OFF"
)
ctest_build()
ctest_test(PARALLEL_LEVEL 1 RETURN_VALUE res)
if(EXISTS "${coverage_file}")
  file(COPY "${coverage_file}" DESTINATION "${CTEST_BINARY_DIRECTORY}")
  ctest_coverage()
  file(REMOVE ${CTEST_BINARY_DIRECTORY}/coverage.xml)
endif()
ctest_submit()

file(REMOVE "${CTEST_BINARY_DIRECTORY}/test_failed")
if(NOT res EQUAL 0)
  file(WRITE "${CTEST_BINARY_DIRECTORY}/test_failed" "error")
  message(FATAL_ERROR "Test failures occurred.")
endif()
