include(FindPackageHandleStandardArgs)

if(NOT JSDuck_EXECUTABLE)
    # Look for an executable called "jsduck".
    find_program(JSDuck_EXECUTABLE jsduck)

    # If it can't be found, try to construct the java commandline.
    if(NOT JSDuck_EXECUTABLE)
        find_package(Java REQUIRED)

        if(NOT JSDuck_PATH)
            find_path(JSDuck_PATH jsrun.jar)
        endif()

        set(JSDuck_TEMPLATEPATH "${JSDuck_PATH}/templates/jsduck")
        set(JSDuck_ARGS -Djsduck.dir=${JSDuck_PATH} -Djsduck.template.dir=${JSDuck_TEMPLATEPATH} -jar ${JSDuck_PATH}/jsrun.jar ${JSDuck_PATH}/app/run.js)
        set(JSDuck_TEST_EXECUTABLE ${Java_JAVA_EXECUTABLE} ${JSDuck_ARGS})

        # Test the resulting "executable" by running with the help flag and
        # observing the return value.
        execute_process(
            COMMAND ${JSDuck_TEST_EXECUTABLE} -h
            RESULT_VARIABLE success
            OUTPUT_QUIET
            ERROR_QUIET)

        if(NOT ${success} EQUAL 0)
            string(REPLACE ";" " " cmdline "${JSDuck_TEST_EXECUTABLE}")
            message(WARNING "Could not determine invocation for JSDuck (tried \"${cmdline}\") - please edit JSDuck_EXECUTABLE by hand or set JSDuck_PATH to the location you extracted the jsduck zip file.")
        else()
            set(JSDuck_EXECUTABLE ${JSDuck_TEST_EXECUTABLE} CACHE FILE "jsduck executable" FORCE)
        endif()
    endif()

endif()

find_package_handle_standard_args(JSDuck DEFAULT_MSG JSDuck_PATH JSDuck_EXECUTABLE JSDuck_TEMPLATEPATH)
