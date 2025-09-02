#include "LcdData.h"

#include <print>

#include "../../../PokeWalker/IO/Lcd/Lcd.h"
#include "../../../H8/Ssu/Ssu.h"

void LcdData::Transmit(Ssu* ssu)
{
    const uint16_t address = (lcd->page * Lcd::TOTAL_COLUMNS * Lcd::COLUMN_SIZE) + (lcd->column * Lcd::COLUMN_SIZE) + lcd->offset;
    lcd->memory->WriteByte(address, ssu->transmit);

    if (lcd->offset == 1)
    {
        lcd->column++;
    }

    lcd->offset++;
    lcd->offset %= 2;

    ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
    ssu->status |= SsuFlags::Status::TRANSMIT_END;
}
