
import { Flight, Booking, PriceAlert, PaymentMethod } from './types';

/**
 * Object-Oriented Design for the Reservation System.
 * This acts as the 'Service Layer' and 'Data Access Layer'.
 */

export class UserProfile {
  constructor(
    public name: string = 'Guest Explorer',
    public email: string = 'guest@fastflight.com',
    public tier: 'Silver' | 'Gold' | 'Platinum' = 'Silver'
  ) {}
}

export class ReservationDatabase {
  private static instance: ReservationDatabase;
  private storageKey = 'fastflight_db_v1';

  private data: {
    bookings: Booking[];
    alerts: PriceAlert[];
    user: UserProfile;
  };

  private constructor() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = {
        bookings: [],
        alerts: [],
        user: new UserProfile()
      };
    }
  }

  public static getInstance(): ReservationDatabase {
    if (!ReservationDatabase.instance) {
      ReservationDatabase.instance = new ReservationDatabase();
    }
    return ReservationDatabase.instance;
  }

  private persist() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // Booking Operations
  public addBooking(booking: Booking) {
    this.data.bookings.push(booking);
    this.persist();
  }

  public getBookings(): Booking[] {
    return this.data.bookings;
  }

  public cancelBooking(id: string) {
    this.data.bookings = this.data.bookings.map(b => 
      b.id === id ? { ...b, status: 'Cancelled' as const } : b
    );
    this.persist();
  }

  // Alert Operations
  public addAlert(alert: PriceAlert) {
    this.data.alerts.push(alert);
    this.persist();
  }

  public getAlerts(): PriceAlert[] {
    return this.data.alerts;
  }

  public removeAlert(id: string) {
    this.data.alerts = this.data.alerts.filter(a => a.id !== id);
    this.persist();
  }

  public updateAlerts(flights: Flight[]) {
    let changed = false;
    this.data.alerts = this.data.alerts.map(alert => {
      const match = flights.find(f => 
        f.origin.toLowerCase() === alert.origin.toLowerCase() && 
        f.destination.toLowerCase() === alert.destination.toLowerCase() &&
        f.price <= alert.targetPrice
      );
      if (match && !alert.isTriggered) {
        changed = true;
        return { ...alert, isTriggered: true, currentPrice: match.price };
      }
      return alert;
    });
    if (changed) this.persist();
    return changed;
  }
}

export class FlightEngine {
  constructor(public flight: Flight) {}

  public getPriceFormatted(): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(this.flight.price);
  }

  public static generateSeat(): string {
    const row = Math.floor(Math.random() * 30) + 1;
    const col = ['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)];
    return `${row}${col}`;
  }
}
