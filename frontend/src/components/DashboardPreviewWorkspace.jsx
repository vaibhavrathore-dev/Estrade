import { CalendarDays, MapPin, ShieldCheck, Image as ImageIcon, Users, Award, Info } from "lucide-react";

function InfoRow({ Icon, children }) {
  return <div className="estrade-preview-info-row"><Icon size={18} aria-hidden="true" /><span>{children}</span></div>;
}

export default function DashboardPreviewWorkspace({ event, committee, venue, section }) {
  if (!event) {
    return <section className="operations-panel estrade-preview-workspace"><h2>Select an event</h2><p>Sample event details will appear here.</p></section>;
  }
  const details = [
    { Icon: CalendarDays, text: `${new Date(event.starts_at).toLocaleString()} — ${new Date(event.ends_at).toLocaleString()}` },
    { Icon: MapPin, text: `${venue?.name || "Venue to be confirmed"} · ${committee?.name || "Committee"}` },
    { Icon: ShieldCheck, text: `${event.is_published ? "Published" : "Committee only"} · ${event.status}` },
  ];
  const capability = {
    Events: { Icon: CalendarDays, title: "Event operations", text: "The connected workspace lets authorized organizers publish, cancel and manage real events." },
    Coordinators: { Icon: Users, title: "Coordinators & replacements", text: "Live mode shows approved committee members, assignment duties, withdrawals and replacement options." },
    Media: { Icon: ImageIcon, title: "AI Media Manager", text: "Live mode analyses event images for clarity and duplicates, with human review of all recommendations." },
    Certificates: { Icon: Award, title: "Certificate studio", text: "Live mode verifies participation, issues PDF certificates and allows recipients to download them." },
  }[section] || { Icon: Info, title: "Event workspace", text: "More actions become available once signed in to the connected service." };
  return (
    <section className="operations-panel estrade-preview-workspace">
      <div className="estrade-preview-workspace-heading"><span className="eyebrow">EVENT WORKSPACE / DESIGN PREVIEW</span><span className="estrade-pill">SAMPLE EVENT</span></div>
      <h2>{event.title}</h2>
      <p>{event.description}</p>
      <div className="estrade-preview-info-list">{details.map(({ Icon, text }) => <InfoRow key={text} Icon={Icon}>{text}</InfoRow>)}</div>
      <div className="estrade-preview-capability"><capability.Icon size={22} aria-hidden="true" /><div><h3>{capability.title}</h3><p>{capability.text}</p><small>Interactive changes are disabled in design preview. No API requests are sent.</small></div></div>
    </section>
  );
}
