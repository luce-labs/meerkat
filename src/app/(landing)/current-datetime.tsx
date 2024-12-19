"use client";

import { useEffect, useState } from "react";

export default function CurrentDateTime() {
  const [dateTime, setDateTime] = useState<string>("");

  useEffect(() => {
    const formatDateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 || 12;
      const day = now.toLocaleDateString("en-US", { weekday: "short" });
      const month = now.toLocaleDateString("en-US", { month: "short" });
      const date = now.getDate();

      return `${formattedHours}:${minutes} ${ampm} • ${day}, ${month} ${date}`;
    };

    setDateTime(formatDateTime());

    const interval = setInterval(() => {
      setDateTime(formatDateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <div className="text-sm text-gray-600">{dateTime}</div>;
}
