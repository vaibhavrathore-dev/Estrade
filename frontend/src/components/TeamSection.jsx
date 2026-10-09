import { ArrowUpRight } from "lucide-react";

const teamMembers = [
  {
    name: "Rupinder Singh",
    role: "Frontend Developer",
    initials: "RS",
    image: "/images/team/rupinder.png",
    linkedin: "https://www.linkedin.com/in/rupinder-singh-8b8b38380/?isSelfProfile=true"
  },
  {
    name: "Vaibhav Rathore",
    role: "Backend Developer",
    initials: "VR",
     image: "/images/team/fastapi.png",
    linkedin: "https://www.linkedin.com/in/vaibhavsrathore"
  },
  {
    name: "Vanshika Verma",
    role: "SPEAKER/ Assistant Developer",
    initials: "V V",
    image: "/images/team/python.png",
    linkedin: "https://www.linkedin.com/in/vanshikaverma2609"
  },
  {
    name: "Sandeep Singh",
    role: "AI/ML Developer",
    initials: "S S",
    image: "/images/team/OpenCV.png",
    linkedin: "https://www.linkedin.com/in/sandeep-singh-781671357/"
  }
];

function TeamSection() {
  return (
    <section className="team-section" id="about">

      <div className="team-header">
        <span className="team-label">
          THE PEOPLE BEHIND ESTRADE
        </span>

        <h2>
          Built by people.
          <br />
          <em>Driven by purpose.</em>
        </h2>

        <p>
          Meet the four developers behind Estrade.
          Different skills, one shared vision —
          making campus event management smarter.
        </p>
      </div>

      <div className="team-grid">
        {teamMembers.map((member) => (
          <article className="team-card" key={member.name}>

         <div className="team-avatar">
  {member.image ? (
    <img
      src={member.image}
      alt={`${member.name} avatar`}
      className="team-profile-image"
    />
  ) : (
    <span>{member.initials}</span>
  )}
</div>

            <div className="team-member-details">
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>

            {member.linkedin ? (
              <a
  href={member.linkedin}
  target="_blank"
  rel="noopener noreferrer"
  className="team-linkedin"
  aria-label={`Visit ${member.name}'s LinkedIn profile`}
>
  <span className="linkedin-icon" aria-hidden="true">in</span>

  <span>LinkedIn Profile</span>

  <ArrowUpRight size={16} />
</a>
            ) : (
              <span className="team-linkedin-pending">
                LinkedIn coming soon
              </span>
            )}

          </article>
        ))}
      </div>

      <div className="team-footer-text">
        <p>Four minds. One vision. One Estrade.</p>
      </div>

    </section>
  );
}

export default TeamSection;