
import { Flight, Booking, PriceAlert, PaymentMethod } from './types';

/**
 * Object-Oriented Design for the Reservation System.
 * Encapsulates the business logic within classes.
 */

export class FlightModel {
  constructor(public data: Flight) {}

  getFormattedPrice(): string {
    return `₹${this.data.price.toLocaleString('en-IN')}`;
  }

  isSameRoute(origin: string, destination: string): boolean {
    return (
      this.data.origin.toLowerCase().includes(origin.toLowerCase()) &&
      this.data.destination.toLowerCase().includes(destination.toLowerCase())
    );
  }
}

export class AlertSystem {
  private alerts: PriceAlert[] = [];

  constructor() {
    const saved = localStorage.getItem('fastflight_alerts');
    if (saved) {
      this.alerts = JSON.parse(saved);
    }
  }

  createAlert(origin: string, destination: string, date: string, targetPrice: number): PriceAlert {
    const newAlert: PriceAlert = {
      id: `AL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      origin,
      destination,
      date,
      targetPrice,
      isTriggered: false,
      createdAt: Date.now()
    };
    this.alerts.push(newAlert);
    this.save();
    return newAlert;
  }

  getAlerts(): PriceAlert[] {
    return this.alerts;
  }

  removeAlert(id: string) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.save();
  }

  checkAlerts(flights: Flight[]) {
    let triggeredAny = false;
    this.alerts = this.alerts.map(alert => {
      const matchingFlight = flights.find(f => 
        f.origin.toLowerCase() === alert.origin.toLowerCase() && 
        f.destination.toLowerCase() === alert.destination.toLowerCase() &&
        f.price <= alert.targetPrice
      );

      if (matchingFlight && !alert.isTriggered) {
        triggeredAny = true;
        return { ...alert, isTriggered: true, currentPrice: matchingFlight.price };
      }
      return alert;
    });
    
    if (triggeredAny) {
      this.save();
    }
    return triggeredAny;
  }

  private save() {
    localStorage.setItem('fastflight_alerts', JSON.stringify(this.alerts));
  }
}

export class BookingSystem {
  private bookings: Booking[] = [];

  constructor() {
    const saved = localStorage.getItem('fastflight_bookings');
    if (saved) {
      this.bookings = JSON.parse(saved);
    }
  }

  createBooking(flight: Flight, passengerName: string, paymentMethod: PaymentMethod): Booking {
    const newBooking: Booking = {
      id: `BK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      flight,
      passengerName,
      seatNumber: `${Math.floor(Math.random() * 30) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`,
      status: 'Confirmed',
      paymentMethod,
      bookingDate: Date.now()
    };
    this.bookings.push(newBooking);
    this.save();
    return newBooking;
  }

  cancelBooking(id: string) {
    this.bookings = this.bookings.map(b => 
      b.id === id ? { ...b, status: 'Cancelled' as const } : b
    );
    this.save();
  }

  getBookings(): Booking[] {
    return this.bookings;
  }

  private save() {
    localStorage.setItem('fastflight_bookings', JSON.stringify(this.bookings));
  }
}
