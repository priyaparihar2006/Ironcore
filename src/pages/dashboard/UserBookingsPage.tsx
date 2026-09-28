import { PageHeader } from '../../components/dashboard/PageHeader';
import { Badge } from '../../components/dashboard/Badge';
import { EmptyState } from '../../components/dashboard/EmptyState';
import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, X, Trash2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { BookingSession } from '../../types';

interface TrainerOption {
  id: string;
  name: string;
  specialization: string;
}

export const UserBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingSession[]>([]);
  const [trainers, setTrainers] = useState<TrainerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Book Modal State
  const [showModal, setShowModal] = useState(false);
  const [trainerId, setTrainerId] = useState('');
  const [sessionType, setSessionType] = useState('1-on-1 Hypertrophy Coaching');
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 11:00 AM');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ bookings: BookingSession[]; trainers: TrainerOption[] }>('/user/bookings');
      setBookings(res.bookings || []);
      setTrainers(res.trainers || []);
      if (res.trainers?.length > 0 && !trainerId) {
        setTrainerId(res.trainers[0].id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trainerId || !date) return;

    setSubmitting(true);
    try {
      await apiRequest('/user/bookings', {
        method: 'POST',
        body: JSON.stringify({
          trainerId,
          sessionType,
          date,
          timeSlot,
          notes,
        }),
      });
      setShowModal(false);
      setNotes('');
      await fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled coaching session?')) return;

    try {
      setCancellingId(bookingId);
      await apiRequest(`/user/bookings/${bookingId}/cancel`, { method: 'PUT' });
      await fetchBookings();
    } catch (err) {
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED');
  const pastBookings = bookings.filter((b) => b.status !== 'CONFIRMED');

  return (
    <div className="space-y-section">
      {/* Header */}
      <PageHeader
        title="Bookings"
        subtitle="Reserve 1-on-1 coaching and body composition evaluations."
        actions={
          <>
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Book Session</span>
            </button>
          </>
        }
      />

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-section">
          {/* Upcoming Section */}
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-main)] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Upcoming Scheduled Sessions ({upcomingBookings.length})
            </h2>

            {upcomingBookings.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={Calendar}
                  title="No upcoming sessions booked"
                  body="Connect with our certified master coaches for targeted form evaluation."
                  action={{ label: 'Schedule Your Next Session', onClick: () => setShowModal(true) }}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="card flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Badge tone="info">{b.status}</Badge>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="btn btn-ghost btn-sm text-[var(--color-text-muted)] hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>

                      <h3 className="text-base font-bold text-[var(--color-text-main)]">{b.sessionType}</h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Trainer: <span className="font-bold text-[var(--color-text-main)]">{b.trainerName}</span>
                      </p>

                      <div className="mt-4 p-3 rounded-lg bg-[var(--color-brand-bg)] border border-[var(--color-border-main)]/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-neutral-700 font-medium">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>{b.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--color-text-muted)] font-mono">
                          <Clock className="w-4 h-4" />
                          <span>{b.timeSlot}</span>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="text-xs text-[var(--color-text-muted)] italic mt-3">
                          "{b.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Sessions History */}
          {pastBookings.length > 0 && (
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-muted)] mb-4">
                Completed & Past Sessions History
              </h2>
              <div className="card overflow-hidden !p-0">
                <table className="table-clean">
                  <thead>
                    <tr>
                      <th>Session Type</th>
                      <th>Trainer</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pastBookings.map((b) => (
                      <tr key={b.id} className="text-neutral-700">
                        <td className="font-bold text-[var(--color-text-main)]">{b.sessionType}</td>
                        <td>{b.trainerName}</td>
                        <td>{b.date}</td>
                        <td>{b.timeSlot}</td>
                        <td>
                          <Badge tone={b.status === 'COMPLETED' ? 'success' : 'neutral'}>{b.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Book Session Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-card">
          <div className="card max-w-md w-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-text-main)]">Schedule Coaching Session</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-[var(--color-text-muted)]" />
              </button>
            </div>

            <form onSubmit={handleBookSession} className="space-y-4">
              <div>
                <label className="form-label">Select Coach *</label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="form-input"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Session Specialty</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="form-input"
                >
                  <option value="1-on-1 Hypertrophy Coaching">1-on-1 Hypertrophy Coaching</option>
                  <option value="Olympic Barbell & Deadlift Analysis">Olympic Barbell & Deadlift Analysis</option>
                  <option value="Metabolic Conditioning Assessment">Metabolic Conditioning Assessment</option>
                  <option value="Functional Mobility & Recovery">Functional Mobility & Recovery</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <label className="form-label">Time Slot *</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="form-input"
                  >
                    <option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
                    <option value="04:30 PM - 05:30 PM">04:30 PM - 05:30 PM</option>
                    <option value="06:00 PM - 07:00 PM">06:00 PM - 07:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Training Objective / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Focus on squat depth and hip drive mechanics."
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? 'Confirming with Coach...' : 'Confirm Session Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
