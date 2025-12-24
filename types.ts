export type TripType = 'One Way' | 'Round Trip' | 'Multi-City';
export type PaymentMethod = 'Credit Card' | 'UPI' | 'Net Banking' | 'Corporate';

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  iataDepartureCode: string;
  iataArrivalCode: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  class: 'Economy' | 'Business' | 'First';
  duration: string;
  stops: number;
  baggageCabin: string;
  baggageChecked: string;
}

export interface Booking {
  id: string;
  flight: Flight;
  passengerName: string;
  seatNumber: string;
  status: 'Confirmed' | 'Pending' | 'Cancelled';
  paymentMethod: PaymentMethod;
  bookingDate: number;
}

export interface PriceAlert {
  id: string;
  origin: string;
  destination: string;
  date: string;
  targetPrice: number;
  currentPrice?: number;
  isTriggered: boolean;
  createdAt: number;
}

export interface SearchCriteria {
  origin: string;
  destination: string;
  tripType: TripType;
  departureDate: string;
  returnDate?: string;
  travelers: number;
}