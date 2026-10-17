// Design-preview fixtures shaped like the existing Estrade API responses.
// NEVER used by the authenticated production dashboard.
const now = Date.now();
const after = (days) => new Date(now + days * 86400000).toISOString();
export const dashboardPreviewData = {
  user: { id: "preview-faculty", full_name: "Faculty Coordinator", email: "preview@estrade.invalid", user_type: "faculty" },
  committees: [
    { id: "sample-c1", name: "Cultural Affairs Committee", role: "head", membership_status: "approved", can_manage: true },
    { id: "sample-c2", name: "Technical Events Committee", role: "executive", membership_status: "approved", can_manage: true },
  ],
  venues: [
    { id: "sample-v1", name: "Main Auditorium", capacity: 350 },
    { id: "sample-v2", name: "Seminar Hall", capacity: 120 },
  ],
  events: [
    { id: "sample-e1", committee_id: "sample-c1", venue_id: "sample-v1", title: "Annual Cultural Festival", description: "Campus arts and cultural showcase.", status: "confirmed", is_published: true, starts_at: after(3), ends_at: after(3.18), max_participants: 300 },
    { id: "sample-e2", committee_id: "sample-c2", venue_id: "sample-v2", title: "Innovation & Ideas Summit", description: "Technology talks and student projects.", status: "confirmed", is_published: true, starts_at: after(7), ends_at: after(7.16), max_participants: 110 },
    { id: "sample-e3", committee_id: "sample-c1", venue_id: "sample-v1", title: "Campus Leadership Forum", description: "A faculty and student leadership session.", status: "confirmed", is_published: true, starts_at: after(-5), ends_at: after(-4.8), max_participants: 200 },
  ],
  summary: {
    upcoming: 2, ongoing: 0, completed: 1, participants: 124,
    coordinators: 18, pending_withdrawals: 2,
    event_metrics: {
      "sample-e1": { coordinators: 9, participants: 0 },
      "sample-e2": { coordinators: 5, participants: 0 },
      "sample-e3": { coordinators: 4, participants: 124 },
    },
    media: [],
  },
  certificates: [],
};
