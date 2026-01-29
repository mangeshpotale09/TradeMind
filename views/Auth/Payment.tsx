
import React, { useState } from 'react';
import { User } from '../../types';
import { useStore } from '../../store';
import { Upload, CheckCircle } from 'lucide-react';

interface PaymentProps {
  user: User;
  onPaymentSubmit: () => void;
}

const Payment: React.FC<PaymentProps> = ({ user, onPaymentSubmit }) => {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: '',
    amount: 1999,
    screenshot: '',
  });

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      // In production, upload to Supabase Storage. For now, we simulate.
      setFormData({ ...formData, screenshot: 'https://picsum.photos/400/600' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const paymentDetails = {
      transactionId: formData.transactionId,
      amount: formData.amount,
      date: new Date().toISOString(),
      screenshotUrl: formData.screenshot || 'https://picsum.photos/400/600',
    };

    const { error } = await store.submitPaymentProof(user.id, paymentDetails);
    
    if (!error) {
      onPaymentSubmit();
    } else {
      alert('Error submitting payment proof. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        <div className="flex-1 bg-slate-900 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-700">
          <h2 className="text-lg font-bold text-slate-300 mb-6 uppercase tracking-wider">UPI SCAN TO PAY</h2>
          <div className="bg-white p-4 rounded-2xl mb-6">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=trade.mind@upi&pn=TradeMind&am=1999&cu=INR`} 
              alt="Payment QR" 
              className="w-48 h-48"
            />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-white">₹1,999</p>
            <p className="text-slate-400 text-sm">One-time Access Fee</p>
          </div>
        </div>

        <div className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-white mb-2">Proof of Payment</h1>
          <p className="text-slate-400 mb-8">Enter your transaction details to unlock TradeMind.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Transaction ID</label>
              <input
                type="text"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="UPI Ref ID"
                value={formData.transactionId}
                onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              />
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-1">Screenshot</label>
              <div className="group relative w-full h-32 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center hover:border-emerald-500 transition-colors cursor-pointer bg-slate-900/50">
                {formData.screenshot ? (
                  <div className="flex items-center space-x-2 text-emerald-500">
                    <CheckCircle size={24} />
                    <span className="font-medium text-sm">Uploaded</span>
                  </div>
                ) : (
                  <>
                    <Upload className="text-slate-500 group-hover:text-emerald-500 mb-2" />
                    <span className="text-sm text-slate-500 font-medium">Click to upload</span>
                  </>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleScreenshotChange} 
                  required
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-bold py-3 mt-6 rounded-xl hover:bg-emerald-600 transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit for Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Payment;
