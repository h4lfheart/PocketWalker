#include "PocketWalker.h"

PocketWalker::PocketWalker(uint8_t* ramBuffer, uint8_t* eepromBuffer): board(Board(ramBuffer, eepromBuffer))
{
    
}

void PocketWalker::Run()
{
    while (this->running)
    {
        const uint8_t cpuCycles = this->board.cpu->Step();
        for (auto i = 0; i < cpuCycles; i++)
        {
            this->cycles++;
            this->board.Tick(this->cycles);
        }
    }
}
