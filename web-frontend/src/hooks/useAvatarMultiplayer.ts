// src/hooks/useAvatarMultiplayer.ts
import { useEffect, useState, useRef, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { RemoteAvatar, AvatarCustomization } from '@/types/avatar';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:5000';

type Timer = ReturnType<typeof setInterval>;

export function useAvatarMultiplayer(
  galleryId: string,
  customization: AvatarCustomization,
  localPosition: { x: number; z: number },
  localRotation: number,
  localAnimation: string
) {
  const [remoteAvatars, setRemoteAvatars] = useState<RemoteAvatar[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const { accessToken, user } = useAuthStore();
  const lastSentPosition = useRef({ x: 0, z: 0, rot: 0, anim: '' });
  const heartbeatInterval = useRef<Timer | null>(null);

  const sendPositionUpdate = useCallback(async () => {
    if (!connectionRef.current || !isConnected) return;
    
    const dx = Math.abs(localPosition.x - lastSentPosition.current.x);
    const dz = Math.abs(localPosition.z - lastSentPosition.current.z);
    const dr = Math.abs(localRotation - lastSentPosition.current.rot);
    
    if (dx < 0.1 && dz < 0.1 && dr < 0.05 && localAnimation === lastSentPosition.current.anim) return;
    
    lastSentPosition.current = {
      x: localPosition.x,
      z: localPosition.z,
      rot: localRotation,
      anim: localAnimation
    };
    
    try {
      await connectionRef.current.invoke('UpdatePosition', {
        galleryId,
        positionX: localPosition.x,
        positionZ: localPosition.z,
        rotation: localRotation,
        animation: localAnimation
      });
    } catch (error) {
      console.error('Failed to update position:', error);
    }
  }, [galleryId, isConnected, localPosition.x, localPosition.z, localRotation, localAnimation]);

  useEffect(() => {
    const interval = setInterval(sendPositionUpdate, 50);
    return () => clearInterval(interval);
  }, [sendPositionUpdate]);

  const performEmote = useCallback(async (emoteType: string) => {
    if (!connectionRef.current || !isConnected) return;
    try {
      await connectionRef.current.invoke('PerformEmote', galleryId, emoteType);
    } catch (error) {
      console.error('Failed to perform emote:', error);
    }
  }, [galleryId, isConnected]);

  const waveToUser = useCallback(async (targetConnectionId: string) => {
    if (!connectionRef.current || !isConnected) return;
    try {
      await connectionRef.current.invoke('WaveToUser', targetConnectionId, galleryId);
    } catch (error) {
      console.error('Failed to wave:', error);
    }
  }, [galleryId, isConnected]);

  useEffect(() => {
    if (!galleryId || user?.userType !== 'Visitor') return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/avatarHub`, {
        accessTokenFactory: () => accessToken || '',
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(signalR.LogLevel.Information)
      .build();

    connectionRef.current = connection;

    const startConnection = async () => {
      try {
        await connection.start();
        setIsConnected(true);
        
        await connection.invoke('JoinGallery', galleryId, customization);
        
        heartbeatInterval.current = setInterval(async () => {
          if (connection.state === signalR.HubConnectionState.Connected) {
            await connection.invoke('Heartbeat');
          }
        }, 30000);
        
      } catch (error) {
        console.error('Failed to connect AvatarHub:', error);
        setIsConnected(false);
      }
    };

    startConnection();

    connection.on('UserJoined', (user: RemoteAvatar) => {
      setRemoteAvatars(prev => [...prev.filter(u => u.connectionId !== user.connectionId), user]);
    });

    connection.on('UserMoved', (update) => {
      setRemoteAvatars(prev =>
        prev.map(avatar =>
          avatar.connectionId === update.connectionId
            ? { 
                ...avatar, 
                positionX: update.positionX, 
                positionZ: update.positionZ, 
                rotation: update.rotation, 
                animation: update.animation 
              }
            : avatar
        )
      );
    });

    connection.on('UserLeft', (data: { connectionId: string }) => {
      setRemoteAvatars(prev => prev.filter(avatar => avatar.connectionId !== data.connectionId));
    });

    connection.on('ExistingUsers', (users: RemoteAvatar[]) => {
      setRemoteAvatars(users);
    });

    connection.on('UserEmote', (data) => {
      if (data.emote === 'wave') {
        toast.success(`${data.userName} waved!`);
      }
    });

    connection.on('UserWavedAtYou', (data) => {
      toast.success(`${data.fromUserName} waved at you!`);
    });

    connection.on('OnlineCount', (data: { count: number }) => {
      setOnlineCount(data.count);
    });

    connection.on('Error', (error: { message: string }) => {
      console.error('SignalR Error:', error.message);
    });

    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [galleryId, accessToken, customization, user]);

  return {
    remoteAvatars,
    isConnected,
    onlineCount,
    performEmote,
    waveToUser,
  };
}