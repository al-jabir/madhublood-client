import { useState } from "react";
import type { ManagedUser } from "@/types/api";
export function RoleEditor({
  row,
  save,
}: {
  row: ManagedUser;
  save: (roles: string[], areas: string[]) => void;
}) {
  const [role, setRole] = useState(
    row.roles.find((role) => role !== "user") ?? "user",
  );
  const [area, setArea] = useState(row.areas?.join(", ") ?? "");
  return (
    <form
      className="role-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (confirm("Change roles and revoke this user’s sessions?"))
          save(
            role === "user" ? ["user"] : ["user", role],
            area
              .split(",")
              .map((value) => value.trim())
              .filter(Boolean),
          );
      }}
    >
      <label className="field">
        Role
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          {["user", "volunteer", "admin", "super-admin"].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </label>
      <label className="field">
        Assigned areas, separated by commas
        <input
          value={area}
          onChange={(event) => setArea(event.target.value)}
          maxLength={500}
        />
      </label>
      <button>Save role</button>
    </form>
  );
}
