#pragma once
#include <functional>
#include <list>

template <typename T>
using EventHandlerCallback = std::function<void(T)>;


template <typename T>
class EventHandler
{
public:
    void operator()(T argument)
    {
        for (auto callback : callbacks)
        {
            callback(argument);
        }
    }
    
    void operator+=(EventHandlerCallback<T> callback)
    {
        callbacks.push_back(callback);
    }
    
    void operator-=(EventHandlerCallback<T> callback)
    {
        callbacks.remove(callback);
    }

    
private:
    std::list<EventHandlerCallback<T>> callbacks;
};
