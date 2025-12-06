import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Employee {
  id: string;
  name: string;
  role: string;
  monthly_salary: number;
  advance_given: number;
  is_active: boolean;
  created_at: string;
}

export interface SalaryPayment {
  id: string;
  employee_id: string;
  amount: number;
  payment_type: string;
  payment_method: string;
  month: string;
  year: number;
  notes: string | null;
  created_at: string;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Employee[];
    },
  });
}

export function useSalaryPayments(employeeId?: string, month?: string, year?: number) {
  return useQuery({
    queryKey: ["salary-payments", employeeId, month, year],
    queryFn: async () => {
      let query = supabase.from("salary_payments").select("*").order("created_at", { ascending: false });
      
      if (employeeId) query = query.eq("employee_id", employeeId);
      if (month) query = query.eq("month", month);
      if (year) query = query.eq("year", year);

      const { data, error } = await query;
      if (error) throw error;
      return data as SalaryPayment[];
    },
  });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      role: string;
      monthly_salary: number;
    }) => {
      const { error } = await supabase.from("employees").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Employee> & { id: string }) => {
      const { error } = await supabase.from("employees").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}

export function usePaySalary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      employee_id: string;
      amount: number;
      payment_type: string;
      payment_method: string;
      month: string;
      year: number;
      notes?: string;
    }) => {
      // Add salary payment record
      const { error: paymentError } = await supabase.from("salary_payments").insert({
        employee_id: data.employee_id,
        amount: data.amount,
        payment_type: data.payment_type,
        payment_method: data.payment_method,
        month: data.month,
        year: data.year,
        notes: data.notes || null,
      });
      if (paymentError) throw paymentError;

      // Add as expense
      const { error: expenseError } = await supabase.from("expenses").insert({
        date: new Date().toISOString().split("T")[0],
        expense_type: "Salary",
        amount: data.amount,
        payment_method: data.payment_method,
        notes: `${data.payment_type} - ${data.month} ${data.year}`,
        is_salary_payment: true,
        employee_id: data.employee_id,
      });
      if (expenseError) throw expenseError;

      // If advance, update employee's advance_given
      if (data.payment_type === "Advance") {
        const { data: employee } = await supabase
          .from("employees")
          .select("advance_given")
          .eq("id", data.employee_id)
          .single();
        
        if (employee) {
          await supabase
            .from("employees")
            .update({ advance_given: Number(employee.advance_given) + data.amount })
            .eq("id", data.employee_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["salary-payments"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Salary payment recorded!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}