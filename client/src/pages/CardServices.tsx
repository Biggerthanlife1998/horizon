import { useState, useEffect } from 'react';
import { formatUSD } from '@/utils/currency';
import Modal from '@/components/Modal';
import FormInput from '@/components/FormInput';
import LoadingButton from '@/components/LoadingButton';
import { api } from '@/utils/api';
import { 
  CreditCard, 
  Shield,
  ShieldOff,
  DollarSign,
  Lock,
  Unlock,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Card {
  id: string;
  type: 'debit' | 'credit';
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  number: string;
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isBlocked: boolean;
  dailyLimit: number;
  currentBalance: number;
  availableCredit?: number;
  creditLimit?: number;
}

interface DailyLimitForm {
  limit: string;
}

// Card interface matches backend
interface Card {
  _id: string;
  type: 'debit' | 'credit';
  brand: 'visa' | 'mastercard' | 'amex' | 'discover';
  maskedNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isBlocked: boolean;
  dailyLimit: number;
  currentBalance: number;
  availableCredit?: number;
  creditLimit?: number;
  accountId: string;
}

const getBrandIcon = (brand: string) => {
  switch (brand) {
    case 'visa':
      return <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">VISA</div>;
    case 'mastercard':
      return <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold">MC</div>;
    case 'amex':
      return <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold">AMEX</div>;
    case 'discover':
      return <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center text-white text-xs font-bold">DISC</div>;
    default:
      return <CreditCard className="w-8 h-8 text-gray-600" />;
  }
};

const getBrandGradient = (brand: string) => {
  switch (brand) {
    case 'visa':
      return 'from-blue-600 to-blue-800';
    case 'mastercard':
      return 'from-red-500 to-red-700';
    case 'amex':
      return 'from-green-500 to-green-700';
    case 'discover':
      return 'from-orange-500 to-orange-700';
    default:
      return 'from-gray-600 to-gray-800';
  }
};

export default function CardServices() {
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitForm, setLimitForm] = useState<DailyLimitForm>({ limit: '' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch cards from API
  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        const response = await api.get('/user/cards');
        setCards(response.data.cards);
      } catch (error) {
        console.error('Failed to fetch cards:', error);
        setError('Failed to load cards. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLimitForm(prev => ({ ...prev, [name]: value }));
  };

  const handleBlockCard = async (cardId: string) => {
    setActionLoading(cardId);
    try {
      const response = await api.put(`/user/cards/${cardId}/block`);
      
      setCards(prev => prev.map(card => 
        card._id === cardId 
          ? { ...card, isBlocked: true }
          : card
      ));
    } catch (error) {
      console.error('Failed to block card:', error);
      alert('Failed to block card. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblockCard = async (cardId: string) => {
    setActionLoading(cardId);
    try {
      const response = await api.put(`/user/cards/${cardId}/unblock`);
      
      setCards(prev => prev.map(card => 
        card._id === cardId 
          ? { ...card, isBlocked: false }
          : card
      ));
    } catch (error) {
      console.error('Failed to unblock card:', error);
      alert('Failed to unblock card. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDailyLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;

    setLoading(true);
    try {
      const response = await api.put(`/user/cards/${selectedCard._id}/limit`, {
        dailyLimit: parseFloat(limitForm.limit)
      });
      
      setCards(prev => prev.map(card => 
        card._id === selectedCard._id 
          ? { ...card, dailyLimit: parseFloat(limitForm.limit) }
          : card
      ));
      
      setShowLimitModal(false);
      setLimitForm({ limit: '' });
      setSelectedCard(null);
    } catch (error) {
      console.error('Failed to set daily limit:', error);
      alert('Failed to set daily limit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openLimitModal = (card: Card) => {
    setSelectedCard(card);
    setLimitForm({ limit: card.dailyLimit.toString() });
    setShowLimitModal(true);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Card Services</h1>
        <p className="text-gray-600 mt-1">Manage your debit and credit cards.</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Cards Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => (
            <div key={card._id} className="group">
            {/* Glossy Card UI */}
            <div className={`relative overflow-hidden rounded-xl p-6 text-white shadow-lg transition-all duration-300 group-hover:shadow-xl ${
              card.isBlocked 
                ? 'bg-gradient-to-br from-gray-400 to-gray-600 opacity-75' 
                : `bg-gradient-to-br ${getBrandGradient(card.brand)}`
            }`}>
              {/* Card Brand Logo */}
              <div className="flex justify-between items-start mb-8">
                <div className="text-sm font-medium opacity-90">
                  {card.type === 'debit' ? 'DEBIT CARD' : 'CREDIT CARD'}
                </div>
                <div className="bg-white/20 rounded-lg p-2">
                  {getBrandIcon(card.brand)}
                </div>
              </div>

              {/* Card Number */}
              <div className="mb-6">
                <div className="text-2xl font-mono tracking-wider mb-2">
                  {card.maskedNumber}
                </div>
                <div className="text-sm opacity-90">
                  {card.cardholderName}
                </div>
              </div>

              {/* Card Details */}
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-xs opacity-75 mb-1">EXPIRES</div>
                  <div className="text-sm font-medium">
                    {card.expiryMonth}/{card.expiryYear}
                  </div>
                </div>
                
                {/* Card Type Badge */}
                <div className="bg-white/20 rounded-lg px-3 py-1">
                  <div className="text-xs font-medium">
                    {card.brand.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Blocked Overlay */}
              {card.isBlocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center">
                    <Lock className="w-8 h-8 mx-auto mb-2" />
                    <div className="text-sm font-medium">CARD BLOCKED</div>
                  </div>
                </div>
              )}
            </div>

            {/* Card Info */}
            <div className="mt-4 space-y-3">
              {/* Balance/Credit Info */}
              <div className="bg-gray-50 rounded-lg p-4 h-24 flex flex-col justify-center">
                {card.type === 'debit' ? (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Available Balance</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatUSD(card.currentBalance)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Current Balance</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formatUSD(card.currentBalance)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Available Credit</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatUSD(card.availableCredit || 0)} of {formatUSD(card.creditLimit || 0)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Limit */}
              <div className="bg-gray-50 rounded-lg p-4 h-16 flex flex-col justify-center">
                <div className="text-sm text-gray-600 mb-1">Daily Limit</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatUSD(card.dailyLimit)}
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex space-x-2">
                {card.isBlocked ? (
                  <LoadingButton
                    loading={actionLoading === card._id}
                    onClick={() => handleUnblockCard(card._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Unblock
                  </LoadingButton>
                ) : (
                  <LoadingButton
                    loading={actionLoading === card._id}
                    onClick={() => handleBlockCard(card._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Block
                  </LoadingButton>
                )}
                
                <LoadingButton
                  loading={actionLoading === card._id}
                  onClick={() => openLimitModal(card)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Settings className="w-4 h-4" />
                </LoadingButton>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Card Security</h3>
            <p className="text-blue-700 mb-3">
              For your security, only the last 4 digits of your card number are displayed. 
              If you need to see your full card number, please contact customer service.
            </p>
            <div className="text-sm text-blue-600">
              <strong>Tip:</strong> You can block your card instantly if it's lost or stolen, 
              and unblock it when found.
            </div>
          </div>
        </div>
      </div>

      {/* Daily Limit Modal */}
      <Modal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        title="Set Daily Limit"
      >
        {selectedCard && (
          <form onSubmit={handleSetDailyLimit} className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">Current Card</div>
              <div className="font-medium text-gray-900">
                {selectedCard.type === 'debit' ? 'Debit' : 'Credit'} Card ending in {selectedCard.maskedNumber.slice(-4)}
              </div>
            </div>

            <FormInput
              label="Daily Spending Limit (USD)"
              name="limit"
              type="number"
              value={limitForm.limit}
              onChange={handleInputChange}
              placeholder="0.00"
              required
              icon={<DollarSign className="w-5 h-5" />}
              step="0.01"
              min="0.01"
            />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-900">Important</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    This limit applies to all transactions made with this card. 
                    Once reached, the card will be temporarily blocked until the next day.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <LoadingButton
                loading={false}
                onClick={() => setShowLimitModal(false)}
                className="btn-secondary"
                type="button"
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                loading={loading}
                type="submit"
                className="btn-primary"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Update Limit
              </LoadingButton>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
