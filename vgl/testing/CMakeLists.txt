set(tests
  drawTest1.html
)

# Copy testing paths / files to the deployment directory
set(test_targets)
foreach(m ${tests})
    get_filename_component(filenamews ${CMAKE_CURRENT_SOURCE_DIR}/${m}
      NAME_WE)
    set(outdir ${deploy_dir}/web/tests/vgl/${filenamews}/index.html)
    add_custom_command(
        OUTPUT ${outdir}
        COMMAND ${CMAKE_COMMAND} -E copy ${CMAKE_CURRENT_SOURCE_DIR}/${m}
        ${CMAKE_BINARY_DIR}/${outdir}
    )
    list(APPEND test_targets ${outdir})
endforeach()

add_custom_target(
  vgl_tests
  ALL
  DEPENDS ${test_targets}
)
