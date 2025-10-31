import { useState } from "react";

export type SalesPeriod = "hour" | "today" | "week" | "month" | "year" | "ever";

export const useSalesFilters = () => {
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("today");

  const filterByPeriod = (items: any[], dateKey: string = "createdAt") => {
    const now = new Date();

    return items.filter((item) => {
      const createdAt = new Date(item[dateKey] || now);

      switch (salesPeriod) {
        case "hour":
          const oneHourAgo = new Date(now);
          oneHourAgo.setHours(now.getHours() - 1);
          return createdAt >= oneHourAgo;
        case "today":
          return createdAt.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return createdAt >= weekAgo;
        case "month":
          return (
            createdAt.getMonth() === now.getMonth() &&
            createdAt.getFullYear() === now.getFullYear()
          );
        case "year":
          return createdAt.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  };

  return { salesPeriod, setSalesPeriod, filterByPeriod };
};
