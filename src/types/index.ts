// ============================================================
// TypeScript Types & Database Types
// ============================================================

export type UserRole = 'student' | 'driver' | 'admin'
export type BusStatus = 'active' | 'inactive' | 'maintenance'
export type TripStatus = 'not_started' | 'running' | 'delayed' | 'completed'
export type RegistrationStatus = 'pending' | 'approved' | 'rejected'
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'announcement'

export interface Stop {
  name: string
  lat: number
  lng: number
}

export interface Profile {
  id: string
  role: UserRole
  full_name: string | null
  roll_number: string | null
  email: string | null
  phone: string | null
  department: string | null
  year: number | null
  created_at: string
}

export interface Route {
  id: string
  route_name: string
  source: string
  destination: string
  stops: Stop[]
  fare: number
  created_at: string
}

export interface Bus {
  id: string
  bus_number: string
  route_id: string | null
  capacity: number
  status: BusStatus
  created_at: string
  route?: Route
}

export interface Driver {
  id: string
  profile_id: string
  bus_id: string | null
  created_at: string
  profile?: Profile
  bus?: Bus
}

export interface Registration {
  id: string
  student_id: string
  route_id: string | null
  bus_id: string | null
  status: RegistrationStatus
  academic_year: string | null
  remarks: string | null
  created_at: string
  updated_at: string
  profile?: Profile
  route?: Route
  bus?: Bus
}

export interface BusLocation {
  id: string
  bus_id: string
  latitude: number | null
  longitude: number | null
  trip_status: TripStatus
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  subscription: object
  created_at: string
}

// Bus Dashboard data (aggregated)
export interface BusDashboardData {
  bus: Bus
  route: Route | null
  driver: Driver | null
  location: BusLocation | null
  passengerCount: number
}

// Database type for Supabase client
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      routes: {
        Row: Route
        Insert: Omit<Route, 'id' | 'created_at'>
        Update: Partial<Omit<Route, 'id' | 'created_at'>>
      }
      buses: {
        Row: Bus
        Insert: Omit<Bus, 'id' | 'created_at'>
        Update: Partial<Omit<Bus, 'id' | 'created_at'>>
      }
      drivers: {
        Row: Driver
        Insert: Omit<Driver, 'id' | 'created_at'>
        Update: Partial<Omit<Driver, 'id' | 'created_at'>>
      }
      registrations: {
        Row: Registration
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Registration, 'id' | 'created_at'>>
      }
      bus_locations: {
        Row: BusLocation
        Insert: Omit<BusLocation, 'id'>
        Update: Partial<Omit<BusLocation, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      push_subscriptions: {
        Row: PushSubscription
        Insert: Omit<PushSubscription, 'id' | 'created_at'>
        Update: Partial<Omit<PushSubscription, 'id' | 'created_at'>>
      }
    }
  }
}
