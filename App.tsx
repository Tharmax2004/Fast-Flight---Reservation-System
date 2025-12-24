import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plane, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
  User, 
  CheckCircle2, 
  X,
  Loader2,
  ArrowRightLeft,
  Ticket,
  Clock,
  MessageCircle,
  Send,
  Sparkles,
  Bot,
  ThumbsUp,
  ThumbsDown,
  Bell,
  BellRing,
  Trash2,
  TrendingDown,
  Info,
  AlertCircle,
  Armchair,
  Briefcase,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Coffee,
  Wifi,
  Tv,
  ExternalLink,
  SlidersHorizontal,
  RotateCcw,
  Compass,
  Map,
  Gem,
  Palmtree,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Flag,
  AlertTriangle,
  Type as TypeIcon,
  Zap,
  ShieldAlert,
  HelpCircle,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { TripType, Flight, SearchCriteria, Booking, PriceAlert, PaymentMethod } from './types';
import { BookingSystem, FlightModel, AlertSystem } from './models';
import { getAIFlightSearch, getAIChatResponse, ChatResponse } from './services/geminiService';

// --- Types ---
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  feedback?: 'up' | 'down';
  rating?: number;
  reportedIssue?: {
    category: string;
    details: string;
    rating: number;
    requestFollowUp: boolean;
  };
  suggestedFlights?: Flight[];
}

type TimeWindow = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

// --- Helper Functions ---
const parseDurationToMinutes = (durationStr: string): number => {
  const hoursMatch = durationStr.match(/(\d+)h/);
  const minsMatch = durationStr.match(/(\d+)m/);
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const mins = minsMatch ? parseInt(minsMatch[1]) : 0;
  return (hours * 60) + mins;
};

const formatRouteInfo = (city: string, iata: string) => {
  return { city, code: (iata || 'TBD').toUpperCase() };
};

const get24HourTime = (timeStr: string): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(' ');
  if (parts.length < 2) return 0;
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + (minutes || 0);
};

const getTimeWindow = (timeStr: string): TimeWindow => {
  const minutes = get24HourTime(timeStr);
  if (minutes >= 300 && minutes < 720) return 'Morning'; 
  if (minutes >= 720 && minutes < 1080) return 'Afternoon'; 
  if (minutes >= 1080 && minutes < 1440) return 'Evening'; 
  return 'Night'; 
};

// --- Sub-components ---

