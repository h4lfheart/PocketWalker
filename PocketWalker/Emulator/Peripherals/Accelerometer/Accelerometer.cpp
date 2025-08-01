#include "Accelerometer.h"

void Accelerometer::TransmitAndReceive(Ssu* ssu)
{
    switch (state)
    {
    case GettingAddress:
        {
            address = ssu->transmit;
            offset = 0;
            state = GettingData;

            ssu->status |= SsuFlags::Status::RECEIVE_FULL;
            break;
        }
    case GettingData:
        {
            ssu->receive = memory->ReadByte(address);
            offset++;

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
            state = GettingData;
            break;
        }
    case GettingData:
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
