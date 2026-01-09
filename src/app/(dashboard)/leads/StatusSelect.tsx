'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { updateLeadStatus } from '@/lib/api';
import { STATUS_CONFIG, type LeadStatus } from '@/lib/types';

// Confetti celebration for converted leads
const triggerConfetti = () => {
  // First burst
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5'],
  });

  // Second burst after 150ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#10B981', '#34D399', '#6EE7B7'],
    });
  }, 150);

  // Third burst after 300ms
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#10B981', '#34D399', '#6EE7B7'],
    });
  }, 300);
};

interface Props {
  leadId: string;
  currentStatus: LeadStatus;
}

export function StatusSelect({ leadId, currentStatus }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  const handleStatusChange = async (newStatus: LeadStatus) => {
    if (newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setUpdating(true);
    const { error } = await updateLeadStatus(leadId, newStatus);

    if (!error) {
      // Celebrate when lead is converted to green (signed)!
      if (newStatus === 'green') {
        triggerConfetti();
      }
      router.refresh();
    }
    setUpdating(false);
    setIsOpen(false);
  };

  const config = STATUS_CONFIG[currentStatus];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={updating}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition whitespace-nowrap ${config.bgColor} ${config.color} ${updating ? 'opacity-50' : ''}`}
        title={config.label}
      >
        <span>{config.label}</span>
        <ChevronDown size={14} className="flex-shrink-0" />
      </button>

      {isOpen && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[280px]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 9999,
          }}
        >
          {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3 ${status === currentStatus ? 'bg-gray-100' : ''}`}
            >
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_CONFIG[status].bgColor}`} />
              <span className="text-sm text-gray-700">{STATUS_CONFIG[status].label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
