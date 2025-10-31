import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Milk } from "lucide-react";
import { format, startOfMonth } from "date-fns";

export default function MilkTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [purchased, setPurchased] = useState("");
  const [used, setUsed] = useState("");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: milkData } = useQuery({
    queryKey: ["milk_usage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("milk_usage")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addMilkMutation = useMutation({
    mutationFn: async (newEntry: any) => {
      // Get previous day's remaining
      const { data: prevData } = await supabase
        .from("milk_usage")
        .select("remaining")
        .lt("date", newEntry.date)
        .order("date", { ascending: false })
        .limit(1);

      const prevRemaining = prevData?.[0]?.remaining || 0;
      const remaining = Number(prevRemaining) + Number(newEntry.purchased) - Number(newEntry.used);

      const { error } = await supabase
        .from("milk_usage")
        .upsert([{ ...newEntry, remaining }], { onConflict: "date" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milk_usage"] });
      toast({ title: "Milk usage recorded successfully!" });
      setPurchased("");
      setUsed("");
    },
    onError: () => {
      toast({ title: "Failed to record milk usage", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMilkMutation.mutate({
      date: selectedDate,
      purchased: Number(purchased) || 0,
      used: Number(used) || 0,
    });
  };

  const calculateMonthlyStats = () => {
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthData = milkData?.filter((m) => m.date >= monthStart) || [];
    return {
      totalPurchased: monthData.reduce((sum, m) => sum + Number(m.purchased), 0),
      totalUsed: monthData.reduce((sum, m) => sum + Number(m.used), 0),
    };
  };

  const monthlyStats = calculateMonthlyStats();
  const todayData = milkData?.find((m) => m.date === format(new Date(), "yyyy-MM-dd"));

  return (
    <div className="min-h-screen bg-background pt-20 pb-6 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Milk className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Milk Usage Tracker</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Today Purchased</p>
            <p className="text-2xl font-bold text-primary">
              {todayData ? Number(todayData.purchased).toFixed(2) : "0.00"} L
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Today Used</p>
            <p className="text-2xl font-bold text-destructive">
              {todayData ? Number(todayData.used).toFixed(2) : "0.00"} L
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="text-2xl font-bold text-success">
              {todayData ? Number(todayData.remaining).toFixed(2) : "0.00"} L
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Monthly Used</p>
            <p className="text-2xl font-bold">{monthlyStats.totalUsed.toFixed(2)} L</p>
          </Card>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Milk Purchased (Liters)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={purchased}
                  onChange={(e) => setPurchased(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Milk Used (Liters)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={used}
                  onChange={(e) => setUsed(e.target.value)}
                  placeholder="0.0"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Record Milk Usage
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Monthly Records</h2>
          <Card className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Purchased (L)</th>
                  <th className="p-3 text-right">Used (L)</th>
                  <th className="p-3 text-right">Remaining (L)</th>
                </tr>
              </thead>
              <tbody>
                {milkData?.map((milk) => (
                  <tr key={milk.id} className="border-b">
                    <td className="p-3">{format(new Date(milk.date), "dd MMM yyyy")}</td>
                    <td className="p-3 text-right text-primary font-medium">
                      {Number(milk.purchased).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-destructive font-medium">
                      {Number(milk.used).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-success font-bold">
                      {Number(milk.remaining).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
