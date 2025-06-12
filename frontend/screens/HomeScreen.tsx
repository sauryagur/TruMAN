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
interface StatusCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color: string;
}
interface HomeScreenProps {
  userRole?: 'sheep' | 'wolf';
  navigation?: any; // Add navigation prop
}
const StatusCard: React.FC<StatusCardProps> = ({ icon, title, value, color }) => (
  <TouchableOpacity style={styles.statusCard}>
    <View style={styles.cardHeader}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.cardTitle, { color }]}>{title}</Text>
    </View>
    <Text style={styles.cardValue}>{value}</Text>
  </TouchableOpacity>
);
const HomeScreen: React.FC<HomeScreenProps> = ({ userRole = 'sheep', navigation }) => {
  const [networkStatus, setNetworkStatus] = useState('Connected');
  const [connectedPeers, setConnectedPeers] = useState(156);
  const [lastBroadcast, setLastBroadcast] = useState('5 minutes ago');
  const [networkStrength, setNetworkStrength] = useState('250 kbps');
  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setConnectedPeers(prev => prev + Math.floor(Math.random() * 5) - 2);
      setNetworkStrength(`${Math.floor(Math.random() * 500) + 100} kbps`);
    }, 10000);
    return () => clearInterval(interval);
  }, []);
  // Different capabilities based on user role
  const getEmergencyButtonText = () => {
    return userRole === 'wolf' ? 'Admin Emergency Broadcast' : 'Emergency Broadcast';
  };
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
  const handleNavigation = (screen: string) => {
    if (navigation) {
      navigation.navigate(screen);
    }
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
        <StatusCard
          icon="wifi"
          title="Network Status"
          value={networkStatus}
          color="#4A90E2"
        />
        <StatusCard
          icon="people"
          title="Connected Peers"
          value={`${connectedPeers} nodes`}
          color="#4A90E2"
        />
        <StatusCard
          icon="radio"
          title="Last Broadcast"
          value={lastBroadcast}
          color="#4A90E2"
        />
        <StatusCard
          icon="cellular"
          title="Network Strength"
          value={networkStrength}
          color="#4A90E2"
        />

        {/* Additional Wolf Node Features */}
        {userRole === 'wolf' && (
          <View style={styles.wolfFeatures}>
            <StatusCard
              icon="shield-checkmark"
              title="Wolf Authority Level"
              value="Administrative"
              color="#e74c3c"
            />
            <StatusCard
              icon="server"
              title="Managed Nodes"
              value="23 sheep nodes"
              color="#e74c3c"
            />
          </View>
        )}
      </View>
    </ScrollView>
      <View style={styles.footer}>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigation('Home')}
          >
            <Ionicons name="home" size={24} color="#4A90E2" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => handleNavigation('Messages')}
          >
            <Ionicons name="chatbubble" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              if (userRole === 'wolf') {
                handleNavigation('WolfBroadcast');
              } else {
                console.log('Broadcast feature');
              }
            }}
          >
            <Ionicons name="radio" size={24} color="#666" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => {
              if (userRole === 'wolf') {
                handleNavigation('AdminNewWolf');
              } else {
                handleNavigation('Peers');
              }
            }}
          >
            <Ionicons name="people" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>
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
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  statusCard: {
    backgroundColor: '#2a2a3a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emergencyButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  wolfEmergencyButton: {
    backgroundColor: '#c0392b',
  },
  emergencyText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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