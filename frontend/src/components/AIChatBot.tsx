import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Sparkles,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { RoomService, AIService } from '../services/api';
import type { UserProfile } from '../services/api';

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */
interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  time: string;
  isTyping?: boolean;
  quickReplies?: string[];
}

interface AIChatBotProps {
  currentUser: UserProfile | null;
}

/* ─────────────────────────────────────────────────────────────────────────────
   KNOWLEDGE BASE  –  hotel-specific intent matching
───────────────────────────────────────────────────────────────────────────── */
const KB: { patterns: RegExp[]; response: string | ((ctx: BotContext) => string); quick?: string[] }[] = [
  // ── Greetings
  {
    patterns: [/\b(hi|hello|hey|namaste|good morning|good evening|good afternoon|howdy)\b/i],
    response: (c) =>
      `Hello${c.userName ? ` ${c.userName}` : ''}! 👋 I'm **Aura**, your AI hotel concierge. I can help you with:\n\n• 🏨 Room availability & prices\n• 📅 Booking & check-in/out info\n• 🍽️ Hotel services & amenities\n• 💳 Payments & policies\n• 🆘 Complaint & support\n\nWhat can I help you with today?`,
    quick: ['Room prices', 'Check-in info', 'Amenities', 'Book a room'],
  },
  // ── Rooms / availability
  {
    patterns: [/\b(room|rooms|available|availability|which room|any room)\b/i],
    response: `We offer **4 room categories**:\n\n🛏 **Standard Single** – ₹899/night (1 guest)\n🛏 **Comfort Family** – ₹1,499/night (4 guests)\n🛏 **Deluxe Double** – ₹1,299/night (2 guests)\n🛏 **Premium Suite** – ₹2,499/night (2 guests)\n\nAll rooms include free Wi-Fi, 24/7 hot water, LED TV & daily housekeeping.\n\nWould you like me to check live availability?`,
    quick: ['Check live availability', 'Room details', 'Book now'],
  },
  // ── Pricing
  {
    patterns: [/\b(price|prices|cost|how much|rate|tariff|charges|affordable|cheap|expensive)\b/i],
    response: `Here's our current pricing 💰:\n\n| Room Type | Price/Night |\n|---|---|\n| Standard Single | ₹899 |\n| Comfort Family | ₹1,499 |\n| Deluxe Double | ₹1,299 |\n| Premium Suite | ₹2,499 |\n\n✅ **No hidden charges** – price shown is final including taxes.\n🎟 We also have **promo codes** for discounts!`,
    quick: ['Apply promo code', 'Book Standard', 'Book Deluxe'],
  },
  // ── Check-in
  {
    patterns: [/\b(check.?in|checkin|arrival|arrive|when can i|check in time)\b/i],
    response: `📋 **Check-In Information**\n\n⏰ **Check-in time:** 12:00 PM (noon)\n⏰ **Check-out time:** 11:00 AM\n\n✅ Early check-in available on request (subject to availability)\n✅ Luggage storage offered if room isn't ready\n✅ Bring a valid **government-issued photo ID**\n📍 Front desk is staffed **24/7**`,
    quick: ['Check-out details', 'Early check-in', 'Luggage storage'],
  },
  // ── Check-out
  {
    patterns: [/\b(check.?out|checkout|departure|leave|leaving)\b/i],
    response: `📋 **Check-Out Information**\n\n⏰ **Check-out time:** 11:00 AM\n💳 Bills settled at the front desk or online\n🧳 Late check-out: available on request (extra charges may apply)\n🔑 Please return your room key/card at reception\n\nNeed help with an early or late check-out?`,
    quick: ['Request late check-out', 'Contact front desk', 'View my booking'],
  },
  // ── Amenities
  {
    patterns: [/\b(amenities|amenity|facilities|gym|pool|spa|wifi|wi.fi|parking|laundry|restaurant|food)\b/i],
    response: `🏨 **Hotel Amenities at Aura**\n\n✅ Free high-speed Wi-Fi (all rooms)\n✅ 24/7 hot water shower\n✅ Split AC & ceiling fan\n✅ LED Smart TV\n✅ Free secure parking\n✅ Daily housekeeping\n✅ Laundry & ironing service\n✅ 24/7 front desk assistance\n✅ Cab & travel booking help\n✅ Free luggage storage\n\nIs there a specific facility you'd like to know more about?`,
    quick: ['Laundry service', 'Parking info', 'Food & dining'],
  },
  // ── Food / dining
  {
    patterns: [/\b(food|dining|restaurant|breakfast|lunch|dinner|meal|eat|snack|coffee|tea)\b/i],
    response: `🍽️ **Dining at Aura Hotel**\n\nWe offer **in-room dining service** 🛎:\n• Breakfast: 7:00 AM – 10:30 AM\n• Lunch: 12:30 PM – 3:00 PM\n• Dinner: 7:00 PM – 10:30 PM\n\n☕ Tea/coffee available 24/7 at reception\n🍱 Local restaurant delivery also facilitated by our front desk staff.\n\nWould you like to place a food order or need help with anything else?`,
    quick: ['Order food', 'Breakfast timing', 'Contact front desk'],
  },
  // ── Booking process
  {
    patterns: [/\b(how to book|how do i book|make a booking|reservation|reserve|book a room|booking process)\b/i],
    response: `📅 **How to Book a Room**\n\n1️⃣ Scroll to the **Rooms section** on our home page\n2️⃣ Select your preferred room type\n3️⃣ Click **"Book Now"** and fill in your dates\n4️⃣ Enter guest details & apply any promo code\n5️⃣ Confirm & receive your **booking voucher by email**\n\n🔐 You need to **create an account or sign in** first.\n\nNeed me to take you to the booking section?`,
    quick: ['Go to rooms', 'Sign in / Register', 'Apply coupon'],
  },
  // ── Cancellation
  {
    patterns: [/\b(cancel|cancellation|refund|money back|cancelled)\b/i],
    response: `❌ **Cancellation & Refund Policy**\n\n• **Free cancellation** up to 24 hours before check-in\n• Cancellations within 24 hours: **50% charge** applies\n• No-show: **Full charge** applies\n\n💳 Refunds are processed within **5–7 business days** to your original payment method.\n\nTo cancel a booking, go to **"My Bookings"** after logging in, or contact our front desk directly.`,
    quick: ['Cancel my booking', 'Contact front desk', 'Refund status'],
  },
  // ── Promo / coupon
  {
    patterns: [/\b(promo|coupon|discount|offer|code|deal|voucher)\b/i],
    response: `🎟️ **Promo Codes & Discounts**\n\nWe regularly offer promo codes for:\n• First-time guests\n• Extended stays (3+ nights)\n• Weekend specials\n• Loyalty guests\n\nEnter your promo code during booking checkout to apply the discount automatically.\n\n💡 **Tip:** Check our social pages & email newsletters for the latest deals!`,
    quick: ['Apply coupon', 'Book a room', 'Contact us'],
  },
  // ── Payment
  {
    patterns: [/\b(payment|pay|upi|card|credit|debit|cash|online payment|how to pay)\b/i],
    response: `💳 **Payment Methods Accepted**\n\n✅ Credit & Debit Cards (Visa, Mastercard, Rupay)\n✅ UPI (GPay, PhonePe, Paytm, BHIM)\n✅ Net Banking\n✅ Cash at front desk\n✅ Hotel vouchers / gift cards\n\nAll online payments are **SSL-secured** and processed safely.\n\nNeed help with a payment issue?`,
    quick: ['Payment failed', 'Refund request', 'Contact support'],
  },
  // ── Complaints / issues
  {
    patterns: [/\b(complaint|complain|issue|problem|bad|not working|dirty|noise|broken|unhappy|unhygienic)\b/i],
    response: `🙏 We're sorry to hear you're having an issue!\n\n**To submit a complaint:**\n1. Go to the **Reviews** section and use our feedback form\n2. Or call our 24/7 front desk directly\n3. Our staff will respond within **2 hours**\n\n📞 **Front Desk:** +91 98765 43210\n📧 **Email:** support@aurahotels.com\n\nYour feedback is taken seriously and reviewed by our management team with AI analysis.`,
    quick: ['Submit complaint', 'Call front desk', 'Write a review'],
  },
  // ── Location / address
  {
    patterns: [/\b(location|address|where|directions|how to reach|map|nearby|distance)\b/i],
    response: `📍 **Aura Hotel Location**\n\n🏨 123 Hotel Street, Near City Centre\nMumbai, Maharashtra – 400001\n\n🚆 **Nearest Railway Station:** 1.2 km\n✈️ **Airport:** 18 km\n🚌 **Bus Stand:** 0.8 km\n🛺 **Auto / Cab:** Easily available at entrance\n\nOur front desk can arrange **airport pickup** on request!`,
    quick: ['Airport pickup', 'Cab booking', 'Contact us'],
  },
  // ── WiFi
  {
    patterns: [/\b(wifi|wi-fi|internet|password|network|connection)\b/i],
    response: `📶 **Wi-Fi Information**\n\n✅ **Free high-speed Wi-Fi** in all rooms & common areas\n📶 Network Name: **AURA_HOTEL_GUEST**\n🔑 Password: Provided at check-in (on your room key card)\n\n⚡ Speed: Up to **50 Mbps** (shared)\nIf you face any connectivity issues, contact our front desk and we'll have it fixed within 15 minutes!`,
    quick: ['Other amenities', 'Contact front desk', 'Room info'],
  },
  // ── Parking
  {
    patterns: [/\b(parking|park|car|vehicle|bike|two.wheeler|four.wheeler)\b/i],
    response: `🅿️ **Parking Information**\n\n✅ **Free parking** for all hotel guests\n🔒 **24/7 CCTV-monitored** secure premises\n🚗 Space for cars and two-wheelers\n📍 Parking area: Ground level, hotel entrance\n\nFor oversized vehicles or special arrangements, please inform our front desk in advance.`,
    quick: ['Check-in info', 'Other amenities', 'Contact us'],
  },
  // ── AI / tech questions
  {
    patterns: [/\b(ai|artificial intelligence|machine learning|ml|technology|smart|system|how does this work)\b/i],
    response: `🤖 **AI-Powered Hotel System**\n\nAura Hotel uses a **Smart Management System** with:\n\n🧠 **AI Sentiment Analysis** – Reviews auto-analyzed by NLP\n📈 **Occupancy Forecasting** – 7-day ML predictions\n💰 **Dynamic Pricing Engine** – Real-time rate optimization\n🔄 **Turnaround Optimizer** – Housekeeping scheduling\n⚠️ **Cancellation Predictor** – Booking risk analysis\n\nAll models are trained on real hotel data with scikit-learn!`,
    quick: ['Room prices', 'Book a room', 'Other questions'],
  },
  // ── Thanks
  {
    patterns: [/\b(thank|thanks|thank you|thx|ty|great|awesome|nice|helpful|good)\b/i],
    response: `You're very welcome! 😊 It's my pleasure to assist you.\n\nIs there anything else I can help you with? Whether it's about your booking, room details, or any other query — I'm here for you 24/7! 🏨✨`,
    quick: ['Room prices', 'Check-in info', 'More help'],
  },
  // ── Goodbye
  {
    patterns: [/\b(bye|goodbye|see you|take care|exit|close|done|ok thanks|no thanks)\b/i],
    response: `Goodbye! 👋 Have a wonderful stay at Aura Hotel! \n\nFeel free to chat anytime if you need assistance. Wishing you a comfortable and memorable experience! 🏨✨`,
    quick: [],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   BOT CONTEXT
───────────────────────────────────────────────────────────────────────────── */
interface BotContext {
  userName: string;
  userRole: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
const uid = () => Math.random().toString(36).slice(2, 9);

const now = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

function getResponse(
  input: string,
  ctx: BotContext
): { text: string; quick: string[] } {
  const lower = input.toLowerCase();

  // Live availability intent
  if (/\b(live|check live|real.time|available now|available rooms|how many)\b/.test(lower)) {
    return {
      text: '🔍 Let me check live room availability for you right now…',
      quick: [],
    };
  }

  for (const entry of KB) {
    if (entry.patterns.some((p) => p.test(lower))) {
      const text =
        typeof entry.response === 'function' ? entry.response(ctx) : entry.response;
      return { text, quick: entry.quick ?? [] };
    }
  }

  // Fallback
  return {
    text: `I'm not sure I understood that fully. Let me connect you to our support team or you can try rephrasing!\n\nYou can ask me about:\n• Room prices & availability\n• Check-in / check-out\n• Amenities & services\n• Booking & cancellation policy\n• Payment methods\n\n📞 Or call us: **+91 98765 43210**`,
    quick: ['Room prices', 'Check-in info', 'Amenities', 'Contact us'],
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export const AIChatBot: React.FC<AIChatBotProps> = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ctx: BotContext = {
    userName: currentUser?.full_name?.split(' ')[0] || '',
    userRole: currentUser?.role || 'guest',
  };

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initial greeting when chat opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      const greeting: ChatMessage = {
        id: uid(),
        role: 'bot',
        text: `Hello${ctx.userName ? ` **${ctx.userName}**` : ''}! 👋 I'm **Aura AI**, your 24/7 hotel concierge.\n\nI can help with:\n• 🏨 Room info & pricing\n• 📅 Booking & check-in help\n• 🛎️ Hotel services\n• 💳 Payments & policies\n• 🆘 Complaints & support\n\nWhat can I help you with today?`,
        time: now(),
        quickReplies: ['Room prices', 'Check-in info', 'Amenities', 'Book a room'],
      };
      setMessages([greeting]);
    }
  }, [isOpen, hasGreeted]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const addBotMessage = (text: string, quick: string[] = []) => {
    const msg: ChatMessage = {
      id: uid(),
      role: 'bot',
      text,
      time: now(),
      quickReplies: quick,
    };
    setMessages((prev) => [...prev, msg]);
    if (!isOpen || isMinimized) setUnreadCount((n) => n + 1);
  };

  const handleLiveAvailability = async () => {
    setIsLoadingLive(true);
    try {
      const rooms = await RoomService.getRooms({ available_only: true });
      if (!rooms || rooms.length === 0) {
        addBotMessage(
          '😔 Unfortunately all rooms are currently fully booked. Please check back soon or contact our front desk to be added to the waitlist!\n\n📞 **+91 98765 43210**',
          ['Check prices', 'Contact front desk']
        );
      } else {
        const lines = rooms
          .slice(0, 6)
          .map((r: any) => `• **Room ${r.room_number}** – ${r.room_type_name} – ₹${r.price_per_night?.toLocaleString('en-IN') ?? 'N/A'}/night`)
          .join('\n');
        addBotMessage(
          `✅ **${rooms.length} rooms available right now!**\n\n${lines}\n\nWould you like to book any of these?`,
          ['Book a room', 'Room details', 'Check prices']
        );
      }
    } catch {
      addBotMessage(
        'I couldn\'t fetch live availability right now. Please check the **Rooms** section on the home page or call us at **+91 98765 43210**.',
        ['Go to rooms', 'Contact us']
      );
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleOccupancyForecast = async () => {
    try {
      const forecast = await AIService.getOccupancyForecast(3);
      const list = forecast?.daily_forecasts || (forecast as any)?.forecast;
      if (list && list.length > 0) {
        const lines = list
          .slice(0, 3)
          .map((f: any) => `• **${f.date}**: ${Math.round(f.predicted_occupancy * 100)}% occupancy expected`)
          .join('\n');
        addBotMessage(
          `📈 **AI Occupancy Forecast (Next 3 Days)**\n\n${lines}\n\n💡 Book early for better room selection!`,
          ['Book now', 'Room prices']
        );
      }
    } catch {
      /* silent */
    }
  };

  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: uid(),
      role: 'user',
      text: msgText,
      time: now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Typing indicator
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
    setIsTyping(false);

    // Live availability special case
    const lower = msgText.toLowerCase();
    if (/\b(live|check live|available now|real.time|how many rooms|available rooms)\b/.test(lower)) {
      await handleLiveAvailability();
      return;
    }

    // Occupancy forecast
    if (/\b(forecast|occupancy|busy|peak|demand)\b/.test(lower)) {
      await handleOccupancyForecast();
      return;
    }

    // Action quick replies
    if (/\b(go to rooms|book now|book a room|booking section)\b/.test(lower)) {
      addBotMessage(
        '🏨 Taking you to the rooms section! Scroll down to browse and book available rooms.',
        ['Check prices', 'Check-in info']
      );
      setTimeout(() => {
        document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      return;
    }

    if (/\b(sign in|register|login|create account)\b/.test(lower)) {
      addBotMessage(
        '🔐 You can sign in or create a new account using the **Sign In** button in the navigation bar at the top of the page.',
        ['Room prices', 'Book a room']
      );
      return;
    }

    if (/\b(contact|call|phone|email|front desk|speak to someone|human)\b/.test(lower)) {
      addBotMessage(
        `📞 **Contact Our Team**\n\n🏨 **Front Desk (24/7):** +91 98765 43210\n📧 **Email:** support@aurahotels.com\n💬 **WhatsApp:** +91 98765 43210\n\n⏰ Response time: Immediate by phone, within 2 hours by email.\n\nIs there anything else I can help you with?`,
        ['Room prices', 'Amenities', 'Book a room']
      );
      return;
    }

    // General NLP response
    const { text: botText, quick } = getResponse(msgText, ctx);
    addBotMessage(botText, quick);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setHasGreeted(false);
  };

  /* ── RENDER ── */
  return (
    <>
      {/* ── Floating Bubble Button ── */}
      <button
        id="ai-chatbot-btn"
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 9990,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#0284C7',
          border: 'none',
          cursor: 'pointer',
          display: isOpen && !isMinimized ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(2, 132, 199, 0.45)',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 35px rgba(3, 105, 161, 0.55)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 25px rgba(2, 132, 199, 0.45)';
        }}
        title="Chat with Aura AI Concierge"
      >
        <MessageCircle size={26} color="#FFFFFF" strokeWidth={2.5} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#DC2626',
            color: '#fff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '0.7rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #FFFFFF',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Chat Window ── */}
      {isOpen && (
        <div
          id="ai-chatbot-window"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 9991,
            width: isMinimized ? '280px' : '380px',
            maxWidth: 'calc(100vw - 2rem)',
            borderRadius: '20px',
            background: '#FFFFFF',
            border: '1px solid #BAE6FD',
            boxShadow: '0 20px 50px rgba(14, 165, 233, 0.2), 0 0 0 1px #BAE6FD',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: isMinimized ? 'auto' : '560px',
            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.1rem',
            background: '#E0F2FE',
            borderBottom: isMinimized ? 'none' : '1px solid #BAE6FD',
            cursor: isMinimized ? 'pointer' : 'default',
          }} onClick={() => isMinimized && setIsMinimized(false)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: '#38BDF8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={18} color="#FFFFFF" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Aura AI Concierge
                  <Sparkles size={12} color="#0284C7" />
                </div>
                <div style={{ fontSize: '0.68rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
                  Online · Typically replies instantly
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                onClick={(e) => { e.stopPropagation(); clearChat(); }}
                title="Clear chat"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                title={isMinimized ? 'Expand' : 'Minimise'}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              >
                {isMinimized ? <ChevronDown size={16} /> : <Minimize2 size={14} />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                minHeight: '300px',
                maxHeight: '380px',
                background: '#F0F9FF',
              }}>
                {messages.map((msg) => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', maxWidth: '88%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: msg.role === 'bot' ? '#38BDF8' : '#0284C7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {msg.role === 'bot'
                          ? <Bot size={14} color="#FFFFFF" strokeWidth={2.5} />
                          : <User size={14} color="#FFFFFF" />}
                      </div>
                      {/* Bubble */}
                      <div style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: msg.role === 'user'
                          ? '#0284C7'
                          : '#FFFFFF',
                        border: msg.role === 'user'
                          ? '1px solid #0369A1'
                          : '1px solid #BAE6FD',
                        color: msg.role === 'user' ? '#FFFFFF' : '#0F172A',
                        fontSize: '0.83rem',
                        lineHeight: '1.6',
                        whiteSpace: 'pre-wrap',
                        boxShadow: '0 2px 6px rgba(14, 165, 233, 0.06)',
                      }}>
                        <FormattedText text={msg.text} />
                      </div>
                    </div>
                    <span style={{ fontSize: '0.62rem', color: '#64748B', paddingLeft: msg.role === 'bot' ? '36px' : '0', paddingRight: msg.role === 'user' ? '36px' : '0' }}>
                      {msg.time}
                    </span>
                    {/* Quick replies */}
                    {msg.role === 'bot' && msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', paddingLeft: '36px', marginTop: '0.15rem' }}>
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr}
                            onClick={() => sendMessage(qr)}
                            style={{
                              padding: '0.3rem 0.7rem',
                              borderRadius: '999px',
                              background: '#E0F2FE',
                              border: '1px solid #BAE6FD',
                              color: '#0284C7',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              fontWeight: 600,
                              transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#BAE6FD'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#E0F2FE'; }}
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {(isTyping || isLoadingLive) && (
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bot size={14} color="#FFFFFF" />
                    </div>
                    <div style={{ padding: '0.65rem 1rem', borderRadius: '16px 16px 16px 4px', background: '#FFFFFF', border: '1px solid #BAE6FD', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284C7', animation: `chatBounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div style={{
                padding: '0.75rem 1rem',
                borderTop: '1px solid #BAE6FD',
                background: '#FFFFFF',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
              }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Ask me anything about your stay…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isTyping || isLoadingLive}
                  style={{
                    flex: 1,
                    padding: '0.55rem 0.85rem',
                    borderRadius: '12px',
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    color: '#0F172A',
                    fontSize: '0.83rem',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = '#0284C7'; }}
                  onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = '#BAE6FD'; }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isTyping || isLoadingLive}
                  style={{
                    width: '38px', height: '38px', borderRadius: '12px',
                    background: input.trim() ? '#0284C7' : '#E0F2FE',
                    border: 'none', cursor: input.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s',
                  }}
                >
                  <Send size={16} color={input.trim() ? '#FFFFFF' : '#94A3B8'} strokeWidth={2.5} />
                </button>
              </div>

              {/* Footer */}
              <div style={{ padding: '0.4rem 1rem 0.5rem', textAlign: 'center', fontSize: '0.62rem', color: 'var(--text-subtle)' }}>
                Powered by Aura AI · Smart Hotel Management System
              </div>
            </>
          )}
        </div>
      )}

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   FORMATTED TEXT  –  render **bold** markdown inline
───────────────────────────────────────────────────────────────────────────── */
const FormattedText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} style={{ color: '#f8fafc', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default AIChatBot;
