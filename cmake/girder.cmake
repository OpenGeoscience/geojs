# - Configure a project for downloading test data from a Girder server
# Include this module in the top CMakeLists.txt file of a project to
# enable downloading test data from Girder. Requires CTest module.
#   project(MyProject)
#   ...
#   include(CTest)
#   include(Girder3)
#
# To use this module, set the following variable in your script:
#   Girder_REST_URL - URL of the Girder server's REST API
# Other optional variables:
#   Girder_DATA_DIR         - Where to place downloaded files
#                          - Defaults to PROJECT_BINARY_DIR/Girder_Data
#   Girder_KEY_DIR          - Where the key files are located
#                          - Defaults to PROJECT_SOURCE_DIR/Girder_Keys
#   Girder_DOWNLOAD_TIMEOUT - Timeout for download stage (default 0)
#  ---------------------- Authentication -------------------------
# For authenticated access, you must also have the following variables set
#   Girder_USER             - The email of the user to authenticate as
#   Girder_DEFAULT_API_KEY  - The user's Default api key
#
#=============================================================================
# Copyright 2010 Kitware, Inc.
#
# Distributed under the OSI-approved BSD License (the "License");
# see accompanying file Copyright.txt for details.
#
# This software is distributed WITHOUT ANY WARRANTY; without even the
# implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# See the License for more information.
#=============================================================================

function(add_download_target)

  set(fetch_scripts_dir "${CMAKE_CURRENT_BINARY_DIR}/Girder_FetchScripts")
  file(MAKE_DIRECTORY "${fetch_scripts_dir}")

  if(NOT DEFINED Girder_DOWNLOAD_TIMEOUT)
    set(Girder_DOWNLOAD_TIMEOUT_STR "")
  else(NOT DEFINED Girder_DOWNLOAD_TIMEOUT)
    set(Girder_DOWNLOAD_TIMEOUT_STR "TIMEOUT ${Girder_DOWNLOAD_TIMEOUT}")
  endif(NOT DEFINED Girder_DOWNLOAD_TIMEOUT)

  file(GLOB urlfiles "${Girder_KEY_DIR}/*.url") 

  set(downloadFiles "")

  foreach(urlfile ${urlfiles})
    _process_urlfile(${urlfile} 1)
  endforeach()

  set(Girder_DOWNLOAD_FILES "${downloadFiles}" PARENT_SCOPE)
endfunction(add_download_target)

# Helper macro to write the download scripts for Girder.*{} arguments
macro(_process_urlfile urlFile extractTgz)


  # Split up the checksum extension from the real filename
  string(REGEX REPLACE "\\.[^\\.]*$" "" base_file "${urlFile}")
  get_filename_component(base_filename "${base_file}" NAME)
  get_filename_component(base_fileext  "${base_file}" EXT)
  string(REGEX REPLACE "\\.url$" ".md5" keyFile "${urlFile}")
  set(checksum "X")

  # Resolve file location
  if(EXISTS "${keyFile}")

    # Obtain the checksum
    file(READ "${keyFile}" checksum)
    string(STRIP ${checksum} checksum)

  endif(EXISTS "${keyFile}")

  file(READ "${urlFile}" url)
  string(STRIP ${url} url)

  # Write the test script file for downloading
  if(UNIX)
    set(cmake_symlink create_symlink)
  else()
    set(cmake_symlink copy) # Windows has no symlinks; copy instead.
  endif()
  file(WRITE "${fetch_scripts_dir}/fetch_${checksum}_${base_filename}.cmake"

# Start file content
"message(STATUS \"Data is here: ${url}\")
file(DOWNLOAD \"${url}\" \"${Girder_DATA_DIR}/${base_filename}\" ${Girder_DOWNLOAD_TIMEOUT_STR} STATUS status)
list(GET status 0 exitCode)
list(GET status 1 errMsg)
if(NOT exitCode EQUAL 0)
  file(REMOVE \"${Girder_DATA_DIR}/${base_filename}\")
  message(FATAL_ERROR \"Error downloading ${base_filename}: \${errMsg}\")
endif(NOT exitCode EQUAL 0)

execute_process(COMMAND \"${CMAKE_COMMAND}\" -E md5sum \"${Girder_DATA_DIR}/${base_filename}\" OUTPUT_VARIABLE output)
string(SUBSTRING \${output} 0 32 computedChecksum)

if((NOT ${checksum} STREQUAL X) AND (NOT computedChecksum STREQUAL ${checksum}))
  file(READ \"${Girder_DATA_DIR}/${base_filename}\" serverResponse)
  file(REMOVE \"${Girder_DATA_DIR}/${base_filename}\")
  message(FATAL_ERROR \"Error: Computed checksum (\${computedChecksum}) did not match expected (${checksum}). Server response: \${serverResponse}\")
endif((NOT ${checksum} STREQUAL X) AND (NOT computedChecksum STREQUAL ${checksum}))
")
# End file content

if("${base_fileext}" STREQUAL ".tgz")
    file(APPEND "${fetch_scripts_dir}/fetch_${checksum}_${base_filename}.cmake"
        # Start file content
        "# Extract the contents of the tgz
        get_filename_component(dirName \"${base_filename}\" NAME_WE)
        file(MAKE_DIRECTORY \"${Girder_DATA_DIR}/\${dirName}\")
        execute_process(COMMAND \"${CMAKE_COMMAND}\" -E tar xzf \"${Girder_DATA_DIR}/${base_filename}\"
                        WORKING_DIRECTORY \"${Girder_DATA_DIR}/\${dirName}\")
        "
        # End file content
    )
endif()

  add_custom_command(OUTPUT "${Girder_DATA_DIR}/${base_filename}"
    COMMAND ${CMAKE_COMMAND} -P "${fetch_scripts_dir}/fetch_${checksum}_${base_filename}.cmake"
    DEPENDS "${urlfile}"
    COMMENT "Downloading ${base_filename}"
  )

  list(APPEND downloadFiles "${Girder_DATA_DIR}/${base_filename}")
endmacro(_process_urlfile)
