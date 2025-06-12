import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav'; // Import the new BottomNav component

interface Message {
    id: string;
    sender: string;
    time: string;
    content: string;
    category: 'Critical' | 'High' | 'Normal'; // Removed 'Verified'
}

interface MessagesScreenProps {
    navigation?: any;
    userRole?: 'sheep' | 'wolf'; // Inherit userRole for theme consistency
}

const categoryColors = {
    Critical: '#e74c3c', // Red
    High: '#f39c12',     // Orange
    Normal: '#4A90E2',    // Blue
    // Removed 'Verified' from here as well
};

const MessagesScreen: React.FC<MessagesScreenProps> = ({ navigation, userRole = 'sheep' }) => {
    const allMessages: Message[] = [
        { id: '1', sender: 'Wolf Alpha', time: '2 mins ago', content: 'Emergency evacuation notice: Clear the downtown area immediately. Safe zones are marked in green.', category: 'Critical' },
        { id: '2', sender: 'Wolf Beta', time: '15 mins ago', content: 'Network maintenance scheduled for 03:00. Brief connectivity interruption expected.', category: 'High' },
        { id: '3', sender: 'Wolf Gamma', time: '1 hour ago', content: 'Weather Alert: Severe storm approaching from the west. Seek shelter immediately.', category: 'Normal' },
        { id: '4', sender: 'Wolf Delta', time: 'Yesterday', content: 'Routine system update completed successfully. No action required.', category: 'Normal' }, // Changed to 'Normal'
        { id: '5', sender: 'Wolf Alpha', time: '2 hours ago', content: 'High traffic detected in sector 7. Avoid unnecessary movement.', category: 'High' },
        { id: '6', sender: 'Wolf Gamma', time: '30 mins ago', content: 'All clear in Zone B. Resume normal activities.', category: 'Normal' }, // Changed to 'Normal'
    ];

    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [filteredMessages, setFilteredMessages] = useState<Message[]>(allMessages);

    // Determine accent color based on user role for bottom navigation and selected filter buttons
    const accentColor = userRole === 'wolf' ? '#e74c3c' : '#4A90E2';
    const inactiveNavColor = '#666';

    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredMessages(allMessages);
        } else {
            // Filter by category, ensuring it's a valid category from `categoryColors`
            setFilteredMessages(allMessages.filter(msg => msg.category === selectedCategory));
        }
    }, [selectedCategory]);

    const renderMessageCard = ({ item }: { item: Message }) => (
        <View style={styles.messageCard}>
            <View style={styles.messageHeader}>
                <Text style={styles.messageSender}>{item.sender}</Text>
                {/* Small circle indicator moved to the left of time */}
                <View style={styles.messageTimeContainer}>
                    <View style={[styles.messageCategoryIndicator, { backgroundColor: categoryColors[item.category] }]} />
                    <Text style={styles.messageTime}>{item.time}</Text>
                </View>
            </View>
            <Text style={styles.messageContent}>{item.content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            <View style={styles.header}>
                <Text style={styles.title}>Message Feed</Text>
                <Text style={styles.subtitle}>Received emergency messages</Text>
            </View>

            <View style={styles.categoryFilters}>
                {['All', 'Critical', 'High', 'Normal'].map((category) => ( // Removed 'Verified'
                    <TouchableOpacity
                        key={category}
                        style={[
                            styles.categoryButton,
                            // All selected category buttons now use the accentColor for consistency
                            selectedCategory === category && { backgroundColor: accentColor, borderColor: accentColor, borderWidth: 2 },
                        ]}
                        onPress={() => setSelectedCategory(category)}
                    >
                        <Text style={styles.categoryButtonText}>{category}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={filteredMessages}
                renderItem={renderMessageCard}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            />

            {/* Use the new BottomNav component */}
            <BottomNav navigation={navigation} userRole={userRole} activeScreen="Messages" />
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
    categoryFilters: {
        flexDirection: 'row',
        justifyContent: 'center', // Changed from 'space-around' to 'center'
        gap: 10, // Added gap for spacing between buttons
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    categoryButton: {
        backgroundColor: '#333', // Default background for unselected buttons
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#333', // Default border for unselected buttons
    },
    categoryButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 12,
    },
    listContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    messageCard: {
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1, // Keep default border, as indicator is now separate
        borderColor: '#4a4a4a', // A neutral border color for the card itself
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center', // Align items vertically in header
        marginBottom: 8,
    },
    messageSender: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    messageTimeContainer: { // New container for indicator and time
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5, // Space between indicator and time
    },
    messageTime: {
        fontSize: 12,
        color: '#cccccc',
    },
    messageContent: {
        fontSize: 14,
        color: '#e0e0e0',
        lineHeight: 20,
        marginBottom: 10, // Add space for the indicator
    },
    messageCategoryIndicator: { // New style for the small circle indicator
        width: 10,
        height: 10,
        borderRadius: 5,
        // Position now handled by messageTimeContainer
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

export default MessagesScreen;
