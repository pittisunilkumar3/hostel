export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: "SUPER_ADMIN" | "OWNER" | "CUSTOMER";
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RoomInput {
  roomNumber: string;
  floor: number;
  capacity: number;
  type: "SINGLE" | "DOUBLE" | "TRIPLE" | "DORMITORY";
  pricePerMonth: number;
  amenities?: string;
  description?: string;
}

export interface BookingInput {
  studentId: number;
  roomId: number;
  checkIn: string;
  checkOut?: string;
  totalAmount: number;
}
