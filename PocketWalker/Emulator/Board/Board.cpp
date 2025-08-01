
#include "Board.h"


void Board::Tick(uint64_t cycles)
{
    if (cycles % ssu->clockRate == 0)
    {
        ssu->Tick();
    }

    if (cycles % (Cpu::TICKS / Lcd::TICKS) == 0)
    {
        lcd->Tick();
    }
}
