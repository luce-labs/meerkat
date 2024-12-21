import { useState } from "react";
import { api } from "@/trpc/react";

export const useGenerateName = () => {
  const [generatedName, setGeneratedName] = useState<string | null>(null);

  const { data, isLoading, error } = api.name.generate.useQuery();

  const handleGenerateName = () => {
    if (!isLoading && !error && data) {
      setGeneratedName(data);
    }
  };

  return {
    generatedName,
    isLoading,
    error,
    handleGenerateName,
  };
};
