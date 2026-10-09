import {
  Image,
  ScanSearch,
  Images,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

function AIMediaShowcase() {
  return (
    <section className="ai-showcase" id="ai-media">

      <div className="ai-showcase-content">

        <span className="ai-section-label">
          04 / INTELLIGENT MEDIA
        </span>

        <h2>
          Every moment deserves
          <br />
          <em>to be remembered.</em>
        </h2>

        <p>
          From technical competitions to cultural celebrations,
          every photograph tells a story.

          Estrade helps organizers identify blurry and
          duplicate photographs, making event media
          management faster and simpler.
        </p>

        <div className="ai-feature-list">

          <div>
            <ScanSearch size={22} />
            <span>Blur Detection</span>
          </div>

          <div>
            <Images size={22} />
            <span>Duplicate Detection</span>
          </div>

          <div>
            <CheckCircle2 size={22} />
            <span>Smart Photo Organization</span>
          </div>

        </div>

        <a href="/dashboard" className="ai-explore-button">
          Explore AI Media
          <ArrowRight size={18} />
        </a>

      </div>

      {/* AI MEDIA PREVIEW */}

      <div className="ai-showcase-visual">

        <div className="ai-preview-card">

          <div className="ai-preview-heading">
            <Image size={25} />

            <div>
              <h3>AI Media Manager</h3>
              <p>Intelligent event photography management</p>
            </div>
          </div>

          <div className="ai-preview-placeholder">

            <Images size={45} strokeWidth={1.2} />

            <h4>Your event memories, organized.</h4>

            <p>
              AI-powered blur and duplicate detection.
            </p>

            <span>
              Product preview coming soon
            </span>

          </div>

        </div>

      </div>

    </section>
  );
}

export default AIMediaShowcase;