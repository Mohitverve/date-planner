// BookingsList.jsx
import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { List, Card, Spin, message } from "antd";
import moment from "moment";
import { db } from "../Components/firebase"; // adjust as needed
import PaymentApproval from "./PaymentApproval"; // import the PaymentApproval component

const BookingsList = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      message.error("User not found. Please log in.");
      return;
    }

    // Query for bookings initiated by this user
    const userBookingsRef = collection(db, "bookings");
    const q1 = query(userBookingsRef, where("fromUserId", "==", user.uid));

    // Listen to fromUserId
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const newBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // We merge with existing bookings so we don't overwrite the array
      setBookings((prev) => [...prev, ...newBookings]);
    });

    // Query for bookings where this user is the target
    const q2 = query(userBookingsRef, where("targetUserId", "==", user.uid));

    // Listen to targetUserId
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings((prev) => [...prev, ...newBookings]);
      setLoading(false);
    });

    // Clean up
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user]);

  // Sort by dateTime ascending
  const sortedBookings = bookings.sort((a, b) => {
    const dateA = a.dateTime?.toDate?.() ?? a.dateTime;
    const dateB = b.dateTime?.toDate?.() ?? b.dateTime;
    return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
  });

  if (loading) {
    return <Spin style={{ display: "block", margin: "auto", marginTop: "20%" }} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>Your Bookings</h2>
      {sortedBookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        <List
          grid={{ gutter: 16, column: 1 }}
          dataSource={sortedBookings}
          renderItem={(booking) => {
            const dateObj = booking.dateTime?.toDate?.() ?? booking.dateTime;
            const formattedDate = dateObj
              ? moment(dateObj).format("YYYY-MM-DD HH:mm")
              : "N/A";

            return (
              <List.Item key={booking.id}>
                <Card
                  title={
                    booking.fromUserId === user.uid
                      ? `You booked a date with ${booking.targetUserName}`
                      : `${booking.fromUserName} booked a date with you`
                  }
                  style={{ backgroundColor: "#ffe6f0", borderRadius: "8px" }}
                >
                  <p><strong>Date & Time:</strong> {formattedDate}</p>
                  {booking.location && <p><strong>Location:</strong> {booking.location}</p>}
                  {booking.notes && <p><strong>Notes:</strong> {booking.notes}</p>}
                  
                  {/* Show the status */}
                  <p><strong>Status:</strong> {booking.status}</p>
                  {/* If partner chooses a paymentType, show it */}
                  {booking.paymentType && (
                    <p><strong>Payment:</strong> {booking.paymentType}</p>
                  )}

                  {/* If this user is the target and booking is pendingPayment, show approval UI */}
                  {booking.targetUserId === user.uid && booking.status === "pendingPayment" && (
                    <PaymentApproval booking={booking} />
                  )}
                </Card>
              </List.Item>
            );
          }}
        />
      )}
    </div>
  );
};

export default BookingsList;
