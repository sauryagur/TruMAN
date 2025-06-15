import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView } from 'react-native';
import BottomNav from '../components/BottomNav';
import backendService from '../services/backend';

interface StatusCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    value: string;
    color: string;
    borderColor?: string;
}

interface HomeScreenProps {
    userRole?: 'sheep' | 'wolf';
    navigation?: any; // Add navigation prop
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, title, value, color, borderColor }) => (
    <TouchableOpacity style={[styles.statusCard, { borderColor: borderColor || styles.statusCard.borderColor }]}>
        <View style={styles.cardHeader}>
            <Ionicons name={icon} size={20} color={color} />
            <Text style={[styles.cardTitle, { color }]}>{title}</Text>
        </View>
        <Text style={styles.cardValue}>{value}</Text>
    </TouchableOpacity>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ userRole = 'sheep', navigation}) => {
    console.log("Rendring HomeScreen");
    const [networkStatus, setNetworkStatus] = useState('Initializing...');
    const [connectedPeers, setConnectedPeers] = useState(0);
    const [lastBroadcast, setLastBroadcast] = useState('Never');
    const [networkStrength, setNetworkStrength] = useState('0 kbps');
    const [publicKey, setPublicKey] = useState('')

    // Determine accent color based on user role
    const accentColor = userRole === 'wolf' ? '#e74c3c' : '#4A90E2'; // Red for wolf, blue for sheep

    useEffect(() => {
        // Initialize network connection
        const initNetwork = async () => {
            try {
                const success = backendService.initNetwork();
                if (success) {
                    setNetworkStatus('Connected');
                    backendService.startGossipLoop();
                    
                    // Get local peer ID
                    const peerId = backendService.getLocalPeerId();
                    setPublicKey(peerId);
                } else {
                    setNetworkStatus('Error');
                }
            } catch (error) {
                console.error('Failed to initialize network:', error);
                setNetworkStatus('Error');
            }
        };
        
        initNetwork();
        
        // Set up polling for peer updates
        const peerInterval = setInterval(() => {
            try {
                const peers = backendService.getPeers();
                setConnectedPeers(peers.length);
            } catch (error) {
                console.error('Failed to get peers:', error);
            }
        }, 5000);
        
        // Clean up on unmount
        return () => {
            clearInterval(peerInterval);
        };
    }, []);

    const getAdditionalInfo = () => {
        if (userRole === 'wolf') {
            return (
                <View style={styles.adminInfo}>
                    <Ionicons name="shield-checkmark" size={16} color="#e74c3c" />
                    <Text style={styles.adminText}>Wolf Node - Administrative Access Enabled</Text>
                </View>
            );
        }
        return (
            <View style={styles.adminInfo}>
                <Ionicons name="people" size={16} color="#2ecc71" />
                <Text style={styles.userText}>Sheep Node - Standard User Access</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
            <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                <View style={styles.header}>
                    <Text style={styles.title}>TruMAN</Text>
                    <Text style={styles.subtitle}>
                        A peer to peer emergency communication software
                    </Text>
                    {getAdditionalInfo()}
                </View>
                <View style={styles.content}>
                    {userRole == 'wolf' && (<StatusCard
                        icon="key"
                        title="Public Key"
                        value={publicKey}
                        color={accentColor}
                        borderColor={accentColor} // Pass accentColor for border
                    />)}
                    <StatusCard
                        icon="wifi"
                        title="Network Status"
                        value={networkStatus}
                        color={accentColor}
                        borderColor={accentColor} // Pass accentColor for border
                    />
                    <StatusCard
                        icon="people"
                        title="Connected Peers"
                        value={`${connectedPeers} nodes`}
                        color={accentColor}
                        borderColor={accentColor} // Pass accentColor for border
                    />
                    <StatusCard
                        icon="radio"
                        title="Last Broadcast"
                        value={lastBroadcast}
                        color={accentColor}
                        borderColor={accentColor} // Pass accentColor for border
                    />
                    <StatusCard
                        icon="cellular"
                        title="Network Strength"
                        value={networkStrength}
                        color={accentColor}
                        borderColor={accentColor} // Pass accentColor for border
                    />

                    {/* Additional Wolf Node Features */}
                    {userRole === 'wolf' && (
                        <View style={styles.wolfFeatures}>
                            <StatusCard
                                icon="shield-checkmark"
                                title="Wolf Authority Level"
                                value="Administrative"
                                color="#e74c3c"
                                borderColor="#e74c3c" // Always red for wolf features
                            />
                            <StatusCard
                                icon="server"
                                title="Managed Nodes"
                                value="23 sheep nodes"
                                color="#e74c3c"
                                borderColor="#e74c3c" // Always red for wolf features
                            />
                        </View>
                    )}
                </View>
            </ScrollView>
            {/* Use the new BottomNav component */}
            <BottomNav navigation={navigation} userRole={userRole} activeScreen="Home" />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 30,
    },
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#cccccc',
        lineHeight: 22,
        maxWidth: 280,
        marginBottom: 12,
    },
    adminInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    adminText: {
        fontSize: 14,
        color: '#e74c3c',
        fontWeight: '500',
        marginLeft: 6,
    },
    userText: {
        fontSize: 14,
        color: '#2ecc71',
        fontWeight: '500',
        marginLeft: 6,
    },
    content: {
        // flex: 1,
        paddingHorizontal: 20,
        gap: 20,
        marginBottom:20
    },
    statusCard: {
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        // The borderColor is now set dynamically via props, but we keep a default here
        borderColor: '#4A90E2',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginLeft: 30,
    },
    wolfFeatures: {
        gap: 20,
    },
    // The footer and bottomNav styles are now managed within the BottomNav component
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
});

export default HomeScreen;