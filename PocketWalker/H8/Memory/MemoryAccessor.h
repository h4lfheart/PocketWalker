#pragma once
#include <cstdint>
#include <functional>
#include <unordered_map>

using MemoryHandler = std::function<void(uint32_t)>;

class Memory;

template<typename T>
class MemoryAccessor {
public:
    MemoryAccessor(Memory* mem, uint16_t addr) : memory(mem), address(addr) {}
    
    MemoryAccessor& operator=(T value) {
        write(value);
        return *this;
    }
    
    operator T() const {
        return read();
    }

    MemoryAccessor& operator+=(T value) {
        T current = read();
        write(current + value);
        return *this;
    }
    
    MemoryAccessor& operator-=(T value) {
        T current = read();
        write(current - value);
        return *this;
    }
    
    MemoryAccessor& operator&=(T value) {
        T current = read();
        write(current & value);
        return *this;
    }
    
    MemoryAccessor& operator|=(T value) {
        T current = read();
        write(current | value);
        return *this;
    }
    
    T Get() const {
        return read();
    }
    
    void Set(T value) {
        write(value);
    }

    uint16_t address;
    
private:
    Memory* memory;

    T read() const;
    void write(T value);
};