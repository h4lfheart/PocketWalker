
#include "Board.h"


void Board::Tick(uint64_t cycles)
{
    if (cycles % ssu->clockRate == 0)
    {
        ssu->Tick();
    }
}
