import { Component, lazy, Suspense } from "react";
const Scene = lazy(() => import("./LampScene"));
function Fallback() {
  return (
    <div className="lamp-fallback" aria-hidden="true">
      <i />
      <b />
      <span />
    </div>
  );
}
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}
export default function LampExperience({ lit }) {
  const economical =
    typeof navigator !== "undefined" &&
    (navigator.connection?.saveData ||
      (navigator.deviceMemory && navigator.deviceMemory <= 2));
  return economical ? (
    <Fallback />
  ) : (
    <SceneBoundary>
      <Suspense fallback={<Fallback />}>
        <Scene lit={lit} />
      </Suspense>
    </SceneBoundary>
  );
}
