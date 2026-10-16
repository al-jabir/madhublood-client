import { Droplets } from "lucide-react";

export function Loading() {
  return (
    <div className="loading" role="status">
      <Droplets className="pulse" /> Loading…
    </div>
  );
}
