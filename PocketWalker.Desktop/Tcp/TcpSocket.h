#pragma once

#include <iostream>
#include <functional>
#include <thread>
#include <atomic>
#include <vector>
#include <string>
#include <cstring>
#include <chrono>
#include <winsock2.h>
#include <ws2tcpip.h>

#pragma comment(lib, "ws2_32.lib")

class TcpSocket {
public:
    using ConnectHandler = std::function<void()>;
    using CloseHandler = std::function<void()>;
    using DataHandler = std::function<void(const std::vector<uint8_t>&)>;
    using ErrorHandler = std::function<void(const std::string&)>;
    using ClientConnectHandler = std::function<void(const std::string&)>;

    enum class Mode {
        CLIENT,
        SERVER
    };

private:
    SOCKET sock;
    SOCKET clientSock;
    std::atomic<bool> connected;
    std::atomic<bool> shouldStop;
    std::atomic<bool> isServerMode;
    std::thread receiveThread;
    std::thread acceptThread;
    
    std::string lastHost;
    int lastPort;
    
    ConnectHandler onConnect;
    CloseHandler onClose;
    DataHandler onData;
    ErrorHandler onError;
    ClientConnectHandler onClientConnect;

    void initWinsock() {
        WSADATA wsaData;
        if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
            if (onError) {
                onError("Failed to initialize Winsock");
            }
        }
    }

    bool waitForConnection(SOCKET socket, int timeoutMs = 5000) {
        fd_set writeSet, errorSet;
        FD_ZERO(&writeSet);
        FD_ZERO(&errorSet);
        FD_SET(socket, &writeSet);
        FD_SET(socket, &errorSet);

        timeval timeout;
        timeout.tv_sec = timeoutMs / 1000;
        timeout.tv_usec = (timeoutMs % 1000) * 1000;

        int result = select(0, nullptr, &writeSet, &errorSet, &timeout);
        
        if (result > 0) {
            if (FD_ISSET(socket, &errorSet)) {
                return false; 
            }
            if (FD_ISSET(socket, &writeSet)) {
                int error = 0;
                int errorLen = sizeof(error);
                if (getsockopt(socket, SOL_SOCKET, SO_ERROR, (char*)&error, &errorLen) == 0) {
                    return error == 0;
                }
            }
        }
        
        return false; 
    }

    void acceptLoop() {
        while (!shouldStop && isServerMode) {
            fd_set readSet;
            FD_ZERO(&readSet);
            FD_SET(sock, &readSet);
            
            timeval timeout;
            timeout.tv_sec = 1; 
            timeout.tv_usec = 0;
            
            int selectResult = select(0, &readSet, nullptr, nullptr, &timeout);
            
            if (selectResult > 0 && FD_ISSET(sock, &readSet)) {
                sockaddr_in clientAddr;
                int clientAddrLen = sizeof(clientAddr);
                
                SOCKET newClientSock = accept(sock, reinterpret_cast<sockaddr*>(&clientAddr), &clientAddrLen);
                
                if (newClientSock != INVALID_SOCKET) {
                    if (clientSock != INVALID_SOCKET) {
                        closesocket(clientSock);
                    }
                    
                    clientSock = newClientSock;
                    connected = true;
                    
                    char clientIP[INET_ADDRSTRLEN];
                    inet_ntop(AF_INET, &clientAddr.sin_addr, clientIP, INET_ADDRSTRLEN);
                    
                    shouldStop = false;
                    if (receiveThread.joinable()) {
                        shouldStop = true;
                        receiveThread.join();
                        shouldStop = false;
                    }
                    receiveThread = std::thread(&TcpSocket::receiveLoop, this);
                    
                    if (onClientConnect) {
                        onClientConnect(std::string(clientIP));
                    }
                    if (onConnect) {
                        onConnect();
                    }
                } else {
                    int error = WSAGetLastError();
                    if (error != WSAEWOULDBLOCK) {
                        if (onError) {
                            onError("Accept error: " + std::to_string(error));
                        }
                    }
                }
            } else if (selectResult == SOCKET_ERROR) {
                int error = WSAGetLastError();
                if (onError) {
                    onError("Accept select error: " + std::to_string(error));
                }
            }
        }
    }

    void receiveLoop() {
        const int bufferSize = 4096;
        std::vector<uint8_t> buffer(bufferSize);
        
        while (!shouldStop && connected) {
            SOCKET recvSock = isServerMode ? clientSock : sock;
            if (recvSock == INVALID_SOCKET) {
                break;
            }
            
            fd_set readSet;
            FD_ZERO(&readSet);
            FD_SET(recvSock, &readSet);
            
            timeval timeout;
            timeout.tv_sec = 1;
            timeout.tv_usec = 0;
            
            int selectResult = select(0, &readSet, nullptr, nullptr, &timeout);
            
            if (selectResult > 0 && FD_ISSET(recvSock, &readSet)) {
                int bytesReceived = recv(recvSock, reinterpret_cast<char*>(buffer.data()), bufferSize, 0);
                
                if (bytesReceived > 0) {
                    std::vector<uint8_t> data(buffer.begin(), buffer.begin() + bytesReceived);
                    if (onData) {
                        onData(data);
                    }
                } else if (bytesReceived == 0) {
                    handleDisconnection("Connection closed by peer");
                    break;
                } else {
                    int error = WSAGetLastError();
                    if (error != WSAEWOULDBLOCK) {
                        handleDisconnection("Receive error: " + std::to_string(error));
                        break;
                    }
                }
            } else if (selectResult == SOCKET_ERROR) {
                int error = WSAGetLastError();
                handleDisconnection("Select error: " + std::to_string(error));
                break;
            }
        }
    }

    void handleDisconnection(const std::string& reason = "") {
        if (connected.exchange(false)) {
            if (onError && !reason.empty()) {
                onError(reason);
            }
            if (onClose) {
                onClose();
            }
            
            if (isServerMode && clientSock != INVALID_SOCKET) {
                closesocket(clientSock);
                clientSock = INVALID_SOCKET;
            }
        }
    }

    void cleanupSocket() {
        if (sock != INVALID_SOCKET) {
            closesocket(sock);
            sock = INVALID_SOCKET;
        }
        if (clientSock != INVALID_SOCKET) {
            closesocket(clientSock);
            clientSock = INVALID_SOCKET;
        }
    }

    void stopReceiveThread() {
        shouldStop = true;
        if (receiveThread.joinable()) {
            receiveThread.join();
        }
        if (acceptThread.joinable()) {
            acceptThread.join();
        }
    }

