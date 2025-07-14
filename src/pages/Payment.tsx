import React, { useEffect, useState } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';

interface Fee {
  id: string;
  title: string;
  description?: string;
  amount: number;
  due_date: string;
  created_at: string;
}

interface Payment {
  id: string;
  fee_id: string;
  user_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paid_at?: string;
}

interface PaymentRow {
  fee: Fee;
  payment?: Payment;
  amountDue: number;
  paid: number;
  remaining: number;
}

const Payment: React.FC = () => {
  const { currentTeam } = useTeam();
  const { user } = useAuth();
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTeam && user) {
      fetchPaymentData();
    }
  }, [currentTeam, user]);

  const fetchPaymentData = async () => {
    if (!currentTeam || !user) return;

    setLoading(true);
    try {
      // Fetch all fees for the team
      const { data: fees, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .eq('team_id', currentTeam.id)
        .order('due_date', { ascending: true });

      if (feesError) throw feesError;

      // Fetch user's payments for these fees
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .in('fee_id', fees?.map(f => f.id) || []);

      if (paymentsError) throw paymentsError;

      // Combine fees and payments into payment rows
      const rows: PaymentRow[] = (fees || []).map(fee => {
        const payment = payments?.find(p => p.fee_id === fee.id);
        const paid = payment?.amount || 0;
        const remaining = fee.amount - paid;

        return {
          fee,
          payment,
          amountDue: fee.amount,
          paid,
          remaining: Math.max(0, remaining)
        };
      });

      setPaymentRows(rows);
    } catch (error) {
      console.error('Error fetching payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-medium text-gray-700">Payments</h1>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-900">Payments</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No payments due
                  </td>
                </tr>
              ) : (
                paymentRows.map((row) => (
                  <tr key={row.fee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {row.fee.title}
                        </div>
                        {row.fee.description && (
                          <div className="text-sm text-gray-500">
                            {row.fee.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(row.amountDue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(row.fee.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(row.paid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${
                        row.remaining > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatCurrency(row.remaining)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      {paymentRows.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(paymentRows.reduce((sum, row) => sum + row.amountDue, 0))}
              </div>
              <div className="text-sm text-gray-500">Total Due</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentRows.reduce((sum, row) => sum + row.paid, 0))}
              </div>
              <div className="text-sm text-gray-500">Total Paid</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(paymentRows.reduce((sum, row) => sum + row.remaining, 0))}
              </div>
              <div className="text-sm text-gray-500">Total Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payment;