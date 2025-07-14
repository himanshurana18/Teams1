import React, { useEffect, useState } from 'react';
import { useTeam } from '../contexts/TeamContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import { Plus } from 'lucide-react';
import Button from '../components/ui/Button';

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

interface MemberFeeData {
  user_id: string;
  name: string;
  email: string;
  totalFees: number;
  totalPaid: number;
  totalRemaining: number;
  payments: Payment[];
}

const Finance: React.FC = () => {
  const { currentTeam, teamMembers } = useTeam();
  const { user } = useAuth();
  const [fees, setFees] = useState<Fee[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [memberFeeData, setMemberFeeData] = useState<MemberFeeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentTeam) {
      fetchFinanceData();
    }
  }, [currentTeam, teamMembers]);

  const fetchFinanceData = async () => {
    if (!currentTeam) return;

    setLoading(true);
    try {
      // Fetch all fees for the team
      const { data: feesData, error: feesError } = await supabase
        .from('fees')
        .select('*')
        .eq('team_id', currentTeam.id)
        .order('due_date', { ascending: false });

      if (feesError) throw feesError;

      // Fetch all payments for the team's fees
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('fee_id', feesData?.map(f => f.id) || []);

      if (paymentsError) throw paymentsError;

      setFees(feesData || []);
      setPayments(paymentsData || []);

      // Calculate member fee data
      const memberData: MemberFeeData[] = teamMembers.map(member => {
        const memberPayments = paymentsData?.filter(p => p.user_id === member.user_id) || [];
        const totalFees = feesData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
        const totalPaid = memberPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const totalRemaining = totalFees - totalPaid;

        return {
          user_id: member.user_id,
          name: member.user.full_name || member.user.email,
          email: member.user.email,
          totalFees,
          totalPaid,
          totalRemaining: Math.max(0, totalRemaining),
          payments: memberPayments,
        };
      });

      setMemberFeeData(memberData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
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

  const getTotals = () => {
    const totalAmount = memberFeeData.reduce((sum, member) => sum + member.totalFees, 0);
    const totalPaid = memberFeeData.reduce((sum, member) => sum + member.totalPaid, 0);
    const totalRemaining = memberFeeData.reduce((sum, member) => sum + member.totalRemaining, 0);

    return { totalAmount, totalPaid, totalRemaining };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totals = getTotals();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Roster Fees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Roster Fees</h2>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Name ▲
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Fees & Payments
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  GP
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Paid
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberFeeData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No team members found
                  </td>
                </tr>
              ) : (
                memberFeeData.map((member) => (
                  <tr key={member.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="inline-flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                        <Plus className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.totalFees > 0 ? formatCurrency(member.totalFees) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.totalPaid > 0 ? formatCurrency(member.totalPaid) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.totalRemaining > 0 ? formatCurrency(member.totalRemaining) : '-'}
                    </td>
                  </tr>
                ))
              )}
              
              {/* Totals Row */}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  Totals
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(totals.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(totals.totalPaid)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(totals.totalRemaining)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white">
              Add Multiple Fees
            </Button>
            
            <div className="flex space-x-4">
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                Notification Settings
              </Button>
              <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                Stripe Settings
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;