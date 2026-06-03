export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Vehicle {
  id: string;
  regNo: string;
  description: string;
  startingMileage: number;
  currentMileage: number;
  colorIndex: number;
}

export type ExpenseType = 'Fuel' | 'Service' | 'Tyres' | 'Toll' | 'Other';

export interface Entry {
  id: string;
  vehicleId: string;
  date: string;
  odometerStart: number;
  odometerEnd: number;
  distance: number;
  expenseType: ExpenseType;
  amount: number;
  notes: string;
  attachments: Attachment[];
}

export interface Attachment {
  id: string;
  uri: string;
  type: 'image' | 'file';
  name: string;
}
