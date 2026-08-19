import { DELIVERY_TIERS } from "@/lib/constants";

export function dbToJs(row) {
  if (!row) return null;
  return {
    storeEmail: row.store_email || "",
    storePhone: row.store_phone || "",
    socialHandle: row.social_handle || "",
    pickupArea: row.pickup_area || "",
    pickupAddress: row.pickup_address || "",
    gstRate: row.gst_rate !== null ? Number(row.gst_rate) : 5,
    deliveryEnabled: row.delivery_enabled ?? true,
    deliveryTiers: row.delivery_tiers || DELIVERY_TIERS,
    isOpen: row.is_open ?? true,
    pickupDays: row.pickup_days || ["Friday", "Saturday"],
    pickupTimes: row.pickup_times || ["11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
    deliveryDays: row.delivery_days || ["Friday", "Saturday"],
  };
}

export function jsToDb(obj) {
  return {
    store_email: obj.storeEmail,
    store_phone: obj.storePhone,
    social_handle: obj.socialHandle,
    pickup_area: obj.pickupArea,
    pickup_address: obj.pickupAddress || null,
    gst_rate: obj.gstRate,
    delivery_enabled: obj.deliveryEnabled,
    delivery_tiers: obj.deliveryTiers,
    is_open: obj.isOpen,
    pickup_days: obj.pickupDays,
    pickup_times: obj.pickupTimes,
    delivery_days: obj.deliveryDays,
  };
}

export const DEFAULT_SETTINGS = {
  storeEmail: "info@layrd.org",
  storePhone: "403-399-3903",
  socialHandle: "@l.a.y.r.d",
  pickupArea: "Pineridge NE, Calgary",
  pickupAddress: "",
  gstRate: 5,
  deliveryEnabled: true,
  deliveryTiers: DELIVERY_TIERS,
  isOpen: true,
  pickupDays: ["Friday", "Saturday"],
  pickupTimes: ["11:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"],
  deliveryDays: ["Friday", "Saturday"],
};