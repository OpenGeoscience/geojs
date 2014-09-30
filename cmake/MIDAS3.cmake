# - Configure a project for downloading test data from a MIDAS server
# Include this module in the top CMakeLists.txt file of a project to
# enable downloading test data from MIDAS. Requires CTest module.
#   project(MyProject)
#   ...
#   include(CTest)
#   include(MIDAS3)
#
# To use this module, set the following variable in your script:
#   MIDAS_REST_URL - URL of the MIDAS server's REST API
# Other optional variables:
#   MIDAS_DATA_DIR         - Where to place downloaded files
#                          - Defaults to PROJECT_BINARY_DIR/MIDAS_Data
#   MIDAS_KEY_DIR          - Where the key files are located
#                          - Defaults to PROJECT_SOURCE_DIR/MIDAS_Keys
#   MIDAS_DOWNLOAD_TIMEOUT - Timeout for download stage (default 0)
#  ---------------------- Authentication -------------------------
# For authenticated access, you must also have the following variables set
#   MIDAS_USER             - The email of the user to authenticate as
#   MIDAS_DEFAULT_API_KEY  - The user's Default api key
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

  set(fetch_scripts_dir "${CMAKE_CURRENT_BINARY_DIR}/MIDAS_FetchScripts")
  file(MAKE_DIRECTORY "${fetch_scripts_dir}")

  if(NOT DEFINED MIDAS_DOWNLOAD_TIMEOUT)
    set(MIDAS_DOWNLOAD_TIMEOUT_STR "")
  else(NOT DEFINED MIDAS_DOWNLOAD_TIMEOUT)
    set(MIDAS_DOWNLOAD_TIMEOUT_STR "TIMEOUT ${MIDAS_DOWNLOAD_TIMEOUT}")
  endif(NOT DEFINED MIDAS_DOWNLOAD_TIMEOUT)

  file(GLOB keyfiles "${MIDAS_KEY_DIR}/*.md5") 

  set(downloadFiles "")

  foreach(keyfile ${keyfiles})
    _process_keyfile(${keyfile} 1)
  endforeach()

  set(MIDAS_DOWNLOAD_FILES "${downloadFiles}" PARENT_SCOPE)
endfunction(add_download_target)

# Helper macro to write the download scripts for MIDAS.*{} arguments
macro(_process_keyfile keyFile extractTgz)


  # Split up the checksum extension from the real filename
  string(REGEX MATCH "\\.[^\\.]*$" hash_alg "${keyFile}")
  string(REGEX REPLACE "\\.[^\\.]*$" "" base_file "${keyFile}")
  string(REPLACE "." "" hash_alg "${hash_alg}")
  string(TOUPPER "${hash_alg}" hash_alg)
  # get_filename_component(base_filepath "${base_file}" PATH)
  get_filename_component(base_filename "${base_file}" NAME)
  get_filename_component(base_fileext  "${base_file}" EXT)

  # Resolve file location
  if(NOT EXISTS "${keyFile}")
    message(FATAL_ERROR "MIDAS key file ${keyFile} does not exist.")
  endif(NOT EXISTS "${keyFile}")

  # Obtain the checksum
  file(READ "${keyFile}" checksum)
  string(STRIP ${checksum} checksum)

  # Write the test script file for downloading
  if(UNIX)
    set(cmake_symlink create_symlink)
  else()
    set(cmake_symlink copy) # Windows has no symlinks; copy instead.
  endif()
  file(WRITE "${fetch_scripts_dir}/fetch_${checksum}_${base_filename}.cmake"
# Start file content
"message(STATUS \"Data is here: ${MIDAS_REST_URL}?method=midas.bitstream.download?checksum=${checksum}&algorithm=${hash_alg}\")
set(tokenArg \"\")
if(NOT \"${MIDAS_USER}\" STREQUAL \"\" AND NOT \"${MIDAS_DEFAULT_API_KEY}\" STREQUAL \"\")
  file(DOWNLOAD \"${MIDAS_REST_URL}?method=midas.login&email=${MIDAS_USER}&appname=Default&apikey=${MIDAS_DEFAULT_API_KEY}\" \"${fetch_scripts_dir}/MIDASToken.txt\" ${MIDAS_DOWNLOAD_TIMEOUT_STR} STATUS status)
  list(GET status 0 exitCode)
  list(GET status 1 errMsg)
  if(NOT exitCode EQUAL 0)
    message(FATAL_ERROR \"Error authenticating to MIDAS server: \${errMsg}\")
  endif(NOT exitCode EQUAL 0)
  file(READ \"${fetch_scripts_dir}/MIDASToken.txt\" resp)
  file(REMOVE \"${fetch_scripts_dir}/MIDASToken.txt\")
  string(REGEX REPLACE \".*token\\\":\\\"(.*)\\\".*\" \"\\\\1\" token \${resp})
  string(LENGTH \${token} tokenlength)
  if(tokenlength EQUAL 40)
    set(tokenArg \"&token=\${token}\")
  else()
    message(FATAL_ERROR \"Invalid authentication token: \${token}\")
  endif()
endif()
file(DOWNLOAD \"${MIDAS_REST_URL}?method=midas.bitstream.download&checksum=${checksum}&algorithm=${hash_alg}\${tokenArg}\" \"${MIDAS_DATA_DIR}/${base_filename}\" ${MIDAS_DOWNLOAD_TIMEOUT_STR} STATUS status)
list(GET status 0 exitCode)
list(GET status 1 errMsg)
if(NOT exitCode EQUAL 0)
  file(REMOVE \"${MIDAS_DATA_DIR}/${base_filename}\")
  message(FATAL_ERROR \"Error downloading ${checksum}: \${errMsg}\")
endif(NOT exitCode EQUAL 0)

execute_process(COMMAND \"${CMAKE_COMMAND}\" -E md5sum \"${MIDAS_DATA_DIR}/${base_filename}\" OUTPUT_VARIABLE output)
string(SUBSTRING \${output} 0 32 computedChecksum)

if(NOT computedChecksum STREQUAL ${checksum})
  file(READ \"${MIDAS_DATA_DIR}/${base_filename}\" serverResponse)
  file(REMOVE \"${MIDAS_DATA_DIR}/${base_filename}\")
  message(FATAL_ERROR \"Error: Computed checksum (\${computedChecksum}) did not match expected (${checksum}). Server response: \${serverResponse}\")
endif(NOT computedChecksum STREQUAL ${checksum})
")
# End file content

if("${base_fileext}" STREQUAL ".tgz")
    file(APPEND "${fetch_scripts_dir}/fetch_${checksum}_${base_filename}.cmake"
        # Start file content
        "# Extract the contents of the tgz
        get_filename_component(dirName \"${base_filename}\" NAME_WE)
        file(MAKE_DIRECTORY \"${MIDAS_DATA_DIR}/\${dirName}\")
        execute_process(COMMAND \"${CMAKE_COMMAND}\" -E tar xzf \"${MIDAS_DATA_DIR}/${base_filename}\"
                        WORKING_DIRECTORY \"${MIDAS_DATA_DIR}/\${dirName}\")
        "
        # End file content
    )
endif()

  add_custom_command(OUTPUT "${MIDAS_DATA_DIR}/${base_filename}"
    COMMAND ${CMAKE_COMMAND} -P "${fetch_scripts_dir}/fetch_${checksum}_${base_filename}.cmake"
    DEPENDS "${keyfile}"
    COMMENT "Downloading ${base_filename}"
  )

  list(APPEND downloadFiles "${MIDAS_DATA_DIR}/${base_filename}")
endmacro(_process_keyfile)
