'use client'
import React, { useEffect, useState } from 'react'
import ChatPage from './ChatPage'
import PushNotificationLayout from '@/components/firebaseNotification/PushNotification'

const ChatApp = () => {
    const [notificationData, setNotificationData] = useState(null);
    const handleNotificationReceived = (data) => {
        setNotificationData(data);
    };
    useEffect(() => {}, [notificationData])
    return (
        <PushNotificationLayout onNotificationReceived={handleNotificationReceived}>
            <ChatPage notificationData={notificationData} />
        </PushNotificationLayout>
    )
}

export default ChatApp