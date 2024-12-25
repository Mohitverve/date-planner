// BookingForm.jsx
import React, { useState } from "react";
import { Form, Input, Button, DatePicker, TimePicker, message } from "antd";
import { addDoc, collection } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import moment from "moment";
import { db } from "../Components/firebase"; // adjust path as needed

const BookingForm = ({ user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  
  // Grab bookingTarget from the router state
  const { bookingTarget } = location.state || {};

  // Optional checks
  if (!user?.uid) {
    return <p style={{ textAlign: "center", marginTop: 20 }}>No user found. Please log in again.</p>;
  }
  if (!bookingTarget?.uid) {
    return <p style={{ textAlign: "center", marginTop: 20 }}>No partner info. Return to Home.</p>;
  }

  const onFinish = async (values) => {
    try {
      setLoading(true);

      // Combine date and time into a single JS Date using moment
      const selectedDate = values.date.format("YYYY-MM-DD");
      const selectedTime = values.time.format("HH:mm");
      const dateTimeString = `${selectedDate} ${selectedTime}`;
      const dateTime = moment(dateTimeString, "YYYY-MM-DD HH:mm").toDate();

      await addDoc(collection(db, "bookings"), {
        fromUserId: user.uid,
        fromUserName: user.displayName || user.email || "Anonymous",
        targetUserId: bookingTarget.uid,
        targetUserName: bookingTarget.name || bookingTarget.displayName || "Partner",
        dateTime: dateTime,
        location: values.location || "",
        notes: values.notes || "",
        createdAt: new Date(),
        status: "pendingPayment", // NEW: booking is created pending payment
        paymentType: "",          // NEW: empty until partner decides
      });

      message.success("Booking created successfully!");
      navigate("/BookingsList");
    } catch (error) {
      console.error("Error creating booking:", error);
      message.error("Failed to create booking. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>Book a Date</h2>
      <p style={{ textAlign: "center" }}>
        You’re booking a date with <strong>{bookingTarget.name || bookingTarget.displayName}</strong>
      </p>

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="date"
          label="Select Date"
          rules={[{ required: true, message: "Please select a date!" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="time"
          label="Select Time"
          rules={[{ required: true, message: "Please select a time!" }]}
        >
          <TimePicker format="HH:mm" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="location" label="Location">
          <Input placeholder="Where are you going?" />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea placeholder="Any special notes or instructions..." rows={4} />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{ background: "#ff69b4", border: "none" }}
        >
          Create Booking
        </Button>
      </Form>
    </div>
  );
};

export default BookingForm;
