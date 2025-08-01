#include "Eeprom.h"

#include "../../Ssu/Ssu.h"

namespace EepromFlags
{
    enum Commands : uint8_t
    {
        WRITE_ENABLE = 0b00000110,
        WRITE_DISABLE = 0b00000100,
        READ_STATUS = 0b00000101,
        WRITE_STATUS = 0b00000001,
        READ_MEMORY = 0b00000011,
        WRITE_MEMORY = 0b00000010
    };

    enum Status : uint8_t
    {
        WRITE_UNLOCK = 0b00000010
    };
}

void Eeprom::TransmitAndReceive(Ssu* ssu)
{
    switch (state)
    {
    case Waiting:
        {
            if (ssu->transmit == EepromFlags::Commands::READ_MEMORY)
            {
                state = GettingHighAddress;
            }
            else if (ssu->transmit == EepromFlags::Commands::READ_STATUS)
            {
                state = GettingStatus;
            }
            break;
        }
    case GettingStatus:
        {
            ssu->receive = status;
            ssu->status |= SsuFlags::Status::TRANSMIT_END;
            break;
        }
    case GettingHighAddress:
        {
            highAddress = ssu->transmit;
            state = GettingLowAddress;
            break;
        }
    case GettingLowAddress:
        {
            lowAddress = ssu->transmit;
            state = GettingBytes;
            break;
        }
    case GettingBytes:
        {
            ssu->receive = memory->ReadByte((highAddress << 8 | lowAddress) + offset);
            offset++;
            
            ssu->status |= SsuFlags::Status::TRANSMIT_END;
            break;
        }
    }

    ssu->status |= SsuFlags::Status::RECEIVE_FULL;
    ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
}

void Eeprom::Transmit(Ssu* ssu)
{
    switch (state)
    {
    case Waiting:
        {
            if (ssu->transmit == EepromFlags::Commands::WRITE_ENABLE)
            {
                status |= EepromFlags::Status::WRITE_UNLOCK;
                ssu->status |= SsuFlags::Status::TRANSMIT_END;
            }
            else if (ssu->transmit == EepromFlags::Commands::READ_MEMORY)
            {
                state = GettingHighAddress;
            }
            break;
        }
    case GettingHighAddress:
        {
            highAddress = ssu->transmit;
            state = GettingLowAddress;
            break;
        }
    case GettingLowAddress:
        {
            lowAddress = ssu->transmit;
            state = GettingBytes;
            break;
        }
    case GettingBytes:
        {
            memory->WriteByte((highAddress << 8 | lowAddress) + offset, ssu->transmit);
            offset++;
            offset %= 128;
            
            ssu->status |= SsuFlags::Status::TRANSMIT_END;
            break;
        }
    }

    ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
}

void Eeprom::Reset()
{
    state = Waiting;
    offset = 0;
}
