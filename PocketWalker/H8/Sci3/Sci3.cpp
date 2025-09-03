#include "Sci3.h"

void Sci3::Tick()
{
    if (~control & Sci3Flags::CONTROL_TRANSMIT_ENABLE)
    {
        status |= Sci3Flags::STATUS_TRANSMIT_EMPTY;
    }

    if (control & Sci3Flags::CONTROL_TRANSMIT_ENABLE)
    {
        if (~status & Sci3Flags::STATUS_TRANSMIT_EMPTY)
        {
            OnTransmitData(transmit);

            status |= Sci3Flags::STATUS_TRANSMIT_EMPTY;
            status |= Sci3Flags::STATUS_TRANSMIT_END;
        }
    }

    
    if (control & Sci3Flags::CONTROL_RECEIVE_ENABLE)
    {
        if (~status & Sci3Flags::STATUS_RECEIVE_FULL)
        {
            if (!receiveBuffer.empty())
            {
                const uint8_t receiveValue = receiveBuffer.front();
                receiveBuffer.pop();
                
                receive = receiveValue;
                status |= Sci3Flags::STATUS_RECEIVE_FULL;
            }
        }
    }
}

void Sci3::Receive(const uint8_t byte)
{
    receiveBuffer.push(byte);
}
