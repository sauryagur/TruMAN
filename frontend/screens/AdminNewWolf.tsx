import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav'; // Import the new BottomNav component

interface WolfNode {
  id: string;
  responseTime: number;
  isOnline: boolean;
}

interface WolfItemProps {
  wolf: WolfNode;
  onPromote: (id: string) => void;
}

interface AdminNewWolfProps {
  navigation?: any;
  userRole?: 'sheep' | 'wolf'; // Add userRole prop
}

const WolfItem: React.FC<WolfItemProps> = ({ wolf, onPromote }) => (
    <View style={styles.wolfCard}>
      <View style={styles.wolfInfo}>
        <Text style={styles.wolfId}>{wolf.id}</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusDot} />
          <Text style={styles.responseTime}>Response Time: {wolf.responseTime} ms</Text>
        </View>
      </View>
      <TouchableOpacity
          style={styles.promoteButton}
          onPress={() => onPromote(wolf.id)}
      >
        <Text style={styles.promoteText}>Promote</Text>
      </TouchableOpacity>
    </View>
);

const AdminNewWolf: React.FC<AdminNewWolfProps> = ({ navigation, userRole = 'wolf' }) => { // Default to wolf for this screen
  const [searchQuery, setSearchQuery] = useState('');
  const [wolves, setWolves] = useState<WolfNode[]>([
    { id: '65513', responseTime: 250, isOnline: true },
    { id: '13413', responseTime: 102, isOnline: true },
    { id: '32223', responseTime: 829, isOnline: true },
    { id: '63243', responseTime: 544, isOnline: true },
    { id: '92139', responseTime: 312, isOnline: true },
  ]);

  const [filteredWolves, setFilteredWolves] = useState<WolfNode[]>(wolves);

  // Determine accent color for this screen (always red for wolf admin)
  const accentColor = '#e74c3c';

  useEffect(() => {
    const filtered = wolves.filter(wolf =>
        wolf.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredWolves(filtered);
  }, [searchQuery, wolves]);

  useEffect(() => {
    // Simulate real-time response time updates
    const interval = setInterval(() => {
      setWolves(prevWolves =>
          prevWolves.map(wolf => ({
            ...wolf,
            responseTime: Math.floor(Math.random() * 800) + 50,
          }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handlePromote = (wolfId: string) => {
    Alert.alert(
        'Promote Wolf',
        `Are you sure you want to promote wolf ${wolfId}?`,
        [{
          text: 'Cancel',
          style: 'cancel',
        },
          {
            text: 'Promote',
            onPress: () => {
              setWolves(prevWolves => prevWolves.filter(wolf => wolf.id !== wolfId));
              Alert.alert('Success', `Wolf ${wolfId} has been promoted!`);
            },
          },]
    );
  };

  const renderWolfItem = ({ item }: { item: WolfNode }) => (
      <WolfItem wolf={item} onPromote={handlePromote} />
  );

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

        {/* Header with Back Button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation?.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={accentColor} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>New Wolf</Text>
            <Text style={styles.subtitle}>Assign a new wolf for yourself</Text>
          </View>
        </View>
        <View style={{ flex: 1}}>
          <View style={styles.content}>
            <TextInput
                style={[styles.searchInput, { borderColor: accentColor }]}
                placeholder="Search..."
                placeholderTextColor="#888"
                value={searchQuery}
                onChangeText={setSearchQuery}
            />

            <FlatList
                data={filteredWolves}
                renderItem={renderWolfItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />
          </View>
        </View>
        {/* Use the new BottomNav component */}
        <BottomNav navigation={navigation} userRole={userRole} activeScreen="AdminNewWolf" />
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  headerContainer: {
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#cccccc',
    textAlign: 'center',
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
    marginBottom: 32,
  },
  listContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  wolfCard: {
    backgroundColor: '#2a2a3a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e74c3c', // Red tint for wolf cards
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wolfInfo: {
    flex: 1,
  },
  wolfId: {
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
    backgroundColor: '#2ecc71', // Green for online status
    marginRight: 8,
  },
  responseTime: {
    fontSize: 14,
    color: '#cccccc',
  },
  promoteButton: {
    backgroundColor: '#e74c3c', // Red tint for promote button
    borderRadius: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  promoteText: {
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

export default AdminNewWolf;