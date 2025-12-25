import React, { useState, useEffect, useRef } from 'react';
import { 
  Plane, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  CheckCircle2, 
  X,
  Loader2,
  ArrowRightLeft,
  Ticket,
  Sparkles,
  Bot,
  SlidersHorizontal,
  Briefcase,
  ShieldCheck,
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
  Globe,
  Compass,
  Send
} from 'lucide-react';
import { TripType, Flight, Booking, PaymentMethod } from './types';
import { ReservationDatabase, FlightEngine } from './models';
import { getAIFlightSearch, getAIChatResponse } from './services/geminiService';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  suggestedFlights?: Flight[];
}

const TRENDING_DESTINATIONS = [
  { city: 'Tokyo', country: 'Japan', img: 'https://images.unsplash.com/photo-1540959733332-e94e270b4d82?q=80&w=800' },
  { city: 'Paris', country: 'France', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800' },
  { city: 'Dubai', country: 'UAE', img: 'https://images.unsplash.com/photo-1512453979798-5ea4a73a88d0?q=80&w=800' },
  { city: 'Maldives', country: 'South Asia', img: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=800' }
];

const App: React.FC = () => {
  const db = ReservationDatabase.getInstance();
  
  const [tripType, setTripType] = useState<TripType>('One Way');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [results, setResults] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a reliable background image matching the user's reference photo (traveler at flight board)
  const [heroImg] = useState('https://images.unsplash.com/photo-1464037866556-6812c9d1c72e?q=80&w=2000');
  
  const [showDashboard, setShowDashboard] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [compareList, setCompareList] = useState<Flight[]>([]);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('Credit Card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookedItem, setBookedItem] = useState<Booking | null>(null);
  
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
    
    try {
      const flights = await getAIFlightSearch({ 
        origin, destination, tripType, departureDate, travelers: parseInt(travelers) 
      });
      setResults(flights);
      db.updateAlerts(flights);
      
      setTimeout(() => {
        document.getElementById('results-view')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
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
    <div className="min-h-screen text-white font-sans selection:bg-indigo-500/30">
      {/* Cinematic Background Layer */}
      <div 
        className="fixed inset-0 -z-10 bg-black"
        style={{ 
          backgroundImage: `linear-gradient(to bottom, rgba(2, 6, 23, 0.75), rgba(2, 6, 23, 0.95)), url('${heroImg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />

      {/* Persistent Navigation */}
      <nav className="fixed top-0 w-full z-[100] px-8 py-6 flex justify-between items-center bg-black/40 backdrop-blur-3xl border-b border-white/5">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.reload()}>
          <div className="bg-indigo-600 p-2 rounded-xl shadow-[0_0_30px_rgba(79,70,229,0.3)] group-hover:rotate-12 transition-transform">
            <Plane className="text-white w-6 h-6 rotate-45" />
          </div>
          <span className="text-xl font-black tracking-tighter text-white drop-shadow-md">FAST FLIGHT</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowDashboard(true)} className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/10 rounded-full font-bold text-xs transition-all backdrop-blur-md">
            <Ticket className="w-4 h-4 text-orange-400" /> My Itinerary
          </button>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-48 pb-20 px-8 flex flex-col items-center text-center">
          <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-md rounded-full border border-white/10 text-white/50 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
              <Sparkles className="w-3 h-3 text-orange-400" /> Experience Aviation Excellence
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-[1] mb-8 drop-shadow-2xl tracking-tighter">
              CHART YOUR <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-500 to-indigo-500">HORIZON</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 font-medium mb-16 max-w-2xl mx-auto leading-relaxed drop-shadow-lg">
              Curating elite flight paths for the modern voyager. <br className="hidden md:block"/> Sophisticated searching, instant reservations.
            </p>
            
            {/* Main Search Panel */}
            <div className="glass-card p-6 rounded-[3rem] w-full max-w-5xl mx-auto border-white/10 shadow-3xl bg-black/40">
              <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl w-fit">
                {['One Way', 'Round Trip', 'Multi-City'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setTripType(t as TripType)}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tripType === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              
              <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-end">
                <div className="flex-1 w-full space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Origin</label>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3 focus-within:ring-2 ring-indigo-500/50 transition-all">
                    <MapPin className="text-indigo-400 w-5 h-5" />
                    <input required value={origin} onChange={e => setOrigin(e.target.value)} placeholder="From City..." className="bg-transparent outline-none font-bold w-full text-white placeholder:text-white/20" />
                  </div>
                </div>
                <div className="hidden lg:flex bg-white/5 p-2 rounded-full border border-white/10 self-center mt-6">
                  <ArrowRightLeft className="w-4 h-4 text-white/20" />
                </div>
                <div className="flex-1 w-full space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Destination</label>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3 focus-within:ring-2 ring-rose-500/50 transition-all">
                    <Compass className="text-rose-400 w-5 h-5" />
                    <input required value={destination} onChange={e => setDestination(e.target.value)} placeholder="To City..." className="bg-transparent outline-none font-bold w-full text-white placeholder:text-white/20" />
                  </div>
                </div>
                <div className="w-full lg:w-48 space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-white/30 ml-4 tracking-widest">Departure</label>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                    <Calendar className="text-white/40 w-5 h-5" />
                    <input required type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="bg-transparent outline-none font-bold w-full text-white [color-scheme:dark] text-sm" />
                  </div>
                </div>
                <button disabled={isLoading} className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-500 text-white p-4 lg:p-5 rounded-2xl shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Dynamic Search Results */}
        <div id="results-view" />
        {results.length > 0 && (
          <section className="px-8 pb-32 max-w-6xl mx-auto animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-6">
              <div className="text-center md:text-left">
                <h2 className="text-4xl font-black text-white mb-2">Available Passages</h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Exclusive selections for your journey</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-xl text-white/60 border border-white/10 font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">
                <SlidersHorizontal className="w-4 h-4" /> Refine Board
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
                      className={`glass-card p-8 rounded-[2rem] flex flex-col lg:flex-row items-center gap-8 cursor-pointer transition-all hover:bg-white/10 border-white/10 bg-black/40 ${isExpanded ? 'rounded-b-none border-b-transparent ring-2 ring-indigo-500/20' : ''}`}
                    >
                      <div className="w-full lg:w-1/4 flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Plane className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">{f.airline}</p>
                          <h3 className="text-lg font-black text-white">{f.flightNumber}</h3>
                        </div>
                      </div>
                      
                      <div className="flex-1 flex justify-between items-center w-full px-4">
                        <div className="text-center md:text-left">
                          <p className="text-3xl font-black text-white">{f.iataDepartureCode}</p>
                          <p className="text-[10px] font-bold text-white/30 uppercase mt-1">{f.departureTime}</p>
                        </div>
                        <div className="flex-1 px-10 flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity">
                          <span className="text-[8px] font-black uppercase mb-1 tracking-widest">{f.duration}</span>
                          <div className="w-full h-[1px] bg-white/20 relative">
                            <div className="absolute inset-0 bg-indigo-400 animate-progress origin-left"></div>
                          </div>
                          <span className="text-[8px] font-bold text-indigo-400 mt-1 uppercase tracking-tighter">{f.stops === 0 ? 'Direct' : `${f.stops} Stop`}</span>
                        </div>
                        <div className="text-center md:text-right">
                          <p className="text-3xl font-black text-white">{f.iataArrivalCode}</p>
                          <p className="text-[10px] font-bold text-white/30 uppercase mt-1">{f.arrivalTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8 w-full lg:w-auto justify-between lg:justify-end">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Rate</p>
                          <p className="text-2xl font-black text-white">{engine.getPriceFormatted()}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setSelectedFlight(f); setShowBookingModal(true); }}
                          className="bg-white text-black px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl"
                        >
                          Book
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="glass-card rounded-b-[2rem] p-10 -mt-1 animate-in slide-in-from-top-4 border-t-0 bg-black/60 grid grid-cols-1 md:grid-cols-3 gap-8 text-white/60">
                        <div className="space-y-4">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Amenities</h4>
                          <div className="flex gap-3">
                            <Wifi className="w-5 h-5" /> <Coffee className="w-5 h-5" /> <Tv className="w-5 h-5" />
                          </div>
                          <p className="text-[10px] leading-relaxed">Experience star-rated luxury with private suites and world-class dining.</p>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Baggage</h4>
                          <div className="text-[10px] font-bold space-y-2">
                            <div className="flex justify-between border-b border-white/5 pb-2"><span>Cabin</span><span>{f.baggageCabin}</span></div>
                            <div className="flex justify-between"><span>Checked</span><span>{f.baggageChecked}</span></div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Security</h4>
                          <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20">
                            <p className="text-[10px] font-bold text-emerald-400">Flexible Passage Guaranteed</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trending Destinations (Initial View) */}
        {!results.length && !isLoading && (
          <section className="px-8 pb-32 max-w-7xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-10 tracking-tight">Curated Escapes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {TRENDING_DESTINATIONS.map((d, i) => (
                <div key={i} className="group relative h-80 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-2xl border border-white/5" onClick={() => setDestination(d.city)}>
                  <img src={d.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={d.city} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                  <div className="absolute bottom-6 left-8">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60 mb-1">{d.country}</p>
                    <h3 className="text-2xl font-black text-white">{d.city}</h3>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Booking Side Panel */}
      {showDashboard && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDashboard(false)}></div>
          <div className="relative bg-[#020617] w-full max-w-lg h-full border-l border-white/10 animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-10 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter">Your Trips</h2>
                <p className="text-[10px] font-bold uppercase text-white/30 tracking-widest mt-1">Confirmed Itineraries</p>
              </div>
              <button onClick={() => setShowDashboard(false)} className="p-3 hover:bg-white/5 rounded-full text-white/40"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {db.getBookings().length === 0 ? (
                <div className="text-center py-20 opacity-10"><Plane className="w-20 h-20 mx-auto mb-4" /><p className="font-bold">No active passage plans</p></div>
              ) : (
                db.getBookings().map(b => (
                  <div key={b.id} className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Passage ID</p>
                        <p className="text-lg font-black text-white">{b.id}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase">Confirmed</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-white/5 pt-6">
                      <div className="text-center"><p className="text-2xl font-black">{b.flight.iataDepartureCode}</p><p className="text-[9px] font-bold text-white/40 uppercase">{b.flight.departureTime}</p></div>
                      <Plane className="w-5 h-5 text-white/10" />
                      <div className="text-center"><p className="text-2xl font-black text-right">{b.flight.iataArrivalCode}</p><p className="text-[9px] font-bold text-white/40 uppercase text-right">{b.flight.arrivalTime}</p></div>
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
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => !isProcessing && setShowBookingModal(false)}></div>
          <div className="relative bg-[#020617] w-full max-w-lg rounded-[3rem] p-10 border border-white/10 overflow-hidden shadow-3xl">
            {isProcessing ? (
              <div className="text-center py-20"><Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-indigo-500" /><h3 className="text-2xl font-black">Issuing Tickets...</h3></div>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-3xl font-black">Reservation</h2>
                  <div className="text-right"><p className="text-[10px] text-white/30 font-bold uppercase">Total</p><p className="text-xl font-black text-indigo-400">₹{selectedFlight.price.toLocaleString()}</p></div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Full Name</label>
                    <input required value={passengerName} onChange={e => setPassengerName(e.target.value)} placeholder="As per passport" className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-bold text-white focus:border-indigo-500/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {['Credit Card', 'UPI', 'Net Banking', 'Corporate'].map(m => (
                      <button key={m} onClick={() => setSelectedPayment(m as PaymentMethod)} className={`p-4 rounded-2xl border transition-all text-[9px] font-black uppercase ${selectedPayment === m ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <button disabled={!passengerName} onClick={handleBooking} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-indigo-500 transition-all active:scale-95">Complete Purchase</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success View */}
      {bookedItem && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl"></div>
          <div className="relative bg-white text-black w-full max-w-md rounded-[4rem] p-12 text-center animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl"><CheckCircle2 className="w-10 h-10" /></div>
            <h2 className="text-4xl font-black mb-2 tracking-tighter">SECURED</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-black/30 mb-10">Locator ID: {bookedItem.id}</p>
            <div className="bg-indigo-50 p-8 rounded-[2.5rem] text-left space-y-6 mb-10">
              <div className="flex justify-between items-center">
                <span className="text-4xl font-black">{bookedItem.flight.iataDepartureCode}</span>
                <Plane className="w-6 h-6 text-indigo-200 rotate-90" />
                <span className="text-4xl font-black">{bookedItem.flight.iataArrivalCode}</span>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase">
                <div className="space-y-1"><span className="text-indigo-300">Explorer</span><br/>{bookedItem.passengerName}</div>
                <div className="space-y-1 text-right"><span className="text-indigo-300">Seat</span><br/>{bookedItem.seatNumber}</div>
              </div>
            </div>
            <button onClick={() => { setBookedItem(null); setResults([]); }} className="w-full bg-black text-white py-6 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-indigo-600 transition-all">Done</button>
          </div>
        </div>
      )}

      {/* AI Assistant FAB */}
      <button onClick={() => setShowChat(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-indigo-600 text-white rounded-3xl shadow-3xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[150]">
        <Bot className="w-8 h-8" />
      </button>

      {/* AI Concierge Drawer */}
      {showChat && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChat(false)}></div>
          <div className="relative bg-[#020617] w-full max-w-lg h-full border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Bot className="w-8 h-8" />
                <div><h3 className="text-xl font-black tracking-tight">Concierge</h3><p className="text-[8px] font-bold uppercase text-white/50 tracking-widest">Voyage Specialist</p></div>
              </div>
              <button onClick={() => setShowChat(false)} className="p-3 hover:bg-white/10 rounded-full"><X /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-black/10">
              {chatHistory.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-6 rounded-3xl text-xs font-bold ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>
                    {m.parts[0].text}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-[8px] font-black text-indigo-400 uppercase animate-pulse">Analyzing travel patterns...</div>}
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
            }} className="p-8 border-t border-white/5">
              <div className="relative">
                <input value={chatMessage} onChange={e => setChatMessage(e.target.value)} placeholder="Plan my trip..." className="w-full p-5 pr-16 bg-white/5 rounded-2xl outline-none font-bold text-white border border-white/10" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-3 rounded-xl"><Send className="w-5 h-5" /></button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="py-20 text-center opacity-10 text-[9px] font-black uppercase tracking-[0.6em] text-white">
        Fast Flight Reservation System | Built for Premium Exploration
      </footer>
    </div>
  );
};

export default App;