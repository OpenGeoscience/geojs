include(FindPackageHandleStandardArgs)

if(NOT PHANTOMJS_EXECUTABLE)
    find_program(PHANTOMJS_EXECUTABLE phantomjs)
endif()

find_package_handle_standard_args(PhantomJS DEFAULT_MSG PHANTOMJS_EXECUTABLE)
