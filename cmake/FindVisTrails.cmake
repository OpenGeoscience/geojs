include(FindPackageHandleStandardArgs)

# Look for vistrails
find_path(VisTrails_DIR vistrails_server.py
  NO_DEFAULT_PATH
  PATH_SUFFIXES vistrails
)
if(VisTrails_DIR-NOTFOUND)
  message(FATAL_ERROR "Package VisTrails not found")
endif()

find_package_handle_standard_args(VisTrails DEFAULT_MSG VisTrails_DIR)
