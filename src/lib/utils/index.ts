import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export function formatDateTime(dateTime: string): string {
  const d = new Date(dateTime);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    birthday: '🎂 Birthday',
    anniversary: '💕 Anniversary',
    holiday_dinner: '🎄 Holiday Dinner',
    festival: '🪔 Festival',
    weekend_dinner: '🏠 Weekend Dinner',
    regular_dinner: '🍽️ Regular Dinner',
    other: '📌 Other'
  };
  return labels[type] || type;
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    birthday: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    anniversary: 'bg-red-500/20 text-red-400 border-red-500/30',
    holiday_dinner: 'bg-green-500/20 text-green-400 border-green-500/30',
    festival: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    weekend_dinner: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    regular_dinner: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  return colors[type] || colors.other;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    yes: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    no: 'bg-red-500/20 text-red-400 border-red-500/30',
    maybe: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  };
  return colors[status] || colors.maybe;
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    yes: '✅ Coming',
    no: '❌ Not Coming',
    maybe: '🤔 Maybe'
  };
  return labels[status] || status;
}

export function generateWhatsAppMessage(
  eventName: string,
  eventDate: string,
  attendance: {
    coming: number;
    notComing: number;
    adults: number;
    children: number;
  },
  foodOrders: { item: string; quantity: number }[],
  specialInstructions: { instruction: string; count: number }[]
): string {
  const date = new Date(eventDate);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long'
  });

  let message = `🍽️ *Comedy Group ${eventName}*\n\n`;
  message += `📅 Date: ${formattedDate}\n\n`;
  message += `👥 *Coming Families:* ${attendance.coming}\n`;
  message += `👋 *Not Coming:* ${attendance.notComing}\n`;
  message += `🧑 *Adults:* ${attendance.adults}\n`;
  message += `👶 *Children:* ${attendance.children}\n\n`;
  
  if (foodOrders.length > 0) {
    message += `🍴 *Food Order*\n`;
    foodOrders.forEach(order => {
      message += `• ${order.item} ×${order.quantity}\n`;
    });
    message += '\n';
  }

  if (specialInstructions.length > 0) {
    message += `📝 *Special Notes*\n`;
    specialInstructions.forEach(note => {
      message += `• ${note.instruction} ×${note.count}\n`;
    });
    message += '\n';
  }

  message += `_Ready to send to restaurant._`;

  return message;
}

export function getDeclineReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    out_of_station: 'Out of Station',
    busy: 'Busy',
    sick: 'Sick',
    other: 'Other'
  };
  return labels[reason] || reason;
}
