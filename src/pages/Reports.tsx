import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText } from "lucide-react";
import { format, startOfWeek, startOfMonth, subDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Reports() {
  const [filterType, setFilterType] = useState("monthly");

  const { data: salesData } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: expensesData } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getFilteredData = () => {
    const today = format(new Date(), "yyyy-MM-dd");
    let startDate = "";

    switch (filterType) {
      case "daily":
        startDate = today;
        break;
      case "weekly":
        startDate = format(startOfWeek(new Date()), "yyyy-MM-dd");
        break;
      case "monthly":
        startDate = format(startOfMonth(new Date()), "yyyy-MM-dd");
        break;
      case "all":
        startDate = "";
        break;
    }

    const filteredSales = startDate
      ? salesData?.filter((s) => s.date >= startDate) || []
      : salesData || [];
    const filteredExpenses = startDate
      ? expensesData?.filter((e) => e.date >= startDate) || []
      : expensesData || [];

    // Group by date
    const dateMap = new Map();
    
    filteredSales.forEach((sale) => {
      if (!dateMap.has(sale.date)) {
        dateMap.set(sale.date, {
          date: sale.date,
          sales: 0,
          expenses: 0,
          cash: 0,
          gpay: 0,
          phonepe: 0,
        });
      }
      const entry = dateMap.get(sale.date);
      entry.sales += Number(sale.amount);
      if (sale.payment_mode === "Cash") entry.cash += Number(sale.amount);
      if (sale.payment_mode === "GPay") entry.gpay += Number(sale.amount);
      if (sale.payment_mode === "PhonePe") entry.phonepe += Number(sale.amount);
    });

    filteredExpenses.forEach((expense) => {
      if (!dateMap.has(expense.date)) {
        dateMap.set(expense.date, {
          date: expense.date,
          sales: 0,
          expenses: 0,
          cash: 0,
          gpay: 0,
          phonepe: 0,
        });
      }
      const entry = dateMap.get(expense.date);
      entry.expenses += Number(expense.amount);
      if (expense.mode === "Cash") entry.cash -= Number(expense.amount);
      if (expense.mode === "GPay") entry.gpay -= Number(expense.amount);
      if (expense.mode === "PhonePe") entry.phonepe -= Number(expense.amount);
    });

    return Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date));
  };

  const reportData = getFilteredData();

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Tea Shop Financial Report", 14, 20);
    doc.setFontSize(11);
    doc.text(`Period: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`, 14, 28);
    doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, 14, 34);

    const tableData = reportData.map((row) => [
      format(new Date(row.date), "dd MMM yyyy"),
      `₹${row.sales.toFixed(2)}`,
      `₹${row.expenses.toFixed(2)}`,
      `₹${(row.sales - row.expenses).toFixed(2)}`,
      `₹${row.cash.toFixed(2)}`,
      `₹${row.gpay.toFixed(2)}`,
      `₹${row.phonepe.toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [["Date", "Sales", "Expenses", "Profit", "Cash", "GPay", "PhonePe"]],
      body: tableData,
      startY: 40,
    });

    doc.save(`tea-shop-report-${filterType}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const downloadExcel = () => {
    const excelData = reportData.map((row) => ({
      Date: format(new Date(row.date), "dd MMM yyyy"),
      Sales: row.sales.toFixed(2),
      Expenses: row.expenses.toFixed(2),
      Profit: (row.sales - row.expenses).toFixed(2),
      Cash: row.cash.toFixed(2),
      GPay: row.gpay.toFixed(2),
      PhonePe: row.phonepe.toFixed(2),
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `tea-shop-report-${filterType}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const totals = reportData.reduce(
    (acc, row) => ({
      sales: acc.sales + row.sales,
      expenses: acc.expenses + row.expenses,
      profit: acc.profit + (row.sales - row.expenses),
      cash: acc.cash + row.cash,
      gpay: acc.gpay + row.gpay,
      phonepe: acc.phonepe + row.phonepe,
    }),
    { sales: 0, expenses: 0, profit: 0, cash: 0, gpay: 0, phonepe: 0 }
  );

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Reports & Downloads</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="space-y-2 w-full md:w-64">
            <label className="text-sm font-medium">Filter Period</label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button onClick={downloadPDF} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button onClick={downloadExcel}>
              <Download className="h-4 w-4 mr-2" />
              Download Excel
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold text-primary">₹{totals.sales.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive">₹{totals.expenses.toFixed(2)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-2xl font-bold text-success">₹{totals.profit.toFixed(2)}</p>
          </Card>
        </div>

        <Card className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-right font-semibold">Sales</th>
                <th className="p-3 text-right font-semibold">Expenses</th>
                <th className="p-3 text-right font-semibold">Profit</th>
                <th className="p-3 text-right font-semibold">Cash</th>
                <th className="p-3 text-right font-semibold">GPay</th>
                <th className="p-3 text-right font-semibold">PhonePe</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row) => (
                <tr key={row.date} className="border-b hover:bg-muted/50">
                  <td className="p-3">{format(new Date(row.date), "dd MMM yyyy")}</td>
                  <td className="p-3 text-right text-primary font-medium">
                    ₹{row.sales.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-destructive font-medium">
                    ₹{row.expenses.toFixed(2)}
                  </td>
                  <td className="p-3 text-right text-success font-bold">
                    ₹{(row.sales - row.expenses).toFixed(2)}
                  </td>
                  <td className="p-3 text-right">₹{row.cash.toFixed(2)}</td>
                  <td className="p-3 text-right">₹{row.gpay.toFixed(2)}</td>
                  <td className="p-3 text-right">₹{row.phonepe.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
