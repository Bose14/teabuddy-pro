import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";

export type FilterPeriod = "today" | "week" | "month" | "custom" | "overall";

interface DashboardFilterProps {
  selectedPeriod: FilterPeriod;
  onFilterChange: (startDate: string | null, endDate: string | null, period: FilterPeriod) => void;
}

export function DashboardFilter({ selectedPeriod, onFilterChange }: DashboardFilterProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Generate years from 2020 to current year + 1
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => currentYear - i);

  const calculateDates = (period: FilterPeriod) => {
    const today = new Date();
    let startDate: string | null = null;
    let endDate: string | null = null;

    switch (period) {
      case "today":
        startDate = format(today, "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;

      case "week":
        startDate = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        endDate = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
        break;

      case "month":
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        endDate = format(endOfMonth(today), "yyyy-MM-dd");
        break;

      case "custom":
        const customDate = new Date(selectedYear, selectedMonth, 1);
        startDate = format(startOfMonth(customDate), "yyyy-MM-dd");
        endDate = format(endOfMonth(customDate), "yyyy-MM-dd");
        break;

      case "overall":
        startDate = null;
        endDate = null;
        break;
    }

    onFilterChange(startDate, endDate, period);
  };

  useEffect(() => {
    calculateDates(selectedPeriod);
  }, [selectedPeriod, selectedMonth, selectedYear]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <Select
        value={selectedPeriod}
        onValueChange={(value) => {
          const newPeriod = value as FilterPeriod;
          calculateDates(newPeriod);
        }}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">📅 Today</SelectItem>
          <SelectItem value="week">📊 This Week</SelectItem>
          <SelectItem value="month">📈 This Month</SelectItem>
          <SelectItem value="custom">🗓️ Select Month</SelectItem>
          <SelectItem value="overall">🌍 Overall</SelectItem>
        </SelectContent>
      </Select>

      {selectedPeriod === "custom" && (
        <>
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </>
      )}
    </div>
  );
}
