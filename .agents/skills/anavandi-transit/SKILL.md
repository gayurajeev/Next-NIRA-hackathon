---
name: anavandi-transit
description: >-
  Specialized transit domain skill for handling KSRTC route calculations, bus classification logic (Ordinary, Fast Passenger, Super Fast, Swift, Minnal), fare computation, seat matrix layout generation, and SOS emergency dispatch protocols.
---

# Anavandi Transit Skill Guide

This skill encapsulates the domain rules and calculations for Kerala's public bus transit ecosystem (KSRTC / Swift / Minnal).

## Bus Categories & Speed Classes
1. **Minnal (Night Super Express)**: Top priority, limited stops, high speed, distinctive white/red lightning livery.
2. **KSRTC Swift (Super Deluxe / AC Seater)**: Premium intercity, high comfort, USB charging, electric/diesel fleet.
3. **Super Fast / Fast Passenger**: Backbone inter-district transit, connects major hubs (Ernakulam, Thiruvananthapuram, Kozhikode, Thrissur).
4. **Ordinary / City Circular**: High-density urban routes (e.g. Kochi Metro feeder, Trivandrum City Circular).

## Fare Structure Formula
- Base Fare: ₹10 (Ordinary), ₹15 (Fast Passenger), ₹22 (Super Fast), ₹35+ (Swift / Minnal).
- Distance Rate: ~₹1.10 to ₹1.80 per kilometer based on category.

## Seat Layout Matrix Schema
- Standard 2+2 layout (40-48 seats).
- Window seats: A1, A4, B1, B4...
- Reserved Ladies/Elderly seats: Rows 1-3.

## Emergency SOS Protocol
- High priority alert payload: `{ busId, lat, lng, timestamp, category: 'MEDICAL' | 'HARASSMENT' | 'ACCIDENT' | 'BREAKDOWN' }`.
- Broadcasts real-time alert event to Depot Dashboard & nearby drivers via Supabase Realtime channel `incident_alerts`.
