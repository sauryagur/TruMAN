import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type MessagePriority = 'Critical' | 'High' | 'Normal';

interface BroadcastMessagesProps {
    navigation?: any;
    userRole?: 'sheep' | 'wolf';
}

const BroadcastMessages: React.FC<BroadcastMessagesProps> = ({ navigation, userRole = 'wolf' }) => {
    const [selectedPriority, setSelectedPriority] = useState<MessagePriority>('Critical');
    const [messageText, setMessageText] = useState('');

    const priorityColors = {
        Critical: '#e74c3c',
        High: '#f39c12',
        Normal: '#4A90E2',
    };

    const handleBroadcast = () => {
        if (messageText.trim()) {
            // Here you would implement the actual broadcast logic
            console.log(`Broadcasting ${selectedPriority} message: ${messageText}`);
            // Clear the message after broadcasting
            setMessageText('');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

            <View style={styles.header}>
                <Text style={styles.title}>Broadcast</Text>
                <Text style={styles.subtitle}>Send messages to the network</Text>
            </View>

            <View style={styles.content}>
                {/* Compose Messages Section */}
                <View style={styles.composeSection}>
                    <Text style={styles.sectionTitle}>Compose Messages</Text>
                    
                    {/* Priority Selection */}
                    <View style={styles.priorityContainer}>
                        {(['Critical', 'High', 'Normal'] as MessagePriority[]).map((priority) => (
                            <TouchableOpacity
                                key={priority}
                                style={[
                                    styles.priorityButton,
                                    selectedPriority === priority && {
                                        backgroundColor: priorityColors[priority],
                                        borderColor: priorityColors[priority],
                                    }
                                ]}
                                onPress={() => setSelectedPriority(priority)}
                            >
                                <Text style={[
                                    styles.priorityButtonText,
                                    selectedPriority === priority && styles.priorityButtonTextActive
                                ]}>
                                    {priority}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Message Input */}
                    <TextInput
                        style={styles.messageInput}
                        multiline
                        numberOfLines={4}
                        placeholder="Enter emergency message..."
                        placeholderTextColor="#666"
                        value={messageText}
                        onChangeText={setMessageText}
                        textAlignVertical="top"
                    />

                    {/* Broadcast Button */}
                    <TouchableOpacity 
                        style={[
                            styles.broadcastButton,
                            !messageText.trim() && styles.broadcastButtonDisabled
                        ]}
                        onPress={handleBroadcast}
                        disabled={!messageText.trim()}
                    >
                        <Text style={styles.broadcastButtonText}>Broadcast Message</Text>
                    </TouchableOpacity>
                </View>

                {/* Network Status Section */}
                <View style={styles.statusSection}>
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Network Status</Text>
                        <View style={styles.statusIndicator}>
                            <View style={styles.onlineIndicator} />
                            <Text style={styles.statusValue}>Online</Text>
                        </View>
                    </View>
                    
                    <View style={styles.statusRow}>
                        <Text style={styles.statusLabel}>Network Strength</Text>
                        <Text style={styles.statusValue}>250 kbps</Text>
                    </View>
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    composeSection: {
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e74c3c',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e74c3c',
        marginBottom: 16,
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    priorityButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#333',
        borderWidth: 1,
        borderColor: '#555',
    },
    priorityButtonText: {
        color: '#cccccc',
        fontSize: 14,
        fontWeight: '600',
    },
    priorityButtonTextActive: {
        color: '#ffffff',
    },
    messageInput: {
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 16,
        color: '#ffffff',
        fontSize: 16,
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#555',
        marginBottom: 16,
    },
    broadcastButton: {
        backgroundColor: '#e74c3c',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
    },
    broadcastButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.5,
    },
    broadcastButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusSection: {
        backgroundColor: '#2a2a3a',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: '#e74c3c',
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    statusLabel: {
        fontSize: 16,
        color: '#cccccc',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    onlineIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#2ecc71',
    },
    statusValue: {
        fontSize: 16,
        color: '#ffffff',
        fontWeight: '600',
    },
});

export default BroadcastMessages;