import React, { useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './screens/HomeScreen';
import AdminNewWolf from './screens/Wolf/AdminNewWolf';

type UserRole = 'sheep' | 'wolf';
type CurrentScreen = 'home' | 'admin';

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>('sheep');
  const [currentScreen, setCurrentScreen] = useState<CurrentScreen>('home');

  const toggleUserRole = () => {
    setUserRole(prevRole => prevRole === 'sheep' ? 'wolf' : 'sheep');
    setCurrentScreen('home'); // Reset to home when switching roles
  };

  const navigateToAdminPanel = () => {
    if (userRole === 'wolf') {
      setCurrentScreen('admin');
    }
  };

  const navigateToHome = () => {
    setCurrentScreen('home');
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.roleContainer}>
        <View style={styles.roleIndicator}>
          <Ionicons 
            name={userRole === 'wolf' ? 'shield-checkmark' : 'people'} 
            size={20} 
            color={userRole === 'wolf' ? '#e74c3c' : '#2ecc71'} 
          />
          <Text style={[styles.roleText, { color: userRole === 'wolf' ? '#e74c3c' : '#2ecc71' }]}>
            {userRole === 'wolf' ? 'Wolf Node (Admin)' : 'Sheep Node (User)'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.toggleButton} onPress={toggleUserRole}>
          <Ionicons name="swap-horizontal" size={16} color="#ffffff" />
          <Text style={styles.toggleText}>Switch Role</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity 
          style={[styles.navButton, currentScreen === 'home' && styles.activeNavButton]}
          onPress={navigateToHome}
        >
          <Ionicons name="home" size={16} color="#ffffff" />
          <Text style={styles.navButtonText}>Dashboard</Text>
        </TouchableOpacity>

        {userRole === 'wolf' && (
          <TouchableOpacity 
            style={[styles.navButton, currentScreen === 'admin' && styles.activeNavButton]}
            onPress={navigateToAdminPanel}
          >
            <Ionicons name="settings" size={16} color="#ffffff" />
            <Text style={styles.navButtonText}>Admin Panel</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderContent = () => {
    if (currentScreen === 'home') {
      return <HomeScreen userRole={userRole} />;
    } else if (currentScreen === 'admin' && userRole === 'wolf') {
      return <AdminNewWolf />;
    }
    return <HomeScreen userRole={userRole} />;
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerContainer: {
    backgroundColor: '#1a1a1a',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toggleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
  },
  activeNavButton: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  navButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});