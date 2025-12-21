cmake_minimum_required(VERSION 3.12)

project(PocketWalker
    VERSION 1.0.0
    LANGUAGES CXX
)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin)
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/lib)

set(SDL_SHARED OFF CACHE BOOL "Build SDL2 as shared library" FORCE)
set(SDL_STATIC ON CACHE BOOL "Build SDL2 as static library" FORCE)

add_subdirectory(external/SDL)
add_subdirectory(external/argparse)

add_subdirectory(PocketWalker)
add_subdirectory(PocketWalker.Desktop)

