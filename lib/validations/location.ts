import { z } from "zod";

export const locationPingSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy_m: z.number().min(0).max(10000).optional(),
  speed_mps: z.number().min(0).max(100).optional(), // Max ~360 km/h
  heading: z.number().min(0).max(360).optional(),
  recorded_at: z.string().datetime().optional(),
});

export const locationBatchSchema = z.object({
  pings: z.array(locationPingSchema).min(1).max(50),
});

export type LocationPingInput = z.infer<typeof locationPingSchema>;
export type LocationBatchInput = z.infer<typeof locationBatchSchema>;
