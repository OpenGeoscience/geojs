include(FindPackageHandleStandardArgs)

if(NOT JSLint_EXECUTABLE)
    find_program(JSLint_EXECUTABLE jslint)
endif()

find_package_handle_standard_args(JSLint DEFAULT_MSG JSLint_EXECUTABLE)
