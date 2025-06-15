/**
 * TruMAN Backend FFI Interface
 * 
 * This module provides a TypeScript interface to the Rust backend through FFI.
 * It uses a stub implementation for development and testing, and the actual
 * implementation will be connected via the native modules when running on device.
 */

// Type definitions for FFI data structures
export interface FFIList {
  strings: string[];
}

// Event types that can be returned from the backend
export enum EventType {
  MESSAGE = 'message',
  CONNECTION = 'connection',
  DISCONNECTION = 'disconnection',
}

export interface PeerEvent {
  type: EventType;
  peerId: string;
  timestamp: number;
}

export interface MessageEvent extends PeerEvent {
  type: EventType.MESSAGE;
  message: string;
  tag: string;
}

// Return codes
const SUCCESS = 1;
const ERROR = 0;

// Mock implementation for development/web
const isNativePlatform = false; // Set to true when actual native code is available

/**
 * Initializes the P2P network with an optional whitelist
 */
export function initNetwork(whitelist: string[] = []): boolean {
  if (!isNativePlatform) {
    console.log('[Backend] Initializing P2P network with whitelist:', whitelist);
    return true;
  }
  
  // When native code is available:
  // return NativeModules.TrumanBackend.init(whitelist) === SUCCESS;
  return true;
}

/**
 * Starts the gossip event loop
 */
export function startGossipLoop(): void {
  if (!isNativePlatform) {
    console.log('[Backend] Starting gossip loop');
    return;
  }
  
  // When native code is available:
  // NativeModules.TrumanBackend.startGossipLoop();
}

/**
 * Collects events from the network
 */
export function collectEvents(): string[] {
  if (!isNativePlatform) {
    // Return mock events during development
    return [];
  }
  
  // When native code is available:
  // const ffiList = NativeModules.TrumanBackend.collectEvents();
  // return ffiList.strings;
  return [];
}

/**
 * Sends a ping to a specific peer
 */
export function pingPeer(peerId: string): boolean {
  if (!isNativePlatform) {
    console.log('[Backend] Pinging peer:', peerId);
    return true;
  }
  
  // When native code is available:
  // return NativeModules.TrumanBackend.ping(peerId) === SUCCESS;
  return true;
}

/**
 * Gets the list of connected peers
 */
export function getPeers(): string[] {
  if (!isNativePlatform) {
    // Return mock peers during development
    return [
      '12D3KooWJWEKvMzPCXtZKZkBQmgFWAyYx9d7ex5GeFu9MVqpQ9ps',
      '12D3KooWHFrmLWTTDD4NodngtRUdstGVxQmqLxZXkVFVnXoGnBP8',
      '12D3KooWAYdJSNxaH4sP6NqfEYkGrArVMMCvzMXTL7jQaHxitEqK'
    ];
  }
  
  // When native code is available:
  // const ffiList = NativeModules.TrumanBackend.getPeers();
  // return ffiList.strings;
  return [];
}

/**
 * Broadcasts a message to the network
 */
export function broadcastMessage(message: string, tag: string = 'general'): boolean {
  if (!isNativePlatform) {
    console.log('[Backend] Broadcasting message:', message, 'with tag:', tag);
    return true;
  }
  
  // When native code is available:
  // return NativeModules.TrumanBackend.broadcastMessage(message, tag) === SUCCESS;
  return true;
}

/**
 * Promotes a peer to wolf status
 */
export function promoteToWolf(peerId: string): boolean {
  if (!isNativePlatform) {
    console.log('[Backend] Promoting peer to wolf:', peerId);
    return true;
  }
  
  // When native code is available:
  // return NativeModules.TrumanBackend.newWolf(peerId) === SUCCESS;
  return true;
}

/**
 * Gets the local peer ID
 */
export function getLocalPeerId(): string {
  if (!isNativePlatform) {
    // Return mock ID during development
    return '12D3KooWGG3MAbjhL9NrR9LokpcD3jzHx7NRUHKqcM7orrXtpYvT';
  }
  
  // When native code is available:
  // const ffiList = NativeModules.TrumanBackend.getLocalPeerId();
  // return ffiList.strings[0];
  return '';
}

/**
 * Cleans up resources - call before shutting down
 */
export function cleanup(): void {
  if (!isNativePlatform) {
    console.log('[Backend] Cleaning up resources');
    return;
  }
  
  // When native code is available:
  // NativeModules.TrumanBackend.cleanup();
}

// Export a default object for easier imports
export default {
  initNetwork,
  startGossipLoop,
  collectEvents,
  pingPeer,
  getPeers,
  broadcastMessage,
  promoteToWolf,
  getLocalPeerId,
  cleanup,
};
