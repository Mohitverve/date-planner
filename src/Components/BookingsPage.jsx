import React, { useEffect, useState } from 'react';
import { List, Card, Spin } from 'antd';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: 'auto' }} />;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>My Bookings</h2>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={bookings}
        renderItem={(booking) => (
          <List.Item>
            <Card title={`${booking.date} at ${booking.time}`}>
              Payment: {booking.payment}
            </Card>
          </List.Item>
        )}
      />
    </div>
  );
};

export default BookingsPage;
