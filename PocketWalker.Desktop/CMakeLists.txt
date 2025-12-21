file(GLOB_RECURSE SOURCES
    "*.cpp"
    "*.h"
)

if(WIN32)
    list(APPEND SOURCES "AppIcon.rc")
endif()

add_executable(PocketWalker.Desktop ${SOURCES})

set_target_properties(PocketWalker.Desktop PROPERTIES
    OUTPUT_NAME PocketWalker
)

target_link_libraries(PocketWalker.Desktop PRIVATE
    PocketWalker
    SDL2::SDL2
    argparse::argparse
)

target_include_directories(PocketWalker.Desktop PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CMAKE_SOURCE_DIR}/external/SDL/include
    ${CMAKE_SOURCE_DIR}/external/argparse/include
    ${CMAKE_SOURCE_DIR}/PocketWalker
)

target_compile_options(PocketWalker.Desktop PRIVATE
    $<$<CXX_COMPILER_ID:MSVC>:/W3>
    $<$<CXX_COMPILER_ID:MSVC>:/permissive->
)

target_compile_definitions(PocketWalker.Desktop PRIVATE
    SDL_MAIN_HANDLED
    NOMINMAX
    SDL_STATIC_LIB
    $<$<CONFIG:Debug>:_DEBUG>
    $<$<CONFIG:Release>:NDEBUG>
)

add_custom_command(TARGET PocketWalker.Desktop POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory 
        "$<$<CONFIG:Release>:${CMAKE_SOURCE_DIR}/release>$<$<CONFIG:Debug>:${CMAKE_SOURCE_DIR}/debug>"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different 
        "$<TARGET_FILE:PocketWalker.Desktop>"
        "$<$<CONFIG:Release>:${CMAKE_SOURCE_DIR}/release>$<$<CONFIG:Debug>:${CMAKE_SOURCE_DIR}/debug>/$<TARGET_FILE_NAME:PocketWalker.Desktop>"
    COMMENT "Copying executable to release/debug folder"
)

