#include "Lcd.h"

#include <print>

#include "LcdData.h"
#include "../../Ssu/Ssu.h"

void Lcd::Transmit(Ssu* ssu)
{
    switch (state) {
    case Waiting:
        {
            if (ssu->transmit >= 0x0 && ssu->transmit <= 0xF) // low column
            {
                column &= 0xF0;
                column |= ssu->transmit & 0xF;
                offset = 0;
            }
            else if (ssu->transmit >= 0x10 && ssu->transmit <= 0x17) // high column
            {
                column &= 0xF;
                column |= (ssu->transmit & 0b111) << 4;
                offset = 0;
            }
            else if (ssu->transmit >= 0xB0 && ssu->transmit <= 0xBF) // page
            {
                page = ssu->transmit & 0xF;
            }
            else if (ssu->transmit == 0x81) // contrast
            {
                state = GettingContrast;
            }
            break;
        }
    case GettingContrast:
        {
            contrast = ssu->transmit;
            state = Waiting;
            break;
        }
    }

    ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
    ssu->status |= SsuFlags::Status::TRANSMIT_END;
}

void Lcd::Tick()
{
    const auto buffer = new uint8_t[WIDTH * HEIGHT * 3]();

    for (int y = 0; y < HEIGHT; ++y)
    {
        const int stripeOffset = y % 8;
        const int row = y / 8;
        const int rowOffset = row * WIDTH * COLUMN_SIZE;
        const int bufferOffset = bufferIndex * WIDTH * BUFFER_SEPARATION;

        for (int x = 0; x < WIDTH; ++x)
        {
            const int baseIndex = 2 * x + rowOffset + bufferOffset;

            const uint8_t firstByte = memory->ReadByte(baseIndex);
            const uint8_t secondByte = memory->ReadByte(baseIndex + 1);

            const uint8_t firstBit = (firstByte >> stripeOffset) & 1;
            const uint8_t secondBit = (secondByte >> stripeOffset) & 1;

            const uint8_t paletteIndex = (firstBit << 1) | secondBit;
            const uint32_t color = PALETTE[paletteIndex];

            const int baseOffset = (y * WIDTH + x) * 3;
            buffer[baseOffset]     = (color >> 16) & 0xFF;
            buffer[baseOffset + 1] = (color >> 8)  & 0xFF;
            buffer[baseOffset + 2] = (color >> 0)  & 0xFF;
        }
    }

    bufferIndex = bufferIndex ? 0 : 1;

    onDraw(buffer);
}

bool Lcd::CanExecute(Ssu* ssu)
{
    return !(ssu->GetPort(SsuFlags::Port::PORT_1) & LcdData::PIN);
}


