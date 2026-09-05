import React, { useEffect, useState } from 'react';
import { Calendar, Clock, User, Plus, X, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
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
      await apiRequest(`/user/bookings/${bookingId}/cancel`, { method: 'POST' });
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#080512]">
            Coaching & Trainer Bookings
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Reserve dedicated 1-on-1 athletic coaching, body composition evaluations, and biomechanics reviews.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 rounded-2xl bg-[#080512] text-white text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-neutral-800 transition-all self-start sm:self-center cursor-pointer shadow-lg shadow-purple-950/5"
        >
          <Plus className="w-4 h-4" />
          <span>Book Session</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-neutral-200 rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Section */}
          <div>
            <h2 className="text-lg font-black text-[#080512] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Upcoming Scheduled Sessions ({upcomingBookings.length})
            </h2>

            {upcomingBookings.length === 0 ? (
              <div className="p-8 rounded-3xl bg-white border border-neutral-200 text-center">
                <Calendar className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                <p className="text-sm font-bold text-neutral-700">No upcoming sessions booked</p>
                <p className="text-xs text-neutral-400 mt-1">Connect with our certified master coaches for targeted form evaluation.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#080512] text-white text-xs font-bold cursor-pointer"
                >
                  Schedule Your Next Session
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-[28px] p-6 border border-neutral-200/80 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-[10px] font-black uppercase">
                          {b.status}
                        </span>
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="text-neutral-400 hover:text-red-600 text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>

                      <h3 className="text-base font-black text-[#080512]">{b.sessionType}</h3>
                      <p className="text-xs text-neutral-600 mt-1">
                        Trainer: <span className="font-bold text-neutral-900">{b.trainerName}</span>
                      </p>

                      <div className="mt-4 p-3 rounded-2xl bg-neutral-50 border border-neutral-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-neutral-700 font-medium">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <span>{b.date}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-neutral-500 font-mono">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{b.timeSlot}</span>
                        </div>
                      </div>

                      {b.notes && (
                        <p className="text-xs text-neutral-500 italic mt-3">
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
              <h2 className="text-base font-black text-neutral-500 mb-4">
                Completed & Past Sessions History
              </h2>
              <div className="bg-white rounded-[28px] border border-neutral-200/80 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50/80 text-neutral-400 uppercase font-bold border-b border-neutral-100">
                      <th className="py-3 px-6">Session Type</th>
                      <th className="py-3 px-6">Trainer</th>
                      <th className="py-3 px-6">Date</th>
                      <th className="py-3 px-6">Time</th>
                      <th className="py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {pastBookings.map((b) => (
                      <tr key={b.id} className="text-neutral-700">
                        <td className="py-3.5 px-6 font-bold text-[#080512]">{b.sessionType}</td>
                        <td className="py-3.5 px-6">{b.trainerName}</td>
                        <td className="py-3.5 px-6">{b.date}</td>
                        <td className="py-3.5 px-6">{b.timeSlot}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-500'
                          }`}>
                            {b.status}
                          </span>
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
        <div className="fixed inset-0 bg-[#080512]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-neutral-200 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#080512]">Schedule Coaching Session</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <form onSubmit={handleBookSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Select Coach *</label>
                <select
                  value={trainerId}
                  onChange={(e) => setTrainerId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-bold"
                >
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#080512] mb-1">Session Specialty</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                >
                  <option value="1-on-1 Hypertrophy Coaching">1-on-1 Hypertrophy Coaching</option>
                  <option value="Olympic Barbell & Deadlift Analysis">Olympic Barbell & Deadlift Analysis</option>
                  <option value="Metabolic Conditioning Assessment">Metabolic Conditioning Assessment</option>
                  <option value="Functional Mobility & Recovery">Functional Mobility & Recovery</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#080512] mb-1">Time Slot *</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
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
                <label className="block text-xs font-bold text-[#080512] mb-1">Training Objective / Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Focus on squat depth and hip drive mechanics."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-[#080512] text-white text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {submitting ? 'Confirming with Coach...' : 'Confirm Session Booking'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
