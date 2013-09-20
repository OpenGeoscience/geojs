include(FindPackageHandleStandardArgs)

if(NOT UglifyJS_EXECUTABLE)
    find_program(UglifyJS_EXECUTABLE uglifyjs)
endif()

find_package_handle_standard_args(UglifyJS DEFAULT_MSG UglifyJS_EXECUTABLE)
