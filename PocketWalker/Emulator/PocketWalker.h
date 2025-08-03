#pragma once
#include <cstdint>

#include "Board/Board.h"

class PocketWalker
{
public:
    PocketWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer);

    void Step();

    Board* board;
    uint64_t cycles;
};
