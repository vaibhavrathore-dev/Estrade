import { ArrowRight } from "lucide-react";
export default function WithdrawalAlert({ onReview, count = 0 }) {
  if (!count) return null;
  return <section className="withdrawal-alert"><div className="withdrawal-content">
    <h3>Coordinator withdrawal — Action required.</h3><p>{count} pending requests need organizer review.</p>
  </div><button className="replacement-button" onClick={onReview}>Review Replacements <ArrowRight size={18} /></button></section>;
}
