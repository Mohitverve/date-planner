// PaymentApproval.jsx
import React, { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { Button, Select, message } from "antd";
import { db } from "../Components/firebase"; // adjust as needed

const PaymentApproval = ({ booking }) => {
  const [paymentType, setPaymentType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);
      if (!paymentType) {
        message.error("Please select a payment type first!");
        return;
      }

      // Update booking: set status to confirmed & store paymentType
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "confirmed",
        paymentType: paymentType,
      });
      message.success("Booking approved!");
    } catch (error) {
      console.error("Error approving booking:", error);
      message.error("Failed to approve booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      // Set booking status to rejected
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "rejected",
      });
      message.info("Booking rejected.");
    } catch (error) {
      console.error("Error rejecting booking:", error);
      message.error("Failed to reject booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 10 }}>
      <Select
        placeholder="Select Payment"
        style={{ width: 150 }}
        onChange={(value) => setPaymentType(value)}
      >
        <Select.Option value="kisses">Kisses</Select.Option>
        <Select.Option value="hugs">Hugs</Select.Option>
        <Select.Option value="food">Food</Select.Option>
      </Select>

      <Button
        type="primary"
        onClick={handleApprove}
        loading={loading}
        style={{ marginLeft: 8, background: "#ff69b4", border: "none" }}
      >
        Approve
      </Button>

      <Button
        danger
        onClick={handleReject}
        loading={loading}
        style={{ marginLeft: 8 }}
      >
        Reject
      </Button>
    </div>
  );
};

export default PaymentApproval;
