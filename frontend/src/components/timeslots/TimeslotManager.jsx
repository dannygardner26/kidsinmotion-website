import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Users, Clock, AlertTriangle } from 'lucide-react';
import firestoreTimeslotService from '../../services/firestoreTimeslotService';
import firebaseRealtimeTimeslotService from '../../services/firebaseRealtimeTimeslotService';

const TimeslotManager = ({
  eventId,
  eventStartTime,
  eventEndTime,
  isEditMode = false,
  onTimeslotsChange
}) => {
  const [mode, setMode] = useState('auto'); // 'auto' or 'custom'
  const [timeslots, setTimeslots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Auto-generate settings
  const [slotDuration, setSlotDuration] = useState(120); // 2 hours default
  const [defaultCapacity, setDefaultCapacity] = useState(5);
  const [previewSlots, setPreviewSlots] = useState([]);

  // Custom slot form
  const [customSlot, setCustomSlot] = useState({
    startTime: '',
    endTime: '',
    capacity: 5
  });

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Load existing timeslots if in edit mode
  useEffect(() => {
    if (!eventId || !isEditMode) return;

    const unsubscribe = firebaseRealtimeTimeslotService.subscribeToEventTimeslotsWithSignups(
      eventId,
      (slotsWithSignups) => {
        setTimeslots(slotsWithSignups);
        if (onTimeslotsChange) onTimeslotsChange(slotsWithSignups);
      },
      (err) => {
        console.error('Error loading timeslots:', err);
        setError('Failed to load existing timeslots');
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [eventId, isEditMode]);

  // Generate preview slots when settings change
  useEffect(() => {
    if (mode !== 'auto' || !eventStartTime || !eventEndTime) {
      setPreviewSlots([]);
      return;
    }

    const slots = generatePreviewSlots(eventStartTime, eventEndTime, slotDuration, defaultCapacity);
    setPreviewSlots(slots);
  }, [mode, eventStartTime, eventEndTime, slotDuration, defaultCapacity]);

  const generatePreviewSlots = (startTime, endTime, duration, capacity) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalMinutes = endMinutes - startMinutes;

    if (totalMinutes <= 0) return [];

    const numberOfSlots = Math.ceil(totalMinutes / duration);
    const slots = [];

    for (let i = 0; i < numberOfSlots; i++) {
      const slotStartMinutes = startMinutes + (i * duration);
      const slotEndMinutes = Math.min(slotStartMinutes + duration, endMinutes);

      slots.push({
        shiftNumber: i + 1,
        startTime: minutesToTime(slotStartMinutes),
        endTime: minutesToTime(slotEndMinutes),
        capacity
      });
    }

    return slots;
  };

  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const formatTime12 = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const handleAutoGenerate = async () => {
    if (!eventId) {
      setError('Event must be saved before generating timeslots');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const generated = await firestoreTimeslotService.generateTimeslots(
        eventId,
        eventStartTime,
        eventEndTime,
        slotDuration,
        defaultCapacity
      );

      setTimeslots(generated);
      if (onTimeslotsChange) onTimeslotsChange(generated);
      setSuccessMessage(`Generated ${generated.length} timeslots successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error generating timeslots:', err);
      setError(err.message || 'Failed to generate timeslots');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomSlot = async () => {
    if (!eventId) {
      setError('Event must be saved before adding timeslots');
      return;
    }

    if (!customSlot.startTime || !customSlot.endTime) {
      setError('Please enter start and end times');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newSlot = await firestoreTimeslotService.createTimeslot(eventId, {
        shiftNumber: timeslots.length + 1,
        startTime: customSlot.startTime,
        endTime: customSlot.endTime,
        capacity: customSlot.capacity
      });

      setTimeslots([...timeslots, newSlot]);
      if (onTimeslotsChange) onTimeslotsChange([...timeslots, newSlot]);
      setCustomSlot({ startTime: '', endTime: '', capacity: 5 });
      setSuccessMessage('Timeslot added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error adding timeslot:', err);
      setError(err.message || 'Failed to add timeslot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCapacity = async (slotId, newCapacity) => {
    const slot = timeslots.find(s => s.id === slotId);
    if (!slot) return;

    // Only allow increasing capacity if there are signups
    if (slot.current > 0 && newCapacity < slot.current) {
      setError('Cannot reduce capacity below current signups');
      return;
    }

    try {
      await firestoreTimeslotService.updateTimeslot(slotId, { capacity: newCapacity });

      const updatedSlots = timeslots.map(s =>
        s.id === slotId ? { ...s, capacity: newCapacity } : s
      );
      setTimeslots(updatedSlots);
      if (onTimeslotsChange) onTimeslotsChange(updatedSlots);
    } catch (err) {
      console.error('Error updating capacity:', err);
      setError(err.message || 'Failed to update capacity');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    const slot = timeslots.find(s => s.id === slotId);
    if (!slot) return;

    // Show confirmation if there are signups
    if (slot.current > 0 && deleteConfirm !== slotId) {
      setDeleteConfirm(slotId);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await firestoreTimeslotService.deleteTimeslot(slotId);

      const updatedSlots = timeslots.filter(s => s.id !== slotId);
      // Renumber remaining slots
      const renumberedSlots = updatedSlots.map((s, idx) => ({ ...s, shiftNumber: idx + 1 }));
      setTimeslots(renumberedSlots);
      if (onTimeslotsChange) onTimeslotsChange(renumberedSlots);
      setDeleteConfirm(null);
      setSuccessMessage('Timeslot deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting timeslot:', err);
      setError(err.message || 'Failed to delete timeslot');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTeamLead = async (slotId, userId) => {
    try {
      if (userId) {
        await firestoreTimeslotService.assignTeamLead(slotId, userId);
      } else {
        await firestoreTimeslotService.removeTeamLead(slotId);
      }

      const updatedSlots = timeslots.map(s =>
        s.id === slotId ? { ...s, teamLeadUserId: userId } : s
      );
      setTimeslots(updatedSlots);
      if (onTimeslotsChange) onTimeslotsChange(updatedSlots);
    } catch (err) {
      console.error('Error assigning team lead:', err);
      setError(err.message || 'Failed to assign team lead');
    }
  };

  return (
    <div className="timeslot-manager">
      <h3 className="manager-title">Volunteer Shifts</h3>

      {error && (
        <div className="manager-error">
          <AlertTriangle size={16} />
          {error}
          <button onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {successMessage && (
        <div className="manager-success">
          {successMessage}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'auto' ? 'active' : ''}`}
          onClick={() => setMode('auto')}
        >
          Auto-Generate
        </button>
        <button
          className={`mode-btn ${mode === 'custom' ? 'active' : ''}`}
          onClick={() => setMode('custom')}
        >
          Custom Shifts
        </button>
      </div>

      {/* Auto-Generate Mode */}
      {mode === 'auto' && (
        <div className="auto-generate-section">
          <div className="auto-settings">
            <div className="setting-group">
              <label>Shift Duration</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
              >
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={180}>3 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>

            <div className="setting-group">
              <label>Volunteers per Shift</label>
              <input
                type="number"
                min="1"
                max="50"
                value={defaultCapacity}
                onChange={(e) => setDefaultCapacity(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Preview */}
          {previewSlots.length > 0 && (
            <div className="preview-section">
              <h4>Preview ({previewSlots.length} shifts)</h4>
              <div className="preview-list">
                {previewSlots.map((slot, idx) => (
                  <div key={idx} className="preview-slot">
                    <span className="preview-label">Shift {slot.shiftNumber}</span>
                    <span className="preview-time">
                      {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
                    </span>
                    <span className="preview-capacity">
                      <Users size={14} /> {slot.capacity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            className="btn-generate"
            onClick={handleAutoGenerate}
            disabled={isLoading || !eventStartTime || !eventEndTime || previewSlots.length === 0}
          >
            {isLoading ? 'Generating...' : `Generate ${previewSlots.length} Shifts`}
          </button>

          {(!eventStartTime || !eventEndTime) && (
            <p className="helper-text">Set event start and end times first</p>
          )}
        </div>
      )}

      {/* Custom Mode */}
      {mode === 'custom' && (
        <div className="custom-section">
          <div className="custom-form">
            <div className="form-row">
              <div className="form-group">
                <label>Start Time</label>
                <input
                  type="time"
                  value={customSlot.startTime}
                  onChange={(e) => setCustomSlot({ ...customSlot, startTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Time</label>
                <input
                  type="time"
                  value={customSlot.endTime}
                  onChange={(e) => setCustomSlot({ ...customSlot, endTime: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={customSlot.capacity}
                  onChange={(e) => setCustomSlot({ ...customSlot, capacity: Number(e.target.value) })}
                />
              </div>
              <button
                className="btn-add-slot"
                onClick={handleAddCustomSlot}
                disabled={isLoading}
              >
                <Plus size={16} />
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Timeslots */}
      {timeslots.length > 0 && (
        <div className="existing-slots">
          <h4>Current Shifts ({timeslots.length})</h4>
          <div className="slots-list">
            {timeslots.map((slot) => (
              <div key={slot.id} className="slot-card">
                <div className="slot-header">
                  <span className="slot-number">Shift {slot.shiftNumber}</span>
                  <span className="slot-time">
                    <Clock size={14} />
                    {formatTime12(slot.startTime)} - {formatTime12(slot.endTime)}
                  </span>
                </div>

                <div className="slot-body">
                  <div className="slot-stat">
                    <Users size={14} />
                    <span>{slot.current || 0}/{slot.capacity} volunteers</span>
                  </div>

                  <div className="slot-controls">
                    <label>Capacity:</label>
                    <input
                      type="number"
                      min={slot.current || 1}
                      max="50"
                      value={slot.capacity}
                      onChange={(e) => handleUpdateCapacity(slot.id, Number(e.target.value))}
                      disabled={isLoading}
                    />
                  </div>

                  {/* Team Lead Assignment */}
                  {slot.signups && slot.signups.length > 0 && (
                    <div className="team-lead-section">
                      <label>Team Lead:</label>
                      <select
                        value={slot.teamLeadUserId || ''}
                        onChange={(e) => handleAssignTeamLead(slot.id, e.target.value || null)}
                      >
                        <option value="">None</option>
                        {slot.signups.map((signup) => (
                          <option key={signup.userId} value={signup.userId}>
                            {signup.userFirstName} {signup.userLastName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="slot-actions">
                  {deleteConfirm === slot.id ? (
                    <div className="delete-confirm">
                      <span className="confirm-text">
                        Delete shift with {slot.current} volunteer{slot.current !== 1 ? 's' : ''}?
                      </span>
                      <button
                        className="btn-confirm-delete"
                        onClick={() => handleDeleteSlot(slot.id)}
                      >
                        Yes, Delete
                      </button>
                      <button
                        className="btn-cancel-delete"
                        onClick={() => setDeleteConfirm(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-delete-slot"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={isLoading}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .timeslot-manager {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-top: 1rem;
        }

        .manager-title {
          margin: 0 0 1rem 0;
          color: var(--primary);
          font-size: 1.125rem;
        }

        .manager-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .manager-error button {
          margin-left: auto;
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #dc2626;
        }

        .manager-success {
          background: #dcfce7;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .mode-btn {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          background: white;
          border-radius: 0.5rem;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.15s ease;
        }

        .mode-btn:hover {
          border-color: var(--primary);
        }

        .mode-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .auto-generate-section {
          margin-bottom: 1.5rem;
        }

        .auto-settings {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .setting-group {
          flex: 1;
        }

        .setting-group label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .setting-group select,
        .setting-group input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .preview-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .preview-section h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .preview-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 200px;
          overflow-y: auto;
        }

        .preview-slot {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.5rem;
          background: #f9fafb;
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .preview-label {
          font-weight: 500;
          color: var(--primary);
          min-width: 60px;
        }

        .preview-time {
          color: #6b7280;
        }

        .preview-capacity {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: auto;
          color: #6b7280;
        }

        .btn-generate {
          width: 100%;
          padding: 0.75rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-generate:hover:not(:disabled) {
          background: rgba(47, 80, 106, 0.9);
        }

        .btn-generate:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .helper-text {
          text-align: center;
          color: #9ca3af;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .custom-section {
          margin-bottom: 1.5rem;
        }

        .custom-form .form-row {
          display: flex;
          gap: 0.75rem;
          align-items: flex-end;
        }

        .custom-form .form-group {
          flex: 1;
        }

        .custom-form label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.25rem;
        }

        .custom-form input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
        }

        .btn-add-slot {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-add-slot:hover:not(:disabled) {
          background: rgba(47, 80, 106, 0.9);
        }

        .existing-slots {
          border-top: 1px solid #e5e7eb;
          padding-top: 1rem;
        }

        .existing-slots h4 {
          margin: 0 0 1rem 0;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .slots-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .slot-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
        }

        .slot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .slot-number {
          font-weight: 600;
          color: var(--primary);
        }

        .slot-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .slot-body {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
        }

        .slot-stat {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .slot-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .slot-controls label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .slot-controls input {
          width: 60px;
          padding: 0.25rem 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
        }

        .team-lead-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .team-lead-section label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .team-lead-section select {
          padding: 0.25rem 0.5rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.25rem;
        }

        .slot-actions {
          margin-top: 0.75rem;
          display: flex;
          justify-content: flex-end;
        }

        .btn-delete-slot {
          padding: 0.5rem;
          background: transparent;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          color: #6b7280;
          cursor: pointer;
        }

        .btn-delete-slot:hover {
          background: #fee2e2;
          border-color: #fecaca;
          color: #dc2626;
        }

        .delete-confirm {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }

        .confirm-text {
          font-size: 0.875rem;
          color: #dc2626;
        }

        .btn-confirm-delete {
          padding: 0.375rem 0.75rem;
          background: #dc2626;
          color: white;
          border: none;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .btn-cancel-delete {
          padding: 0.375rem 0.75rem;
          background: #e5e7eb;
          color: #4b5563;
          border: none;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        @media (max-width: 640px) {
          .auto-settings {
            flex-direction: column;
          }

          .custom-form .form-row {
            flex-wrap: wrap;
          }

          .custom-form .form-group {
            min-width: calc(50% - 0.375rem);
          }

          .btn-add-slot {
            width: 100%;
            justify-content: center;
          }

          .slot-body {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
};

export default TimeslotManager;