public:
    TcpSocket() : sock(INVALID_SOCKET), clientSock(INVALID_SOCKET), connected(false), 
                  shouldStop(false), isServerMode(false), lastPort(0) {
        initWinsock();
    }

    ~TcpSocket() {
        close();
        WSACleanup();
    }

    void setOnConnect(ConnectHandler handler) { onConnect = handler; }
    void setOnClose(CloseHandler handler) { onClose = handler; }
    void setOnData(DataHandler handler) { onData = handler; }
    void setOnError(ErrorHandler handler) { onError = handler; }
    void setOnClientConnect(ClientConnectHandler handler) { onClientConnect = handler; }

    bool startServer(int port) {
        close();
        
        isServerMode = true;
        lastPort = port;
        lastHost = "";

        sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (sock == INVALID_SOCKET) {
            if (onError) {
                onError("Failed to create server socket");
            }
            return false;
        }

        int flag = 1;
        setsockopt(sock, SOL_SOCKET, SO_REUSEADDR, (char*)&flag, sizeof(flag));
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(flag));
 
        int sendBufferSize = 65536;
        setsockopt(sock, SOL_SOCKET, SO_SNDBUF, (char*)&sendBufferSize, sizeof(sendBufferSize));

        int recvBufferSize = 65536;
        setsockopt(sock, SOL_SOCKET, SO_RCVBUF, (char*)&recvBufferSize, sizeof(recvBufferSize));

        u_long mode = 1;
        if (ioctlsocket(sock, FIONBIO, &mode) != 0) {
            if (onError) {
                onError("Failed to set non-blocking mode");
            }
            cleanupSocket();
            return false;
        }

        sockaddr_in serverAddr;
        memset(&serverAddr, 0, sizeof(serverAddr));
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = INADDR_ANY;
        serverAddr.sin_port = htons(port);

        if (bind(sock, reinterpret_cast<sockaddr*>(&serverAddr), sizeof(serverAddr)) == SOCKET_ERROR) {
            if (onError) {
                onError("Bind failed: " + std::to_string(WSAGetLastError()));
            }
            cleanupSocket();
            return false;
        }

        if (listen(sock, SOMAXCONN) == SOCKET_ERROR) {
            if (onError) {
                onError("Listen failed: " + std::to_string(WSAGetLastError()));
            }
            cleanupSocket();
            return false;
        }

        shouldStop = false;

        acceptThread = std::thread(&TcpSocket::acceptLoop, this);

        return true;
    }

    bool connect(const std::string& host, int port) {
        close();
        
        isServerMode = false;
        
        lastHost = host;
        lastPort = port;

        sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        if (sock == INVALID_SOCKET) {
            if (onError) {
                onError("Failed to create socket");
            }
            return false;
        }

        int flag = 1;
        setsockopt(sock, IPPROTO_TCP, TCP_NODELAY, (char*)&flag, sizeof(flag));

        int sendBufferSize = 65536;
        setsockopt(sock, SOL_SOCKET, SO_SNDBUF, (char*)&sendBufferSize, sizeof(sendBufferSize));

        int recvBufferSize = 65536;
        setsockopt(sock, SOL_SOCKET, SO_RCVBUF, (char*)&recvBufferSize, sizeof(recvBufferSize));

        u_long mode = 1;
        if (ioctlsocket(sock, FIONBIO, &mode) != 0) {
            if (onError) {
                onError("Failed to set non-blocking mode");
            }
            cleanupSocket();
            return false;
        }

        sockaddr_in serverAddr;
        memset(&serverAddr, 0, sizeof(serverAddr));
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_port = htons(port);
        
        if (inet_pton(AF_INET, host.c_str(), &serverAddr.sin_addr) <= 0) {
            if (onError) {
                onError("Invalid host address");
            }
            cleanupSocket();
            return false;
        }

        int connectResult = ::connect(sock, reinterpret_cast<sockaddr*>(&serverAddr), sizeof(serverAddr));
        
        if (connectResult == SOCKET_ERROR) {
            int error = WSAGetLastError();
            if (error != WSAEWOULDBLOCK && error != WSAEINPROGRESS) {
                if (onError) {
                    onError("Connect failed: " + std::to_string(error));
                }
                cleanupSocket();
                return false;
            }
            
            if (!waitForConnection(sock)) {
                if (onError) {
                    onError("Connection timeout or failed");
                }
                cleanupSocket();
                return false;
            }
        }

        connected = true;
        shouldStop = false;

        receiveThread = std::thread(&TcpSocket::receiveLoop, this);

        if (onConnect) {
            onConnect();
        }

        return true;
    }

    bool reconnect() {
        if (isServerMode) {
            if (lastPort == 0) {
                if (onError) {
                    onError("No previous server port available for restart");
                }
                return false;
            }
            return startServer(lastPort);
        } else {
            if (lastHost.empty() || lastPort == 0) {
                if (onError) {
                    onError("No previous connection details available for reconnection");
                }
                return false;
            }
            return connect(lastHost, lastPort);
        }
    }

    void close() {
        if (connected || sock != INVALID_SOCKET) {
            shouldStop = true;
            connected = false;
            
            stopReceiveThread();
            cleanupSocket();
            
            isServerMode = false;
        }
    }

    bool send(const std::vector<uint8_t>& data) {
        if (!connected) {
            return false;
        }
        
        SOCKET sendSock = isServerMode ? clientSock : sock;
        if (sendSock == INVALID_SOCKET) {
            return false;
        }

        size_t totalSent = 0;
        size_t dataSize = data.size();
        
        while (totalSent < dataSize && connected) {
            int bytesSent = ::send(sendSock, 
                reinterpret_cast<const char*>(data.data() + totalSent), 
                static_cast<int>(dataSize - totalSent), 0);
            
            if (bytesSent > 0) {
                totalSent += bytesSent;
            } else if (bytesSent == SOCKET_ERROR) {
                int error = WSAGetLastError();
                if (error == WSAEWOULDBLOCK) {
                    continue;
                }
                
                handleDisconnection("Send error: " + std::to_string(error));
                return false;
            }
        }
        
        return totalSent == dataSize;
    }

    bool isConnected() const {
        return connected;
    }

    bool isServer() const {
        return isServerMode;
    }

    std::string getLastHost() const { return lastHost; }
    int getLastPort() const { return lastPort; }
};