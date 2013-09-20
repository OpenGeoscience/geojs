function(cat _in _out)
  file(READ ${_in} _content)
  file(APPEND ${_out} "${_content}")
endfunction()

file(WRITE "${CAT_OUTPUT_FILE}" "")

set(_files ${CAT_FILES})
foreach(_file ${_files})
  cat("${_file}" "${CAT_OUTPUT_FILE}")
endforeach()
