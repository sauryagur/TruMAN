import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import backendService from '../services/backend';

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
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
    const [allMessages, setAllMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [messageCategory, setMessageCategory] = useState<'Normal' | 'High' | 'Critical'>('Normal');

    // Determine accent color based on user role for bottom navigation and selected filter buttons
    const accentColor = userRole === 'wolf' ? '#e74c3c' : '#4A90E2';
    const inactiveNavColor = '#666';

    // Effect to poll for new messages
    useEffect(() => {
        const fetchMessages = () => {
            try {
                const events = backendService.collectEvents();
                if (events.length > 0) {
                    const newMessages = events
                        .map(event => {
                            try {
                                const parsed = JSON.parse(event);
                                if (parsed.type === 'message' && parsed.data && parsed.data.message) {
                                    const msg = parsed.data.message;
                                    return {
                                        id: `msg-${Date.now()}-${Math.random()}`,
                                        sender: parsed.data.peer || 'Unknown',
                                        time: new Date().toLocaleTimeString(),
                                        content: msg.message,
                                        category: msg.tags === 'emergency' ? 'Critical' : 
                                                 msg.tags === 'important' ? 'High' : 'Normal'
                                    };
                                }
                                return null;
                            } catch (e) {
                                console.error('Failed to parse event:', e);
                                return null;
                            }
                        })
                        .filter(Boolean) as Message[];
                    
                    if (newMessages.length > 0) {
                        setAllMessages(prev => [...newMessages, ...prev]);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch messages:', error);
            }
        };
        
        // Poll for messages every 2 seconds
        const interval = setInterval(fetchMessages, 2000);
        
        return () => clearInterval(interval);
    }, []);

    // Filter messages when category or messages change
    useEffect(() => {
        if (selectedCategory === 'All') {
            setFilteredMessages(allMessages);
        } else {
            setFilteredMessages(allMessages.filter(msg => msg.category === selectedCategory));
        }
    }, [selectedCategory, allMessages]);

    // Function to send a new message
    const sendMessage = () => {
        if (!newMessage.trim()) {
            Alert.alert('Error', 'Please enter a message');
            return;
        }
        
        let tag = 'general';
        if (messageCategory === 'Critical') tag = 'emergency';
        if (messageCategory === 'High') tag = 'important';
        
        try {
            const success = backendService.broadcastMessage(newMessage, tag);
            if (success) {
                // Add to local messages immediately for UI responsiveness
                const newMsg: Message = {
                    id: `local-${Date.now()}`,
                    sender: 'You',
                    time: 'Just now',
                    content: newMessage,
                    category: messageCategory
                };
                setAllMessages(prev => [newMsg, ...prev]);
                setNewMessage('');
                Alert.alert('Success', 'Message sent successfully');
            } else {
                Alert.alert('Error', 'Failed to send message');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    // Toggle message category
    const toggleCategory = () => {
        if (messageCategory === 'Normal') setMessageCategory('High');
        else if (messageCategory === 'High') setMessageCategory('Critical');
        else setMessageCategory('Normal');
    };

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

            {/* Message input area */}
            <View style={styles.messageInputContainer}>
                <TextInput
                    style={styles.messageInput}
                    placeholder="Type your message here..."
                    placeholderTextColor="#999"
                    value={newMessage}
                    onChangeText={setNewMessage}
                    multiline
                />
                <View style={styles.messageInputActions}>
                    <TouchableOpacity 
                        onPress={toggleCategory} 
                        style={[
                            styles.categoryToggle,
                            { backgroundColor: accentColor }
                        ]}
                    >
                        <Text style={styles.categoryToggleText}>{messageCategory}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
                        <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

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
    messageInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#2a2a3a',
    },
    messageInput: {
        flex: 1,
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#333',
        color: '#fff',
        fontSize: 16,
        marginRight: 8,
    },
    messageInputActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    categoryToggle: {
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    categoryToggleText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 14,
    },
    sendButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 10,
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
