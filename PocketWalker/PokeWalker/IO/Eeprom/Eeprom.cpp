#include "Eeprom.h"

#include "../../../H8/Ssu/Ssu.h"
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
            ssu->receive = memory->ReadByte(((highAddress << 8) | lowAddress) + offset);
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
            else if (ssu->transmit == EepromFlags::Commands::WRITE_MEMORY)
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
            memory->WriteByte(((highAddress << 8) | lowAddress) + offset, ssu->transmit);
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
