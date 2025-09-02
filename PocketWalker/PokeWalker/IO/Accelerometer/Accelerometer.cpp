#include "Accelerometer.h"

#include "../../../H8/Ssu/Ssu.h"

void Accelerometer::TransmitAndReceive(Ssu* ssu)
{
    switch (state)
    {
    case GettingAddress:
        {
            address = ssu->transmit & 0x7F;
            offset = 0;
            state = (ssu->transmit >> 7) ? ReadingData : WritingData;

            ssu->status |= SsuFlags::Status::RECEIVE_FULL;
            break;
        }
    case ReadingData:
        {
            ssu->receive = memory->ReadByte(address + offset);
            offset++;

            ssu->status |= SsuFlags::Status::RECEIVE_FULL;
            ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
            ssu->status |= SsuFlags::Status::TRANSMIT_END;
            break;
        }
    case WritingData:
        {
            memory->WriteByte(address, ssu->transmit);

            ssu->status |= SsuFlags::Status::RECEIVE_FULL;
            ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
            ssu->status |= SsuFlags::Status::TRANSMIT_END;
            break;
        }
    }
}

void Accelerometer::Transmit(Ssu* ssu)
{
    switch (state)
    {
    case GettingAddress:
        {
            address = ssu->transmit;
            state = WritingData;
            break;
        }
    case WritingData:
        {
            memory->WriteByte(address, ssu->transmit);

            ssu->status |= SsuFlags::Status::TRANSMIT_EMPTY;
            ssu->status |= SsuFlags::Status::TRANSMIT_END;
            break;
        }
    }
}

void Accelerometer::Reset()
{
    state = GettingAddress;
    offset = 0;
}
