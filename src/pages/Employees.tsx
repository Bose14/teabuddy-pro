import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEmployees, useAddEmployee, useSalaryPayments, usePaySalary } from "@/hooks/useEmployees";
import { MONTHS, PAYMENT_METHODS } from "@/lib/constants";
import { Loader2, Plus, Users, IndianRupee, Wallet, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function Employees() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  
  // Add employee form
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");

  // Pay salary form
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("Salary");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: employees, isLoading } = useEmployees();
  const { data: payments } = useSalaryPayments();
  const addMutation = useAddEmployee();
  const payMutation = usePaySalary();

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !role || !monthlySalary) {
      toast.error("Please fill all fields");
      return;
    }

    addMutation.mutate({
      name,
      role,
      monthly_salary: parseFloat(monthlySalary),
    }, {
      onSuccess: () => {
        setName("");
        setRole("");
        setMonthlySalary("");
        setShowAddDialog(false);
      }
    });
  };

  const handlePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee || !paymentAmount) {
      toast.error("Please fill all fields");
      return;
    }

    payMutation.mutate({
      employee_id: selectedEmployee,
      amount: parseFloat(paymentAmount),
      payment_type: paymentType,
      payment_method: paymentMethod,
      month: selectedMonth,
      year: selectedYear,
    }, {
      onSuccess: () => {
        setPaymentAmount("");
        setShowPayDialog(false);
        setSelectedEmployee(null);
      }
    });
  };

  const getEmployeePayments = (employeeId: string, month: string, year: number) => {
    return payments?.filter(p => 
      p.employee_id === employeeId && 
      p.month === month && 
      p.year === year
    ) || [];
  };

  const currentMonth = MONTHS[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <div className="lg:ml-64 p-4 lg:p-6 space-y-6 safe-bottom">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Employees</h1>
        
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Employee name"
                  className="input-field"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Helper, Cook"
                  className="input-field"
                />
              </div>
              <div>
                <Label>Monthly Salary (₹)</Label>
                <Input
                  type="number"
                  value={monthlySalary}
                  onChange={(e) => setMonthlySalary(e.target.value)}
                  placeholder="0"
                  className="input-field"
                />
              </div>
              <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                {addMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Add Employee
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employee List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : employees && employees.length > 0 ? (
        <div className="grid gap-4">
          {employees.filter(e => e.is_active).map((employee) => {
            const monthPayments = getEmployeePayments(employee.id, currentMonth, currentYear);
            const paidAmount = monthPayments.reduce((acc, p) => acc + Number(p.amount), 0);
            const remaining = Number(employee.monthly_salary) - paidAmount;

            return (
              <Card key={employee.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{employee.name}</h3>
                        <p className="text-sm text-muted-foreground">{employee.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">₹{Number(employee.monthly_salary).toLocaleString("en-IN")}</p>
                      <p className="text-xs text-muted-foreground">Monthly Salary</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="p-3 bg-success/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Paid ({currentMonth})</p>
                      <p className="font-bold text-success">₹{paidAmount.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="p-3 bg-warning/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Advance</p>
                      <p className="font-bold text-warning">₹{Number(employee.advance_given).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="p-3 bg-destructive/10 rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Due</p>
                      <p className="font-bold text-destructive">₹{remaining.toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  <Dialog open={showPayDialog && selectedEmployee === employee.id} onOpenChange={(open) => {
                    setShowPayDialog(open);
                    if (open) {
                      setSelectedEmployee(employee.id);
                      setPaymentAmount("");
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button className="w-full mt-4" variant="outline">
                        <IndianRupee className="h-4 w-4 mr-2" />
                        Pay Salary / Advance
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Pay {employee.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePaySalary} className="space-y-4">
                        <div>
                          <Label>Payment Type</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {["Salary", "Advance"].map((type) => (
                              <Button
                                key={type}
                                type="button"
                                variant={paymentType === type ? "default" : "outline"}
                                onClick={() => setPaymentType(type)}
                              >
                                {type}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <Label>Amount (₹)</Label>
                          <Input
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            placeholder="0"
                            className="input-field"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Month</Label>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {MONTHS.map((month) => (
                                  <SelectItem key={month} value={month}>{month}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Year</Label>
                            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[2024, 2025, 2026].map((year) => (
                                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Payment Method</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_METHODS.map((method) => (
                              <Button
                                key={method}
                                type="button"
                                variant={paymentMethod === method ? "default" : "outline"}
                                onClick={() => setPaymentMethod(method)}
                              >
                                {method === "Cash" ? <Wallet className="h-4 w-4 mr-2" /> : <Smartphone className="h-4 w-4 mr-2" />}
                                {method}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={payMutation.isPending}>
                          {payMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Record Payment
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No employees added yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}