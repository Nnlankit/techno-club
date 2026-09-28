import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Clock, MapPin, Tag, Layers, Filter, CheckCircle2, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { CalendarItem, Domain } from '../types';
import { Modal } from '../components/Modal';

export const CalendarPage: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'schedule'>('month');

  // Filters
  const [selectedDomainId, setSelectedDomainId] = useState<number | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Selected item detail modal
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  useEffect(() => {
    loadCalendar();
    loadDomains();
  }, [currentDate, selectedDomainId]);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await api.calendar.getUnified({
        domain_id: selectedDomainId,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDomains = async () => {
    try {
      const data = await api.domains.list();
      setDomains(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar month matrix generator
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }

    return days;
  };

  const filteredItems = items.filter(item => {
    if (selectedCategory === 'All') return true;
    return item.category.toLowerCase() === selectedCategory.toLowerCase();
  });

  const getItemsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredItems.filter(item => {
      if (!item.start) return false;
      const itemStart = item.start.split('T')[0];
      return itemStart === dateStr;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>Unified Club Calendar & Timeline</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {filteredItems.length} Milestones
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Aggregated schedule of workshops, hackathons, meetings, task deadlines, and registration cutoffs.
          </p>
        </div>

        {/* View Switcher & Month Navigation */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Month Grid
            </button>
            <button
              onClick={() => setViewMode('schedule')}
              className={`px-3 py-1 rounded-md transition-all ${
                viewMode === 'schedule'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Agenda List
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Today
          </button>

          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[130px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', 'Event', 'Hackathon', 'Meeting', 'Task Deadline'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-slate-500 font-medium">Domain Filter:</label>
          <select
            value={selectedDomainId || ''}
            onChange={(e) => setSelectedDomainId(e.target.value ? Number(e.target.value) : undefined)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300"
          >
            <option value="">All Technical Domains</option>
            {domains.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'month' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-center py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {getDaysInMonth().map((dayObj, i) => {
              const dayItems = getItemsForDate(dayObj.date);
              const isToday = dayObj.date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={i}
                  className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                    !dayObj.isCurrentMonth
                      ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white font-bold'
                          : dayObj.isCurrentMonth
                          ? 'text-slate-900 dark:text-white'
                          : 'text-slate-400 dark:text-slate-600'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Items list for day */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px]">
                    {dayItems.slice(0, 3).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate block transition-opacity hover:opacity-80 ${
                          item.category === 'Hackathon'
                            ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-200'
                            : item.category === 'Meeting'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : item.category === 'Task Deadline'
                            ? 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200'
                            : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200'
                        }`}
                      >
                        {item.title}
                      </button>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-semibold px-1">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda / Schedule List View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No milestones scheduled in this date range.
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedItem(item)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg text-white ${
                    item.category === 'Hackathon' ? 'bg-purple-600' :
                    item.category === 'Meeting' ? 'bg-amber-600' :
                    item.category === 'Task Deadline' ? 'bg-rose-600' : 'bg-indigo-600'
                  }`}>
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{item.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {item.type_badge || item.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.start).toLocaleDateString()} {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                      {item.venue && (
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{item.venue}</span>
                        </span>
                      )}
                      {item.domain_name && (
                        <span className="flex items-center space-x-1">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{item.domain_name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {item.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || 'Schedule Details'}
      >
        {selectedItem && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                <div className="font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                  {selectedItem.type_badge || selectedItem.category}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {selectedItem.status}
              </span>
            </div>

            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>
                  <strong>Date & Time:</strong> {new Date(selectedItem.start).toLocaleString()}
                  {selectedItem.end && ` - ${new Date(selectedItem.end).toLocaleTimeString()}`}
                </span>
              </div>
              {selectedItem.venue && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span><strong>Location / Venue:</strong> {selectedItem.venue}</span>
                </div>
              )}
              {selectedItem.domain_name && (
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span><strong>Domain:</strong> {selectedItem.domain_name}</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Close Details
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
