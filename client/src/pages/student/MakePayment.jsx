import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import api from '../../utils/api';
import { formatCurrency, formatDate, isOverdue } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  CreditCardIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

// Load Stripe outside of component to avoid re-creating on every render
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder'
);

function PaymentForm({ fee, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState('full');

  const balance = fee.amount - (fee.paidAmount || 0);

  useEffect(() => {
    if (paymentType === 'full') {
      setPaymentAmount(balance.toString());
    }
  }, [paymentType, balance]);

  const createPaymentIntent = useMutation({
    mutationFn: async (amount) => {
      const response = await api.post('/payments/create-intent', {
        feeAssignmentId: fee.id,
        amount: parseFloat(amount),
      });
      return response.data.data;
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > balance) {
      toast.error('Amount cannot exceed balance due');
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const { clientSecret, paymentId } = await createPaymentIntent.mutateAsync(
        amount
      );

      // Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
          },
        }
      );

      if (error) {
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on our server
        await api.post(`/payments/${paymentId}/confirm`, {
          stripePaymentIntentId: paymentIntent.id,
        });
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount */}
      <div>
        <label className="label">ចំនួនទឹកប្រាក់ទូទាត់</label>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentType"
              value="full"
              checked={paymentType === 'full'}
              onChange={() => setPaymentType('full')}
              className="text-primary-600"
            />
            <span>ចំនួនពេញ ({formatCurrency(balance)})</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="paymentType"
              value="partial"
              checked={paymentType === 'partial'}
              onChange={() => setPaymentType('partial')}
              className="text-primary-600"
            />
            <span>ការទូទាត់មួយផ្នែក</span>
          </label>
        </div>
        {paymentType === 'partial' && (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="1"
              max={balance}
              className="input pl-8"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="បញ្ចូលចំនួនទឹកប្រាក់..."
            />
          </div>
        )}
      </div>

      {/* Card Details */}
      <div>
        <label className="label">ព័ត៌មានលម្អិតអំពីកាត</label>
        <div className="border rounded-lg p-4 bg-gray-50">
          <CardElement options={cardElementOptions} />
        </div>
        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <LockClosedIcon className="h-4 w-4" />
          ការទូទាត់របស់អ្នកត្រូវបានការពារដោយប្រព័ន្ធកូដនីយកម្ម SSL
        </p>
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            កំពុងដំណើរការ...
          </>
        ) : (
          <>
            <CreditCardIcon className="h-6 w-6" />
            ទូទាត់ {formatCurrency(parseFloat(paymentAmount) || 0)}
          </>
        )}
      </button>

      {/* Test Card Info */}
      <div className="text-center text-sm text-gray-500">
        <p>កាតសាកល្បង (Test card): 4242 4242 4242 4242</p>
        <p>កាលបរិច្ឆេទអនាគតណាមួយ CVC ណាមួយ និងកូដតំបន់ណាមួយ</p>
      </div>
    </form>
  );
}

export default function MakePayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const feeId = searchParams.get('feeId');
  const [selectedFeeId, setSelectedFeeId] = useState(feeId || '');
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const { data: fees, isLoading } = useQuery({
    queryKey: ['pendingFees'],
    queryFn: async () => {
      const response = await api.get('/students/fees?status=pending');
      return response.data.data.fees;
    },
  });

  const selectedFee = fees?.find((f) => f.id === parseInt(selectedFeeId));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center py-12">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ការទូទាត់ទទួលបានជោគជ័យ!
          </h2>
          <p className="text-gray-600 mb-6">
            ការទូទាត់របស់អ្នកត្រូវបានដំណើរការដោយជោគជ័យ។ បង្កាន់ដៃត្រូវបានផ្ញើទៅកាន់អ៊ីមែលរបស់អ្នក។
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/student/payments')}
              className="btn-secondary"
            >
              មើលប្រវត្តិ
            </button>
            <button
              onClick={() => {
                setPaymentSuccess(false);
                setSelectedFeeId('');
              }}
              className="btn-primary"
            >
              ទូទាត់ម្តងទៀត
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ធ្វើការទូទាត់</h1>
        <p className="text-gray-600">បង់ថ្លៃសិក្សារបស់អ្នកដោយសុវត្ថិភាពតាមអនឡាញ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Selection */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ជ្រើសរើសថ្លៃសិក្សាត្រូវបង់
          </h3>

          {fees?.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-600">រាល់ថ្លៃសិក្សាទាំងអស់ត្រូវបានបង់រួចរាល់! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fees?.map((fee) => {
                const balance = fee.amount - (fee.paidAmount || 0);
                const isPastDue = isOverdue(fee.dueDate);

                return (
                  <label
                    key={fee.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedFeeId === fee.id.toString()
                        ? 'border-primary-600 bg-primary-50 ring-2 ring-primary-600'
                        : 'hover:border-gray-400'
                    } ${isPastDue ? 'border-red-200 bg-red-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="fee"
                        value={fee.id}
                        checked={selectedFeeId === fee.id.toString()}
                        onChange={(e) => setSelectedFeeId(e.target.value)}
                        className="mt-1 text-primary-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {fee.FeeStructure?.name}
                          </h4>
                          {isPastDue && (
                            <span className="badge badge-danger">ហួសកាលកំណត់</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          កាលបរិច្ឆេទកំណត់: {formatDate(fee.dueDate)}
                        </p>
                        <div className="mt-2 flex justify-between">
                          <span className="text-sm text-gray-600">
                            សមតុល្យត្រូវបង់:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(balance)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ព័ត៌មានលម្អិតនៃការទូទាត់
          </h3>

          {!selectedFee ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCardIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>ជ្រើសរើសថ្លៃសិក្សាពីខាងឆ្វេងដើម្បីបន្តការទូទាត់</p>
            </div>
          ) : (
            <>
              {/* Selected Fee Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">ប្រភេទការបង់ថ្លៃ:</span>
                  <span className="font-medium">
                    {selectedFee.FeeStructure?.name}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">ចំនួនទឹកប្រាក់ដើម:</span>
                  <span>{formatCurrency(selectedFee.amount)}</span>
                </div>
                {selectedFee.paidAmount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">បានបង់រួច:</span>
                    <span className="text-green-600">
                      - {formatCurrency(selectedFee.paidAmount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-medium text-gray-900">
                    សមតុល្យត្រូវបង់:
                  </span>
                  <span className="font-bold text-lg text-primary-600">
                    {formatCurrency(
                      selectedFee.amount - (selectedFee.paidAmount || 0)
                    )}
                  </span>
                </div>
              </div>

              {/* Stripe Elements */}
              <Elements stripe={stripePromise}>
                <PaymentForm
                  fee={selectedFee}
                  onSuccess={() => setPaymentSuccess(true)}
                />
              </Elements>
            </>
          )}
        </div>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg flex items-start gap-3">
        <LockClosedIcon className="h-5 w-5 text-gray-400 mt-0.5" />
        <div className="text-sm text-gray-600">
          <p className="font-medium text-gray-900">ការទូទាត់ដោយសុវត្ថិភាព</p>
          <p>
            ព័ត៌មានទូទាត់របស់អ្នកត្រូវបានការពារដោយការសរសេរកូដ និងដំណើរការដោយសុវត្ថិភាពតាមរយៈ Stripe។ យើងមិនដែលរក្សាទុកព័ត៌មានលម្អិតកាតរបស់អ្នកនៅលើម៉ាស៊ីនមេរបស់យើងឡើយ។
          </p>
        </div>
      </div>
    </div>
  );
}
