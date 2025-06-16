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

// Environment configuration
export enum Environment {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

// Current environment
const ENV: Environment = __DEV__ ? Environment.DEVELOPMENT : Environment.PRODUCTION;

// Config based on environment
const CONFIG = {
  [Environment.DEVELOPMENT]: {
    useNativePlatform: false,
    pingTimeout: 3000,  // 3 seconds timeout for pings in dev
    collectEventsInterval: 2000, // 2 seconds for event polling
    logEvents: true,
  },
  [Environment.PRODUCTION]: {
    useNativePlatform: true,
    pingTimeout: 5000, // 5 seconds timeout for production
    collectEventsInterval: 1000, // 1 second for event polling
    logEvents: false,
  }
};

// App configuration
const appConfig = CONFIG[ENV];

// Whether to use native platform implementation
const isNativePlatform = appConfig.useNativePlatform;

// Logger with environment awareness
const logger = {
  log: (...args: any[]) => {
    if (appConfig.logEvents) {
      console.log('[Backend]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[Backend Error]', ...args);
  }
};

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
// const isNativePlatform = false; // Set to true when actual native code is available

// Mock data for development
const mockPeers = [
  '12D3KooWJWEKvMzPCXtZKZkBQmgFWAyYx9d7ex5GeFu9MVqpQ9ps',
  '12D3KooWHFrmLWTTDD4NodngtRUdstGVxQmqLxZXkVFVnXoGnBP8',
  '12D3KooWAYdJSNxaH4sP6NqfEYkGrArVMMCvzMXTL7jQaHxitEqK',
  '12D3KooWFHJUzUMgxWVvsxSeYUxZ5jcSeLxUDJ1tZqS36GJN5n5V',
  '12D3KooWRusoAhqQV6PadmALLD3wZkuEB5MsNwrrFNJh7KfMgpKU',
];

const mockLocalPeerId = '12D3KooWGG3MAbjhL9NrR9LokpcD3jzHx7NRUHKqcM7orrXtpYvT';

// Simulated message queue for mock implementation
let mockMessageQueue: string[] = [];

// Time of last generated event
let lastEventTime = Date.now();

// Generate a random event periodically
function generateRandomEvent() {
  const now = Date.now();
  
  // Only generate events every 10-20 seconds to avoid spamming
  if (now - lastEventTime < 10000 + Math.random() * 10000) {
    return;
  }
  
  const eventType = Math.random() > 0.7 ? 'message' : 'connection';
  
  if (eventType === 'message') {
    const randomPeer = mockPeers[Math.floor(Math.random() * mockPeers.length)];
    const messages = [
      "All clear in my area, continuing patrols.",
      "Need assistance in sector 7G, unusual activity spotted.",
      "EMERGENCY: Fire reported in building at coordinates 32.4N, 17.8E!",
      "Weather conditions deteriorating rapidly in western region.",
      "Supply convoy arrived safely at northern outpost.",
      "Communication systems experiencing intermittent failures.",
      "Suspicious individuals spotted near the perimeter fence."
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const tags = ['general', 'general', 'general', 'important', 'important', 'emergency'];
    const randomTag = tags[Math.floor(Math.random() * tags.length)];
    
    const event = JSON.stringify({
      type: 'message',
      data: {
        peer: randomPeer,
        message: {
          message: randomMessage,
          tags: randomTag
        }
      }
    });
    
    mockMessageQueue.push(event);
  } else {
    const randomPeer = mockPeers[Math.floor(Math.random() * mockPeers.length)];
    const event = JSON.stringify({
      type: 'connection',
      data: {
        peer: randomPeer
      }
    });
    
    mockMessageQueue.push(event);
  }
  
  lastEventTime = now;
}

/**
 * Initializes the P2P network with an optional whitelist
 */
export function initNetwork(whitelist: string[] = []): boolean {
  if (!isNativePlatform) {
    logger.log('Initializing P2P network with whitelist:', whitelist);
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
    logger.log('Starting gossip loop');
    // Start generating random events in development mode
    setInterval(generateRandomEvent, 1000);
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
    const events = [...mockMessageQueue];
    mockMessageQueue = []; // Clear the queue after returning events
    return events;
  }
  
  // When native code is available:
  // const ffiList = NativeModules.TrumanBackend.collectEvents();
  // return ffiList.strings;
  return [];
}

/**
 * Sends a ping to a specific peer and returns the response time
 */
export function pingPeer(peerId: string): number {
  const startTime = performance.now();
  
  if (!isNativePlatform) {
    logger.log('Pinging peer:', peerId);
    // Simulate network latency with some realistic variation
    const baseLatency = pingResponseTimes[peerId] || (50 + Math.random() * 100);
    const jitter = Math.random() * 20 - 10; // +/- 10ms jitter
    const responseTime = Math.max(5, Math.floor(baseLatency + jitter));
    
    // Cache the response time
    pingResponseTimes[peerId] = responseTime;
    
    return responseTime;
  }
  
  // When native code is available:
  // const success = NativeModules.TrumanBackend.ping(peerId) === SUCCESS;
  // const endTime = performance.now();
  // return success ? Math.floor(endTime - startTime) : -1;
  
  // Simulate a response time for now
  const endTime = performance.now();
  return Math.floor(endTime - startTime + (Math.random() * 50) + 20);
}

/**
 * Gets the list of connected peers
 */
export function getPeers(): string[] {
  if (!isNativePlatform) {
    // Return mock peers during development
    return mockPeers;
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
    logger.log('Broadcasting message:', message, 'with tag:', tag);
    // In development mode, add the broadcast to our own message queue
    const event = JSON.stringify({
      type: 'message',
      data: {
        peer: mockLocalPeerId,
        message: {
          message: message,
          tags: tag
        }
      }
    });
    mockMessageQueue.push(event);
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
    logger.log('Promoting peer to wolf:', peerId);
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
    return mockLocalPeerId;
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
    logger.log('Cleaning up resources');
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
