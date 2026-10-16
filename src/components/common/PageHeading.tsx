export function PageHeading({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="page-heading">
      <span className="overline">MADHUBLOOD · MADHUPUR</span>
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
  );
}
