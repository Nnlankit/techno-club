import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, 
  Clock, MapPin, Tag, Layers, Filter, CheckCircle2, AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { CalendarItem, Domain } from '../types';
import { 
  Button, Badge, Modal, PageHeader, EmptyState, LoadingState, Card 
} from '../components/ui';

export const CalendarPage: React.FC = () => {
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);

  // Date State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'schedule'>('month');

  // Filters
  const [selectedDomainId, setSelectedDomainId] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Selected item detail modal
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  useEffect(() => {
    loadCalendar();
  }, [currentDate, selectedDomainId]);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadCalendar = async () => {
    setLoading(true);
    try {
      const data = await api.calendar.getUnified({
        domain_id: selectedDomainId !== 'All' ? Number(selectedDomainId) : undefined,
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

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = [];
    const startingDayOfWeek = firstDay.getDay();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }

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
      {/* Section 9 Page Header */}
      <PageHeader
        title="Calendar"
        description="Unified master schedule across workshops, hackathons, leadership syncs, and delivery deadlines."
        filterProps={{
          filters: [
            {
              key: 'domain',
              label: 'Domain',
              value: selectedDomainId,
              onChange: setSelectedDomainId,
              options: [
                { label: 'All Domains', value: 'All' },
                ...domains.map(d => ({ label: d.name, value: d.id.toString() }))
              ]
            },
            {
              key: 'category',
              label: 'Category',
              value: selectedCategory,
              onChange: setSelectedCategory,
              options: [
                { label: 'All Categories', value: 'All' },
                { label: 'Events & Workshops', value: 'event' },
                { label: 'Hackathons', value: 'hackathon' },
                { label: 'Sync Meetings', value: 'meeting' },
                { label: 'Tasks & Deadlines', value: 'task' },
              ]
            }
          ]
        }}
        actions={
          <div className="flex items-center space-x-2">
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('schedule')}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  viewMode === 'schedule'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Schedule
              </button>
            </div>

            <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        }
      />

      {/* Current Month Banner */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <span className="text-xs text-slate-400 font-medium">
          {filteredItems.length} active scheduled items
        </span>
      </div>

      {loading ? (
        <LoadingState message="Loading calendar timeline..." />
      ) : viewMode === 'month' ? (
        /* Month View Grid */
        <Card className="overflow-hidden shadow-xs">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-center py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Days Matrix */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {getDaysInMonth().map((dayObj, idx) => {
              const dayItems = getItemsForDate(dayObj.date);
              const isToday = 
                new Date().toISOString().split('T')[0] === dayObj.date.toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  className={`min-h-[105px] p-2 flex flex-col justify-between transition-colors ${
                    !dayObj.isCurrentMonth
                      ? 'bg-slate-50/40 dark:bg-slate-900/40 text-slate-400'
                      : isToday
                      ? 'bg-blue-50/30 dark:bg-blue-950/10'
                      : 'bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-amber-600 text-white font-black'
                          : dayObj.isCurrentMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>
                    {dayItems.length > 0 && (
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {dayItems.length}
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 overflow-y-auto max-h-20">
                    {dayItems.slice(0, 3).map((item) => (
                      <div
                        key={`${item.category}-${item.id}`}
                        onClick={() => setSelectedItem(item)}
                        className="px-1.5 py-0.5 rounded text-[10px] font-medium truncate cursor-pointer hover:opacity-90 transition-opacity bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-900"
                        title={item.title}
                      >
                        {item.title}
                      </div>
                    ))}
                    {dayItems.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-medium pl-1">
                        +{dayItems.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        /* Schedule View (Agenda List) */
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <EmptyState
              title="No Scheduled Events"
              description="No workshops, hackathons, or meetings found for this month."
            />
          ) : (
            filteredItems.map((item) => (
              <Card
                key={`${item.category}-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className="p-4 hover:border-blue-400 dark:hover:border-blue-500/50 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {item.category}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {item.domain_name || 'Club Wide'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      {new Date(item.start).toLocaleDateString()} at {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {item.venue && (
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {item.venue}
                      </span>
                    )}
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Calendar Item Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          subtitle={`Category: ${selectedItem.category.toUpperCase()} • ${selectedItem.type_badge || ''}`}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Time & Date:</span>
                <strong className="text-slate-900 dark:text-white">
                  {new Date(selectedItem.start).toLocaleString()}
                </strong>
              </div>
              {selectedItem.venue && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Venue:</span>
                  <strong className="text-slate-900 dark:text-white">{selectedItem.venue}</strong>
                </div>
              )}
              {selectedItem.domain_name && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Organizing Domain:</span>
                  <strong className="text-blue-600 dark:text-blue-400">{selectedItem.domain_name}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <strong className="text-slate-700 dark:text-slate-300">{selectedItem.status}</strong>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
