#include "MemoryAccessor.h"

#include "Memory.h"

template<>
uint8_t MemoryAccessor<uint8_t>::read() const {
    return memory->ReadByte(address);
}

template<>
void MemoryAccessor<uint8_t>::write(uint8_t value) {
    memory->WriteByte(address, value);
}

template<>
uint16_t MemoryAccessor<uint16_t>::read() const {
    return memory->ReadShort(address);
}

template<>
void MemoryAccessor<uint16_t>::write(uint16_t value) {
    memory->WriteShort(address, value);
}

template<>
uint32_t MemoryAccessor<uint32_t>::read() const {
    return memory->ReadInt(address);
}

template<>
void MemoryAccessor<uint32_t>::write(uint32_t value) {
    memory->WriteInt(address, value);
}