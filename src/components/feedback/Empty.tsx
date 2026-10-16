import { Droplets } from "lucide-react";

export function Empty({
  text = "এখনও কোনো তথ্য নেই · Nothing here yet",
}: {
  text?: string;
}) {
  return (
    <div className="empty">
      <Droplets />
      <p>{text}</p>
    </div>
  );
}
