import { HelpCircle, MessageSquare, FileText, Megaphone, Clock, TrendingUp, Flame, Eye, SortAsc } from 'lucide-react';

export const POST_TYPES = [
  { id: 'question', label: 'Question', icon: HelpCircle, color: 'violet', gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', hoverBg: 'hover:bg-violet-100' },
  { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'blue', gradient: 'from-blue-500 to-cyan-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', hoverBg: 'hover:bg-blue-100' },
  { id: 'resource', label: 'Resource', icon: FileText, color: 'emerald', gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', hoverBg: 'hover:bg-emerald-100' },
  { id: 'announcement', label: 'Announcement', icon: Megaphone, color: 'amber', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', hoverBg: 'hover:bg-amber-100' }
];

export const STATUS_CONFIG = {
  open: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Open', dot: 'bg-emerald-500' },
  answered: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Answered', dot: 'bg-blue-500' },
  closed: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Closed', dot: 'bg-slate-400' }
};

export const SORT_OPTIONS = [
  { id: 'created_at', label: 'Newest', icon: Clock },
  { id: 'upvotes', label: 'Most Voted', icon: TrendingUp },
  { id: 'comment_count', label: 'Most Active', icon: Flame },
  { id: 'view_count', label: 'Most Viewed', icon: Eye }
];

export const ANSWER_SORT_OPTIONS = [
  { id: 'votes', label: 'Top Votes', icon: TrendingUp },
  { id: 'newest', label: 'Newest', icon: Clock },
  { id: 'oldest', label: 'Oldest', icon: SortAsc }
];
