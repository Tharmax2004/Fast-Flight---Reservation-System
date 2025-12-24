
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plane, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Star, 
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
  SlidersHorizontal,
  Briefcase,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Coffee,
  Wifi,
  Tv,
  Layers,
  ArrowRight,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  Settings,
  LogOut,
  TrendingUp,
  Map
} from 'lucide-react';
import { TripType, Flight, Booking, PriceAlert, PaymentMethod } from './types';
import { ReservationDatabase, FlightEngine, UserProfile } from './models';
import { getAIFlightSearch, getAIChatResponse } from './services/geminiService';

// --- Types ---
interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  suggestedFlights?: Flight[];
}

const App: React.FC = () => {
  // Database instance
  const db = ReservationDatabase.getInstance();
  
  // App State
  const [tripType, setTripType] = useState<TripType>('One Way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [results, setResults] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // UI State
  const [showDashboard, setShowDashboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [compareList, setCompareList] = useState<Flight[]>([]);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  
  // Booking State
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookedItem, setBookedItem] = useState<Booking | null>(null);
  
  // Chat State
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, chatLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;
    setIsLoading(true);
    const flights = await getAIFlightSearch({ 
      origin, destination, tripType, departureDate, travelers: parseInt(travelers) 
    });
    setResults(flights);
    setIsLoading(false);
    db.updateAlerts(flights);
  };

  const handleBooking = () => {
    if (!selectedFlight || !passengerName) return;
    setIsProcessing(true);
    setTimeout(() => {
      const newBooking: Booking = {
        id: `FF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        flight: selectedFlight,
        passengerName,
        seatNumber: FlightEngine.generateSeat(),
        status: 'Confirmed',
        paymentMethod: selectedPayment,
        bookingDate: Date.now()
      };
      db.addBooking(newBooking);
      setBookedItem(newBooking);
      setIsProcessing(false);
      setShowBookingModal(false);
    }, 2000);
  };

  const toggleCompare = (e: React.MouseEvent, flight: Flight) => {
    e.stopPropagation();
    setCompareList(prev => 
      prev.find(f => f.id === flight.id) 
        ? prev.filter(f => f.id !== flight.id) 
        : (prev.length < 3 ? [...prev, flight] : prev)
    );
  };

  return (
    <div className="min-h-screen text-indigo-950">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.location.reload()}>
          <div className="bg-indigo-950 p-2.5 rounded-2xl shadow-xl"><Plane className="text-white w-6 h-6 rotate-45" /></div>
          <span className="text-2xl font-black tracking-tighter text-white drop-shadow-md">FAST FLIGHT</span>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setShowDashboard(true)} className="flex items-center gap-3 px-6 py-2.5 bg-white/90 hover:bg-white rounded-full font-bold text-sm transition-all shadow-lg">
            <Ticket className="w-4 h-4 text-indigo-600" /> My Trips
          </button>
          <button className="w-12 h-12 rounded-full bg-indigo-950/20 border border-white/40 flex items-center justify-center text-white hover:bg-white/20 transition-all">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-8 flex flex-col items-center text-center">
        <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <h1 className="text-7xl md:text-9xl font-black text-white leading-tight mb-8 drop-shadow-2xl">
            BEYOND THE <br/><span className="text-orange-400">HORIZON</span>
          </h1>
          <p className="text-xl text-white/90 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Experience the pinnacle of aviation. Intelligent routes, luxury cabins, and personalized concierge at your fingertips.
          </p>
          
          {/* Search Box */}
          <div className="glass-card p-4 rounded-[3rem] w-full max-w-5xl shadow-2xl border-white/50">
            <div className="flex gap-2 mb-4 p-1.5 bg-indigo-950/5 rounded-2xl w-fit">
              {['One Way', 'Round Trip', 'Multi-City'].map(t => (
                <button 
                  key={t}
                  onClick={() => setTripType(t as TripType)}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${tripType === t ? 'bg-indigo-950 text-white shadow-lg' : 'text-indigo-950/40 hover:text-indigo-950'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-4 tracking-widest">From</label>
                <div className="bg-white/60 p-4 rounded-2xl border border-white flex items-center gap-3 focus-within:ring-2 ring-indigo-500/20 transition-all">
                  <MapPin className="text-indigo-400 w-5 h-5" />
                  <input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Origin City" className="bg-transparent outline-none font-bold w-full" />
                </div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-full hidden md:block border border-white shadow-sm -mb-0.5"><ArrowRightLeft className="w-4 h-4 text-indigo-300" /></div>
              <div className="flex-1 space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-4 tracking-widest">To</label>
                <div className="bg-white/60 p-4 rounded-2xl border border-white flex items-center gap-3 focus-within:ring-2 ring-indigo-500/20 transition-all">
                  <MapPin className="text-indigo-400 w-5 h-5" />
                  <input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Destination" className="bg-transparent outline-none font-bold w-full" />
                </div>
              </div>
              <div className="w-full md:w-48 space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-4 tracking-widest">Date</label>
                <div className="bg-white/60 p-4 rounded-2xl border border-white flex items-center gap-3 focus-within:ring-2 ring-indigo-500/20 transition-all">
                  <Calendar className="text-indigo-400 w-5 h-5" />
                  <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="bg-transparent outline-none font-bold w-full text-sm" />
                </div>
              </div>
              <button disabled={isLoading} className="bg-indigo-950 text-white p-5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50">
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {results.length > 0 && (
        <section className="px-8 pb-32 max-w-7xl mx-auto animate-in slide-in-from-bottom-20 duration-700">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-black text-indigo-950 mb-2">Available Journeys</h2>
              <p className="text-indigo-950/40 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> Found {results.length} elite options
              </p>
            </div>
            <button className="flex items-center gap-2 px-6 py-3 bg-white rounded-2xl font-black text-xs uppercase tracking-widest border border-indigo-50 shadow-sm hover:shadow-md transition-all">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          <div className="space-y-4">
            {results.map(f => {
              const engine = new FlightEngine(f);
              const isExpanded = expandedFlightId === f.id;
              return (
                <div key={f.id} className="group">
                  <div 
                    onClick={() => setExpandedFlightId(isExpanded ? null : f.id)}
                    className={`glass-card p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-12 cursor-pointer transition-all hover:translate-x-2 ${isExpanded ? 'rounded-b-none border-b-transparent' : ''}`}
                  >
                    <div className="w-full md:w-1/4 flex items-center gap-6">
                       <button onClick={e => toggleCompare(e, f)} className={`p-3 rounded-2xl transition-all ${compareList.find(x => x.id === f.id) ? 'bg-indigo-950 text-white' : 'bg-white border border-indigo-50 text-indigo-300'}`}>
                        <Layers className="w-4 h-4" />
                       </button>
                       <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">{f.airline}</p>
                          <h3 className="text-xl font-black">{f.flightNumber}</h3>
                       </div>
                    </div>
                    
                    <div className="flex-1 flex justify-between items-center w-full">
                       <div className="text-center md:text-left">
                          <p className="text-3xl font-black">{f.iataDepartureCode}</p>
                          <p className="text-xs font-bold text-indigo-400 mt-1">{f.departureTime}</p>
                       </div>
                       <div className="flex-1 px-8 flex flex-col items-center opacity-40">
                          <span className="text-[10px] font-black uppercase mb-1">{f.duration}</span>
                          <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-950 to-transparent relative">
                            <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-90" />
                          </div>
                          <span className="text-[9px] font-black uppercase mt-1">{f.stops === 0 ? 'Direct' : `${f.stops} Stop`}</span>
                       </div>
                       <div className="text-center md:text-right">
                          <p className="text-3xl font-black">{f.iataArrivalCode}</p>
                          <p className="text-xs font-bold text-indigo-400 mt-1">{f.arrivalTime}</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-8">
                       <p className="text-3xl font-black text-indigo-900">{engine.getPriceFormatted()}</p>
                       <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedFlight(f); setShowBookingModal(true); }}
                        className="bg-indigo-950 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-500 transition-all shadow-xl"
                       >
                        Select
                       </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="glass-card rounded-b-[3rem] p-10 -mt-2 animate-in slide-in-from-top-4 border-t-0 shadow-2xl grid grid-cols-3 gap-10">
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">In-Flight Luxuries</h4>
                           <div className="flex gap-4"><Wifi className="w-5 h-5" /><Coffee className="w-5 h-5" /><Tv className="w-5 h-5" /></div>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Baggage Specs</h4>
                           <p className="text-sm font-bold"><Briefcase className="inline w-4 h-4 mr-2" /> {f.baggageCabin} Cabin / {f.baggageChecked} Checked</p>
                        </div>
                        <div className="space-y-4">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Protection Plan</h4>
                           <p className="text-xs font-bold text-green-600"><ShieldCheck className="inline w-4 h-4 mr-2" /> Elite Flexible Cancellation</p>
                        </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Booking Drawer (Dashboard) */}
      {showDashboard && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-sm" onClick={() => setShowDashboard(false)}></div>
          <div className="relative bg-white w-full max-w-xl h-full shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-10 border-b border-indigo-50 flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black tracking-tight">Your Lounge</h2>
                <p className="text-[10px] font-black uppercase text-indigo-300 tracking-widest mt-1">Managed Reservations</p>
              </div>
              <button onClick={() => setShowDashboard(false)} className="p-4 hover:bg-indigo-50 rounded-full transition-all text-indigo-300"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {db.getBookings().length === 0 ? (
                <div className="text-center py-20 opacity-20">
                  <Ticket className="w-24 h-24 mx-auto mb-6" />
                  <p className="text-xl font-black">No active journeys yet</p>
                </div>
              ) : (
                db.getBookings().map(b => (
                  <div key={b.id} className="p-8 rounded-[2.5rem] bg-indigo-50 border border-indigo-100 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all"><Plane className="w-32 h-32 rotate-45" /></div>
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-6">
                        <span className="bg-indigo-950 text-white px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase">{b.id}</span>
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">{b.status}</span>
                      </div>
                      <div className="flex justify-between items-center mb-6">
                        <div className="text-2xl font-black">{b.flight.iataDepartureCode} <ArrowRight className="inline w-4 h-4 mx-2 text-indigo-300" /> {b.flight.iataArrivalCode}</div>
                        <p className="text-xl font-black text-indigo-900">₹{b.flight.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-8 border-t border-indigo-200 pt-6">
                        <div><p className="text-[9px] font-black uppercase text-indigo-300">Passenger</p><p className="font-black text-sm">{b.passengerName}</p></div>
                        <div><p className="text-[9px] font-black uppercase text-indigo-300">Seat</p><p className="font-black text-sm">{b.seatNumber}</p></div>
                        <div><p className="text-[9px] font-black uppercase text-indigo-300">Gate</p><p className="font-black text-sm">G-12</p></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBookingModal && selectedFlight && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-indigo-950/80 backdrop-blur-xl" onClick={() => !isProcessing && setShowBookingModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-[4rem] shadow-2xl p-12 animate-in zoom-in">
            {isProcessing ? (
              <div className="text-center py-20">
                <Loader2 className="w-20 h-20 animate-spin text-indigo-600 mx-auto mb-8" />
                <h3 className="text-3xl font-black mb-2">Finalizing Passage</h3>
                <p className="text-indigo-950/40 font-bold uppercase text-[10px] tracking-widest">Securing your elite seat selection...</p>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-black mb-8 tracking-tighter">Reservation</h2>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-2 tracking-widest">Full Passenger Name</label>
                    <input value={passengerName} onChange={e => setPassengerName(e.target.value)} placeholder="As shown on Passport" className="w-full p-5 bg-indigo-50 rounded-2xl outline-none font-black focus:ring-2 ring-indigo-500 transition-all" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-indigo-950/40 ml-2 tracking-widest">Premium Payment</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Credit Card', icon: <CreditCard className="w-4 h-4" /> },
                        { id: 'UPI', icon: <QrCode className="w-4 h-4" /> },
                        { id: 'Net Banking', icon: <Building2 className="w-4 h-4" /> },
                        { id: 'Corporate', icon: <Wallet className="w-4 h-4" /> }
                      ].map(opt => (
                        <button 
                          key={opt.id}
                          onClick={() => setSelectedPayment(opt.id as PaymentMethod)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${selectedPayment === opt.id ? 'bg-indigo-950 text-white border-indigo-950' : 'bg-white border-indigo-100 text-indigo-950'}`}
                        >
                          {opt.icon} <span className="text-[10px] font-black uppercase tracking-tighter">{opt.id}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    disabled={!passengerName}
                    onClick={handleBooking}
                    className="w-full bg-indigo-950 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-indigo-900 disabled:opacity-50 mt-4"
                  >
                    Confirm & Pay ₹{selectedFlight.price.toLocaleString()}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {bookedItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-indigo-950/90 backdrop-blur-2xl"></div>
          <div className="relative bg-white w-full max-w-lg rounded-[5rem] p-16 text-center animate-in zoom-in shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-indigo-950"></div>
            <div className="w-28 h-28 bg-green-50 text-green-600 rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-xl border-4 border-white"><CheckCircle2 className="w-14 h-14" /></div>
            <h2 className="text-6xl font-black mb-4 tracking-tighter">SUCCESS</h2>
            <p className="text-indigo-950/40 font-bold uppercase text-[12px] tracking-widest mb-12">Ticket ID: {bookedItem.id}</p>
            
            <div className="p-8 bg-indigo-50/50 rounded-[3rem] border-2 border-dashed border-indigo-200 text-left mb-12">
               <div className="flex justify-between items-center mb-6">
                  <div className="text-4xl font-black">{bookedItem.flight.iataDepartureCode}</div>
                  <Plane className="w-6 h-6 text-indigo-200 rotate-90" />
                  <div className="text-4xl font-black">{bookedItem.flight.iataArrivalCode}</div>
               </div>
               <div className="flex justify-between font-black text-sm uppercase text-indigo-300">
                  <span>{bookedItem.passengerName}</span>
                  <span>SEAT {bookedItem.seatNumber}</span>
               </div>
            </div>

            <button onClick={() => { setBookedItem(null); setResults([]); }} className="w-full bg-indigo-950 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Back to Trips</button>
          </div>
        </div>
      )}

      {/* Floating Concierge */}
      <button onClick={() => setShowChat(true)} className="fixed bottom-10 right-10 w-24 h-24 bg-indigo-950 text-white rounded-[2.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[150]">
        <Bot className="w-10 h-10" />
        <span className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full border-4 border-white animate-pulse"></span>
      </button>

      {/* AI Chat Drawer */}
      {showChat && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-indigo-950/20 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
          <div className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
             <div className="p-10 bg-indigo-950 text-white flex justify-between items-center">
                <div className="flex items-center gap-4"><Bot className="w-8 h-8" /><div><h3 className="text-2xl font-black">AI Concierge</h3><p className="text-[9px] font-black uppercase text-indigo-400">Premium Travel Advisor</p></div></div>
                <button onClick={() => setShowChat(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X className="w-6 h-6" /></button>
             </div>
             <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-indigo-50/30">
                {chatHistory.length === 0 && (
                  <div className="text-center py-20">
                    <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
                    <h4 className="text-2xl font-black mb-3">Your Journey Starts Here</h4>
                    <p className="text-sm text-indigo-950/40 font-medium">Ask me about premium destinations, hotel pairings, or travel tips.</p>
                  </div>
                )}
                {chatHistory.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-6 rounded-[2rem] text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-indigo-950 text-white rounded-br-none' : 'bg-white border border-indigo-50 text-indigo-950 rounded-bl-none'}`}>
                      {m.parts[0].text}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="text-[10px] font-black text-indigo-300 uppercase animate-pulse">Concierge is curating...</div>}
                <div ref={chatEndRef} />
             </div>
             <form onSubmit={async (e) => {
               e.preventDefault();
               if (!chatMessage) return;
               const newHist: ChatMessage[] = [...chatHistory, { role: 'user', parts: [{ text: chatMessage }] }];
               setChatHistory(newHist);
               setChatMessage('');
               setChatLoading(true);
               const res = await getAIChatResponse(newHist);
               setChatHistory([...newHist, { role: 'model', parts: [{ text: res.text }], suggestedFlights: res.suggestedFlights }]);
               setChatLoading(false);
             }} className="p-10 border-t border-indigo-50">
                <div className="relative">
                   <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Curate my travel plan..." className="w-full p-6 pr-20 bg-indigo-50 rounded-[2rem] outline-none font-bold focus:bg-white border-2 border-transparent focus:border-indigo-600 transition-all" />
                   <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-950 text-white p-4 rounded-2xl"><Send className="w-5 h-5" /></button>
                </div>
             </form>
          </div>
        </div>
      )}

      <footer className="py-20 text-center opacity-20 text-[10px] font-black uppercase tracking-[0.5em] text-white">
        © 2024 Fast Flight Reservation System | OOPS Architecture
      </footer>
    </div>
  );
};

export default App;
