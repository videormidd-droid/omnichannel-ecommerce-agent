// app/forms/[type]/page.tsx
"use client";

import { useParams } from "next/navigation";
import DynamicForm from "@/components/DynamicForm";

export default function DynamicFormPage() {
  const params = useParams();
  const type = params.type as string;

  return (
    <main className="max-w-md mx-auto min-h-screen bg-white px-4 pt-8">
      <DynamicForm formType={type} />
    </main>
  );
}
