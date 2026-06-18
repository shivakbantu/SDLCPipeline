import { useEffect, useState } from 'react';
import { disputeService, Dispute } from '@/services/disputeService';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle, MessageSquare } from 'lucide-react';

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState('');

  useEffect(() => {
    loadDisputes();
  }, [selectedStatus]);

  const loadDisputes = async () => {
    try {
      const filters = selectedStatus !== 'all' ? { status: selectedStatus } : undefined;
      const data = await disputeService.getDisputes(filters);
      setDisputes(data);
    } catch (error) {
      console.error('Failed to load disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    disputeId: string,
    status: Dispute['status'],
    resolutionText?: string
  ) => {
    try {
      await disputeService.updateDisputeStatus(disputeId, status, resolutionText);
      await loadDisputes();
      setSelectedDispute(null);
      setResolution('');
    } catch (error) {
      console.error('Failed to update dispute status:', error);
    }
  };

  const getStatusBadge = (status: Dispute['status']) => {
    const styles = {
      open: 'bg-yellow-100 text-yellow-800',
      investigating: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const getPriorityBadge = (priority: Dispute['priority']) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority]}`}
      >
        {priority.toUpperCase()}
      </span>
    );
  };

  const getTypeBadge = (type: Dispute['type']) => {
    const styles = {
      refund: 'bg-purple-100 text-purple-800',
      service: 'bg-blue-100 text-blue-800',
      billing: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type]}`}
      >
        {type.toUpperCase()}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dispute Management</h1>
        <p className="text-gray-600 mt-2">Handle and resolve customer disputes</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        {['all', 'open', 'investigating', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setSelectedStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedStatus === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.length === 0 ? (
          <div className="card text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No disputes found</p>
          </div>
        ) : (
          disputes.map((dispute) => (
            <div key={dispute.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">Dispute #{dispute.id.slice(0, 8)}</h3>
                    {getTypeBadge(dispute.type)}
                    {getPriorityBadge(dispute.priority)}
                    {getStatusBadge(dispute.status)}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">User:</span> {dispute.user_name}
                    </div>
                    <div>
                      <span className="font-medium">Hotel:</span> {dispute.hotel_name}
                    </div>
                    <div>
                      <span className="font-medium">Booking ID:</span> {dispute.booking_id.slice(0, 8)}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {format(new Date(dispute.created_at), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Description:</p>
                <p className="text-sm text-gray-600">{dispute.description}</p>
              </div>

              {dispute.resolution && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-medium text-green-900 mb-1">Resolution:</p>
                  <p className="text-sm text-green-800">{dispute.resolution}</p>
                  {dispute.resolved_at && (
                    <p className="text-xs text-green-600 mt-2">
                      Resolved on {format(new Date(dispute.resolved_at), 'MMM dd, yyyy')}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              {(dispute.status === 'open' || dispute.status === 'investigating') && (
                <div className="flex space-x-2">
                  {dispute.status === 'open' && (
                    <button
                      onClick={() => handleUpdateStatus(dispute.id, 'investigating')}
                      className="btn-primary text-sm flex items-center"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Start Investigation
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedDispute(dispute)}
                    className="btn-primary text-sm flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Resolve Dispute
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Resolve Dispute</h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Dispute Description:</p>
                <p className="text-sm text-gray-600">{selectedDispute.description}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Details
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  className="input-field"
                  placeholder="Describe how this dispute was resolved..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setSelectedDispute(null);
                    setResolution('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedDispute.id, 'resolved', resolution)}
                  disabled={!resolution.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
