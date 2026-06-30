export interface DateResponse {
  id: string;
  timestamp: string;
  selectedDate: string;
  selectedTime: string;
  dateType: string;
  customNotes?: string;
  status: 'pending' | 'accepted' | 'completed';
}

export interface ProposalStats {
  noClicksCount: number;
  yesClickedAt?: string;
}
