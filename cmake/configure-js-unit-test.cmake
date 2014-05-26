file(READ "${SOURCE_FILE}" TEST_SOURCE)
configure_file(
    ${SOURCE_DIR}/testing/test-runners/jasmine-runner.html.in
    ${TEST_HTML}
)
