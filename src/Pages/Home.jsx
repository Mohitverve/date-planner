// Home.jsx
import React, { useEffect, useState } from "react";
import { Layout, Spin, Avatar, message, Card, Button, List } from "antd";
import { doc, getDoc, query, collection, where, getDocs, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { auth, db } from "../Components/firebase";
import PaymentApproval from "../Components/PaymentApproval"; // If you're using the payment approval flow

const { Header, Content } = Layout;

const Home = ({ user }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [partner, setPartner] = useState(null);

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  // Loading main page
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.uid) {
      message.error("No user found. Please log in.");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        // 1) Get the current user's doc (for displayName, photoURL, role, etc.)
        const userDocSnap = await getDoc(doc(db, "users", user.uid));
        if (userDocSnap.exists()) {
          setUserProfile(userDocSnap.data());
        } else {
          console.warn("Current user doc not found in Firestore.");
        }

        // 2) Once we have the user’s role, we can find the partner with the opposite role
        //    But only if the user doc actually has role data
        const userData = userDocSnap.data();
        if (userData?.role) {
          const oppositeRole = userData.role === "bf" ? "gf" : "bf";

          // Query for a partner with the opposite role
          const partnerQuery = query(collection(db, "users"), where("role", "==", oppositeRole));
          const partnerSnapshot = await getDocs(partnerQuery);

          if (!partnerSnapshot.empty) {
            // For simplicity, take the first partner doc
            setPartner(partnerSnapshot.docs[0].data());
          } else {
            console.warn(`No partner found with role '${oppositeRole}'.`);
          }
        }
      } catch (error) {
        console.error("Error fetching user/partner data:", error);
        message.error("Could not load user/partner data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // 3) Listen to the "bookings" collection for the current user
    const userBookingsRef = collection(db, "bookings");

    // Bookings where user is fromUserId
    const q1 = query(userBookingsRef, where("fromUserId", "==", user.uid));
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      const newBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings((prev) => [...prev, ...newBookings]);
    });

    // Bookings where user is targetUserId
    const q2 = query(userBookingsRef, where("targetUserId", "==", user.uid));
    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      const newBookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings((prev) => [...prev, ...newBookings]);
      setBookingsLoading(false);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user, navigate]);

  // Sort bookings by date/time ascending
  const sortedBookings = bookings.sort((a, b) => {
    const dateA = a.dateTime?.toDate?.() ?? a.dateTime;
    const dateB = b.dateTime?.toDate?.() ?? b.dateTime;
    return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
  });

  // Logout handler
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // If still fetching user doc and partner info
  if (loading) {
    return <Spin style={{ display: "block", margin: "auto", marginTop: "20%" }} />;
  }

  return (
    <Layout>
      {/* App Header */}
      <Header
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#ff69b4",
          alignItems: "center",
        }}
      >
        {/* Left side: User's avatar + display name */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {userProfile?.photoURL ? (
            <Avatar size="large" src={userProfile.photoURL} />
          ) : (
            <Avatar size="large">U</Avatar>
          )}
          <h2 style={{ color: "white", margin: 0, fontFamily: "Poppins" }}>
            {userProfile?.displayName || "My Profile"}
          </h2>
        </div>

        {/* Right side: Buttons */}
        <div>
          {/* Navigate to Profile page */}
          <Button onClick={() => navigate("/profile")} style={{ marginRight: 8 }}>
            Profile
          </Button>
          <Button type="primary" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </Header>

      {/* Main Content */}
      <Content style={{ padding: 20, fontFamily: "Poppins" }}>
        {/* Partner Card (if found) */}
        {partner ? (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <Card
              cover={<img alt={partner.name} src={partner.photoURL} />}
              style={{ 
                maxWidth: 300, 
                margin: "0 auto", 
                backgroundColor: "#ffe6f0", 
                borderRadius: "8px" 
              }}
            >
              <Card.Meta
                title={partner.name || partner.displayName || "Partner"}
                description={`Email: ${partner.email}`}
              />
              <Button
                type="primary"
                onClick={() =>
                  navigate("/BookingForm", {
                    state: { bookingTarget: partner },
                  })
                }
                style={{ marginTop: 10, background: "#ff69b4", border: "none" }}
              >
                Book {partner.name || partner.displayName}
              </Button>
            </Card>
          </div>
        ) : (
          <p style={{ textAlign: "center" }}>No partner found for booking.</p>
        )}

        {/* Bookings List */}
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: 20 }}>Your Bookings</h2>

          {bookingsLoading ? (
            <Spin style={{ display: "block", margin: "auto", marginTop: "20%" }} />
          ) : sortedBookings.length === 0 ? (
            <p style={{ textAlign: "center" }}>No bookings found.</p>
          ) : (
            <List
              // A two-column grid (adjust breakpoints as desired)
              grid={{ gutter: 24, xs: 1, sm: 1, md: 2, lg: 2 }}
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
                      style={{ 
                        backgroundColor: "#ffe6f0", 
                        borderRadius: "8px" 
                      }}
                    >
                      <p>
                        <strong>Date & Time:</strong> {formattedDate}
                      </p>
                      {booking.location && (
                        <p>
                          <strong>Location:</strong> {booking.location}
                        </p>
                      )}
                      {booking.notes && (
                        <p>
                          <strong>Notes:</strong> {booking.notes}
                        </p>
                      )}

                      <p>
                        <strong>Status:</strong> {booking.status}
                      </p>
                      {booking.paymentType && (
                        <p>
                          <strong>Payment:</strong> {booking.paymentType}
                        </p>
                      )}

                      {/* Payment approval if user is the target and status is pendingPayment */}
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
      </Content>
    </Layout>
  );
};

export default Home;
