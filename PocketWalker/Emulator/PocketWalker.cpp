#include "PocketWalker.h"

PocketWalker::PocketWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer): board(new Board(ramBuffer, eepromBuffer))
{
    
}

uint8_t PocketWalker::Step()
{
    const uint8_t cpuCycles = board->cpu->Step();
    for (auto i = 0; i < cpuCycles; i++)
    {
        cycles++;
        board->Tick(this->cycles);
    }

    return cpuCycles;
}
