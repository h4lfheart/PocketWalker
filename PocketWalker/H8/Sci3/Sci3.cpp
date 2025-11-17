#include "Sci3.h"

void Sci3::StartPacketAccumulator()
{ 
    senderRunning = true;
    packetSenderThread = std::thread([&]
    {
        while (senderRunning)
        {
            std::this_thread::sleep_for(std::chrono::milliseconds(2));

            if (!hasTransmitData) continue;
            if (transmitBuffer.empty()) continue;
                
            std::unique_lock lock(transmitMutex);
                
            auto now = std::chrono::steady_clock::now();
            auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(now - lastTransmitTime);
                
            if (elapsed.count() >= packetTimeout)
            {
               OnTransmitPacket(transmitBuffer);
                    
               transmitBuffer.clear();
               hasTransmitData = false;
            }
                
            lock.unlock();
        }
    });
}

void Sci3::StopPacketAccumulator()
{
    senderRunning = false;
    packetSenderThread.join();
}

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
            std::lock_guard lock(transmitMutex);
            
            transmitBuffer.push_back(transmit);
            
            lastTransmitTime = std::chrono::steady_clock::now();
            hasTransmitData = true;

            status |= Sci3Flags::STATUS_TRANSMIT_EMPTY;
            status |= Sci3Flags::STATUS_TRANSMIT_END;
        }
    }
    
    if (control & Sci3Flags::CONTROL_RECEIVE_ENABLE)
    {
        if (~status & Sci3Flags::STATUS_RECEIVE_FULL)
        {
            std::lock_guard lock(receiveMutex);
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
    std::lock_guard lock(receiveMutex);
    receiveBuffer.push(byte);
}