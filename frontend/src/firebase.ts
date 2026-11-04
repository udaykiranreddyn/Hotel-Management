import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDusMC8ehNSUEK6H85rWYL7DmhPInXzKrk",
  authDomain: "hotel-management-system-afd89.firebaseapp.com",
  projectId: "hotel-management-system-afd89",
  storageBucket: "hotel-management-system-afd89.firebasestorage.app",
  messagingSenderId: "845827061498",
  appId: "1:845827061498:web:87dafaa8669f0929d3bb43",
  measurementId: "G-6FHBKWDXC2"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics (only initialized if supported in browser environment)
export const analyticsPromise = isSupported().then((supported) => supported ? getAnalytics(app) : null);

// Firestore Client Helpers
export async function saveUserToFirestore(user: {
  id: number | string;
  email: string;
  full_name: string;
  role: string;
  phone?: string | null;
  preferences?: string | null;
  loyalty_points?: number;
}) {
  try {
    const userRef = doc(db, "users", String(user.id));
    await setDoc(userRef, {
      ...user,
      updated_at: serverTimestamp()
    }, { merge: true });
    console.log(`[Firestore] User ${user.email} saved successfully.`);
  } catch (err) {
    console.warn("[Firestore] Save user note:", err);
  }
}

export async function saveBookingToFirestore(booking: {
  booking_reference: string;
  guest_name: string;
  guest_email: string;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  status: string;
}) {
  try {
    const bookingRef = doc(db, "bookings", booking.booking_reference);
    await setDoc(bookingRef, {
      ...booking,
      created_at: serverTimestamp()
    }, { merge: true });
    console.log(`[Firestore] Booking ${booking.booking_reference} saved successfully.`);
  } catch (err) {
    console.warn("[Firestore] Save booking note:", err);
  }
}

export async function saveReviewToFirestore(review: {
  guest_name: string;
  room_number?: string;
  rating: number;
  comments: string;
  sentiment_label?: string;
}) {
  try {
    await addDoc(collection(db, "reviews"), {
      ...review,
      submitted_at: serverTimestamp()
    });
    console.log(`[Firestore] Review from ${review.guest_name} saved successfully.`);
  } catch (err) {
    console.warn("[Firestore] Save review note:", err);
  }
}
