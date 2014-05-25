set(alljs ${CMAKE_BINARY_DIR}/test-cases/js-unit-tests/all-js-unit-tests.js)

file(WRITE ${alljs} "")
foreach(f IN LISTS JS_UNIT_TEST_CASES)
    file(READ "${f}" js)
    file(APPEND ${alljs} "${js}")
endforeach()

file(READ ${alljs} TEST_SOURCE)
configure_file(
    ${SOURCE_DIR}/testing/test-runners/coverage-runner.html.in
    ${DEPLOY_DIR}/test/js-coverage/geojs-coverage.html
)
