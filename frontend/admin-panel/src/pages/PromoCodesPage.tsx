import { useEffect, useState } from 'react';
import { promoCodeService, PromoCode, CreatePromoCodeData } from '@/services/promoCodeService';
import { format } from 'date-fns';
import { Plus, Edit, Trash2, X, Ban } from 'lucide-react';

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState<CreatePromoCodeData>({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    valid_from: '',
    valid_until: '',
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      const data = await promoCodeService.getPromoCodes();
      setPromoCodes(data);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCode) {
        await promoCodeService.updatePromoCode(editingCode.id, formData);
      } else {
        await promoCodeService.createPromoCode(formData);
      }

      await loadPromoCodes();
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save promo code:', error);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await promoCodeService.deactivatePromoCode(id);
      await loadPromoCodes();
    } catch (error) {
      console.error('Failed to deactivate promo code:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;

    try {
      await promoCodeService.deletePromoCode(id);
      await loadPromoCodes();
    } catch (error) {
      console.error('Failed to delete promo code:', error);
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      min_booking_value: code.min_booking_value,
      max_discount: code.max_discount,
      valid_from: code.valid_from.split('T')[0],
      valid_until: code.valid_until.split('T')[0],
      usage_limit: code.usage_limit,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCode(null);
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 0,
      valid_from: '',
      valid_until: '',
    });
  };

  const getStatusBadge = (status: PromoCode['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-600 mt-2">Create and manage promotional discounts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Create Promo Code
        </button>
      </div>

      {/* Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promoCodes.map((code) => (
          <div key={code.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-primary-600">{code.code}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {code.discount_type === 'percentage'
                    ? `${code.discount_value}% off`
                    : `$${code.discount_value} off`}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(code)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(code.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {code.min_booking_value && (
                <div className="text-sm text-gray-600">
                  Min. booking: ${code.min_booking_value}
                </div>
              )}
              {code.max_discount && (
                <div className="text-sm text-gray-600">Max. discount: ${code.max_discount}</div>
              )}
              {code.usage_limit && (
                <div className="text-sm text-gray-600">
                  Usage: {code.used_count} / {code.usage_limit}
                </div>
              )}
            </div>

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Valid from:</span>
                <span className="font-medium">{format(new Date(code.valid_from), 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valid until:</span>
                <span className="font-medium">{format(new Date(code.valid_until), 'MMM dd, yyyy')}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {getStatusBadge(code.status)}
              {code.status === 'active' && (
                <button
                  onClick={() => handleDeactivate(code.id)}
                  className="text-sm text-red-600 hover:text-red-900 flex items-center"
                >
                  <Ban className="w-4 h-4 mr-1" />
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCode ? 'Edit Promo Code' : 'Create Promo Code'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Promo Code
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input-field"
                    placeholder="e.g., SUMMER2024"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Type
                    </label>
                    <select
                      value={formData.discount_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_type: e.target.value as 'percentage' | 'fixed',
                        })
                      }
                      className="input-field"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: parseFloat(e.target.value) })
                      }
                      className="input-field"
                      min="0"
                      step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min. Booking Value ($)
                    </label>
                    <input
                      type="number"
                      value={formData.min_booking_value || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, min_booking_value: parseFloat(e.target.value) || undefined })
                      }
                      className="input-field"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max. Discount ($)
                    </label>
                    <input
                      type="number"
                      value={formData.max_discount || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, max_discount: parseFloat(e.target.value) || undefined })
                      }
                      className="input-field"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid From
                    </label>
                    <input
                      type="date"
                      value={formData.valid_from}
                      onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valid Until
                    </label>
                    <input
                      type="date"
                      value={formData.valid_until}
                      onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Limit (Optional)
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: parseInt(e.target.value) || undefined })
                    }
                    className="input-field"
                    min="1"
                    placeholder="Leave empty for unlimited"
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingCode ? 'Update' : 'Create'} Promo Code
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