const NavItem: React.FC<{ label: string; active?: boolean; onClick?: () => void; hasIndicator?: boolean }> = ({ label, active, onClick, hasIndicator }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all relative ${active ? 'bg-indigo-900 text-white shadow-lg shadow-indigo-200' : 'text-indigo-950/70 hover:text-indigo-900 hover:bg-white/40'}`}
  >
    {label}
    {hasIndicator && (
      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
    )}
  </button>
);

const SearchInput: React.FC<{ icon: React.ReactNode; label: string; value: string; placeholder: string; onChange: (v: string) => void; type?: string }> = ({ 
  icon, label, value, placeholder, onChange, type = "text" 
}) => (
  <div className="flex-1 min-w-[140px]">
    <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">{label}</label>
    <div className="flex items-center gap-2 p-2 bg-white/60 rounded-xl border border-white/80 focus-within:border-indigo-400 transition-all shadow-sm">
      <div className="text-gray-400">{icon}</div>
      <input 
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent text-sm w-full outline-none text-indigo-950 font-medium placeholder:text-gray-400"
      />
    </div>
  </div>
);

const App: React.FC = () => {
  const [tripType, setTripType] = useState<TripType>('One Way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [results, setResults] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Comparison state
  const [compareList, setCompareList] = useState<Flight[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filter States
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);
  const [maxDurationFilter, setMaxDurationFilter] = useState<number | null>(null);
  const [selectedStops, setSelectedStops] = useState<number[]>([]);
  const [selectedTimeWindows, setSelectedTimeWindows] = useState<TimeWindow[]>([]);
  const [isFilterBarExpanded, setIsFilterBarExpanded] = useState(false);

  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Credit Card');
  
  const [showHistory, setShowHistory] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  
  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingIndex, setReportingIndex] = useState<number | null>(null);
  const [reportCategory, setReportCategory] = useState('Accuracy');
  const [reportDetails, setReportDetails] = useState('');
  const [reportRating, setReportRating] = useState(0);

  const [passengerName, setPassengerName] = useState('');
  const [bookedItem, setBookedItem] = useState<Booking | null>(null);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [myAlerts, setMyAlerts] = useState<PriceAlert[]>([]);
  const [alertTargetPrice, setAlertTargetPrice] = useState('');
  const [triggeredToast, setTriggeredToast] = useState(false);

  const bookingSystem = useRef(new BookingSystem());
  const alertSystem = useRef(new AlertSystem());
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMyBookings([...bookingSystem.current.getBookings()].reverse());
    setMyAlerts(alertSystem.current.getAlerts());
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert("Please enter origin and destination");
      return;
    }
    setIsLoading(true);
    setExpandedFlightId(null);
    setCompareList([]);
    resetFilters();

    const flights = await getAIFlightSearch({ 
      origin, 
      destination, 
      tripType, 
      departureDate, 
      returnDate: tripType === 'Round Trip' ? returnDate : undefined,
      travelers: parseInt(travelers) 
    });
    setResults(flights);
    setIsLoading(false);

    const hasTriggered = alertSystem.current.checkAlerts(flights);
    if (hasTriggered) {
      setTriggeredToast(true);
      setMyAlerts(alertSystem.current.getAlerts());
      setTimeout(() => setTriggeredToast(false), 5000);
    }
    
    setTimeout(() => {
      const el = document.getElementById('results-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const toggleCompare = (e: React.MouseEvent, flight: Flight) => {
    e.stopPropagation();
    setCompareList(prev => {
      const isSelected = prev.find(f => f.id === flight.id);
      if (isSelected) {
        return prev.filter(f => f.id !== flight.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 flights.");
        return prev;
      }
      return [...prev, flight];
    });
  };

  const uniqueAirlines = useMemo(() => {
    return Array.from(new Set(results.map(f => f.airline)));
  }, [results]);

  const priceRange = useMemo(() => {
    if (results.length === 0) return { min: 0, max: 0 };
    const prices = results.map(f => f.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(flight => {
      const airlineMatch = selectedAirlines.length === 0 || selectedAirlines.includes(flight.airline);
      const priceMatch = maxPriceFilter === null || flight.price <= maxPriceFilter;
      const durationMatch = maxDurationFilter === null || parseDurationToMinutes(flight.duration) <= maxDurationFilter;
      const stopsMatch = selectedStops.length === 0 || selectedStops.includes(flight.stops);
      const timeMatch = selectedTimeWindows.length === 0 || selectedTimeWindows.includes(getTimeWindow(flight.departureTime));
      return airlineMatch && priceMatch && durationMatch && stopsMatch && timeMatch;
    });
  }, [results, selectedAirlines, maxPriceFilter, maxDurationFilter, selectedStops, selectedTimeWindows]);

  const resetFilters = () => {
    setSelectedAirlines([]);
    setMaxPriceFilter(null);
    setMaxDurationFilter(null);
    setSelectedStops([]);
    setSelectedTimeWindows([]);
  };

  const toggleAirline = (airline: string) => {
    setSelectedAirlines(prev => prev.includes(airline) ? prev.filter(a => a !== airline) : [...prev, airline]);
  };

  const handleCreateAlert = () => {
    if (!origin || !destination || !alertTargetPrice) {
      alert("Search for a route first and set a target price.");
      return;
    }
    alertSystem.current.createAlert(origin, destination, departureDate, parseInt(alertTargetPrice));
    refreshData();
    setAlertTargetPrice('');
    alert("Price alert created!");
  };

  const handleChatSubmit = async (e?: React.FormEvent, presetMessage?: string) => {
    e?.preventDefault();
    const messageToSend = presetMessage || chatMessage;
    if (!messageToSend.trim()) return;

    setChatMessage('');
    const newHistory = [...chatHistory, { role: 'user' as const, parts: [{ text: messageToSend }] }];
    setChatHistory(newHistory);
    setChatLoading(true);

    const result = await getAIChatResponse(newHistory);
    setChatHistory([...newHistory, { 
      role: 'model' as const, 
      parts: [{ text: result.text }], 
      suggestedFlights: result.suggestedFlights 
    }]);
    setChatLoading(false);
  };

  const handleChatFeedback = (index: number, feedback: 'up' | 'down') => {
    const updatedHistory = [...chatHistory];
    updatedHistory[index] = { ...updatedHistory[index], feedback };
    setChatHistory(updatedHistory);
  };

  const handleChatRating = (index: number, rating: number) => {
    const updatedHistory = [...chatHistory];
    updatedHistory[index] = { ...updatedHistory[index], rating };
    setChatHistory(updatedHistory);
  };

  const initiateBooking = (e: React.MouseEvent | null, flight: Flight) => {
    if (e) e.stopPropagation();
    setSelectedFlight(flight);
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    if (!selectedFlight || !passengerName) return;
    setIsProcessingPayment(true);
    setTimeout(() => {
      const booking = bookingSystem.current.createBooking(selectedFlight, passengerName, selectedPaymentMethod);
      setBookedItem(booking);
      refreshData();
      setShowBookingModal(false);
      setIsProcessingPayment(false);
      setPassengerName('');
    }, 1500);
  };

  const paymentOptions: { id: PaymentMethod; icon: React.ReactNode; label: string }[] = [
    { id: 'Credit Card', icon: <CreditCard className="w-5 h-5" />, label: 'Credit Card' },
    { id: 'UPI', icon: <QrCode className="w-5 h-5" />, label: 'UPI / Scan' },
    { id: 'Net Banking', icon: <Building2 className="w-5 h-5" />, label: 'Net Banking' },
    { id: 'Corporate', icon: <Wallet className="w-5 h-5" />, label: 'Corporate' },
  ];

  const totalActiveFilters = selectedAirlines.length + (maxPriceFilter ? 1 : 0) + (maxDurationFilter ? 1 : 0) + selectedStops.length + selectedTimeWindows.length;

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* Comparison Floating Bar */}
      {compareList.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-indigo-950/90 text-white rounded-[2.5rem] p-4 shadow-2xl shadow-indigo-500/40 flex items-center justify-between border border-white/10 backdrop-blur-xl">
             <div className="flex items-center gap-4 pl-4">
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg"><Layers className="w-5 h-5" /></div>
                <div>
                   <p className="font-black text-sm">{compareList.length} Flight{compareList.length > 1 ? 's' : ''} Selected</p>
                   <p className="text-[10px] uppercase font-bold text-indigo-300">Side-by-side comparison</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <button onClick={() => setCompareList([])} className="p-3 hover:bg-white/10 rounded-2xl transition-all text-indigo-300"><X className="w-5 h-5" /></button>
                <button 
                  onClick={() => setShowCompareModal(true)}
                  className="bg-white text-indigo-950 px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                  Compare Now <ArrowRight className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-7xl px-6 py-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-indigo-700 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Plane className="w-6 h-6 rotate-45" />
          </div>
          <span className="text-xl font-extrabold tracking-tighter text-indigo-950">FAST FLIGHT</span>
        </div>
        
        <nav className="hidden md:flex glass-card p-1.5 rounded-full shadow-sm">
          <NavItem label="Home" active />
          <NavItem label="My Bookings" onClick={() => setShowHistory(true)} hasIndicator={myBookings.some(b => b.status === 'Confirmed')} />
          <NavItem label="Price Alerts" onClick={() => setShowAlerts(true)} />
          <NavItem label="Travel Advisor" onClick={() => setShowChat(true)} />
        </nav>

        <div className="flex items-center gap-4">
          <button onClick={() => setShowAlerts(true)} className="p-3 bg-white/60 hover:bg-white/90 rounded-full text-indigo-950 shadow-sm transition-all relative border border-white/40">
            <Bell className="w-5 h-5" />
            {myAlerts.some(a => a.isTriggered) && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
          </button>
          <button onClick={() => setShowHistory(true)} className="hidden sm:flex bg-indigo-900/10 border border-indigo-900/20 text-indigo-950 px-6 py-2 rounded-full text-sm font-semibold hover:bg-white/80 transition-all shadow-sm flex items-center gap-2">
            <Ticket className="w-4 h-4" /> My Trips
          </button>
        </div>
      </header>

      {/* Hero & Search */}
      <main className="w-full max-w-7xl px-6 pt-12 pb-24 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 items-center gap-12">
          <div className="z-10 animate-in fade-in slide-in-from-left duration-700">
            <h1 className="text-6xl md:text-8xl font-black leading-[1.05] text-white drop-shadow-2xl mb-8 max-w-xl">
              CHASE THE <span className="text-orange-400">SUNSET</span> ACROSS THE WORLD
            </h1>
            <p className="text-white/90 text-lg mb-10 max-w-md font-medium leading-relaxed drop-shadow-md">
              Experience unparalleled luxury and seamless connections. Book your next golden hour escape today.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => document.getElementById('search-form')?.scrollIntoView({ behavior: 'smooth' })} className="bg-indigo-900 text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-indigo-800 transition-all shadow-2xl shadow-indigo-300">
                Find Your Flight
              </button>
              <button onClick={() => setShowChat(true)} className="bg-white/80 backdrop-blur-md text-indigo-950 px-8 py-4 rounded-2xl text-lg font-bold hover:bg-white transition-all border border-indigo-100 flex items-center gap-2 shadow-xl">
                <Bot className="w-5 h-5" /> Travel Advisor
              </button>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div id="search-form" className="mt-16 glass-card p-8 rounded-[3rem] shadow-2xl relative z-40 border-white/60">
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex p-1 bg-white/40 rounded-2xl border border-white/60">
              {['One Way', 'Round Trip'].map((t) => (
                <button 
                  key={t} 
                  type="button"
                  onClick={() => setTripType(t as TripType)} 
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${tripType === t ? 'bg-indigo-900 text-white shadow-lg' : 'text-indigo-950/60 hover:text-indigo-950'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex flex-wrap lg:flex-nowrap gap-4 items-end">
            <SearchInput icon={<MapPin className="w-4 h-4" />} label="Origin" value={origin} onChange={setOrigin} placeholder="City" />
            <div className="flex items-center justify-center p-2 mb-1.5 bg-white/80 shadow-sm border border-white rounded-full">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            </div>
            <SearchInput icon={<MapPin className="w-4 h-4" />} label="Destination" value={destination} onChange={setDestination} placeholder="Where to?" />
            <SearchInput icon={<Calendar className="w-4 h-4" />} label="Departure" value={departureDate} onChange={setDepartureDate} placeholder="Date" type="date" />
            
            {tripType === 'Round Trip' && (
              <SearchInput icon={<Calendar className="w-4 h-4" />} label="Return" value={returnDate} onChange={setReturnDate} placeholder="Return Date" type="date" />
            )}

            <SearchInput icon={<Users className="w-4 h-4" />} label="Travelers" value={travelers} onChange={setTravelers} placeholder="1" type="number" />
            
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full lg:w-auto bg-indigo-900 text-white p-4 rounded-2xl hover:bg-indigo-800 transition-all flex items-center justify-center shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Search className="w-7 h-7" />}
            </button>
          </form>

          {origin && destination && (
            <div className="mt-8 pt-8 border-t border-white/40 flex flex-col md:flex-row items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-2xl text-orange-600 shadow-inner"><BellRing className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-black text-indigo-950">Track this route</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fare monitoring alert</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
                <div className="relative flex-1">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">₹</span>
                   <input type="number" value={alertTargetPrice} onChange={(e) => setAlertTargetPrice(e.target.value)} placeholder="Target Price" className="bg-white/60 border border-white/80 p-4 pl-10 rounded-2xl text-sm outline-none w-full font-bold" />
                </div>
                <button onClick={handleCreateAlert} className="bg-indigo-950 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg">Create Alert</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Results Section */}
      <section id="results-section" className="w-full max-w-7xl px-6 pb-24 scroll-mt-20">
        {results.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black text-indigo-950">Flight Options</h2>
              <button onClick={() => setIsFilterBarExpanded(!isFilterBarExpanded)} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-white text-indigo-950 shadow-sm border border-white">
                <SlidersHorizontal className="w-4 h-4" /> Filters {totalActiveFilters > 0 && `(${totalActiveFilters})`}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredResults.map(flight => {
                const model = new FlightModel(flight);
                const isExpanded = expandedFlightId === flight.id;
                const isCompared = !!compareList.find(f => f.id === flight.id);
                return (
                  <div key={flight.id} className="group">
                    <div 
                      onClick={() => setExpandedFlightId(isExpanded ? null : flight.id)}
                      className={`glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-10 cursor-pointer transition-all ${isExpanded ? 'rounded-b-none border-b-transparent shadow-xl' : ''}`}
                    >
                      <div className="w-full md:w-1/4 flex items-center gap-6">
                         <button onClick={(e) => toggleCompare(e, flight)} className={`p-3 rounded-2xl ${isCompared ? 'bg-indigo-950 text-white' : 'bg-white text-indigo-950 border border-indigo-50 shadow-sm'}`}><Layers className="w-4 h-4" /></button>
                         <div>
                            <p className="text-[11px] font-black text-indigo-400 uppercase mb-1">{flight.airline}</p>
                            <h3 className="text-lg font-black text-indigo-950">{flight.flightNumber}</h3>
                         </div>
                      </div>
                      <div className="flex-1 flex justify-between items-center w-full">
                         <div className="text-center md:text-left">
                            <p className="text-4xl font-black text-indigo-950">{flight.iataDepartureCode}</p>
                            <p className="text-sm font-black text-indigo-600 mt-2">{flight.departureTime}</p>
                         </div>
                         <div className="flex-1 px-10 flex flex-col items-center">
                            <div className="flex items-center gap-2 bg-indigo-50 px-4 py-1 rounded-full"><Clock className="w-3.5 h-3.5" /><span className="text-[10px] font-black">{flight.duration}</span></div>
                            <div className="w-full h-px bg-indigo-100 relative my-4"><Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 rotate-90" /></div>
                            <span className="text-[10px] font-black uppercase text-gray-400">{flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}</span>
                         </div>
                         <div className="text-center md:text-right">
                            <p className="text-4xl font-black text-indigo-950">{flight.iataArrivalCode}</p>
                            <p className="text-sm font-black text-indigo-600 mt-2">{flight.arrivalTime}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-8">
                         <p className="text-3xl font-black text-indigo-900 leading-none">{model.getFormattedPrice()}</p>
                         <button onClick={(e) => initiateBooking(e, flight)} className="bg-indigo-950 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-800 transition-all shadow-xl">Book Now</button>
                         {isExpanded ? <ChevronUp className="w-6 h-6 text-indigo-300" /> : <ChevronDown className="w-6 h-6 text-indigo-300" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="glass-card rounded-b-[3rem] p-10 -mt-2 animate-in slide-in-from-top-4 relative z-10 shadow-2xl">
                         <div className="grid grid-cols-3 gap-12">
                            <div className="space-y-4">
                               <h4 className="flex items-center gap-2 text-xs font-black uppercase"><Info className="w-4 h-4" /> Amenities</h4>
                               <div className="flex gap-3"><Wifi className="w-5 h-5 text-indigo-300" /><Coffee className="w-5 h-5 text-indigo-300" /><Tv className="w-5 h-5 text-indigo-300" /></div>
                            </div>
                            <div className="space-y-4">
                               <h4 className="flex items-center gap-2 text-xs font-black uppercase"><Briefcase className="w-4 h-4" /> Baggage</h4>
                               <p className="text-xs font-bold text-gray-500">Cabin: {flight.baggageCabin} | Checked: {flight.baggageChecked}</p>
                            </div>
                            <div className="space-y-4">
                               <h4 className="flex items-center gap-2 text-xs font-black uppercase"><ShieldCheck className="w-4 h-4" /> Protection</h4>
                               <p className="text-[10px] font-medium text-green-700">Zero-fee rescheduling available on this fare.</p>
                            </div>
                         </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Comparison Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md" onClick={() => setShowCompareModal(false)}></div>
          <div className="relative bg-white w-full max-w-6xl rounded-[3.5rem] shadow-2xl p-10 animate-in zoom-in overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-4xl font-black text-indigo-950">Side-by-Side Comparison</h2>
               <button onClick={() => setShowCompareModal(false)} className="p-3 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-8 h-8" /></button>
            </div>
            <div className="grid grid-cols-4 gap-8">
               <div className="space-y-12 py-8 text-[11px] font-black uppercase text-gray-400 tracking-widest mt-[100px]">
                  <div className="h-10">Airline</div>
                  <div className="h-10">Fare (INR)</div>
                  <div className="h-10">Duration</div>
                  <div className="h-10">Baggage Allowance</div>
                  <div className="h-10">Stops</div>
               </div>
               {compareList.map(f => (
                 <div key={f.id} className="space-y-12">
                    <div className="bg-indigo-50/50 rounded-3xl p-6 h-[100px] flex flex-col justify-center">
                       <p className="text-[10px] font-black text-indigo-400 uppercase">{f.flightNumber}</p>
                       <p className="text-xl font-black text-indigo-950">{f.iataDepartureCode} → {f.iataArrivalCode}</p>
                    </div>
                    <div className="h-10 font-bold text-indigo-950">{f.airline}</div>
                    <div className="h-10 font-black text-indigo-900">₹{f.price.toLocaleString('en-IN')}</div>
                    <div className="h-10 font-bold text-gray-600">{f.duration}</div>
                    <div className="h-10 flex flex-col justify-center gap-1">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-indigo-500">
                          <Briefcase className="w-3 h-3" /> Cabin: {f.baggageCabin}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-400">
                          <Plane className="w-3 h-3" /> Check: {f.baggageChecked}
                       </div>
                    </div>
                    <div className="h-10 font-bold text-gray-500">{f.stops === 0 ? 'Non-stop' : `${f.stops} Stop`}</div>
                    <button onClick={() => { initiateBooking(null, f); setShowCompareModal(false); }} className="w-full bg-indigo-950 text-white py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-900">Select This Trip</button>
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Concierge Drawer */}
      {showChat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-indigo-950 text-white">
              <div className="flex items-center gap-4"><Bot className="w-7 h-7" /><div><h2 className="text-2xl font-black">Concierge</h2><p className="text-[10px] uppercase text-indigo-300">Fast Flight Premium</p></div></div>
              <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50">
              {chatHistory.length === 0 && (
                <div className="text-center py-12">
                   <Sparkles className="w-12 h-12 text-indigo-600 mx-auto mb-6" />
                   <h3 className="text-indigo-950 font-black text-xl mb-3">Welcome to the lounge.</h3>
                   <p className="text-sm text-gray-500">How may I assist your travel curation today?</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                   <div className={`max-w-[85%] p-5 rounded-3xl text-sm font-semibold shadow-sm ${msg.role === 'user' ? 'bg-indigo-950 text-white rounded-br-none' : 'bg-white border border-indigo-100 text-indigo-950 rounded-bl-none'}`}>
                      {msg.parts[0].text}
                   </div>
                   
                   {msg.role === 'model' && msg.suggestedFlights && (
                     <div className="mt-4 flex flex-col gap-3 w-full">
                        {msg.suggestedFlights.map((f) => (
                          <div key={f.id} className="bg-white border border-indigo-50 rounded-2xl p-4 shadow-sm flex justify-between items-center">
                             <div><p className="text-[10px] font-black uppercase text-indigo-400">{f.airline}</p><p className="font-black text-indigo-950">{f.iataDepartureCode} → {f.iataArrivalCode}</p></div>
                             <div className="text-right">
                                <p className="text-sm font-black text-indigo-600">₹{f.price.toLocaleString('en-IN')}</p>
                                <button onClick={() => initiateBooking(null, f)} className="text-[9px] font-black uppercase text-indigo-950 bg-indigo-50 px-2 py-1 rounded-md mt-1 hover:bg-indigo-100">Book Now</button>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}

                   {msg.role === 'model' && (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex gap-1.5 p-2 bg-indigo-50/50 rounded-2xl border border-indigo-100/30">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => handleChatRating(i, star)} className={`transition-all ${ (msg.rating || 0) >= star ? 'text-orange-500' : 'text-gray-200'}`}><Star className={`w-4 h-4 ${ (msg.rating || 0) >= star ? 'fill-current' : ''}`} /></button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleChatFeedback(i, 'up')} className={`p-2 rounded-xl border transition-all ${msg.feedback === 'up' ? 'bg-indigo-100 border-indigo-200 text-indigo-600' : 'bg-white text-gray-300'}`}><ThumbsUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleChatFeedback(i, 'down')} className={`p-2 rounded-xl border transition-all ${msg.feedback === 'down' ? 'bg-red-100 border-red-200 text-red-600' : 'bg-white text-gray-300'}`}><ThumbsDown className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                   )}
                </div>
              ))}
              {chatLoading && <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Concierge is searching...</div>}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="p-8 bg-white border-t border-gray-100">
               <div className="relative">
                  <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Curate your journey..." className="w-full bg-gray-50 border-2 border-transparent p-5 pr-16 rounded-[1.5rem] focus:bg-white focus:border-indigo-600 outline-none font-bold" />
                  <button type="submit" disabled={chatLoading} className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-950 text-white p-3 rounded-2xl"><Send className="w-5 h-5" /></button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-sm" onClick={() => !isProcessingPayment && setShowBookingModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[3.5rem] shadow-2xl p-10 animate-in zoom-in">
             {isProcessingPayment ? (
               <div className="text-center py-12 flex flex-col items-center">
                  <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-6" />
                  <h2 className="text-2xl font-black text-indigo-950 mb-2">Processing Payment</h2>
                  <p className="text-sm text-gray-400">Please do not refresh the page...</p>
               </div>
             ) : (
               <>
                 <h2 className="text-3xl font-black text-indigo-950 mb-8">Secure Booking</h2>
                 <div className="space-y-6">
                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase mb-2 tracking-widest ml-1">Passenger Name</label>
                       <input type="text" value={passengerName} onChange={(e) => setPassengerName(e.target.value)} className="w-full bg-gray-50 p-5 rounded-2xl outline-none font-bold focus:bg-white focus:border-indigo-600 border-2 border-transparent" placeholder="Full Legal Name" />
                    </div>
                    <div>
                       <label className="block text-[11px] font-black text-gray-400 uppercase mb-3 tracking-widest ml-1">Payment Method</label>
                       <div className="grid grid-cols-2 gap-3">
                          {paymentOptions.map(opt => (
                            <button key={opt.id} onClick={() => setSelectedPaymentMethod(opt.id)} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${selectedPaymentMethod === opt.id ? 'bg-indigo-950 text-white border-indigo-950 shadow-lg' : 'bg-gray-50 border-gray-100 text-indigo-950'}`}>
                               {opt.icon} <span className="text-[10px] font-black uppercase">{opt.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                    <button onClick={confirmBooking} disabled={!passengerName} className="w-full bg-indigo-950 text-white py-6 rounded-3xl font-black uppercase shadow-2xl disabled:opacity-50 mt-4">Confirm & Pay ₹{selectedFlight?.price.toLocaleString('en-IN')}</button>
                 </div>
               </>
             )}
          </div>
        </div>
      )}

      {/* Success View */}
      {bookedItem && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xl"></div>
          <div className="relative bg-white w-full max-w-lg rounded-[4rem] p-12 text-center animate-in zoom-in shadow-2xl">
            <div className="w-24 h-24 bg-green-50 text-green-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-xl"><CheckCircle2 className="w-12 h-12" /></div>
            <h2 className="text-5xl font-black text-indigo-950 mb-4 tracking-tighter">Secured!</h2>
            <p className="text-gray-400 font-semibold mb-10">Your digital boarding pass for #{bookedItem.id} is ready.</p>
            <div className="bg-indigo-50/50 rounded-[2.5rem] p-8 text-left mb-10 border-2 border-dashed border-indigo-100">
               <div className="flex justify-between items-center py-6 border-b border-indigo-100">
                  <span className="text-4xl font-black text-indigo-900">{bookedItem.flight.iataDepartureCode}</span>
                  <Plane className="w-6 h-6 text-indigo-200 rotate-90" />
                  <span className="text-4xl font-black text-indigo-900">{bookedItem.flight.iataArrivalCode}</span>
               </div>
               <div className="mt-6 flex justify-between items-center">
                  <div><p className="text-[10px] font-black text-indigo-400 uppercase">Passenger</p><p className="font-black text-indigo-950">{bookedItem.passengerName}</p></div>
                  <div className="text-right"><p className="text-[10px] font-black text-indigo-400 uppercase">Seat</p><p className="font-black text-indigo-950">{bookedItem.seatNumber}</p></div>
               </div>
            </div>
            <button onClick={() => { setBookedItem(null); setResults([]); }} className="w-full bg-indigo-950 text-white py-6 rounded-3xl font-black uppercase hover:bg-indigo-900 shadow-xl">Back to Trips</button>
          </div>
        </div>
      )}

      {/* Booking History Overlay */}
      {showHistory && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md" onClick={() => setShowHistory(false)}></div>
          <div className="relative bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl p-10 flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-4xl font-black text-indigo-950">My Reservations</h2>
                <button onClick={() => setShowHistory(false)} className="p-3 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-8 h-8" /></button>
             </div>
             <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {myBookings.length === 0 ? (
                  <div className="text-center py-24"><Ticket className="w-20 h-20 text-gray-100 mx-auto mb-6" /><h3 className="text-xl font-bold text-gray-300">No active bookings</h3></div>
                ) : (
                  myBookings.map(b => (
                    <div key={b.id} className={`glass-card p-8 rounded-3xl border border-gray-100 flex justify-between items-center ${b.status === 'Cancelled' ? 'opacity-50 grayscale' : ''}`}>
                       <div className="flex items-center gap-6">
                          <div className="bg-indigo-950 text-white p-4 rounded-2xl shadow-lg"><Plane className="w-6 h-6 rotate-45" /></div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-400 uppercase">ID: {b.id}</p>
                             <h4 className="text-xl font-black text-indigo-950">{b.flight.iataDepartureCode} → {b.flight.iataArrivalCode}</h4>
                             <p className="text-xs font-bold text-gray-400">{b.flight.departureTime} | Seat {b.seatNumber}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${b.status === 'Confirmed' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{b.status}</span>
                          <p className="text-sm font-black text-indigo-900 mt-3">₹{b.flight.price.toLocaleString('en-IN')}</p>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {!showChat && (
        <button onClick={() => setShowChat(true)} className="fixed bottom-10 right-10 z-[90] w-20 h-20 bg-indigo-950 text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
          <MessageCircle className="w-9 h-9" />
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full border-4 border-white animate-pulse"></span>
        </button>
      )}

      <footer className="w-full max-w-7xl px-6 py-16 border-t border-white/20 mt-auto text-white/40 font-black uppercase text-[10px] tracking-widest flex justify-between items-center">
         <p>© 2024 Fast Flight Reservation System</p>
         <div className="flex gap-8"><span>Privacy Policy</span><span>Terms of Service</span></div>
      </footer>
    </div>
  );
};

export default App;