file(GLOB_RECURSE SOURCES
    "*.cpp"
    "*.h"
)

add_library(PocketWalker STATIC ${SOURCES})

target_include_directories(PocketWalker PUBLIC
    ${CMAKE_CURRENT_SOURCE_DIR}
)

target_compile_options(PocketWalker PRIVATE
    $<$<CXX_COMPILER_ID:MSVC>:/W3>
    $<$<CXX_COMPILER_ID:MSVC>:/permissive->
)

target_compile_definitions(PocketWalker PRIVATE
    $<$<CONFIG:Debug>:_DEBUG>
    $<$<CONFIG:Release>:NDEBUG>
)

