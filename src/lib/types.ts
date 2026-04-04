export interface Guest {
  id: number;
  fullName: string;
  country: string;
  dateOfBirth: string;
  yearsOld: number;
  dateOfIssue: string;
  expiryDate: string;
  passportNumber: string;
  issuedBy: string;
  reservationId: number;
  createdAt: string;
}

export interface Reservation {
  id: number;
  name: string;
  checkIn: string;
  checkOut: string;
  propertyId: number;
  createdAt: string;
  guests?: Guest[];
  _count?: { guests: number };
}

export interface Property {
  id: number;
  name: string;
  createdAt: string;
  reservations: Reservation[];
}
