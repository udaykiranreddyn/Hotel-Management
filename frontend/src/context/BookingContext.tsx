import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RoomService, BookingService } from '../services/api';
import type { UserProfile } from '../services/api';

export interface RoomItem {
  id: number;
  name: string;
  type: string;
  price: number;
  capacity: string;
  bed: string;
  floor: string;
  image: string;
  amenities: string[];
  rating: number;
  reviewsCount: number;
  status: string;
  description: string;
}

export interface BookingRecord {
  id: string;
  roomId: number;
  roomName: string;
  roomType: string;
  roomImage: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  roomPreference: string;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface BookingContextType {
  rooms: RoomItem[];
  userBookings: BookingRecord[];
  isLoadingRooms: boolean;
  selectedRoomForBooking: RoomItem | null;
  isBookingModalOpen: boolean;
  isMyBookingsOpen: boolean;
  openBookingModal: (room: RoomItem) => void;
  closeBookingModal: () => void;
  openMyBookings: () => void;
  closeMyBookings: () => void;
  refreshRooms: () => Promise<void>;
  saveBookings: (bookings: BookingRecord[]) => void;
  cancelBooking: (bookingId: string) => Promise<boolean>;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
}

export const defaultRooms: RoomItem[] = [
  {
    id: 101,
    name: 'Standard Single Room (Room 101)',
    type: 'Standard',
    price: 599,
    capacity: '1 Adult',
    bed: '1 Single Bed',
    floor: '1st Floor',
    image: '/images/luxury_hotel_hero.jpg',
    amenities: ['Free Wi-Fi', 'Ceiling Fan / AC', 'LED TV', '24/7 Hot Water Shower'],
    rating: 4.7,
    reviewsCount: 142,
    status: 'AVAILABLE',
    description: 'Clean and practical private room for solo travelers, transit stays, and students. Attached private bathroom with 24/7 hot water.'
  },
  {
    id: 102,
    name: 'Standard Double Room (Room 102)',
    type: 'Deluxe',
    price: 899,
    capacity: '2 Adults',
    bed: '1 Queen Bed',
    floor: '1st Floor',
    image: '/images/deluxe_suite.jpg',
    amenities: ['Free Wi-Fi', 'Ceiling Fan / AC', 'LED TV', '24/7 Hot Water Shower', 'Daily Room Cleaning'],
    rating: 4.8,
    reviewsCount: 215,
    status: 'AVAILABLE',
    description: 'Comfortable double bedroom with fresh sanitized linens, split AC, 32-inch LED TV, and hygienic private bathroom.'
  },
  {
    id: 203,
    name: 'Comfort AC Room (Room 203)',
    type: 'Premium',
    price: 1199,
    capacity: '3 Guests',
    bed: '1 King Bed',
    floor: '2nd Floor',
    image: '/images/ocean_suite.jpg',
    amenities: ['Free Wi-Fi', 'Split Air Conditioner', 'LED TV', '24/7 Hot Water Shower', 'Electric Kettle', 'Work Table & Chair'],
    rating: 4.8,
    reviewsCount: 168,
    status: 'AVAILABLE',
    description: 'Spacious AC room with king-size bed, work table, tea/coffee kettle, and daily housekeeping.'
  },
  {
    id: 204,
    name: 'Comfort Family Room (Room 204)',
    type: 'Suite',
    price: 1499,
    capacity: '4 Guests',
    bed: '2 Double Beds',
    floor: '2nd Floor',
    image: '/images/presidential_suite.jpg',
    amenities: ['Free Wi-Fi', 'Split Air Conditioner', 'LED TV', '24/7 Hot Water Shower', 'Daily Room Cleaning', 'Free Parking Space'],
    rating: 4.8,
    reviewsCount: 110,
    status: 'AVAILABLE',
    description: 'Spacious room with two double beds for up to 4 family members or friends. Includes wardrobe and clean attached bath.'
  }
];

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{
  children: React.ReactNode;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
}> = ({ children, currentUser, setCurrentUser }) => {
  const [rooms, setRooms] = useState<RoomItem[]>(defaultRooms);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<RoomItem | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [userBookings, setUserBookings] = useState<BookingRecord[]>(() => {
    try {
      const saved = localStorage.getItem('aura_hotel_bookings_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveBookings = (newBookings: BookingRecord[]) => {
    setUserBookings(newBookings);
    try {
      localStorage.setItem('aura_hotel_bookings_v2', JSON.stringify(newBookings));
    } catch (e) {
      console.error('Failed to save bookings in localStorage', e);
    }
  };

  const refreshRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const data = await RoomService.getRooms();
      if (data && data.length > 0) {
        const mapped: RoomItem[] = data.map((r) => ({
          id: r.id,
          name: `${r.room_type.name} (Room ${r.room_number})`,
          type: r.room_type.category,
          price: r.price_per_night,
          capacity: `${r.room_type.capacity} ${r.room_type.capacity === 1 ? 'Adult' : 'Guests'}`,
          bed: r.room_type.bed_type,
          floor: `Floor ${r.floor}`,
          image: r.room_type.image_url || '/images/deluxe_suite.jpg',
          amenities: r.amenities.map((a) => a.name),
          rating: 4.8,
          reviewsCount: 150 + r.floor * 14,
          status: r.is_available ? 'AVAILABLE' : r.current_status,
          description: r.room_type.description || `${r.view_type} • Individual climate control & private bathroom.`,
        }));
        setRooms(mapped);
      }
    } catch (err) {
      console.warn('Backend rooms fetch fallback to local inventory:', err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  // Sync user bookings from backend when logged in
  useEffect(() => {
    if (!currentUser?.email) return;

    BookingService.getMyBookings(currentUser.email)
      .then((live) => {
        if (live && live.length > 0) {
          const mapped: BookingRecord[] = live.map((b) => ({
            id: b.booking_reference,
            roomId: b.room_id,
            roomName: `${b.room_type_name} (Room ${b.room_number})`,
            roomType: b.room_type_name,
            roomImage: b.room_image || '/images/deluxe_suite.jpg',
            checkIn: b.check_in_date,
            checkOut: b.check_out_date,
            nights: b.num_nights,
            guests: b.num_guests,
            guestName: b.guest_name || 'Guest Traveler',
            guestEmail: b.guest_email || '',
            guestPhone: (b as any).guest_phone || '+91 98765 11111',
            roomPreference: (b as any).room_preference || 'Standard Floor',
            baseAmount: b.room_charges,
            taxAmount: b.taxes,
            discountAmount: b.discount_amount,
            totalAmount: b.total_amount,
            status: b.booking_status,
            createdAt: b.created_at,
          }));
          saveBookings(mapped);
        }
      })
      .catch((err) => {
        console.warn('Backend bookings fetch fallback to local cache:', err);
      });
  }, [currentUser]);

  useEffect(() => {
    refreshRooms();

    const handleOpenMyBookingsEvent = () => setIsMyBookingsOpen(true);
    window.addEventListener('open-my-bookings', handleOpenMyBookingsEvent);
    return () => window.removeEventListener('open-my-bookings', handleOpenMyBookingsEvent);
  }, [refreshRooms]);

  const openBookingModal = (room: RoomItem) => {
    setSelectedRoomForBooking(room);
    setIsBookingModalOpen(true);
  };

  const closeBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  const openMyBookings = () => {
    setIsMyBookingsOpen(true);
  };

  const closeMyBookings = () => {
    setIsMyBookingsOpen(false);
  };

  const cancelBooking = async (bookingId: string): Promise<boolean> => {
    try {
      await BookingService.cancelBooking(bookingId, 'Guest requested cancellation');
      const updated = userBookings.filter((b) => b.id !== bookingId);
      saveBookings(updated);
      refreshRooms();
      return true;
    } catch (err) {
      console.warn('Backend cancel failed, removing from local list:', err);
      const updated = userBookings.filter((b) => b.id !== bookingId);
      saveBookings(updated);
      return true;
    }
  };

  return (
    <BookingContext.Provider
      value={{
        rooms,
        userBookings,
        isLoadingRooms,
        selectedRoomForBooking,
        isBookingModalOpen,
        isMyBookingsOpen,
        openBookingModal,
        closeBookingModal,
        openMyBookings,
        closeMyBookings,
        refreshRooms,
        saveBookings,
        cancelBooking,
        currentUser,
        setCurrentUser,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
