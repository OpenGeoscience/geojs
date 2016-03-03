## This file should be placed in the root directory of your project.
## Then modify the CMakeLists.txt file in the root directory of your
## project to incorporate the testing dashboard.
##
## # The following are required to submit to the CDash dashboard:
##   ENABLE_TESTING()
##   INCLUDE(CTest)

set(CTEST_PROJECT_NAME "geojs")
set(CTEST_NIGHTLY_START_TIME "00:00:00 EST")

set(CTEST_DROP_METHOD "http")
set(CTEST_DROP_SITE "my.cdash.org")
set(CTEST_DROP_LOCATION "/submit.php?project=geojs")
set(CTEST_DROP_SITE_CDASH TRUE)

if(DEFINED CTEST_BINARY_DIRECTORY AND NOT EXISTS "${CTEST_BINARY_DIRECTORY}/build_notes.json")
  file(WRITE "${CTEST_BINARY_DIRECTORY}/build_notes.json" "")
endif()
set(CTEST_NOTES_FILES "${CTEST_BINARY_DIRECTORY}/build_notes.json")
