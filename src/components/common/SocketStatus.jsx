import { useState, useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import './SocketStatus.scss';

const SocketStatus = () => {
    const { isConnected, connectionStatus, onServerConnected, onServerDisconnected, onConnectionError } = useSocket();
    const [showDetails, setShowDetails] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(new Date());

    useEffect(() => {
        const unsubscribeConnected = onServerConnected(() => {
            setLastUpdate(new Date());
        });

        const unsubscribeDisconnected = onServerDisconnected(() => {
            setLastUpdate(new Date());
        });

        const unsubscribeError = onConnectionError(() => {
            setLastUpdate(new Date());
        });

        return () => {
            unsubscribeConnected();
            unsubscribeDisconnected();
            unsubscribeError();
        };
    }, [onServerConnected, onServerDisconnected, onConnectionError]);

    if (!showDetails && isConnected) {
        return (
            <div className="socket-status socket-status--connected" onClick={() => setShowDetails(true)}>
                <div className="socket-status__indicator"></div>
                <span className="socket-status__text">Connected</span>
            </div>
        );
    }

    if (!showDetails && !isConnected) {
        return (
            <div className="socket-status socket-status--disconnected" onClick={() => setShowDetails(true)}>
                <div className="socket-status__indicator"></div>
                <span className="socket-status__text">Disconnected</span>
            </div>
        );
    }

    return (
        <div className={`socket-status socket-status--detailed ${isConnected ? 'socket-status--connected' : 'socket-status--disconnected'}`}>
            <div className="socket-status__header" onClick={() => setShowDetails(false)}>
                <div className="socket-status__indicator"></div>
                <span className="socket-status__text">
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <button className="socket-status__close">×</button>
            </div>

            <div className="socket-status__details">
                <div className="socket-status__item">
                    <strong>Status:</strong> {isConnected ? '🟢 Online' : '🔴 Offline'}
                </div>

                {connectionStatus.socketId && (
                    <div className="socket-status__item">
                        <strong>Socket ID:</strong> {connectionStatus.socketId.substring(0, 8)}...
                    </div>
                )}

                <div className="socket-status__item">
                    <strong>Reconnect Attempts:</strong> {connectionStatus.reconnectAttempts}
                </div>

                <div className="socket-status__item">
                    <strong>Last Update:</strong> {lastUpdate.toLocaleTimeString()}
                </div>

                {!isConnected && (
                    <div className="socket-status__item socket-status__warning">
                        ⚠️ Real-time features unavailable
                    </div>
                )}
            </div>
        </div>
    );
};

export default SocketStatus;