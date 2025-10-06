#include "Lcd.h"

#include <print>

#include "../../../H8/Ssu/Ssu.h"

void Lcd::Transmit(Ssu* ssu)
{
    // data mode
    if (IsDataMode(ssu))
    {
        const uint16_t address = (page * TOTAL_COLUMNS * COLUMN_SIZE) + (column * COLUMN_SIZE) + offset;
        memory->WriteByte(address, ssu->transmit);

        if (offset == 1)
        {
            column++;
        }

        offset++;
        offset %= 2;

        ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
        ssu->status |= SsuFlags::Status::TRANSMIT_END;
    }
    else
    {

        const uint8_t command = ssu->transmit;
        switch (state) {
        case Waiting:
            {
                if (command <= 0xF) // low column
                {
                    column &= 0xF0;
                    column |= command & 0xF;
                    offset = 0;
                }
                else if (command >= 0x10 && command <= 0x17) // high column
                {
                    column &= 0xF;
                    column |= (command & 0b111) << 4;
                    offset = 0;
                }
                else if (command >= 0x40 && command <= 0x43)
                {
                    state = PageOffset;
                }
                else if (command >= 0xB0 && command <= 0xBF) // page
                {
                    page = command & 0xF;
                }
                else if (command == 0x81)
                {
                    state = Contrast;
                }
                else if (command == 0xA9)
                {
                    powerSaveMode = true;
                }
                else if (command == 0xE1)
                {
                    powerSaveMode = false;
                }
                else if (command == 0xE2) // reset command
                {
                    column = 0;
                    offset = 0;
                    page = 0;
                    contrast = 20;
                    pageOffset = 0;
                    powerSaveMode = false;
                }
                break;
            }
        case Contrast:
            {
                contrast = command;
                state = Waiting;
                break;
            }
        case PageOffset:
            {
                pageOffset = command / 8;
                state = Waiting;
                break;
            }
        }

        ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
        ssu->status |= SsuFlags::Status::TRANSMIT_END;
    }
}

void Lcd::TransmitAndReceive(Ssu* ssu)
{
    Transmit(ssu);

    ssu->status |= SsuFlags::Status::RECEIVE_FULL;
}

void Lcd::Tick()
{
    constexpr size_t bufferSize = WIDTH * HEIGHT;
    const auto buffer = new uint8_t[bufferSize]();

    if (!powerSaveMode)
    {
        for (uint8_t y = 0; y < HEIGHT; y++)
        {
            const int bitOffset = y % 8;
            const int pixelPage = y / 8 + pageOffset;
            const int pixelPageOffset = pixelPage * TOTAL_COLUMNS * COLUMN_SIZE;

            for (uint8_t x = 0; x < WIDTH; x++)
            {
                const int baseIndex = COLUMN_SIZE * x + pixelPageOffset;

                const uint8_t firstByte = memory->ReadByte(baseIndex);
                const uint8_t secondByte = memory->ReadByte(baseIndex + 1);

                const uint8_t firstBit = (firstByte >> bitOffset) & 1;
                const uint8_t secondBit = (secondByte >> bitOffset) & 1;

                const uint8_t paletteIndex = (firstBit << 1) | secondBit;

                const int bufferIndex = y * WIDTH + x;
                buffer[bufferIndex] = paletteIndex;
            }
        }
    }
    else
    {
        std::memset(buffer, 0, bufferSize); // Fill with palette index 0 for power save mode
    }

    OnDraw(LcdInformation(buffer, contrast - 20));
}

bool Lcd::IsDataMode(Ssu* ssu)
{
    // low is command, high is data
    return ssu->GetPort(Ssu::Port::PORT_1) & Ssu::PIN_1;
}

