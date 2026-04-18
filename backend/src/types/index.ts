export interface IUser {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "OWNER" | "CUSTOMER";
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoom {
  _id: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  currentOccupancy: number;
  type: "single" | "double" | "triple" | "dormitory";
  status: "available" | "occupied" | "maintenance";
  pricePerMonth: number;
  amenities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IBooking {
  _id: string;
  student: string;
  room: string;
  checkIn: Date;
  checkOut?: Date;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "overdue";
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
