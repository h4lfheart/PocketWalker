#pragma once
#include <cstdint>
#include <mutex>
#include <queue>
#include <vector>
#include <chrono>
#include <thread>
#include <atomic>
#include <print>

#include "../../Utilities/EventHandler.h"
#include "../Board/Component.h"
#include "../Memory/Memory.h"
#include "../Memory/MemoryAccessor.h"

class Memory;

namespace Sci3Flags
{
    enum Control : uint8_t
    {
        CONTROL_TRANSMIT_INTERRUPT_ENABLE = 1 << 7,
        CONTROL_RECEIVE_INTERRUPT_ENABLE = 1 << 6,
        CONTROL_TRANSMIT_ENABLE = 1 << 5,
        CONTROL_RECEIVE_ENABLE = 1 << 4,
    };

    enum Status : uint8_t
    {
        STATUS_TRANSMIT_EMPTY = 1 << 7,
        STATUS_RECEIVE_FULL = 1 << 6,
        STATUS_TRANSMIT_END = 1 << 2
    };
}

class Sci3 : public Component
{
public:
    Sci3(Memory* ram) : ram(ram),
        control(ram->CreateAccessor<uint8_t>(CONTROL_ADDR)),
        status(ram->CreateAccessor<uint8_t>(STATUS_ADDR)),
        transmit(ram->CreateAccessor<uint8_t>(TRANSMIT_ADDR)),
        receive(ram->CreateAccessor<uint8_t>(RECEIVE_ADDR))
    {
        ram->OnRead(RECEIVE_ADDR, [this](uint8_t)
        {
            status &= ~Sci3Flags::STATUS_RECEIVE_FULL;
        });
        
        ram->OnWrite(TRANSMIT_ADDR, [this](uint8_t)
        {
            status &= ~Sci3Flags::STATUS_TRANSMIT_END;
            status &= ~Sci3Flags::STATUS_TRANSMIT_EMPTY;
        });

        ram->AddReadOnlyAddress(STATUS_ADDR);
        
        StartPacketAccumulator();
    }

    ~Sci3() override
    {
        StopPacketAccumulator();
    }

    void Tick() override;

    void Receive(uint8_t byte);

    
    void StartPacketAccumulator();
    void StopPacketAccumulator();

    void SetPacketTimeout(const int timeout)
    {
        packetTimeout = timeout;
    }

    std::queue<uint8_t> receiveBuffer;

    EventHandler<std::vector<uint8_t>> OnTransmitPacket;

    MemoryAccessor<uint8_t> control;
    MemoryAccessor<uint8_t> status;
    MemoryAccessor<uint8_t> transmit;
    MemoryAccessor<uint8_t> receive;
    
    static constexpr size_t TICKS = 32678;

private:
    Memory* ram;

    static constexpr uint16_t CONTROL_ADDR = 0xFF9A;
    static constexpr uint16_t TRANSMIT_ADDR = 0xFF9B;
    static constexpr uint16_t STATUS_ADDR = 0xFF9C;
    static constexpr uint16_t RECEIVE_ADDR = 0xFF9D;

    std::mutex receiveMutex;
    
    std::vector<uint8_t> transmitBuffer;
    std::mutex transmitMutex;
    std::chrono::steady_clock::time_point lastTransmitTime;
    std::atomic<bool> hasTransmitData{false};
    int packetTimeout = 5;
    
    std::thread packetSenderThread;
    std::atomic<bool> senderRunning{false};
};