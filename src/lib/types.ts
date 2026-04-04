export interface Guest {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  country: string;
  citizenshipCode: string;
  dateOfBirth: string;
  yearsOld: number;
  gender: string;
  dateOfIssue: string;
  expiryDate: string;
  passportNumber: string;
  issuedBy: string;
  visaNumber: string;
  visaFrom: string;
  visaTo: string;
  hasVisa: boolean;
  parentId: number | null;
  reservationId: number;
  createdAt: string;
}

export interface Reservation {
  id: number;
  name: string;
  checkIn: string;
  checkOut: string;
  platform: string;
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
