import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
    // FlatList,
    ScrollView,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav'; // Import the new BottomNav component

interface PeerNode {
    id: string;
    responseTime: number;
    isOnline: boolean;
}

interface PeerItemProps {
    peer: PeerNode;
    onPing: (id: string) => void;
}

interface PeerScreenProps {
    navigation?: any;
    userRole?: 'sheep' | 'wolf'; // Add userRole prop
}

const PeerItem: React.FC<PeerItemProps> = ({ peer, onPing }) => (
    <View style={styles.peerCard}>
        <View style={styles.peerInfo}>
            <Text style={styles.peerId}>{peer.id}</Text>
            <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: peer.isOnline ? '#2ecc71' : '#e74c3c' }]} />
                <Text style={styles.responseTime}>Response Time: {peer.responseTime} ms</Text>
            </View>
        </View>
        <TouchableOpacity
            style={styles.pingButton}
            onPress={() => onPing(peer.id)}
        >
            <Text style={styles.pingText}>Ping</Text>
        </TouchableOpacity>
    </View>
);

const PeerScreen: React.FC<PeerScreenProps> = ({ navigation, userRole = 'sheep' }) => { // Default to sheep for this screen
    const [searchQuery, setSearchQuery] = useState('');
    const [peers, setPeers] = useState<PeerNode[]>([
        { id: '65513', responseTime: 250, isOnline: true },
        { id: '13413', responseTime: 102, isOnline: true },
        { id: '32223', responseTime: 829, isOnline: true },
        { id: '63243', responseTime: 544, isOnline: true },
        { id: '92139', responseTime: 312, isOnline: true },
        { id: '77890', responseTime: 180, isOnline: true },
        { id: '10101', responseTime: 650, isOnline: false },
    ]);

    const [filteredPeers, setFilteredPeers] = useState<PeerNode[]>(peers);
    const [totalPeers, setTotalPeers] = useState(156); // From image
    const [networkSpeed, setNetworkSpeed] = useState(250); // From image

    // Determine accent color based on user role
    const accentColor = userRole === 'wolf' ? '#e74c3c' : '#4A90E2'; // Red for wolf, blue for sheep

    useEffect(() => {
        const filtered = peers.filter(peer =>
            peer.id.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredPeers(filtered);
    }, [searchQuery, peers]);

    useEffect(() => {
        // Simulate real-time response time and network updates
        const interval = setInterval(() => {
            setPeers(prevPeers =>
                prevPeers.map(peer => ({
                    ...peer,
                    responseTime: Math.floor(Math.random() * 800) + 50,
                    isOnline: Math.random() > 0.1, // Simulate some peers going offline
                }))
            );
            setTotalPeers(Math.floor(Math.random() * 100) + 100); // Simulate fluctuating peer count
            setNetworkSpeed(Math.floor(Math.random() * 200) + 150); // Simulate fluctuating speed
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handlePing = (peerId: string) => {
        Alert.alert('Ping', `Pinging peer ${peerId}...`);
        // In a real application, you would send a ping request here
        // And update the response time for this specific peer
    };

    const handlePingAllPeers = () => {
        Alert.alert('Ping All', 'Pinging all connected peers...');
        // In a real application, this would trigger a broadcast ping
        setPeers(prevPeers =>
            prevPeers.map(peer => ({
                ...peer,
                responseTime: Math.floor(Math.random() * 800) + 50, // Simulate new ping responses
            }))
        );
    };

    const renderPeerItem = ({ item }: { item: PeerNode }) => (
        <PeerItem peer={item} onPing={handlePing} />
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            <ScrollView 
                showsVerticalScrollIndicator={false} 
                // contentContainerStyle={}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Peer Network</Text>
                    <Text style={styles.subtitle}>Signal strength & Connection status</Text>
                </View>

                {/* Network Overview */}
                <View style={[styles.networkOverviewCard, { borderColor: accentColor }]}>
                    <Text style={styles.networkOverviewTitle}>Network Overview</Text>
                    <View style={styles.networkStats}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{totalPeers}</Text>
                            <Text style={styles.statLabel}>Peers</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{networkSpeed}</Text>
                            <Text style={styles.statLabel}>kbps</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.pingAllButton, { backgroundColor: accentColor }]}
                        onPress={handlePingAllPeers}
                    >
                        <Text style={styles.pingAllText}>Ping All Peers</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <TextInput
                        style={[styles.searchInput, { borderColor: accentColor }]}
                        placeholder="Search...."
                        placeholderTextColor="#888"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    {/* Replace FlatList with direct rendering of peers */}
                    <View style={styles.listContainer}>
                        {filteredPeers.map((peer, index) => (
                            <React.Fragment key={peer.id}>
                                <PeerItem peer={peer} onPing={handlePing} />
                                {index < filteredPeers.length - 1 && <View style={{ height: 16 }} />}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </ScrollView>


            {/* Use the new BottomNav component */}
            <BottomNav navigation={navigation} userRole={userRole} activeScreen="peers" />
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
        paddingTop: 40,
        paddingBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#cccccc',
        textAlign: 'center',
    },
    networkOverviewCard: {
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#4A90E2', // Default, will be overridden by inline style
        alignItems: 'center',
    },
    networkOverviewTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 10,
    },
    networkStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    statLabel: {
        fontSize: 16,
        color: '#cccccc',
    },
    pingAllButton: {
        backgroundColor: '#4A90E2', // Default, will be overridden by inline style
        borderRadius: 8,
        paddingHorizontal: 35,
        paddingVertical: 14,
    },
    pingAllText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    searchInput: {
        backgroundColor: 'transparent',
        borderRadius: 8,
        padding: 16,
        fontSize: 16,
        color: '#888',
        borderWidth: 1,
        borderColor: '#4A90E2', // Default, will be overridden by inline style
        marginBottom: 20,
    },
    listContainer: {
        paddingBottom: 20,
        flexGrow: 1,
    },
    peerCard: {
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#4A90E2', // Default, will be overridden by accentColor
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    peerInfo: {
        flex: 1,
    },
    peerId: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    responseTime: {
        fontSize: 14,
        color: '#cccccc',
    },
    pingButton: {
        backgroundColor: '#4A90E2', // Default, will be overridden by accentColor
        borderRadius: 8,
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    pingText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: { // This style will be mostly handled by BottomNav component now
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    bottomNav: { // These styles are moved to BottomNav component
        flexDirection: 'row',
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'space-around',
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    navItem: { // These styles are moved to BottomNav component
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
});

export default PeerScreen;