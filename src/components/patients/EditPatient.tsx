//TODO: also modify the database here, use naive promise (or how its called)
import type { Patient } from "@/models/Patients";
import React, { useState, useEffect } from "react";

type EditPatientProps = {
  patient: Patient;
  onSave: (updated: Patient) => void;
};

export const EditPatient: React.FC<EditPatientProps> = ({
  patient,
  onSave,
}) => {
  const [form, setForm] = useState<Patient>(patient);

  useEffect(() => {
    setForm(patient);
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "age" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <section
      style={{
        padding: "2rem",
        background: "#f5f5f5",
        borderRadius: "8px",
        marginBottom: "2rem",
      }}
    >
      <h1>Edit Patient</h1>
      <p>
        Modify the details for <strong>{patient.name}</strong> below.
      </p>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <div>
          <label>Name:</label>
          <input name="name" value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label>Age:</label>
          <input
            name="age"
            type="number"
            value={form.age}
            onChange={handleChange}
          />
        </div>
        <button type="submit" style={{ marginTop: "1rem" }}>
          Save Changes
        </button>
      </form>
    </section>
  );
};
