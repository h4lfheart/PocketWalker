#pragma once
#include <vector>

class ArrayUtilities
{
public:
    static std::vector<size_t> Range(size_t start, size_t end)
    {
        const size_t size = end - start + 1;
        std::vector<size_t> vector(size);
        for (size_t i = 0; i <= size; i++)
        {
            vector.push_back(i);
        }
    }
    
};
