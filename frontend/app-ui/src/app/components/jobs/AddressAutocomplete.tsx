"use client";

import { useEffect, useRef, useState } from "react";
import { autocomplete, getPlaceDetails, geocode, type LocationSuggestion } from "@/lib/api/trackasia";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, latitude?: number, longitude?: number) => void;
  placeholder?: string;
  required?: boolean;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Nhập địa chỉ...",
  required = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Close suggestions when clicking outside
  useEffect(() => {
    if (!showSuggestions) return;
    
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    }

    // Use a small delay to avoid closing immediately when clicking on suggestion
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value || value.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await autocomplete(value, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error("Autocomplete error:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  async function handleSelect(suggestion: LocationSuggestion, e: React.MouseEvent) {
    // Prevent event propagation to avoid triggering click outside
    e.preventDefault();
    e.stopPropagation();
    
    const address = suggestion.fullAddress || suggestion.address;
    
    // Close suggestions immediately - use setTimeout to ensure it happens after event handling
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Update address immediately (before async geocoding)
    onChange(address);
    
    // Blur input to remove focus
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Use place_id to get coordinates from Place Detail API (async, in background)
    if (suggestion.placeId) {
      try {
        const placeDetails = await getPlaceDetails(suggestion.placeId);
        onChange(address, placeDetails.latitude, placeDetails.longitude);
      } catch (error) {
        console.error("Place details error:", error);
        // Fallback to geocoding if place detail fails
        try {
          const geocodeResult = await geocode(address);
          onChange(address, geocodeResult.latitude, geocodeResult.longitude);
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          // Address already updated above
        }
      }
    } else {
      // If no place_id, try geocoding
      try {
        const geocodeResult = await geocode(address);
        onChange(address, geocodeResult.latitude, geocodeResult.longitude);
      } catch (error) {
        console.error("Geocoding error:", error);
        // Address already updated above
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onChange(newValue);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
      />
      
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg"
          onMouseDown={(e) => {
            // Prevent closing when clicking inside dropdown
            e.stopPropagation();
          }}
        >
          <ul className="max-h-60 overflow-auto">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.id}
                onClick={(e) => handleSelect(suggestion, e)}
                onMouseDown={(e) => {
                  // Prevent input blur and event bubbling
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="cursor-pointer px-3 py-2 text-sm hover:bg-sky-50 active:bg-sky-100"
              >
                <div className="font-medium text-slate-900">
                  {suggestion.address}
                </div>
                {suggestion.fullAddress !== suggestion.address && (
                  <div className="text-xs text-slate-500">
                    {suggestion.fullAddress}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

