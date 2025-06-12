import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface BottomNavProps {
    navigation: any;
    userRole: 'sheep' | 'wolf';
    activeScreen: string; // To highlight the current active screen
}

const BottomNav: React.FC<BottomNavProps> = ({ navigation, userRole, activeScreen }) => {
    // Determine accent color based on user role
    const accentColor = userRole === 'wolf' ? '#e74c3c' : '#4A90E2';
    const inactiveNavColor = '#666';

    const handleNavigation = (screen: string) => {
        if (navigation) {
            navigation.navigate(screen);
        }
    };

    return (
        <View style={styles.footer}>
            <View style={[styles.bottomNav, { borderColor: accentColor }]}>
                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => handleNavigation('home')}
                >
                    <Ionicons name="home" size={24} color={activeScreen === 'home' ? accentColor : inactiveNavColor} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => handleNavigation('messages')}
                >
                    <Ionicons name="chatbubble" size={24} color={activeScreen === 'messages' ? accentColor : inactiveNavColor} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        if (userRole === 'wolf') {
                            handleNavigation('wolfBroadcast');
                        } else {
                            //TODO: idhar ek sheep specific page daalna hai
                            //nav is handled in App.tsx
                            console.log('Broadcast feature for sheep node');
                        }
                    }}
                >
                    <Ionicons name="radio" size={24} color={activeScreen === 'wolfBroadcast' || activeScreen === 'Broadcast' ? accentColor : inactiveNavColor} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navItem}
                    onPress={() => {
                        // if (userRole === 'wolf') {
                        //     handleNavigation('peers');
                        // } else {
                        //     handleNavigation('peers');
                        // }
                        handleNavigation('peers');
                        // Not actually correct to do it like this but workss!
                    }}
                >
                    <Ionicons name="people" size={24} color={activeScreen === 'AdminNewWolf' || activeScreen === 'peers' ? accentColor : inactiveNavColor} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    footer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        backgroundColor: '#1a1a1a', // Ensure footer background matches overall container
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'space-around',
        borderWidth: 1,
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
});

export default BottomNav;