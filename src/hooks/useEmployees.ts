import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getAllEmployees as getFirebaseEmployees,
  createEmployee as createFirebaseEmployee,
  updateEmployee as updateFirebaseEmployee,
  getSalaryPayments as getFirebaseSalaryPayments,
  createSalaryPayment as createFirebaseSalaryPayment,
  createExpense as createFirebaseExpense,
} from "@/integrations/firebase/client";
import type { 
  Employee as FirebaseEmployee,
  SalaryPayment as FirebaseSalaryPayment
} from "@/integrations/firebase/types";

// Check which backend to use
const USE_FIREBASE = import.meta.env.VITE_USE_FIREBASE === 'true';

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
    queryKey: ["employees", USE_FIREBASE ? 'firebase' : 'supabase'],
    queryFn: async () => {
      if (USE_FIREBASE) {
        const employees = await getFirebaseEmployees(false); // Get all employees
        return employees.map((e: FirebaseEmployee) => ({
          id: e.id,
          name: e.name,
          role: e.role,
          monthly_salary: e.monthly_salary,
          advance_given: e.advance_given,
          is_active: e.is_active,
          created_at: e.created_at.toDate().toISOString(),
        })) as Employee[];
      } else {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("name");
        if (error) throw error;
        return data as Employee[];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
}

export function useSalaryPayments(employeeId?: string, month?: string, year?: number) {
  return useQuery({
    queryKey: ["salary-payments", employeeId, month, year, USE_FIREBASE ? 'firebase' : 'supabase'],
    queryFn: async () => {
      if (USE_FIREBASE) {
        const payments = await getFirebaseSalaryPayments(employeeId, month, year);
        return payments.map((p: FirebaseSalaryPayment) => ({
          id: p.id,
          employee_id: p.employee_id,
          amount: p.amount,
          payment_type: p.payment_type,
          payment_method: p.payment_method,
          month: p.month,
          year: p.year,
          notes: p.notes || null,
          created_at: p.created_at.toDate().toISOString(),
        })) as SalaryPayment[];
      } else {
        let query = supabase.from("salary_payments").select("*").order("created_at", { ascending: false });
        
        if (employeeId) query = query.eq("employee_id", employeeId);
        if (month) query = query.eq("month", month);
        if (year) query = query.eq("year", year);

        const { data, error } = await query;
        if (error) throw error;
        return data as SalaryPayment[];
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
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
      if (USE_FIREBASE) {
        await createFirebaseEmployee({
          name: data.name,
          role: data.role,
          monthly_salary: data.monthly_salary,
        });
      } else {
        const { error } = await supabase.from("employees").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
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
      if (USE_FIREBASE) {
        // Convert to Firebase field names (remove created_at if present)
        const { created_at, ...updateData } = data as any;
        await updateFirebaseEmployee(id, updateData);
      } else {
        const { error } = await supabase.from("employees").update(data).eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_FIREBASE) {
        // Soft delete by setting is_active to false
        await updateFirebaseEmployee(id, { is_active: false });
      } else {
        const { error } = await supabase
          .from("employees")
          .update({ is_active: false })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee removed!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}

export function useReactivateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_FIREBASE) {
        // Reactivate by setting is_active to true
        await updateFirebaseEmployee(id, { is_active: true });
      } else {
        const { error } = await supabase
          .from("employees")
          .update({ is_active: true })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee reactivated!");
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
      const today = new Date().toISOString().split("T")[0];

      if (USE_FIREBASE) {
        // Firebase implementation
        // 1. Create salary payment record
        await createFirebaseSalaryPayment({
          employee_id: data.employee_id,
          amount: data.amount,
          payment_type: data.payment_type,
          payment_method: data.payment_method as "Cash" | "Online",
          month: data.month,
          year: data.year,
          notes: data.notes,
        });

        // 2. Create the expense record with salary info
        await createFirebaseExpense({
          date: today,
          expense_type: "Salary",
          amount: data.amount,
          payment_method: data.payment_method as "Cash" | "Online",
          notes: `${data.payment_type} - ${data.month} ${data.year}`,
          is_salary_payment: true,
          employee_id: data.employee_id,
        });

        // 3. If advance, update employee's advance_given
        if (data.payment_type === "Advance") {
          const employees = await getFirebaseEmployees(false);
          const employee = employees.find(e => e.id === data.employee_id);
          
          if (employee) {
            await updateFirebaseEmployee(data.employee_id, {
              advance_given: Number(employee.advance_given) + data.amount,
            });
          }
        }
      } else {
        // Supabase implementation
        // 1. Add salary payment record
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

        // 2. Add as expense
        const { error: expenseError } = await supabase.from("expenses").insert({
          date: today,
          expense_type: "Salary",
          amount: data.amount,
          payment_method: data.payment_method,
          notes: `${data.payment_type} - ${data.month} ${data.year}`,
          is_salary_payment: true,
          employee_id: data.employee_id,
        });
        if (expenseError) throw expenseError;

        // 3. Sync with daily_cash_flow - Calculate total expenses for today
        const { data: expensesForDate, error: queryError } = await supabase
          .from("expenses")
          .select("*")
          .eq("date", today);
        
        if (queryError) throw queryError;

        // 4. Calculate cash and online expenses
        const cashExpenses = expensesForDate
          ?.filter(e => e.payment_method === 'Cash')
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        
        const onlineExpenses = expensesForDate
          ?.filter(e => e.payment_method === 'Online')
          .reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        
        const totalExpenses = cashExpenses + onlineExpenses;

        // 5. Update or insert into daily_cash_flow
        const { error: upsertError } = await supabase
          .from("daily_cash_flow")
          .upsert({
            date: today,
            cash_expenses: cashExpenses,
            online_expenses: onlineExpenses,
            total_expenses: totalExpenses,
          }, {
            onConflict: 'date',
            ignoreDuplicates: false,
          });
        
        if (upsertError) throw upsertError;

        // 6. If advance, update employee's advance_given
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
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
      await queryClient.invalidateQueries({ queryKey: ["salary-payments"] });
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["expense-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-cash-flow"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success("Salary payment recorded!");
    },
    onError: (error) => {
      toast.error("Failed: " + error.message);
    },
  });
}
